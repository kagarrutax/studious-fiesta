import { apiBaseUrl } from './media'
import { isNetworkError } from './withRetry'

export function apiErrorMessage(err, fallback = 'Ocurrió un error') {
  if (isNetworkError(err)) {
    return `No hay conexión con el API (${apiBaseUrl()}). Puede estar despertando Render; espera unos segundos y reintenta, o revisa EXPO_PUBLIC_API_URL.`
  }
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) {
    return detail
      .map((item) => (typeof item === 'string' ? item : item.msg || 'Dato inválido'))
      .join('. ')
  }
  return fallback
}
