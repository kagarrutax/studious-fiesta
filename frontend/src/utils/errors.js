import { API_BASE_URL } from '../services/config'

export function apiErrorMessage(err, fallback = 'Ocurrió un error') {
  if (!err.response) {
    return `No hay conexión con el API (${API_BASE_URL}). Si usas la app local, arranca el backend; si usas Vercel, espera a que despierte Render.`
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
