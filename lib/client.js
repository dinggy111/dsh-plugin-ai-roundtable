// Generated with node scripts/build-client.mjs
window.__ModuleLoader__.load({
  id: 'dsh-plugin-ai-roundtable-native',
  factory: require => {
    const React = require('react')
    const ReactDOM = require('react-dom')
    const { createSnapshotStore } = require('@deepseek-ai/dsh-client-store')
const CSS = `
[data-slot="conversation.composer.bar"]:has([data-roundtable-native-controls]) [data-slot="conversation.input.model"]{display:none!important}
.rtn-button,.rtn-select{box-sizing:border-box;font:inherit;color:var(--dsw-alias-label-primary);background:var(--dsw-specific-selector,var(--dsw-alias-interactive-bg-hover));border:1px solid var(--dsw-alias-border-l3);border-radius:7px;padding:4px 9px}
.rtn-button{cursor:pointer}.rtn-button:disabled{opacity:.5;cursor:default}
.rtn-control{display:flex;align-items:center;gap:6px;flex-wrap:wrap;font-size:13px;min-width:0}
.rtn-status{color:var(--dsw-alias-label-secondary);font-size:12px}
.rtn-error{color:var(--dsw-alias-state-danger,#b33);font-size:12px;white-space:pre-wrap}
.rtn-overlay{position:fixed;inset:var(--dsh-frame-chrome-top,var(--dsh-windows-titlebar-height,0px)) 0 0;display:grid;place-items:center;background:#0006;z-index:1000;padding:20px;box-sizing:border-box}
.rtn-dialog{width:min(720px,100%);max-height:92%;overflow:auto;box-sizing:border-box;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#222);border:1px solid var(--dsw-alias-border-l3);border-radius:14px;box-shadow:0 12px 40px #0003;padding:18px;font-size:13px}
.rtn-dialog h2{margin:0 0 6px;font-size:18px}.rtn-dialog p{color:var(--dsw-alias-label-secondary);margin:0 0 10px;line-height:1.5}
.rtn-catalog{max-height:44vh;overflow-y:auto;overscroll-behavior:contain;padding:2px 2px 2px 0}
.rtn-provider{margin-bottom:7px}.rtn-provider-name{font-size:12px;line-height:18px;font-weight:500;color:var(--dsw-alias-label-secondary);margin-bottom:3px}
.rtn-options{display:flex;gap:4px;flex-wrap:wrap}
.rtn-option{font-size:12px;line-height:18px;min-width:0;max-width:190px;padding:2px 8px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-tertiary)}
.rtn-order{display:inline-grid;place-items:center;width:15px;height:15px;margin-right:5px;border-radius:4px;background:var(--rtn-accent);color:white;font:600 10px/1 system-ui}
.rtn-member-order{width:10px;flex:none;text-align:center;color:var(--rtn-accent);font-weight:600}
.rtn-option[aria-pressed="true"],.rtn-target[aria-pressed="true"]{background:color-mix(in srgb,var(--rtn-accent,var(--dsw-alias-state-business-primary,#4176e6)) 12%,transparent);border-color:var(--rtn-accent,var(--dsw-alias-state-business-primary,#4176e6));color:var(--dsw-alias-label-primary)}
.rtn-model-count{margin-top:8px;padding-top:8px;border-top:1px solid var(--dsw-alias-border-l3);font-size:12px;color:var(--dsw-alias-label-secondary)}
.rtn-models{display:flex;flex-direction:column;gap:3px;margin-top:6px}
.rtn-member{display:flex;align-items:center;gap:7px;min-width:0;min-height:30px;font-size:12px}
.rtn-member-name{flex:0 1 150px;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:500}
.rtn-efforts{display:flex;gap:3px;flex-wrap:wrap;max-width:230px}
.rtn-effort{min-width:0;font-size:12px;line-height:18px;padding:1px 6px;color:var(--dsw-alias-label-secondary)}
.rtn-effort[aria-pressed="true"]{border-color:var(--rtn-accent);background:color-mix(in srgb,var(--rtn-accent) 12%,transparent);color:var(--dsw-alias-label-primary)}
.rtn-probe-detail{padding:1px 0 4px 46px;overflow-wrap:anywhere;line-height:18px}
.rtn-probe-result{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--dsw-alias-label-secondary);font-size:12px}
.rtn-probe-result[data-state="ok"]{color:var(--dsw-alias-state-success-primary,#12a150)}.rtn-probe-result[data-state="fail"]{color:var(--dsw-alias-state-danger,#b33)}
.rtn-probe-action{flex:none;font-size:12px;line-height:18px;padding:2px 6px}
.rtn-spinner{display:inline-block;width:10px;height:10px;border:1.5px solid currentColor;border-right-color:transparent;border-radius:50%;margin-right:5px;vertical-align:-1px;animation:rtn-spin .8s linear infinite}
@keyframes rtn-spin{to{transform:rotate(360deg)}}@media(prefers-reduced-motion:reduce){.rtn-spinner{animation:none}}
.rtn-actions{display:flex;gap:8px;justify-content:flex-end;margin-top:12px}.rtn-primary{background:var(--dsw-alias-state-business-primary,#4b6bdb);color:white}
.rtn-toggle{position:relative;display:inline-flex;align-items:center;gap:7px;height:28px;flex:none;cursor:pointer;user-select:none}
.rtn-toggle-label{font-size:12px;line-height:18px;color:var(--dsw-alias-label-secondary)}
.rtn-switch-input{position:absolute;left:0;top:4px;width:34px;height:20px;margin:0;opacity:0;cursor:inherit;z-index:1}
.rtn-switch-track{position:relative;display:block;flex:none;width:34px;height:20px;border-radius:999px;background:var(--dsw-alias-border-l3,#d1d5db);box-shadow:inset 0 0 0 1px #00000006;transition:background .18s}
.rtn-switch-track::before{content:'';position:absolute;left:3px;top:3px;width:14px;height:14px;border-radius:50%;background:#fff;box-shadow:0 1px 3px #0002;transition:transform .18s}
.rtn-switch-input:checked + .rtn-switch-track{background:var(--dsw-alias-state-business-primary,#4176e6)}
.rtn-switch-input:checked + .rtn-switch-track::before{transform:translateX(14px)}
.rtn-switch-input:checked ~ .rtn-toggle-label{color:var(--dsw-alias-label-primary)}
.rtn-switch-input:focus-visible + .rtn-switch-track{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:3px}
.rtn-toggle:has(.rtn-switch-input:disabled){cursor:default;opacity:.5}
.rtn-model-picker{display:inline-flex;align-items:center;gap:6px;height:28px;padding:0 9px;border-radius:999px;border-color:var(--dsw-alias-border-l3);background:var(--dsw-specific-selector);color:var(--dsw-alias-label-secondary);font-size:12px;line-height:18px;white-space:nowrap;transition:background .12s,border-color .12s}
.rtn-model-picker:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover);border-color:var(--dsw-alias-border-l2);color:var(--dsw-alias-label-primary)}
.rtn-picker-icon{width:15px;height:15px;flex:none;background:currentColor;mask:var(--rtn-roundtable-icon) center/contain no-repeat}
@media(prefers-reduced-motion:reduce){.rtn-switch-track,.rtn-switch-track::before,.rtn-model-picker{transition:none}}
.rtn-avatar{display:inline-grid;place-items:center;width:22px;height:22px;flex:none;border-radius:50%;background:var(--rtn-accent);color:white;font:600 10px/1 system-ui}
.rtn-targets{display:grid;grid-template-columns:minmax(0,1fr);gap:var(--rtn-row-gap,2px);min-width:0}
.rtn-target{display:flex;align-items:center;width:100%;min-width:0;max-width:100%;height:var(--rtn-row-height,22px);padding:0 5px;border-radius:6px;text-align:center;overflow:hidden;color:var(--dsw-alias-label-tertiary);background:transparent;border-color:var(--dsw-alias-border-l3);transition:background .12s,border-color .12s,color .12s}
.rtn-target[aria-pressed="true"]{background:color-mix(in srgb,var(--rtn-accent) 9%,var(--dsw-specific-input-major));border-color:color-mix(in srgb,var(--rtn-accent) 55%,var(--dsw-alias-border-l3))}
.rtn-target:hover:not(:disabled){background:color-mix(in srgb,var(--rtn-accent) 15%,var(--dsw-specific-input-major));border-color:var(--rtn-accent)}
.rtn-target-name{min-width:0;flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-size:12px;line-height:18px}
:has(> [data-composer-card] [data-rtn-started]){--rtn-panel-width:142px;--rtn-panel-gap:8px;container-type:inline-size;container-name:rtn-dock;box-sizing:border-box;width:100%;max-width:calc(var(--dsh-composer-card-max-width) + var(--dsh-composer-side-clearance) * 2);margin-inline:auto}
[data-composer-card]:has([data-rtn-started]){position:relative;min-height:98px;width:calc(100% - var(--rtn-panel-width) - var(--rtn-panel-gap));max-width:none;margin-right:calc(var(--rtn-panel-width) + var(--rtn-panel-gap))}
.rtn-control[data-rtn-started]{position:absolute;left:calc(100% + var(--rtn-panel-gap));right:auto;top:0;bottom:0;width:var(--rtn-panel-width);box-sizing:border-box;display:flex;flex-direction:column;align-items:stretch;justify-content:center;gap:2px;padding:2px 0;border:0;border-radius:0;background:transparent;box-shadow:none}
[data-rtn-count="2"]{--rtn-row-height:32px;--rtn-row-gap:4px}
[data-rtn-count="3"]{--rtn-row-height:28px;--rtn-row-gap:4px}
[data-rtn-count="4"]{--rtn-row-height:22px;--rtn-row-gap:2px}
.rtn-progress{font-size:11px;line-height:14px;text-align:center;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.rtn-control[data-rtn-started] .rtn-progress{position:absolute;bottom:calc(100% + 4px);left:0;right:0}
.rtn-menu{position:relative;font-size:13px}.rtn-menu summary{cursor:pointer;list-style:none}.rtn-menu-body{position:absolute;right:0;top:calc(100% + 8px);z-index:30;min-width:230px;max-width:320px;padding:12px;background:var(--dsw-alias-bg-base,#fff);border:1px solid var(--dsw-alias-border-l3);border-radius:12px;box-shadow:0 6px 20px #0002;display:flex;flex-direction:column;gap:8px}.rtn-menu-row{display:flex;gap:6px;align-items:center}.rtn-dot{background:var(--rtn-accent);width:8px;height:8px;border-radius:50%;flex:none}
header:has(.rtn-menu) nav [class$="_crumbCurrent"]::before{content:'';display:inline-block;width:18px;height:18px;vertical-align:-3px;margin-right:6px;background:var(--dsw-alias-label-secondary);mask:var(--rtn-roundtable-icon) center/contain no-repeat}
.rtn-speaker{display:flex;flex-wrap:wrap;gap:6px;align-items:center;font-size:12px}.rtn-button:focus-visible,.rtn-select:focus-visible{outline:2px solid var(--dsw-alias-state-business-primary,#4176e6);outline-offset:2px}
html[data-fullscreen] .rtn-overlay{top:0}@media(max-width:500px){.rtn-overlay{padding:10px}.rtn-dialog{padding:12px}.rtn-member{gap:4px;flex-wrap:wrap}.rtn-member-name{flex-basis:130px}.rtn-efforts{max-width:none}.rtn-probe-result{flex-basis:80px}}
`

const MEMORY_KEY = 'dsh.ai-roundtable-native.models'
const MAX_MODEL_NAME_LENGTH = 'DeepSeek-V41-Flash'.length
const roundtableIcon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="black" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="3.5" r="2"/><circle cx="3.5" cy="12" r="2"/><circle cx="20.5" cy="12" r="2"/><path d="M8.5 9V8c0-2 7-2 7 0v1M1.5 17v3h5v-4l2-2m14 3v3h-5v-4l-2-2M9 15v5m6-5v5"/><ellipse cx="12" cy="12" rx="5.5" ry="3"/></g></svg>')
function routeKey(m) { return JSON.stringify([m.provider, m.model ?? m.id]) }
function accent(index) { return `hsl(${[212, 150, 32, 278][index % 4]} 65% 48%)` }
function shortName(name) {
  const chars = [...String(name ?? '')]
  return chars.length > MAX_MODEL_NAME_LENGTH ? chars.slice(0, MAX_MODEL_NAME_LENGTH - 1).join('') + '…' : chars.join('')
}
function avatarLabel(name) {
  const value = String(name).toLowerCase()
  if (value.includes('deepseek')) return value.includes('flash') ? 'DF' : value.includes('pro') ? 'DP' : 'DS'
  if (value.includes('claude')) return value.includes('opus') ? 'CO' : value.includes('sonnet') ? 'CS' : 'CL'
  if (value.includes('gpt')) return 'GP'
  return [...String(name)].slice(0, 2).join('').toUpperCase() || 'AI'
}
function rememberedModels() {
  try { const rows = JSON.parse(localStorage.getItem(MEMORY_KEY)); return Array.isArray(rows) ? rows.slice(0, 4).filter(m => typeof m.provider === 'string' && typeof m.model === 'string') : [] } catch { return [] }
}
function rememberModels(members) { try { localStorage.setItem(MEMORY_KEY, JSON.stringify(members)) } catch {} }

const dh = React.createElement
const probeSignature = (model, effort) => JSON.stringify([model.provider, model.id, effort ?? ''])

function ModelDialog(props) {
  const state = props.useRoundtables(s => s), sessionId = state.open, config = state.drafts[sessionId]
  const [choices, setChoices] = React.useState([]), [efforts, setEfforts] = React.useState({}), [probes, setProbes] = React.useState({})
  const [error, setError] = React.useState(''), [now, setNow] = React.useState(Date.now())
  const dialogRef = React.useRef(null), controllers = React.useRef(new Map()), generation = React.useRef(0)
  const choicesRef = React.useRef(choices), probesRef = React.useRef(probes)
  choicesRef.current = choices
  const models = (state.catalog?.groups ?? []).flatMap(g => g.models.map(m => ({ ...m, provider: g.id, providerName: g.name, key: routeKey({ provider: g.id, id: m.id }) })))
  React.useEffect(() => {
    if (!sessionId) return
    const members = config?.members?.length ? config.members : rememberedModels()
    const selected = members.map(routeKey).filter(key => !state.catalog || models.some(m => m.key === key))
    choicesRef.current = selected; probesRef.current = {}
    setChoices(selected); setEfforts(Object.fromEntries(members.map(m => [routeKey(m), m.reasoningEffort ?? '']))); setError(''); setProbes({}); generation.current++
    const focus = document.activeElement; void props.loadModels()
    return () => { generation.current++; for (const c of controllers.current.values()) c.abort(); controllers.current.clear(); probesRef.current = {}; setProbes({}); focus?.focus?.() }
  }, [sessionId])
  React.useEffect(() => { if (state.catalog) setChoices(c => c.filter(key => models.some(m => m.key === key))) }, [state.catalog])
  React.useEffect(() => { if (sessionId) dialogRef.current?.querySelector('button')?.focus() }, [sessionId])
  const writeProbe = (key, result) => {
    probesRef.current = { ...probesRef.current, [key]: result }
    setProbes(current => ({ ...current, [key]: result }))
  }
  const cancelProbe = key => {
    controllers.current.get(key)?.abort(); controllers.current.delete(key)
    writeProbe(key, { state: 'cancelled', text: '已取消' })
  }
  const probe = async key => {
    const model = models.find(m => m.key === key)
    if (!model || controllers.current.has(key)) return
    const controller = new AbortController(), token = generation.current, effort = efforts[key] ?? '', signature = probeSignature(model, effort)
    controllers.current.set(key, controller)
    writeProbe(key, { state: 'pending', signature, startedAt: Date.now(), text: '正在检测' })
    try {
      const value = await props.probe({ provider: model.provider, model: model.id, ...(effort ? { reasoningEffort: effort } : {}) }, controller.signal)
      if (token === generation.current && controllers.current.get(key) === controller) {
        const result = { state: 'ok', signature, text: `已连接 · ${(value.elapsedMs / 1000).toFixed(1)} 秒`, detail: value.note }
        writeProbe(key, result)
      }
    } catch (e) {
      if (token === generation.current && controllers.current.get(key) === controller) {
        const result = { state: 'fail', signature, text: '检测失败', detail: e.message }
        writeProbe(key, result)
      }
    } finally { if (controllers.current.get(key) === controller) controllers.current.delete(key) }
  }
  const signature = choices.join('|'), effortSignature = choices.map(key => efforts[key] ?? '').join('|')
  React.useEffect(() => {
    if (!sessionId || !state.catalog || choicesRef.current.join('|') !== signature) return
    for (const key of choices) {
      const model = models.find(m => m.key === key), current = probesRef.current[key]
      if (!model || current?.signature === probeSignature(model, efforts[key]) && current.state !== 'cancelled') continue
      void probe(key)
    }
  }, [sessionId, state.catalog, signature, effortSignature])
  const pending = Object.values(probes).some(p => p.state === 'pending')
  React.useEffect(() => { if (!pending) return; const timer = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(timer) }, [pending])
  if (!sessionId) return null
  const knownChoices = choices.filter(key => models.some(m => m.key === key))
  const toggle = key => {
    if (!choices.includes(key) && choices.length >= 4) { setError('最多选择 4 个模型。'); return }
    if (choices.includes(key)) cancelProbe(key)
    setChoices(c => c.includes(key) ? c.filter(k => k !== key) : [...c, key]); setError('')
  }
  const confirm = () => {
    if (knownChoices.length < 2 || knownChoices.length > 4 || knownChoices.length !== choices.length) { setError('请选择 2–4 个不同模型。'); return }
    const members = choices.map(key => { const m = models.find(m => m.key === key); return { provider: m.provider, model: m.id, name: m.name, ...(efforts[key] ? { reasoningEffort: efforts[key] } : {}) } })
    rememberModels(members); props.configureDraft(sessionId, members); props.close()
  }
  const keydown = e => {
    if (e.key === 'Escape') { e.preventDefault(); props.close() }
    if (e.key !== 'Tab') return
    const items = [...dialogRef.current.querySelectorAll('button:not(:disabled),select:not(:disabled)')], first = items[0], last = items.at(-1)
    if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last?.focus() }
    else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
  }
  return ReactDOM.createPortal(dh('div', { className: 'rtn-overlay', onMouseDown: e => { if (e.target === e.currentTarget) props.close() } },
    dh('div', { className: 'rtn-dialog', ref: dialogRef, role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'rtn-model-title', onKeyDown: keydown },
      dh('h2', { id: 'rtn-model-title' }, '选择圆桌模型'), dh('p', null, '选择 2–4 个模型，按选择顺序发言。'),
      state.catalogError && dh('div', { className: 'rtn-error', role: 'alert' }, state.catalogError, dh('button', { className: 'rtn-button', onClick: props.loadModels }, '重新加载')),
      !state.catalog && !state.catalogError && dh('p', { role: 'status' }, '正在读取本体模型配置…'),
      ...(state.catalog?.failures ?? []).map(f => dh('p', { className: 'rtn-error', key: f.id }, `${f.name}：${f.message}`)),
      dh('div', { className: 'rtn-catalog' }, ...(state.catalog?.groups ?? []).map(g => dh('div', { className: 'rtn-provider', key: g.id },
        dh('div', { className: 'rtn-provider-name' }, g.name), dh('div', { className: 'rtn-options' }, ...g.models.map(m => {
          const key = routeKey({ provider: g.id, id: m.id }), index = choices.indexOf(key)
          return dh('button', { className: 'rtn-button rtn-option', key, type: 'button', 'aria-label': m.name, 'aria-pressed': index >= 0, style: index >= 0 ? { '--rtn-accent': accent(index) } : undefined, onClick: () => toggle(key), title: `${m.name} · ${g.id}/${m.id}${index >= 0 ? ` · 第 ${index + 1} 位发言` : ''}` }, index >= 0 && dh('span', { className: 'rtn-order', 'aria-label': `第 ${index + 1} 位发言` }, index + 1), shortName(m.name))
        }))))),
      knownChoices.length > 0 && dh('div', { className: 'rtn-model-count' }, `已选 ${knownChoices.length}/4 · 连接与思考强度`),
      dh('div', { className: 'rtn-models' }, ...knownChoices.map((key, index) => {
        const model = models.find(m => m.key === key), result = probes[key], status = result?.state ?? 'pending'
        return dh('div', { className: 'rtn-member-row', key, style: { '--rtn-accent': accent(index) }, 'data-probe-model': key }, dh('div', { className: 'rtn-member' },
          dh('span', { className: 'rtn-member-order', 'aria-label': `第 ${index + 1} 位发言` }, index + 1), dh('span', { className: 'rtn-avatar', 'aria-hidden': true }, avatarLabel(model.name)),
          dh('span', { className: 'rtn-member-name', title: `${model.name} · ${model.providerName}` }, shortName(model.name)),
          model.reasoning?.efforts?.length > 0 && dh('div', { className: 'rtn-efforts', role: 'group', 'aria-label': `${model.name}思考强度` }, ...[{ id: '', name: '默认' }, ...model.reasoning.efforts].map(e => dh('button', { type: 'button', className: 'rtn-button rtn-effort', key: e.id, 'aria-pressed': (efforts[key] ?? '') === e.id, onClick: () => { if ((efforts[key] ?? '') === e.id) return; cancelProbe(key); setEfforts(p => ({ ...p, [key]: e.id })) } }, e.name))),
          dh('span', { className: 'rtn-probe-result', role: 'status', 'data-state': status, title: result?.text }, status === 'pending' && dh('span', { className: 'rtn-spinner', 'aria-hidden': true }), status === 'pending' ? `检测中 · ${Math.max(0, Math.floor((now - (result?.startedAt ?? now)) / 1000))} 秒` : result.text),
          (status === 'pending' || status === 'fail' || status === 'cancelled') && dh('button', { className: 'rtn-button rtn-probe-action', onClick: () => status === 'pending' ? cancelProbe(key) : probe(key) }, status === 'pending' ? '取消' : '重试')), result?.detail && dh('div', { className: status === 'fail' ? 'rtn-error rtn-probe-detail' : 'rtn-status rtn-probe-detail', role: status === 'fail' ? 'alert' : undefined }, result.detail))
      })),
      dh('p', { style: { marginTop: 8, fontSize: 12 } }, '选中模型后自动测试连接。检测失败也可保存选择。'),
      error && dh('div', { className: 'rtn-error', role: 'alert' }, error),
      dh('div', { className: 'rtn-actions' }, dh('button', { className: 'rtn-button', onClick: props.close }, '取消'), dh('button', { className: 'rtn-button rtn-primary', disabled: knownChoices.length < 2 || knownChoices.length > 4, onClick: confirm }, '确定')))), document.body)
}


const inject = ['slots', 'connection', 'sessions', 'uiWorkspace', 'conversation']
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

function apply(ctx) {
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

    return { apply, inject }
  }
})
