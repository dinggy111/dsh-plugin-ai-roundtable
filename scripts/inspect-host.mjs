// Extract a read-only reference of the installed desktop contracts for development.
// Outputs stay inside this new plugin; no installed application files are changed.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const archive = process.argv[2] ?? join(process.env.LOCALAPPDATA, 'Programs/DeepSeek Harness/resources/app.asar')
const bytes = readFileSync(archive)
const tree = JSON.parse(bytes.subarray(16, 16 + bytes.readUInt32LE(12)))
const base = 8 + bytes.readUInt32LE(4)
const packages = new Set([
  'cordis', 'dsh-client-ui-cordis',
  'dsh-session-title-first-prompt-llm', 'dsh-session-title-llm', 'dsh-session-persistence-jsonl',
  'dsh-agent', 'dsh-agent-loop', 'dsh-session', 'dsh-session-persistence',
  'dsh-session-projection', 'dsh-session-title', 'dsh-system-prompt', 'dsh-llm',
  'dsh-api-session-controller', 'dsh-api-workspace-controller', 'dsh-tools',
  'dsh-client-ui-conversation', 'dsh-client-ui-chat', 'dsh-client-ui-workspace',
  'dsh-client-ui-model-selection', 'dsh-client-ui-session', 'dsh-client-ui-input-trigger',
  'dsh-client-ui-slots', 'dsh-client-ui-permission-presets', 'dsh-agent-preset',
  'dsh-agent-preset-registry', 'dsh-compaction', 'dsh-compaction-basic', 'dsh-web-app',
  'dsh', 'dsh-cmdline', 'dsh-desktop-host', 'dsh-app-boot', 'dsh-web-frontend', 'dsh-client-modules',
])
function walk(node, path = '') {
  for (const [name, entry] of Object.entries(node.files ?? {})) {
    const full = path ? `${path}/${name}` : name
    if (entry.files) walk(entry, full)
    else {
      const match = /^dsh\/node_modules\/@deepseek-ai\/([^/]+)\/(.+)$/.exec(full)
      if (!match || !packages.has(match[1]) || !/\.(?:js|ts|json|yml)$/.test(full)) continue
      if (entry.unpacked) continue
      const output = join(root, '.host-reference', match[1], match[2])
      mkdirSync(dirname(output), { recursive: true })
      writeFileSync(output, bytes.subarray(base + Number(entry.offset), base + Number(entry.offset) + entry.size))
    }
  }
}
walk(tree)
const app = tree.files['package.json']
const metadata = JSON.parse(bytes.subarray(base + Number(app.offset), base + Number(app.offset) + app.size))
writeFileSync(join(root, '.host-reference', 'host.json'), JSON.stringify({
  version: metadata.version, commit: metadata.dshBuildCommit,
}, null, 2) + '\n')
console.log(`Read installed Harness ${metadata.version}; references extracted for ${packages.size} packages.`)
