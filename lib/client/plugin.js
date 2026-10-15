import { ModelDialog } from "./model-dialog.js"
import { accent, shortName, avatarLabel, roundtableIcon } from "./presentation.js"
import { CSS } from "./styles.js"
import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { createSnapshotStore } from '@deepseek-ai/dsh-client-store'

export const inject = ['slots', 'connection', 'sessions', 'uiWorkspace', 'conversation']
const h = React.createElement
const ENDPOINT = 'ai-roundtable-native/ipc'
const EMPTY_REASON = '请选择至少一个发言模型'
const CONFIG_REASON = '请选择 2–4 个圆桌模型'
function selectedIds(r) { return Array.isArray(r.target) ? r.target : r.target === 'all' ? r.members.map(m => m.id) : [r.target] }
function RoundtableOverlay(props) {
  const records = props.useRoundtables(s => s.records)
  const icon = `content:'';display:inline-block;width:16px;height:16px;vertical-align:-3px;margin-right:6px;background:var(--dsw-alias-label-secondary);mask:var(--rtn-roundtable-icon) center/contain no-repeat`
  const css = `:root{--rtn-roundtable-icon:url(${JSON.stringify(roundtableIcon)})}` + Object.values(records).map(r => {
    const root = `[data-conversation-session=${JSON.stringify(r.sessionId)}]`
    return `[data-row-key=${JSON.stringify(`session:${r.sessionId}`)}] > [class$="_title"]::before{${icon}}${root} [data-chat-flow-kind="turn-tail"] [class$="_actions"],${root} [data-actions-reveal] [class$="_actions"]{opacity:1!important}`
  }).join('\n')
  return h(React.Fragment, null, h('style', null, css), h(ModelDialog, props))
}
function controlCSS(record) {
  const root = `[data-conversation-session=${JSON.stringify(record.sessionId)}]`
  return record.batches.flatMap(b => b.turns.filter(t => Number.isSafeInteger(t.nativeTurn)).map(t => {
    const index = record.members.findIndex(m => m.id === t.memberId), member = record.members[index]
    if (!member) return ''
    const selector = `${root} [data-chat-flow-kind="assistant-step"][data-chat-turn="${t.nativeTurn}"]:not([data-chat-group-part="process"]):not([data-chat-group-part="reasoning"])`
    const internalTrigger = b.retryOf || b.turns.indexOf(t) > 0 ? `${root} [data-chat-flow-kind="turn-trigger"][data-chat-turn="${t.nativeTurn}"]{display:none}` : ''
    return `${selector}{position:relative;border:1px solid color-mix(in srgb,${accent(index)} 32%,transparent);border-left:3px solid ${accent(index)};border-radius:12px;background:color-mix(in srgb,${accent(index)} 6%,transparent);padding:52px 16px 14px;box-sizing:border-box}${selector}::before{content:${JSON.stringify(avatarLabel(member.name))};position:absolute;left:16px;top:12px;width:26px;height:26px;display:grid;place-items:center;border-radius:50%;background:${accent(index)};color:white;font:600 11px/1 system-ui}${selector}::after{content:${JSON.stringify(shortName(member.name))};position:absolute;left:50px;right:16px;top:16px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600;font-size:13px;color:var(--dsw-alias-label-primary)}${internalTrigger}`
  })).join('\n')
}

function RoundtableControls(props) {
  const state = props.useRoundtables(s => s), record = state.records[props.sessionId], draft = state.drafts[props.sessionId]
  const native = props.useSession(s => ({ running: s.running, blank: s.blank }))
  const [error, setError] = React.useState(''), [changing, setChanging] = React.useState(false)
  if (!record && !native.blank) return null
  const batch = record?.batches.find(b => b.id === record.active), current = batch?.turns.find(t => t.status === 'running' || t.status === 'queued'), member = record?.members.find(m => m.id === current?.memberId)
  const targets = state.targets[props.sessionId] ?? (record ? selectedIds(record) : []), busy = native.running || !!batch || changing || !!state.preparing[props.sessionId]
  const run = async fn => { setChanging(true); setError(''); try { await fn() } catch (e) { setError(e.message) } finally { setChanging(false) } }
  if (!record) return h('div', { className: 'rtn-control', ...(draft?.enabled ? { 'data-roundtable-native-controls': '' } : {}) },
    h('label', { className: 'rtn-toggle' }, h('input', { className: 'rtn-switch-input', type: 'checkbox', role: 'switch', 'aria-label': 'AI 圆桌', checked: !!draft?.enabled, disabled: busy, onChange: e => props.toggle(e.target.checked) }), h('span', { className: 'rtn-switch-track', 'aria-hidden': true }), h('span', { className: 'rtn-toggle-label' }, 'AI 圆桌')),
    draft?.enabled && h('button', { className: 'rtn-button rtn-model-picker', disabled: busy, onClick: props.open, 'aria-haspopup': 'dialog' }, h('span', { className: 'rtn-picker-icon', 'aria-hidden': true }), h('span', null, draft.members?.length ? `已选 ${draft.members.length} 个模型` : '选择模型'), h('svg', { width: 12, height: 12, viewBox: '0 0 16 16', fill: 'none', 'aria-hidden': true }, h('path', { d: 'M4 6L8 10L12 6', stroke: 'currentColor', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }))), state.errors[props.sessionId] && h('span', { className: 'rtn-error', role: 'alert' }, state.errors[props.sessionId]))
  return h('div', { className: 'rtn-control', 'data-roundtable-native-controls': '', 'data-rtn-started': '', 'data-rtn-count': record.members.length }, h('style', null, controlCSS(record)),
    h('div', { className: 'rtn-targets', role: 'group', 'aria-label': '本轮发言的模型' }, ...record.members.map((m, index) => h('button', { type: 'button', className: 'rtn-button rtn-target', key: m.id, style: { '--rtn-accent': accent(index) }, 'aria-label': m.name, 'aria-pressed': targets.includes(m.id), disabled: busy, title: `${m.name} · ${m.provider}/${m.model}`, onClick: () => run(() => props.target(targets.includes(m.id) ? targets.filter(id => id !== m.id) : [...targets, m.id])) }, h('span', { className: 'rtn-target-name' }, shortName(m.name))))),
    batch && h('span', { className: 'rtn-status rtn-progress', role: 'status', title: `${member?.name ?? '模型'}正在回答` }, `${shortName(member?.name ?? '处理中')} · ${batch.turns.filter(t => t.status === 'succeeded' || t.status === 'failed').length + 1}/${batch.turns.length}`),
    !targets.length && h('span', { className: 'rtn-error' }, EMPTY_REASON), (error || state.errors[props.sessionId] || record.runtimeError) && h('span', { className: 'rtn-error', role: 'alert' }, error || state.errors[props.sessionId] || record.runtimeError))
}

function HeaderActions(props) {
  const record = props.useRoundtables(s => s.records[props.sessionId]), [error, setError] = React.useState('')
  if (!record) return null
  const download = async format => { try { const result = await props.export(format), url = URL.createObjectURL(new Blob([result.text], { type: result.mime })), anchor = document.createElement('a'); anchor.href = url; anchor.download = result.filename; anchor.click(); setTimeout(() => URL.revokeObjectURL(url), 1000) } catch (e) { setError(e.message) } }
  return h('details', { className: 'rtn-menu' }, h('summary', { className: 'rtn-button' }, `AI 圆桌 · ${record.members.length} 模型`), h('div', { className: 'rtn-menu-body' }, ...record.members.map((m, index) => h('div', { className: 'rtn-menu-row', key: m.id, style: { '--rtn-accent': accent(index) }, title: `${m.provider}/${m.model}` }, h('span', { className: 'rtn-dot' }), m.name)), h('button', { className: 'rtn-button', onClick: () => download('markdown') }, '导出 Markdown'), h('button', { className: 'rtn-button', onClick: () => download('json') }, '导出 JSON'), error && h('span', { className: 'rtn-error', role: 'alert' }, error)))
}

function SpeakerStatus(props) {
  const record = props.useRoundtables(s => s.records[props.sessionId]), [error, setError] = React.useState('')
  if (!record) return null
  const number = typeof props.turn === 'number' ? props.turn : props.turn?.turn ?? props.turn?.number ?? props.turn?.key
  const batch = record.batches.find(b => b.turns.some(t => t.nativeTurn === number)), turn = batch?.turns.find(t => t.nativeTurn === number)
  if (!turn) return null
  const member = record.members.find(m => m.id === turn.memberId)
  if (turn.status !== 'failed' && !turn.error && !error) return null
  return h('div', { className: 'rtn-speaker' }, turn.status === 'failed' && h('button', { className: 'rtn-button', disabled: !!record.active, onClick: () => props.retry(batch.id, member.id).catch(e => setError(e.message)) }, '重试这位模型'), turn.error && h('span', { className: 'rtn-error', role: 'alert' }, `${turn.error}${batch.turns.some(t => t.nativeTurn > turn.nativeTurn) ? ' 已继续下一位模型。' : ''}`), error && h('span', { className: 'rtn-error' }, error))
}

export function apply(ctx) {
  const state = createSnapshotStore({ open: null, catalog: null, catalogError: null, records: {}, drafts: {}, targets: {}, preparing: {}, errors: {} })
  const update = patch => state.set({ ...state.getSnapshot(), ...patch })
  const style = document.createElement('style'); style.dataset.plugin = 'ai-roundtable-native'; style.textContent = CSS; document.head.append(style)
  ctx.effect(() => () => style.remove(), 'roundtable-native: styles')
  const call = async (op, input = {}, signal) => { const result = await ctx.connection.rpc.call('/api', ENDPOINT, { op, ...input }, signal); if (!result?.ok) throw new Error(result?.error?.message ?? '圆桌连接失败。'); return result.value }
  let controlVersion = 0
  const save = record => { if (record) { controlVersion++; update({ records: { ...state.getSnapshot().records, [record.sessionId]: record } }) } }
  const forget = id => { const records = { ...state.getSnapshot().records }; delete records[id]; update({ records }) }
  const loadModels = async () => { try { update({ catalog: await call('models'), catalogError: null }) } catch (e) { update({ catalogError: e.message }) } }
  const close = () => update({ open: null }), blockers = new Set()
  const syncBlock = id => {
    const s = state.getSnapshot(), draft = s.drafts[id], record = s.records[id]
    const reason = record && !(s.targets[id] ?? selectedIds(record)).length ? EMPTY_REASON : !record && draft?.enabled && !draft.members?.length ? CONFIG_REASON : null
    const blocks = ctx.conversation.blocks, current = blocks.storeFor(id).getSnapshot()
    if (reason && (!current || current.reason === EMPTY_REASON || current.reason === CONFIG_REASON)) { blocks.set(id, { reason }); blockers.add(id) }
    else if (!reason && blockers.has(id)) { if (current?.reason === EMPTY_REASON || current?.reason === CONFIG_REASON) blocks.set(id, undefined); blockers.delete(id) }
  }
  const configureDraft = (id, members) => { update({ drafts: { ...state.getSnapshot().drafts, [id]: { enabled: true, members } } }); syncBlock(id) }
  // Prepare the circle at the native send boundary; Harness still owns admission,
  // attachment serialization, input commands, optimistic clear and draft recovery.
  const conversation = ctx.conversation, ownDescriptor = Object.getOwnPropertyDescriptor(conversation, 'sendSession'), nativeSend = conversation.sendSession
  if (typeof nativeSend !== 'function' || !conversation.blocks?.storeFor) throw new Error('宿主缺少原生会话发送接口，需要适配此 Harness 版本。')
  const preparing = new Map()
  const prepare = async (session, attachmentIds, signal) => {
    const id = session.sessionId
    let s = state.getSnapshot(), record = s.records[id], draft = s.drafts[id]
    if (!record && !draft?.enabled) return
    if (signal?.aborted) throw new Error('发送已取消。')
    if (!record) {
      if (!draft.members?.length) throw new Error(CONFIG_REASON)
      let task = preparing.get(id)
      if (!task) { task = call('configure', { sessionId: id, members: draft.members }, signal).then(save).finally(() => preparing.delete(id)); preparing.set(id, task) }
      await task; record = state.getSnapshot().records[id]
    }
    s = state.getSnapshot()
    if (!(s.targets[id] ?? selectedIds(record)).length) throw new Error(EMPTY_REASON)
    const attachments = conversation.resolveDraftAttachments(attachmentIds)
    await call('checkAttachments', { sessionId: id, hasImage: attachments.some(a => a.kind === 'image') }, signal)
    if (signal?.aborted) throw new Error('发送已取消。')
  }
  const sendPrepared = async function(session, text, attachmentIds, mode, signal) {
    const id = session.sessionId, s = state.getSnapshot()
    if (!s.records[id] && !s.drafts[id]?.enabled) return nativeSend.call(this, session, text, attachmentIds, mode, signal)
    update({ preparing: { ...s.preparing, [id]: true }, errors: { ...s.errors, [id]: null } })
    try {
      await prepare(session, attachmentIds, signal)
      // Busy circle input is a complete next question, delivered to the native queue.
      const outcome = await nativeSend.call(this, session, text, attachmentIds, 'queue', signal)
      if (outcome.kind === 'success') {
        // Admission already succeeded: a metadata refresh failure must never
        // turn it into a failed send or restore an already admitted draft.
        try { save(await call('get', { sessionId: id })); syncBlock(id) } catch (e) { update({ errors: { ...state.getSnapshot().errors, [id]: `消息已发送，圆桌状态刷新失败：${e.message}` } }) }
      }
      else if (!s.records[id]) { try { const remaining = await call('unconfigure', { sessionId: id }); if (!remaining) forget(id) } catch {} }
      return outcome
    } catch (e) {
      if (!s.records[id]) { try { const remaining = await call('unconfigure', { sessionId: id }); if (!remaining) forget(id) } catch {} }
      update({ errors: { ...state.getSnapshot().errors, [id]: e.message } }); throw e
    }
    finally { update({ preparing: { ...state.getSnapshot().preparing, [id]: false } }) }
  }
  const admissions = new Map()
  const wrapped = function(session, ...args) {
    const id = session.sessionId
    const snapshot = state.getSnapshot()
    if (!snapshot.records[id] && !snapshot.drafts[id]?.enabled) return nativeSend.call(this, session, ...args)
    const task = (admissions.get(id) ?? Promise.resolve()).catch(() => {}).then(() => sendPrepared.call(this, session, ...args))
    admissions.set(id, task)
    task.finally(() => { if (admissions.get(id) === task) admissions.delete(id) }).catch(() => {})
    return task
  }
  Object.defineProperty(conversation, 'sendSession', { configurable: true, writable: true, value: wrapped })
  ctx.effect(() => () => { if (ownDescriptor) Object.defineProperty(conversation, 'sendSession', ownDescriptor); else delete conversation.sendSession; for (const id of blockers) { const blocks = conversation.blocks, value = blocks.storeFor(id).getSnapshot(); if (value?.reason === EMPTY_REASON || value?.reason === CONFIG_REASON) blocks.set(id, undefined) } }, 'roundtable-native: native send preparation')
  const workspace = ctx.uiWorkspace
  const startDescriptor = Object.getOwnPropertyDescriptor(workspace, 'startSession'), nativeStart = workspace.startSession
  if (typeof nativeStart !== 'function') throw new Error('宿主缺少原生新聊天入口，需要适配此 Harness 版本。')
  Object.defineProperty(workspace, 'startSession', { configurable: true, writable: true, value: async function(...args) {
    await Promise.allSettled([...admissions.values()])
    // Native New Chat may reuse the same blank Session. Reset only provisional
    // client configuration; submitted roundtables have their own durable identity.
    for (const id of Object.keys(state.getSnapshot().drafts)) {
      const drafts = { ...state.getSnapshot().drafts }; delete drafts[id]; update({ drafts }); syncBlock(id)
    }
    close(); return nativeStart.apply(this, args)
  } })
  ctx.effect(() => () => { if (startDescriptor) Object.defineProperty(workspace, 'startSession', startDescriptor); else delete workspace.startSession }, 'roundtable-native: new chat draft reset')
  const refresh = async () => { if (document.visibilityState !== 'visible') return; const version = controlVersion, records = await call('list'); if (version !== controlVersion) return; update({ records: Object.fromEntries(records.map(r => [r.sessionId, r])) }); for (const r of records) syncBlock(r.sessionId) }
  let stopped = false, timer
  const tick = async () => { try { await refresh() } catch {} finally { if (!stopped) timer = setTimeout(tick, Object.values(state.getSnapshot().records).some(r => r.active) ? 400 : 1000) } }
  void tick(); ctx.effect(() => () => { stopped = true; clearTimeout(timer) }, 'roundtable-native: control polling')
  const shared = { hooks: { roundtables: state } }
  const probe = async (input, signal) => {
    const probeId = crypto.randomUUID()
    const cancel = () => { void call('cancelProbe', { probeId }).catch(() => {}) }
    signal.addEventListener('abort', cancel, { once: true })
    try { return await call('probe', { ...input, probeId }, signal) }
    finally { signal.removeEventListener('abort', cancel) }
  }
  ctx.slots.inject('shell.overlay', () => ctx.slots.register({ name: 'shell.overlay', id: 'ai-roundtable-native', order: 20, inject: () => ({ ...shared, close, loadModels, configureDraft, probe }) }, RoundtableOverlay))
  const sessionCallbacks = sessionId => ({ ...shared, open: () => update({ open: sessionId }),
    toggle: enabled => { const s = state.getSnapshot(); update({ drafts: { ...s.drafts, [sessionId]: { ...s.drafts[sessionId], enabled } } }); syncBlock(sessionId) },
    target: async targets => { if (targets.length) save(await call('target', { sessionId, target: targets })); update({ targets: { ...state.getSnapshot().targets, [sessionId]: targets } }); syncBlock(sessionId) },
    retry: async (batchId, memberId) => save(await call('retry', { sessionId, batchId, memberId })), export: format => call('export', { sessionId, format }) })
  ctx.slots.inject('conversation.input.left', () => ctx.slots.register({ name: 'conversation.input.left', id: 'ai-roundtable-native', order: -20, inject: sessionCallbacks }, RoundtableControls))
  ctx.slots.inject('conversation.session.header.utilities', () => ctx.slots.register({ name: 'conversation.session.header.utilities', id: 'ai-roundtable-native', order: 20, inject: sessionCallbacks }, HeaderActions))
  ctx.slots.inject('conversation.chat.turnTail', () => ctx.slots.register({ name: 'conversation.chat.turnTail', id: 'ai-roundtable-native', order: -20, inject: sessionCallbacks }, SpeakerStatus))
}
