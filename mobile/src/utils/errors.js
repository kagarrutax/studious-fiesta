import { apiBaseUrl } from './media'

export function apiErrorMessage(err, fallback = 'Ocurrió un error') {
  if (!err.response) {
    return `No hay conexión con el API (${apiBaseUrl()}). Espera a que despierte Render o revisa EXPO_PUBLIC_API_URL.`
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
