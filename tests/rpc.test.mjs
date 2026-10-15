import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { apply, ENDPOINT } from '../lib/index.js'

async function fixture(llm = {}) {
  let fetch
  const dispose = []
  const ctx = { llm, on() {}, agents: { list: () => [] }, effect(fn) { dispose.push(fn()) }, loader: { internal: { import: async () => ({ createUserMessage: value => ({ role: 'user', ...value }), BlockAssembler: class {} }) } }, connection: { fetch: { register(options) { fetch = options.fetch } } } }
  await apply(ctx, { dataDir: await mkdtemp(resolve('.test-results', 'rpc-')) })
  const call = async payload => (await fetch(new Request(`http://localhost/api/${ENDPOINT}`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type: 'client-request', rpcId: randomUUID(), method: ENDPOINT, payload }) }))).json()
  return { call, close: async () => { for (const fn of dispose.reverse()) await fn() } }
}

test('operation failures use the native RPC failure envelope and retain a useful message', async () => {
  const f = await fixture()
  try {
    const reply = await f.call({ op: 'target', sessionId: `session-${randomUUID()}`, target: [] })
    assert.equal(reply.type, 'server-response')
    assert.equal(reply.result.ok, false)
    assert.match(reply.result.error.message, /找不到/)
    assert.deepEqual(reply.result.error.details, {})
  } finally { await f.close() }
})

test('cancel connection detection aborts the actual adapter signal and handles cancellation before start', async () => {
  let started, signal
  const ready = new Promise(resolve => { started = resolve })
  const f = await fixture({ resolveCallConfig: async value => value, async *stream(request) {
    signal = request.signal; started()
    await new Promise((_, reject) => signal.addEventListener('abort', () => reject(new Error('adapter aborted')), { once: true }))
    yield { type: 'text-delta', text: 'should not complete' }
  } })
  try {
    const probeId = randomUUID(), pending = f.call({ op: 'probe', probeId, provider: 'test', model: 'test' })
    await ready
    await f.call({ op: 'cancelProbe', probeId })
    const reply = await pending
    assert.equal(signal.aborted, true)
    assert.equal(reply.result.ok, false)
    const before = randomUUID()
    await f.call({ op: 'cancelProbe', probeId: before })
    assert.equal((await f.call({ op: 'probe', probeId: before, provider: 'test', model: 'test' })).result.ok, false)
  } finally { await f.close() }
})
