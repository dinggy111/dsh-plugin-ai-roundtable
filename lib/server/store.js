import { mkdir, readdir, readFile, writeFile, rename, rm } from 'node:fs/promises'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'

export function assertSessionId(id) {
  if (typeof id !== 'string' || !/^(?:session|roundtable-native)-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/.test(id)) throw new Error('无效的圆桌会话 ID。')
  return id
}

// This stores control metadata only. Conversation content belongs to Harness.
export class MetadataStore {
  constructor(directory) { this.directory = directory; this.chain = Promise.resolve() }
  async load() {
    await mkdir(this.directory, { recursive: true })
    const records = []
    for (const file of await readdir(this.directory)) {
      if (!/^(?:session|roundtable-native)-[a-f0-9-]{36}\.json$/.test(file)) continue
      const record = JSON.parse(await readFile(join(this.directory, file), 'utf8'))
      assertSessionId(record.sessionId)
      if (record.version !== 1 || file !== `${record.sessionId}.json` || !Array.isArray(record.members) || !Array.isArray(record.batches)) throw new Error(`圆桌控制记录损坏：${file}`)
      records.push(record)
    }
    return records
  }
  save(record) {
    assertSessionId(record.sessionId)
    const content = JSON.stringify(record, null, 2) + '\n'
    const operation = this.chain.then(async () => {
      await mkdir(this.directory, { recursive: true })
      const destination = join(this.directory, `${record.sessionId}.json`)
      const temporary = `${destination}.${randomUUID()}.tmp`
      await writeFile(temporary, content, { encoding: 'utf8', flag: 'wx' })
      await rename(temporary, destination)
    })
    this.chain = operation.catch(() => {})
    return operation
  }
  remove(id) {
    assertSessionId(id)
    const operation = this.chain.then(() => rm(join(this.directory, `${id}.json`), { force: true }))
    this.chain = operation.catch(() => {})
    return operation
  }
}
