// Uses the installed, unmodified Harness AgentLoop/Tools/Session implementation.
// The only substituted execution boundary is the model provider. No credentials,
// user profiles, paid requests or installed application files are touched.
import assert from 'node:assert/strict'
import { join, resolve } from 'node:path'
import { pathToFileURL } from 'node:url'
import { mkdir, mkdtemp } from 'node:fs/promises'
import { randomUUID } from 'node:crypto'
import { NativeRoundtableService } from '../lib/server/service.js'
import { MetadataStore } from '../lib/server/store.js'
import { probeConnection } from '../lib/server/probe.js'
import { apply as applyPlugin, ENDPOINT } from '../lib/index.js'

const base = join(process.env.LOCALAPPDATA, 'Programs/DeepSeek Harness/resources/app.asar/dsh/node_modules/@deepseek-ai')
const load = name => import(pathToFileURL(join(base, name, 'lib/index.js')))
const [{ Context, Service }, sessions, projections, agents, prompt, tools, loop, messages, titles] = await Promise.all([
  load('cordis'), load('dsh-session'), load('dsh-session-projection'), load('dsh-agent'),
  load('dsh-system-prompt'), load('dsh-tools'), load('dsh-agent-loop'), load('dsh-llm'), load('dsh-session-title'),
])
await mkdir('.test-results', { recursive: true })
const tests = []
const test = (name, fn) => tests.push([name, fn])
const timeout = (promise, ms = 4000) => {
  let timer
  return Promise.race([promise, new Promise((_, reject) => { timer = setTimeout(() => reject(new Error('Integration test timed out')), ms) })]).finally(() => clearTimeout(timer))
}
const text = message => message.content.filter(b => b.type === 'text').map(b => b.text).join('\n')

async function fixture(behavior, options = {}) {
  const requests = []; const handles = []; const executedTools = []
  const ctx = new Context()
  class FakeModels extends Service {
    constructor(ctx) { super(ctx, 'llm') }
    async resolveCallConfig(config) { return config }
    async resolveModelInfo(provider, model) { return { provider, id: model, inputModalities: options.textOnlyModel === model ? ['text'] : ['text', 'image'] } }
    async prepareCall(config) {
      return { config, context: { contextWindow: 100000 }, stream: request => this.stream(request) }
    }
    async *stream(request) {
      requests.push(request)
      const output = behavior ? behavior(request, requests.length) : null
      if (output) { yield* output; return }
      yield { type: 'text-delta', index: 0, text: `answer ${request.model}` }
      yield { type: 'finish', reason: { kind: 'completed' } }
    }
  }
  const fibers = [
    ctx.plugin(sessions.default), ctx.plugin(projections.default), ctx.plugin(agents.default),
    ctx.plugin(prompt.default, { personaPrefix: options.personaPrefix ?? '' }), ctx.plugin(tools.default, {}), ctx.plugin(FakeModels),
    ctx.plugin(loop.default, { agents: [], maxParallelToolCalls: 1 }),
  ]
  if (options.titleTest) fibers.push(ctx.plugin(titles.default, { fallbackMaxWords: 8, fallbackMaxBytes: 120, maxTitleBytes: 200 }))
  await timeout(Promise.all(fibers.map(fiber => fiber.await())))
  const store = new MetadataStore(await mkdtemp(resolve('.test-results', 'native-')))
  const service = new NativeRoundtableService({ ctx, store, createUserMessage: messages.createUserMessage, fallbackSessionTitle: titles.fallbackSessionTitle, ...options })
  await service.init()
  ctx.on('agent/created', ({ agent }) => service.bind(agent))
  if (options.creationContext) ctx.on('agent/created', ({ agent }) => agent.inject(messages.createUserMessage({
    content: [{ type: 'text', text: 'TEST_EARLY_WORKSPACE_CONTEXT' }], source: { kind: 'workspace', form: 'notice', summary: 'workspace context' },
  })))
  ctx.on('session/event', (session, event) => service.onEvent(session, event))
  const selections = new WeakMap()
  ctx.reflect.provide('sessionController', { agents: { selectForNextRequest(agent, selection) {
    agent.session.append('model/selection', selection); if (selections.has(agent)) selections.get(agent).current = selection
  } }, create: async input => {
    assert.equal(input.workspaceId, 'native-workspace')
    const handle = await ctx.agents.create({ sessionId: input.sessionId, meta: { cwd: process.cwd() }, agentOptions: { provider: 'default', model: 'untouched-default' }, setup: (agentCtx, agent) => {
      const selection = { current: { provider: 'default', model: 'untouched-default' } }
      selections.set(agent, selection); agents.installModelSelection(agentCtx, selection)
    } })
    handles.push(handle)
    return { sessionId: handle.agent.id }
  } })
  const sessionId = `session-${randomUUID()}`
  await ctx.sessionController.create({ sessionId, workspaceId: 'native-workspace' })
  const record = await service.configure({ sessionId, members: options.members ?? [
    { provider: 'provider-a', model: 'model-a', name: 'A', reasoningEffort: 'high' },
    { provider: 'provider-b', model: 'model-b', name: 'B' },
  ] })
  const agent = ctx.agents.get(record.sessionId)
  const submit = input => agent.followup(messages.createUserMessage({ content: [{ type: 'text', text: input }], source: { kind: 'user', rpcId: randomUUID() } }))
  const settled = async () => {
    for (let n = 0; n < 8; n++) { await timeout(agent.whenIdle()); await timeout(Promise.allSettled([...service.pending])); await Promise.resolve(); if (!service.pending.size && agent.status === 'idle' && !service.get(agent.id).active) break }
    return service.snapshot(agent.id)
  }
  const close = async () => { await service.shutdown(); for (const handle of handles) await handle.dispose(); await ctx.fiber.dispose() }
  return { ctx, service, agent, requests, executedTools, submit, settled, close }
}

test('configuring an existing native chat adds no turn and makes no model call', async () => {
  const f = await fixture()
  try {
    assert.equal(f.requests.length, 0)
    const events = f.agent.session.snapshotEvents()
    assert.equal(events.filter(e => e.type === 'turn/start').length, 0)
    assert.equal(events.filter(e => e.type === 'turn/end').length, 0)
    assert.equal(events.filter(e => e.type === 'step/start').length, 0)
    assert.equal(f.service.snapshot(f.agent.id).batches.length, 0)
  } finally { await f.close() }
})

test('binding a circle preserves native workspace context for the first prompt', async () => {
  const f = await fixture(null, { creationContext: true })
  try {
    assert.equal(f.requests.length, 0)
    f.submit('use workspace context'); await f.settled()
    assert.equal(f.requests[0].messages.filter(m => text(m).includes('TEST_EARLY_WORKSPACE_CONTEXT')).length, 1)
    assert.equal(f.service.snapshot(f.agent.id).initializationTurn, undefined)
  } finally { await f.close() }
})

test('failed first admission can release the provisional circle and restore the native model', async () => {
  const f = await fixture()
  try {
    assert.equal(await f.service.unconfigure(f.agent.id), null)
    assert.equal(f.agent.session.snapshotEvents().findLast(e => e.type === 'model/selection').data.model, 'untouched-default')
    assert.equal((await f.service.store.load()).length, 0)
    f.submit('ordinary after failed admission'); await timeout(f.agent.whenIdle())
    assert.deepEqual(f.requests.map(r => r.model), ['untouched-default'])
  } finally { await f.close() }
})

test('an admitted circle cannot be reset to an ordinary chat', async () => {
  const f = await fixture()
  try {
    f.submit('first'); await f.settled()
    assert.ok(await f.service.unconfigure(f.agent.id))
    f.submit('second'); await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-a', 'model-b', 'model-a', 'model-b'])
  } finally { await f.close() }
})

test('native first-prompt title generation remains active and manual renaming wins', async () => {
  const f = await fixture(null, { titleTest: true })
  let generations = 0
  try {
    assert.equal(f.ctx.sessionTitle.get(f.agent.session), undefined)
    f.ctx.sessionTitle.register({ id: 'native-title-test', automatic: 'first-prompt', generate: async input => {
      generations++; assert.equal(input.route.model, 'model-a')
      return { title: 'native generated title', messageSeqs: input.messages.map(m => m.seq) }
    } })
    f.submit('first title input'); await f.settled()
    assert.equal(generations, 1)
    assert.equal(f.ctx.sessionTitle.get(f.agent.session).title, 'native generated title')
    f.ctx.sessionTitle.rename(f.agent.session, 'user chosen title')
    f.submit('second title input'); await f.settled()
    assert.equal(generations, 1)
    assert.equal(f.ctx.sessionTitle.get(f.agent.session).title, 'user chosen title')
  } finally { await f.close() }
})

test('native generated placeholder titles fall back without another model call and never override a user title', async () => {
  const f = await fixture(null, { titleTest: true })
  try {
    f.ctx.sessionTitle.register({ id: 'native-placeholder-test', automatic: 'first-prompt', generate: async input => ({ title: 'Untitled session', messageSeqs: input.messages.map(m => m.seq) }) })
    f.submit('123'); await f.settled()
    assert.equal(f.ctx.sessionTitle.get(f.agent.session).title, '123')
    assert.equal(f.ctx.sessionTitle.get(f.agent.session).source.kind, 'fallback')
    assert.equal(f.requests.length, 2)
    const seq = f.agent.session.snapshotEvents().find(e => e.type === 'user/message' && e.data.source.kind === 'user').seq
    f.agent.session.append('session/title', { title: 'Untitled session', messageSeqs: [seq], source: { kind: 'provider', provider: 'native-placeholder-test' } })
    f.ctx.sessionTitle.rename(f.agent.session, 'my manual title')
    await Promise.allSettled([...f.service.pending])
    assert.equal(f.ctx.sessionTitle.get(f.agent.session).title, 'my manual title')
    f.ctx.sessionTitle.rename(f.agent.session, 'Untitled session')
    f.service.repairPlaceholderTitle(f.agent.session)
    await Promise.allSettled([...f.service.pending])
    assert.equal(f.ctx.sessionTitle.get(f.agent.session).source.kind, 'user')
  } finally { await f.close() }
})

test('two native turns retain native guidance and use the current roundtable participant as the primary role', async () => {
  const f = await fixture(null, { personaPrefix: 'You are a coding agent powered by the {{model}} model.' })
  try {
    f.submit('question')
    const state = await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-a', 'model-b'])
    assert.equal(f.requests[0].reasoningEffort, 'high')
    assert.equal(f.requests[1].reasoningEffort, undefined)
    assert.ok(f.requests[1].messages.some(m => m.role === 'assistant' && text(m) === 'answer model-a'))
    const firstPrompt = text(f.requests[0].messages.find(m => m.role === 'system'))
    const secondPrompt = text(f.requests[1].messages.find(m => m.role === 'system'))
    assert.match(firstPrompt, /首要身份是 AI 圆桌讨论参与者「A」/)
    assert.match(secondPrompt, /首要身份是 AI 圆桌讨论参与者「B」/)
    assert.match(firstPrompt, /powered by DeepSeek Harness/)
    assert.match(firstPrompt, /coding agent powered by the model-a model/)
    assert.match(secondPrompt, /coding agent powered by the model-b model/)
    assert.ok(f.requests[1].messages.some(m => m.source?.kind === 'ai-roundtable-native' && /分别归属/.test(text(m))))
    const events = f.agent.session.snapshotEvents()
    assert.equal(events.filter(e => e.type === 'user/message' && e.data.source.kind === 'user').length, 1)
    assert.deepEqual(events.filter(e => e.type === 'assistant/message').map(e => e.data.message.source.model), ['model-a', 'model-b'])
    assert.equal(state.active, null)
    assert.deepEqual(state.batches[0].turns.map(t => t.status), ['succeeded', 'succeeded'])
    assert.equal(f.agent.options.model, 'untouched-default')
    assert.doesNotThrow(() => sessions.Session.create(f.agent.id, events, f.agent.session.header))
  } finally { await f.close() }
})

test('pointing at one member runs only that member', async () => {
  const f = await fixture()
  try {
    await f.service.setTarget(f.agent.id, 'member-2'); f.submit('only B')
    const state = await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-b'])
    assert.equal(state.batches[0].turns.length, 1)
  } finally { await f.close() }
})

test('arbitrary member subsets keep roster order and exclude deselected models', async () => {
  const f = await fixture(null, { members: ['a', 'b', 'c', 'd'].map(m => ({ provider: `provider-${m}`, model: `model-${m}`, name: m.toUpperCase() })) })
  try {
    await f.service.setTarget(f.agent.id, ['member-4', 'member-2']); f.submit('B and D')
    const state = await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-b', 'model-d'])
    assert.deepEqual(state.target, ['member-2', 'member-4'])
    assert.deepEqual(state.batches[0].turns.map(t => t.memberId), ['member-2', 'member-4'])
    await assert.rejects(f.service.setTarget(f.agent.id, []), /至少一个/)
    await assert.rejects(f.service.setTarget(f.agent.id, ['member-2', 'member-2']), /不属于/)
    await assert.rejects(f.service.setTarget(f.agent.id, ['unknown']), /不属于/)
  } finally { await f.close() }
})

test('image compatibility checks every selected member without model calls', async () => {
  const f = await fixture(null, { textOnlyModel: 'model-b' })
  try {
    await assert.rejects(f.service.checkAttachments(f.agent.id, true), /B.*不支持图片/)
    await f.service.setTarget(f.agent.id, ['member-1'])
    await f.service.checkAttachments(f.agent.id, true)
    await f.service.checkAttachments(f.agent.id, false)
    assert.equal(f.requests.length, 0)
  } finally { await f.close() }
})

test('configuration refuses converting an ordinary chat that already has user messages', async () => {
  const f = await fixture(); let ordinary
  try {
    const id = `session-${randomUUID()}`
    await f.ctx.sessionController.create({ sessionId: id, workspaceId: 'native-workspace' })
    ordinary = f.ctx.agents.get(id)
    ordinary.followup(messages.createUserMessage({ content: [{ type: 'text', text: 'ordinary first question' }], source: { kind: 'user' } }))
    await timeout(ordinary.whenIdle())
    await assert.rejects(f.service.configure({ sessionId: id, members: f.service.get(f.agent.id).members }), /尚未发送/)
    assert.equal(f.service.snapshot(id), null)
  } finally { await f.close() }
})

test('native fork inherits circle members without replaying or making model calls', async () => {
  const f = await fixture(); let child
  try {
    f.submit('parent'); await f.settled(); const count = f.requests.length
    child = await f.ctx.agents.create({ sessionId: `session-${randomUUID()}`, meta: { cwd: process.cwd(), parentSession: f.agent.id }, agentOptions: { provider: 'default', model: 'untouched-default' }, setup: (ctx, agent) => {
      agents.installModelSelection(ctx, { current: { provider: 'default', model: 'untouched-default' } })
    } })
    const state = f.service.snapshot(child.agent.id)
    assert.deepEqual(state.members, f.service.snapshot(f.agent.id).members)
    assert.equal(state.active, null); assert.equal(f.requests.length, count)
  } finally { if (child) await child.dispose(); await f.close() }
})

test('target changes commit before an immediately queued native prompt starts', async () => {
  const f = await fixture()
  let release
  try {
    const gate = new Promise(resolve => { release = resolve })
    const save = f.service.store.save.bind(f.service.store)
    let held = true
    f.service.store.save = async record => { if (held) { held = false; await gate } return save(record) }
    const change = f.service.setTarget(f.agent.id, 'member-2')
    f.submit('use B after selection')
    await new Promise(resolve => setImmediate(resolve))
    assert.equal(f.requests.length, 0)
    release(); await change; await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-b'])
  } finally { release?.(); await f.close() }
})

test('failure advances to the next member through the real native error boundary', async () => {
  const f = await fixture(async function* (request) {
    if (request.model === 'model-a') throw new Error('provider-a failed')
    yield { type: 'text-delta', index: 0, text: 'B survived' }; yield { type: 'finish', reason: { kind: 'completed' } }
  })
  try {
    f.submit('continue on failure')
    const state = await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-a', 'model-b'])
    assert.deepEqual(state.batches[0].turns.map(t => t.status), ['failed', 'succeeded'])
    assert.ok(f.agent.session.snapshotEvents().some(e => e.type === 'assistant/attempt'))
  } finally { await f.close() }
})

test('a member finishes native tool steps before the next member starts', async () => {
  let bodyCalls = 0
  const f = await fixture(async function* (request) {
    if (request.model === 'model-a' && !request.messages.some(m => m.role === 'tool')) {
      yield { type: 'tool-call-delta', index: 0, id: 'call-one', name: 'native_test_read', argumentsDelta: '{}' }
      yield { type: 'finish', reason: { kind: 'tool-calls' } }
    } else {
      if (request.model === 'model-b') assert.equal(bodyCalls, 1)
      yield { type: 'text-delta', index: 0, text: `after tools ${request.model}` }; yield { type: 'finish', reason: { kind: 'completed' } }
    }
  })
  try {
    f.ctx.tools.register({ name: 'native_test_read', description: 'test read', parameters: { type: 'object', properties: {} },
      output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] },
      async execute() { bodyCalls++; return 'native marker' } })
    f.submit('use native tools'); const state = await f.settled()
    assert.equal(bodyCalls, 1)
    assert.deepEqual(f.requests.map(r => r.model), ['model-a', 'model-a', 'model-b'])
    assert.equal(state.batches[0].turns[0].nativeTurn, state.batches[0].turns[1].nativeTurn - 1)
    assert.ok(f.requests[2].messages.some(m => m.role === 'tool'))
  } finally { await f.close() }
})

test('native Stop cancels the roundtable remainder without calling B', async () => {
  let started
  const began = new Promise(resolve => { started = resolve })
  const f = await fixture(async function* (request) {
    started()
    yield { type: 'text-delta', index: 0, text: 'partial' }
    await new Promise((_, reject) => request.signal.addEventListener('abort', () => reject(new Error('aborted')), { once: true }))
  })
  try {
    f.submit('stop'); await timeout(began)
    f.agent.cancel({ kind: 'user' }, { keepInbox: true })
    const state = await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-a'])
    assert.equal(state.batches[0].status, 'cancelled')
    assert.deepEqual(state.batches[0].turns.map(t => t.status), ['cancelled', 'cancelled'])
    assert.equal(f.agent.inbox.nextTurn.length, 0)
    assert.ok(f.agent.session.snapshotEvents().some(e => e.type === 'assistant/message' && e.data.interrupted))
  } finally { await f.close() }
})

test('roundtable Stop uses its batch identity and does not cancel a later batch', async () => {
  const f = await fixture()
  try {
    f.submit('first'); const first = await f.settled()
    const expired = first.batches[0].id
    f.submit('second')
    // Native status reserves the input synchronously, preventing target races.
    await assert.rejects(f.service.setTarget(f.agent.id, 'member-2'), /结束后/)
    await new Promise(resolve => setImmediate(resolve))
    if (f.service.get(f.agent.id).active) await assert.rejects(f.service.stop(f.agent.id, expired), /旧的停止/)
    await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-a', 'model-b', 'model-a', 'model-b'])
  } finally { await f.close() }
})

test('queued human messages remain behind the remaining roundtable members', async () => {
  const f = await fixture()
  try {
    f.submit('first question'); f.submit('queued second question')
    const state = await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-a', 'model-b', 'model-a', 'model-b'])
    assert.equal(state.batches.length, 2)
    assert.equal(f.requests[1].messages.filter(m => m.source?.kind === 'user').length, 1)
    assert.equal(f.requests[2].messages.filter(m => m.source?.kind === 'user').length, 2)
  } finally { await f.close() }
})

test('native tool guards still deny execution in the roundtable agent scope', async () => {
  let bodyCalls = 0
  const f = await fixture(async function* (request) {
    if (!request.messages.some(m => m.role === 'tool')) {
      yield { type: 'tool-call-delta', index: 0, id: 'guarded-call', name: 'guarded_read', argumentsDelta: '{}' }
      yield { type: 'finish', reason: { kind: 'tool-calls' } }
    } else {
      assert.ok(request.messages.some(m => m.role === 'tool' && m.isError))
      yield { type: 'text-delta', index: 0, text: 'permission denied by host' }; yield { type: 'finish', reason: { kind: 'stop' } }
    }
  })
  try {
    f.ctx.tools.register({ name: 'guarded_read', description: 'guard verification', parameters: { type: 'object', properties: {} },
      output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] }, execute: async () => { bodyCalls++; return 'must not execute' } })
    f.agent.ctx.tools.guard(() => 'denied by native permission boundary')
    f.submit('guard'); const state = await f.settled()
    assert.equal(bodyCalls, 0)
    assert.deepEqual(state.batches[0].turns.map(t => t.status), ['succeeded', 'succeeded'])
  } finally { await f.close() }
})

test('ordinary sessions keep their original model and have no roundtable prompt', async () => {
  const f = await fixture()
  let ordinary
  try {
    ordinary = await f.ctx.agents.create({ sessionId: `ordinary-${randomUUID()}`, meta: { cwd: process.cwd() }, agentOptions: { provider: 'ordinary', model: 'original' } })
    ordinary.agent.followup(messages.createUserMessage({ content: [{ type: 'text', text: 'ordinary question' }], source: { kind: 'user' } }))
    await timeout(ordinary.agent.whenIdle())
    assert.equal(f.requests[0].model, 'original')
    assert.ok(!f.requests[0].messages.some(m => m.role === 'system' && text(m).includes('AI 圆桌')))
    assert.equal(f.service.snapshot(ordinary.agent.id), null)
  } finally { await ordinary?.dispose(); await f.close() }
})

test('failed member retry and exports use the native log', async () => {
  let failed = false
  const f = await fixture(async function* (request) {
    if (request.model === 'model-a' && !failed) { failed = true; throw new Error('first attempt failed') }
    yield { type: 'text-delta', index: 0, text: `success ${request.model}` }; yield { type: 'finish', reason: { kind: 'stop' } }
  })
  try {
    f.submit('retry'); const first = await f.settled()
    await f.service.retry(f.agent.id, first.batches[0].id, 'member-1')
    const state = await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-a', 'model-b', 'model-a'])
    assert.equal(state.batches[1].turns[0].status, 'succeeded')
    const exported = JSON.parse((await f.service.export(f.agent.id, 'json')).text)
    assert.ok(exported.session.events.some(e => e.type === 'assistant/attempt'))
    assert.match((await f.service.export(f.agent.id, 'markdown')).text, /provider-b\/model-b/)
  } finally { await f.close() }
})

test('member timeout aborts native work and continues with the next member', async () => {
  const f = await fixture(async function* (request) {
    if (request.model === 'model-a') await new Promise((_, reject) => request.signal.addEventListener('abort', () => reject(new Error('timed out')), { once: true }))
    yield { type: 'text-delta', index: 0, text: 'B completes after A timeout' }; yield { type: 'finish', reason: { kind: 'stop' } }
  }, { callTimeoutMs: 50 })
  try {
    f.submit('timeout'); const state = await f.settled()
    assert.deepEqual(f.requests.map(r => r.model), ['model-a', 'model-b'])
    assert.deepEqual(state.batches[0].turns.map(t => t.status), ['failed', 'succeeded'])
    assert.match(state.batches[0].turns[0].error, /超过/)
  } finally { await f.close() }
})

test('plugin shutdown cancels native maintenance even without a roundtable batch', async () => {
  const f = await fixture()
  try {
    const maintenance = f.agent.runMaintenance(signal => new Promise(resolve => signal.addEventListener('abort', resolve, { once: true })))
    assert.equal(f.agent.status, 'idle')
    await timeout(f.service.shutdown())
    await timeout(maintenance)
  } finally { f.agent.cancel({ kind: 'disposed' }, { keepInbox: true }); await f.close() }
})

const probeLlm = chunks => ({ resolveCallConfig: async (route, signal) => { assert.ok(signal); assert.equal(route.maxTokens, 512); return { ...route, reasoningEffort: route.reasoningEffort ?? 'low' } }, async *stream(request) { assert.equal(request.reasoningEffort, 'high'); yield* chunks } })
const probeRoute = { provider: 'test', model: 'test', reasoningEffort: 'high' }
test('native probe assembly accepts closed text blocks and reasoning at the output limit', async () => {
  const signal = new AbortController().signal
  const closed = await probeConnection(probeLlm([{ type: 'block-end', index: 0, block: { type: 'text', text: '可用' } }, { type: 'finish', reason: { kind: 'stop' } }]), messages, probeRoute, signal)
  assert.equal(closed.preview, '可用')
  const thinking = await probeConnection(probeLlm([{ type: 'reasoning-delta', index: 0, text: 'thinking' }, { type: 'finish', reason: { kind: 'max-tokens' } }]), messages, probeRoute, signal)
  assert.equal(thinking.ok, true); assert.match(thinking.note, /仅返回思考.*输出上限/)
})
test('native probe preserves provider errors and distinguishes empty or incomplete streams', async () => {
  const signal = new AbortController().signal
  await assert.rejects(probeConnection(probeLlm([{ type: 'finish', reason: { kind: 'error', failure: { code: 'AUTH', message: 'HTTP 401: invalid API key' } } }]), messages, probeRoute, signal), /AUTH.*HTTP 401: invalid API key/)
  await assert.rejects(probeConnection(probeLlm([{ type: 'finish', reason: { kind: 'stop' } }]), messages, probeRoute, signal), /空内容.*stop/)
  await assert.rejects(probeConnection(probeLlm([{ type: 'text-delta', index: 0, text: 'partial' }]), messages, probeRoute, signal), /未返回结束标记/)
})
test('cancelled probe IDs cannot contaminate a fresh selection attempt', async () => {
  let fetch, ready, calls = 0
  const started = new Promise(resolve => { ready = resolve }), dispose = []
  const ctx = { on() {}, agents: { list: () => [] }, effect(fn) { dispose.push(fn()) }, loader: { internal: { import: async name => name.endsWith('dsh-llm') ? messages : titles } },
    connection: { fetch: { register(options) { fetch = options.fetch } } }, llm: { resolveCallConfig: async route => route, async *stream(request) {
      calls++; if (calls === 1) { ready(); await new Promise((_, reject) => request.signal.addEventListener('abort', () => reject(new Error('old request aborted')), { once: true })) }
      yield { type: 'text-delta', index: 0, text: '可用' }; yield { type: 'finish', reason: { kind: 'stop' } }
    } } }
  await applyPlugin(ctx, { dataDir: await mkdtemp(resolve('.test-results', 'probe-')) })
  const call = async payload => (await fetch(new Request(`http://localhost/api/${ENDPOINT}`, { method: 'POST', body: JSON.stringify(payload) }))).json()
  try {
    const probeId = randomUUID(), old = call({ op: 'probe', probeId, ...probeRoute })
    await started; await call({ op: 'cancelProbe', probeId })
    const fresh = await call({ op: 'probe', probeId: randomUUID(), ...probeRoute })
    assert.equal(fresh.ok, true); assert.equal(fresh.value.ok, true); assert.equal((await old).ok, false)
  } finally { for (const fn of dispose.reverse()) await fn() }
})

let failed = 0
for (const [name, fn] of tests) {
  try { await fn(); console.log(`PASS ${name}`) }
  catch (error) { failed++; console.error(`FAIL ${name}\n${error.stack}`) }
}
console.log(JSON.stringify({ harness: 'installed 0.2.0-rc.2', tests: tests.length, failed, paidRequests: 0 }))
process.exitCode = failed ? 1 : 0
