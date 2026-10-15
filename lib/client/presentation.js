const MEMORY_KEY = 'dsh.ai-roundtable-native.models'
export const MAX_MODEL_NAME_LENGTH = 'DeepSeek-V41-Flash'.length
export const roundtableIcon = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><g fill="none" stroke="black" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="3.5" r="2"/><circle cx="3.5" cy="12" r="2"/><circle cx="20.5" cy="12" r="2"/><path d="M8.5 9V8c0-2 7-2 7 0v1M1.5 17v3h5v-4l2-2m14 3v3h-5v-4l-2-2M9 15v5m6-5v5"/><ellipse cx="12" cy="12" rx="5.5" ry="3"/></g></svg>')
export function routeKey(m) { return JSON.stringify([m.provider, m.model ?? m.id]) }
export function accent(index) { return `hsl(${[212, 150, 32, 278][index % 4]} 65% 48%)` }
export function shortName(name) {
  const chars = [...String(name ?? '')]
  return chars.length > MAX_MODEL_NAME_LENGTH ? chars.slice(0, MAX_MODEL_NAME_LENGTH - 1).join('') + '…' : chars.join('')
}
export function avatarLabel(name) {
  const value = String(name).toLowerCase()
  if (value.includes('deepseek')) return value.includes('flash') ? 'DF' : value.includes('pro') ? 'DP' : 'DS'
  if (value.includes('claude')) return value.includes('opus') ? 'CO' : value.includes('sonnet') ? 'CS' : 'CL'
  if (value.includes('gpt')) return 'GP'
  return [...String(name)].slice(0, 2).join('').toUpperCase() || 'AI'
}
export function rememberedModels() {
  try { const rows = JSON.parse(localStorage.getItem(MEMORY_KEY)); return Array.isArray(rows) ? rows.slice(0, 4).filter(m => typeof m.provider === 'string' && typeof m.model === 'string') : [] } catch { return [] }
}
export function rememberModels(members) { try { localStorage.setItem(MEMORY_KEY, JSON.stringify(members)) } catch {} }
