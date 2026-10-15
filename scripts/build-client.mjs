import { readFile, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const source = (await Promise.all(['lib/client/styles.js', 'lib/client/presentation.js', 'lib/client/model-dialog.js', 'lib/client/plugin.js'].map(path => readFile(resolve(root, path), 'utf8')))).join('\n')
const body = source.replace(/^import .*\r?\n/gm, '').replace(/^export (const|function|async function) /gm, '$1 ')
if (/^import |^export /m.test(body)) throw new Error('Unsupported client module syntax')
await writeFile(resolve(root, 'lib/client.js'), `// Generated with node scripts/build-client.mjs\nwindow.__ModuleLoader__.load({\n  id: 'dsh-plugin-ai-roundtable-native',\n  factory: require => {\n    const React = require('react')\n    const ReactDOM = require('react-dom')\n    const { createSnapshotStore } = require('@deepseek-ai/dsh-client-store')\n${body}\n    return { apply, inject }\n  }\n})\n`)
console.log('Built native roundtable client.')
