import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import vm from 'node:vm'

test('browser bundle registers once and uses only shell-provided shared libraries', async () => {
  let loaded
  const code = await readFile(new URL('../lib/client.js', import.meta.url), 'utf8')
  vm.runInNewContext(code, { window: { __ModuleLoader__: { load(value) { assert.equal(loaded, undefined); loaded = value } } } })
  assert.equal(loaded.id, 'dsh-plugin-ai-roundtable-native')
  const requires = []
  const plugin = loaded.factory(name => { requires.push(name); return {} })
  assert.deepEqual(requires, ['react', 'react-dom', '@deepseek-ai/dsh-client-store'])
  assert.equal(typeof plugin.apply, 'function')
  assert.deepEqual(Object.keys(plugin).sort(), ['apply', 'inject'])
})

test('client registrations are additive and retain native input, permission and attachment slots', async () => {
  let loaded
  const registrations = []
  let timeout
  const values = { open: null, catalog: null, records: {}, drafts: {}, preparing: {}, targets: {}, errors: {} }
  const state = { getSnapshot: () => values, set(next) { Object.assign(values, next) } }
  const style = { dataset: {}, remove() {} }
  const context = { window: { __ModuleLoader__: { load(value) { loaded = value } } },
    document: { visibilityState: 'hidden', createElement: () => style, head: { append() {} } },
    setTimeout(fn) { timeout = fn }, clearTimeout() {} }
  vm.runInNewContext(await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'), context)
  const plugin = loaded.factory(name => name === '@deepseek-ai/dsh-client-store' ? { createSnapshotStore: () => state } : { createElement() {} })
  plugin.apply({ uiWorkspace: { startSession() {} }, conversation: { sendSession() {}, blocks: { storeFor() {} } }, effect(fn) { fn() }, slots: { inject(_name, register) { register() }, register(options) { registrations.push(options) } } })
  await Promise.resolve(); await Promise.resolve()
  assert.deepEqual(registrations.map(r => r.name), ['shell.overlay', 'conversation.input.left', 'conversation.session.header.utilities', 'conversation.chat.turnTail'])
  assert.ok(registrations.every(r => r.id === 'ai-roundtable-native'))
  assert.ok(!registrations.some(r => /permission|attachments|composer\.bar/.test(r.name)))
})

async function sendFixture() {
  let loaded, snapshot
  const registrations = [], disposers = [], nativeCalls = [], operations = [], stores = new Map()
  const state = { getSnapshot: () => snapshot, set(next) { snapshot = next } }
  const blocks = { storeFor(id) { if (!stores.has(id)) stores.set(id, { value: undefined, getSnapshot() { return this.value } }); return stores.get(id) }, set(id, value) { this.storeFor(id).value = value } }
  const nativeSend = async (...args) => { nativeCalls.push(args); return { kind: 'success' } }
  const conversation = { sendSession: nativeSend, blocks, resolveDraftAttachments: ids => ids.map(id => ({ id, kind: 'file' })) }
  const context = { window: { __ModuleLoader__: { load(value) { loaded = value } } }, document: { visibilityState: 'hidden', createElement: () => ({ dataset: {}, remove() {} }), head: { append() {} } }, setTimeout() {}, clearTimeout() {} }
  vm.runInNewContext(await readFile(new URL('../lib/client.js', import.meta.url), 'utf8'), context)
  const plugin = loaded.factory(name => name === '@deepseek-ai/dsh-client-store' ? { createSnapshotStore: initial => { snapshot = initial; return state } } : {})
  let failRefresh = false, record
  const connection = { rpc: { async call(_channel, _endpoint, input) {
    operations.push(input.op)
    if (input.op === 'configure') record = { sessionId: input.sessionId, members: input.members.map((m, i) => ({ ...m, id: `member-${i + 1}` })), target: ['member-1', 'member-2'], batches: [], active: null }
    if (input.op === 'get' && failRefresh) return { ok: false, error: { message: 'offline' } }
    return { ok: true, value: input.op === 'configure' || input.op === 'get' ? record : undefined }
  } } }
  const workspace = { startSession() {} }
  plugin.apply({ uiWorkspace: workspace, conversation, connection, effect(fn) { disposers.push(fn()) }, slots: { inject(_name, fn) { fn() }, register(options) { registrations.push(options) } } })
  const callbacks = id => registrations.find(r => r.name === 'conversation.input.left').inject(id)
  const configure = (id, members) => registrations.find(r => r.name === 'shell.overlay').inject().configureDraft(id, members)
  return { workspace, conversation, nativeCalls, nativeSend, operations, state, callbacks, configure, setFailRefresh() { failRefresh = true }, dispose() { for (const fn of disposers.reverse()) fn() } }
}

test('ordinary native send keeps its text, attachments, mode and original lifecycle', async () => {
  const f = await sendFixture()
  const session = { sessionId: 'ordinary' }, signal = new AbortController().signal
  try {
    const pending = f.conversation.sendSession(session, 'draft', ['attachment'], 'steer', signal)
    assert.equal(f.nativeCalls.length, 1)
    await pending
    assert.deepEqual(f.nativeCalls[0], [session, 'draft', ['attachment'], 'steer', signal])
    assert.equal(f.operations.length, 0)
  } finally { f.dispose() }
  assert.equal(f.conversation.sendSession, f.nativeSend)
})

test('circle preparation retains the same session and native attachments, and empty selection blocks sending', async () => {
  const f = await sendFixture(), session = { sessionId: 'native' }
  try {
    f.callbacks(session.sessionId).toggle(true)
    await assert.rejects(f.conversation.sendSession(session, 'preserved draft', ['file'], 'queue'), /2–4/)
    assert.equal(f.nativeCalls.length, 0)
    f.configure(session.sessionId, [{ provider: 'a', model: 'a' }, { provider: 'b', model: 'b' }])
    await f.conversation.sendSession(session, 'preserved draft', ['file'], 'queue')
    assert.equal(f.nativeCalls[0][0], session)
    assert.equal(f.nativeCalls[0][1], 'preserved draft')
    assert.deepEqual(f.nativeCalls[0][2], ['file'])
    assert.deepEqual(f.operations, ['unconfigure', 'configure', 'checkAttachments', 'get'])
    await f.callbacks(session.sessionId).target([])
    await assert.rejects(f.conversation.sendSession(session, 'next draft', ['file'], 'queue'), /至少一个/)
    assert.equal(f.nativeCalls.length, 1)
    assert.equal(f.conversation.blocks.storeFor(session.sessionId).getSnapshot().reason, '请选择至少一个发言模型')
  } finally { f.dispose() }
  assert.equal(f.conversation.blocks.storeFor(session.sessionId).getSnapshot(), undefined)
})

test('native New Chat resets provisional circle mode even when it reuses the same blank session', async () => {
  const f = await sendFixture()
  try {
    f.callbacks('blank').toggle(true)
    assert.equal(f.conversation.blocks.storeFor('blank').getSnapshot().reason, '请选择 2–4 个圆桌模型')
    await f.workspace.startSession()
    assert.equal(f.state.getSnapshot().drafts.blank, undefined)
    assert.equal(f.conversation.blocks.storeFor('blank').getSnapshot(), undefined)
  } finally { f.dispose() }
})

test('a metadata refresh failure after admission never restores an already sent native draft', async () => {
  const f = await sendFixture(), session = { sessionId: 'native' }
  try {
    f.configure(session.sessionId, [{ provider: 'a', model: 'a' }, { provider: 'b', model: 'b' }])
    f.setFailRefresh()
    assert.equal((await f.conversation.sendSession(session, 'one question', [], 'queue')).kind, 'success')
    assert.equal(f.nativeCalls.length, 1)
    assert.match(f.state.getSnapshot().errors.native, /消息已发送/)
  } finally { f.dispose() }
})
