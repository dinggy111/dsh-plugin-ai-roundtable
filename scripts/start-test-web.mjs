import { join, resolve, dirname } from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
process.env.DSH_HOME = join(root, '.test-home-ui')
const patch = join(root, '.test-results', 'web.patch.yml')
await mkdir(dirname(patch), { recursive: true })
const pathText = path => `'${path.replaceAll('\\', '/').replaceAll("'", "''")}'`
await writeFile(patch, `- insert:\n    - id: roundtable-native-diagnostics\n      name: ${pathText(join(root, 'tests/fixture/diagnostics.js'))}\n      config:\n        authPath: ${pathText(join(root, '.test-results/auth.json'))}\n    - id: roundtable-native-fixture\n      name: ${pathText(join(root, 'tests/fixture/index.js'))}\n      config:\n        workspace: ${pathText(join(root, '.test-home-ui/workspace'))}\n    - id: ai-roundtable\n      name: ${pathText(join(root, 'lib/index.js'))}\n      config:\n        dataDir: ${pathText(join(root, '.test-home-ui/roundtable-native'))}\n`)
const cli = join(process.env.LOCALAPPDATA, 'Programs/DeepSeek Harness/resources/app.asar/dsh/node_modules/@deepseek-ai/dsh/lib/bin.js')
process.argv = [process.execPath, cli, '--profile', 'web', '--patch', patch, '--no-open', '--port', '3146']
const { runCli } = await import(pathToFileURL(cli))
await runCli()
