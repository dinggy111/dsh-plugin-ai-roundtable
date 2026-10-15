import { resolve, join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { mkdir, writeFile } from 'node:fs/promises'

export const inject = ['llm', 'workspaceRegistry', 'agentDefaultModel', 'tools']
export async function apply(ctx, config = {}) {
  const { LlmAdapter } = await import(pathToFileURL(join(process.env.LOCALAPPDATA, 'Programs/DeepSeek Harness/resources/app.asar/dsh/node_modules/@deepseek-ai/dsh-llm/lib/index.js')))
  class TestAdapter extends LlmAdapter {
    probeTries = new Map()
    providerInfo(provider) { return { id: provider, name: `本地验证 ${provider.at(-1).toUpperCase()}` } }
    async listModels(provider) { return [{ provider, id: `test-${provider.at(-1)}`, name: ({ a: 'DeepSeek-V41-Flash', b: 'DeepSeek-V4-Pro', c: 'claude-opus-5-5', d: 'claude-sonnet-5-long-name-overflow-check' })[provider.at(-1)] }] }
    async resolveModel(provider, model) { return { provider, id: model, name: model, context: { contextWindow: 100000 }, inputModalities: model === 'test-c' ? ['text'] : ['text', 'image'], reasoning: { efforts: [{ id: 'low', name: '低' }, { id: 'high', name: '高' }], defaultEffort: 'low' } } }
    async *stream(request) {
      if (request.purpose === 'session-title') {
        const placeholder = request.messages.some(m => m.content.some(b => b.type === 'text' && b.text.includes('占位标题')))
        yield { type: 'text-delta', index: 0, text: placeholder ? 'Untitled session' : '原生圆桌验证' }; yield { type: 'finish', reason: { kind: 'stop' } }; return
      }
      if (request.purpose === 'roundtable-probe' && request.model === 'test-d') {
        const count = this.probeTries.get(request.model) ?? 0; this.probeTries.set(request.model, count + 1)
        if (count === 0) throw new Error('本地测试连接失败，请重试')
      }
      const human = request.messages.findLast(m => m.role === 'user' && m.source?.kind === 'user')
      const text = human?.content.filter(b => b.type === 'text').map(b => b.text).join('') ?? ''
      if (text.includes('失败') && request.model === 'test-a') throw new Error('本地验证模型 A 的可控失败')
      if (text.includes('工具') && !request.messages.some(m => m.role === 'tool')) {
        yield { type: 'tool-call-delta', index: 0, id: 'test-call', name: 'roundtable_test_read', argumentsDelta: '{}' }
        yield { type: 'finish', reason: { kind: 'tool-calls' } }; return
      }
      const wait = () => new Promise((done, fail) => {
        const timer = setTimeout(done, text.includes('慢') ? 3000 : request.purpose === 'roundtable-probe' ? 800 : 30)
        request.signal?.addEventListener('abort', () => { clearTimeout(timer); fail(new Error('验证请求已取消')) }, { once: true })
      })
      yield { type: 'reasoning-delta', index: 0, text: `正在使用 ${request.model} 处理共享上下文。` }
      await wait()
      if (request.purpose === 'roundtable-probe' && request.reasoningEffort === 'high') { yield { type: 'finish', reason: { kind: 'max-tokens' } }; return }
      yield { type: 'text-delta', index: 1, text: `**${request.model} 的原生回答**\n\n工作区、权限、消息、工具和流式输出均由本体处理。\n\n${request.messages.some(m => m.role === 'assistant') ? '已看到先前模型的回答。' : '这是本轮第一位模型。'}\n\n本地测试不调用外部模型。` }
      yield { type: 'finish', reason: { kind: 'stop' } }
    }
  }
  ctx.llm.registerAdapter(['roundtable-test-a', 'roundtable-test-b', 'roundtable-test-c', 'roundtable-test-d'], new TestAdapter())
  ctx.tools.register({ name: 'roundtable_test_read', description: '读取隔离测试工作区的固定验证标记', parameters: { type: 'object', properties: {} },
    output: { schema: { type: 'string' }, render: (_args, value) => [{ type: 'text', text: value }] }, execute: async () => 'NATIVE_TOOL_MARKER' })
  const path = resolve(config.workspace)
  await mkdir(path, { recursive: true }); await writeFile(resolve(path, 'notes.txt'), 'NATIVE_WORKSPACE_MARKER\n')
  // WorkspaceRegistry's public creation face is verified at startup; no user directories are accessed.
  const workspace = await ctx.workspaceRegistry.resolveByPath(path) ?? await ctx.workspaceRegistry.create(path)
  await workspace.setTitle('圆桌隔离验证工作区')
}
