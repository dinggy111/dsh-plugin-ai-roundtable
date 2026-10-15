import * as React from 'react'
import * as ReactDOM from 'react-dom'
import { routeKey, accent, shortName, avatarLabel, rememberedModels, rememberModels } from './presentation.js'
const dh = React.createElement
const probeSignature = (model, effort) => JSON.stringify([model.provider, model.id, effort ?? ''])

export function ModelDialog(props) {
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
