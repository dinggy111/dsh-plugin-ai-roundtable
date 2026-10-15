import { homedir } from 'node:os'
import { join, resolve } from 'node:path'
import { MetadataStore } from './server/store.js'
import { NativeRoundtableService } from './server/service.js'
import { probeConnection } from './server/probe.js'

export const name = 'ai-roundtable-native'
export const inject = ['llm', 'connection', 'agents', 'sessions', 'systemPrompt', 'sessionController', 'sessionTitle']
export const ENDPOINT = 'ai-roundtable-native/ipc'

async function hostMessages(ctx) {
  try { return await import('@deepseek-ai/dsh-llm') }
  catch (error) {
    if (!ctx.loader?.internal?.import) throw error
    return ctx.loader.internal.import('@deepseek-ai/dsh-llm', ctx.baseUrl, {})
  }
}
async function hostTitles(ctx) {
  try { return await import('@deepseek-ai/dsh-session-title') }
  catch (error) {
    if (!ctx.loader?.internal?.import) throw error
    return ctx.loader.internal.import('@deepseek-ai/dsh-session-title', ctx.baseUrl, {})
  }
}

export async function apply(ctx, config = {}) {
  const messages = await hostMessages(ctx)
  const titles = await hostTitles(ctx)
  const store = new MetadataStore(resolve(config.dataDir ?? join(process.env.DSH_HOME ?? join(homedir(), '.dsh'), 'roundtable-native')))
  const service = new NativeRoundtableService({ ctx, store, createUserMessage: messages.createUserMessage, fallbackSessionTitle: titles.fallbackSessionTitle, callTimeoutMs: config.callTimeoutMs ?? 600000 })
  await service.init()
  ctx.on('agent/created', ({ agent }) => service.bind(agent))
  ctx.on('session/event', (session, event) => service.onEvent(session, event))
  for (const agent of ctx.agents.list()) await service.bind(agent)
  const probes = new Map(), cancelledProbes = new Map()
  ctx.effect(() => () => { for (const controller of probes.values()) controller.abort(); for (const timer of cancelledProbes.values()) clearTimeout(timer) }, 'roundtable-native: probes')
  const dispatch = async (op, input) => {
    switch (op) {
      case 'health': return { architecture: 'native-session', nativeTools: true, oldRecordsMigrated: false }
      case 'models': return ctx.sessionController.modelCatalog()
      case 'list': return service.list()
      case 'get': return service.snapshot(input.sessionId)
      case 'configure': return service.configure(input)
      case 'unconfigure': return service.unconfigure(input.sessionId)
      case 'checkAttachments': return service.checkAttachments(input.sessionId, input.hasImage)
      case 'target': return service.setTarget(input.sessionId, input.target)
      case 'stop': return service.stop(input.sessionId, input.batchId)
      case 'retry': return service.retry(input.sessionId, input.batchId, input.memberId)
      case 'export': return service.export(input.sessionId, input.format)
      case 'probe': {
        const { provider, model, reasoningEffort, probeId } = input
        if (typeof probeId !== 'string' || !/^[a-f0-9-]{36}$/.test(probeId)) throw new Error('连接检测 ID 无效。')
        if (probes.has(probeId) || cancelledProbes.has(probeId)) throw new Error('连接检测已取消或重复。')
        const began = Date.now(); const controller = new AbortController()
        probes.set(probeId, controller)
        let timer
        const deadline = new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () => reject(new Error('连接检测已取消。')), { once: true })
          timer = setTimeout(() => { reject(new Error('模型探测超时，可重试。')); controller.abort() }, 60000)
        })
        const call = probeConnection(ctx.llm, messages, { provider, model, ...(reasoningEffort ? { reasoningEffort } : {}) }, controller.signal)
          .then(value => ({ ...value, elapsedMs: Date.now() - began }))
        try { return await Promise.race([call, deadline]) }
        finally { clearTimeout(timer); probes.delete(probeId); controller.abort() }
      }
      case 'cancelProbe': {
        if (typeof input.probeId !== 'string' || !/^[a-f0-9-]{36}$/.test(input.probeId)) throw new Error('连接检测 ID 无效。')
        probes.get(input.probeId)?.abort()
        if (!cancelledProbes.has(input.probeId)) cancelledProbes.set(input.probeId, setTimeout(() => cancelledProbes.delete(input.probeId), 65000))
        return { cancelled: true }
      }
      default: throw new Error('未知的圆桌操作。')
    }
  }
  ctx.connection.fetch.register({ path: `/api/${ENDPOINT}`, methods: ['POST'], requestBody: 'buffered',
    fetch: async request => {
      let body
      try { body = await request.json() }
      catch { return Response.json({ ok: false, error: { code: 'roundtable/bad-request', message: '请求不是 JSON。', details: {} } }, { status: 400 }) }
      const enveloped = body?.type === 'client-request'
      const input = enveloped ? body.payload : body
      let result
      try {
        if (enveloped && body.method !== ENDPOINT) throw new Error('请求端点不匹配。')
        result = { ok: true, value: await dispatch(input?.op, input ?? {}) }
      } catch (error) { result = { ok: false, error: { code: 'roundtable/operation-failed', message: error.message, details: {} } } }
      return Response.json(enveloped ? { type: 'server-response', rpcId: body.rpcId, result } : result)
    },
  })
  ctx.effect(() => () => service.shutdown(), 'ai-roundtable-native: shutdown')
  ctx.logger?.info?.('AI 圆桌原生会话插件已加载。')
}

export default { name, inject, apply }
