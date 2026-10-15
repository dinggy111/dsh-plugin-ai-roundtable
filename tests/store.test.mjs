import test from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, writeFile, mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { randomUUID } from 'node:crypto'
import { MetadataStore, assertSessionId } from '../lib/server/store.js'
import { NativeRoundtableService } from '../lib/server/service.js'

await mkdir('.test-results', { recursive: true })
const record = () => ({ version: 1, sessionId: `roundtable-native-${randomUUID()}`, members: [], batches: [], active: null })

test('serialized metadata writes preserve the last committed control state', async () => {
  const store = new MetadataStore(await mkdtemp(resolve('.test-results', 'store-')))
  const r = record()
  const first = store.save({ ...r, target: 'all' })
  const second = store.save({ ...r, target: 'member-2' })
  await Promise.all([first, second])
  assert.equal((await store.load())[0].target, 'member-2')
})

test('invalid session ids cannot address files outside the metadata directory', () => {
  assert.throws(() => assertSessionId('../outside'))
  assert.throws(() => assertSessionId('roundtable-native-../../outside'))
})

test('damaged metadata fails visibly instead of overwriting a discussion', async () => {
  const directory = await mkdtemp(resolve('.test-results', 'corrupt-'))
  const r = record()
  await writeFile(resolve(directory, `${r.sessionId}.json`), '{broken')
  await assert.rejects(new MetadataStore(directory).load())
})

test('restart marks the interrupted batch and never resumes model execution', async () => {
  const store = new MetadataStore(await mkdtemp(resolve('.test-results', 'recover-')))
  const r = record()
  r.active = 'unfinished'
  r.batches = [{ id: 'unfinished', status: 'running', turns: [{ status: 'succeeded' }, { status: 'running' }, { status: 'queued' }] }]
  await store.save(r)
  const service = new NativeRoundtableService({ ctx: {}, store, createUserMessage: () => { throw new Error('must not generate') } })
  await service.init()
  const state = service.snapshot(r.sessionId)
  assert.equal(state.active, null)
  assert.equal(state.batches[0].status, 'interrupted')
  assert.deepEqual(state.batches[0].turns.map(t => t.status), ['succeeded', 'interrupted', 'interrupted'])
  assert.equal((await store.load())[0].active, null)
})
