export const PROD_API_URL = 'https://studious-party-api.onrender.com'
export const DEV_API_URL = 'http://127.0.0.1:8002'

export function apiBaseUrl() {
  const fromEnv = import.meta.env.VITE_API_URL
  if (fromEnv && String(fromEnv).trim()) {
    return String(fromEnv).replace(/\/$/, '')
  }
  return import.meta.env.PROD ? PROD_API_URL : DEV_API_URL
}
