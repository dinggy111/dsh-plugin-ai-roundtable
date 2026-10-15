// Share Harness's block assembly so reasoning and completed block chunks count
// as provider output too. A connectivity probe never invokes tools or retries.
export async function probeConnection(llm, messages, route, signal) {
  const config = await llm.resolveCallConfig({ ...route, maxTokens: 512 }, signal)
  if (signal.aborted) throw new Error('连接检测已取消。')
  const assembler = new messages.BlockAssembler()
  let finish
  for await (const chunk of llm.stream({ ...config, purpose: 'roundtable-probe', signal,
    messages: [messages.createUserMessage({ content: [{ type: 'text', text: '请仅回复：可用' }], source: { kind: 'probe' } })] })) {
    assembler.push(chunk)
    if (chunk.type === 'finish') finish = chunk.reason
  }
  if (signal.aborted || finish?.kind === 'aborted') throw new Error('连接检测已取消。')
  if (!finish) throw new Error('模型连接异常：响应流未返回结束标记。')
  if (finish.kind === 'error') throw new Error([finish.failure?.code, finish.failure?.message ?? '模型返回错误，未提供具体原因。'].filter(Boolean).join(' · '))
  const blocks = assembler.blocks()
  const text = blocks.filter(b => b.type === 'text').map(b => b.text).join('').trim()
  const reasoning = blocks.some(b => b.type === 'reasoning' && b.text.trim())
  if (!text && !reasoning) throw new Error(`模型返回空内容（结束原因：${finish.kind}）。`)
  const note = !text ? `仅返回思考${finish.kind === 'max-tokens' ? '，已达检测输出上限' : ''}` : finish.kind === 'max-tokens' ? '已达检测输出上限' : ''
  return { ok: true, preview: text.slice(0, 120), note }
}
