/** Resuelve URLs de media (uploads locales o /api/media en BD). */
export function mediaUrl(path) {
  if (!path || typeof path !== 'string') return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed
  }
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/api/media/')) {
    const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8002'
    return `${apiBase.replace(/\/$/, '')}${trimmed}`
  }
  return null
}
