import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
const base = join(process.env.LOCALAPPDATA, 'Programs/DeepSeek Harness/resources/app.asar/dsh/node_modules/@deepseek-ai')
const cordis = await import(pathToFileURL(join(base, 'cordis/lib/index.js')))
const agentLoop = await import(pathToFileURL(join(base, 'dsh-agent-loop/lib/index.js')))
console.log(JSON.stringify({ electron: process.versions.electron, cordis: Object.keys(cordis).slice(0, 8), agentLoop: Object.keys(agentLoop) }))
const ctx = new cordis.Context()
console.log('Context', Object.getOwnPropertyNames(cordis.Context.prototype))
console.log('Fiber', Object.getOwnPropertyNames(Object.getPrototypeOf(ctx.fiber)), ctx.fiber.state)
