import Constants from 'expo-constants'

export function apiBaseUrl() {
  return (
    process.env.EXPO_PUBLIC_API_URL ||
    Constants.expoConfig?.extra?.apiUrl ||
    'https://studious-party-api.onrender.com'
  ).replace(/\/$/, '')
}

/** Resuelve URLs de media (/api/media o /uploads). */
export function mediaUrl(path) {
  if (!path || typeof path !== 'string') return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('data:') ||
    trimmed.startsWith('file:')
  ) {
    return trimmed
  }
  if (trimmed.startsWith('/uploads/') || trimmed.startsWith('/api/media/')) {
    return `${apiBaseUrl()}${trimmed}`
  }
  return null
}
