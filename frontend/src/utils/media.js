import { apiBaseUrl } from './apiBase'

/** Resuelve URLs de media (uploads locales o /api/media en BD). */
export function mediaUrl(path) {
  if (!path || typeof path !== 'string') return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
    return trimmed
  }
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/api/media/')) {
    return `${apiBaseUrl()}${trimmed}`
  }
  return null
}
