import { apiBaseUrl } from './apiBase'
import { isNetworkError } from './withRetry'

export function apiErrorMessage(err, fallback = 'Ocurrió un error') {
  if (isNetworkError(err)) {
    const apiUrl = apiBaseUrl()
    return `No hay conexión con el API (${apiUrl}). Puede estar despertando Render; espera unos segundos y reintenta.`
  }
  const detail = err.response.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item === 'string' ? item : item.msg || 'Dato inválido'))
      .join('. ')
  }
  return fallback
}
