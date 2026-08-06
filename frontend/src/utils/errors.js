export function apiErrorMessage(err, fallback = 'Ocurrió un error') {
  if (!err.response) {
    return 'No hay conexión con el API. Comprueba que el backend esté en http://127.0.0.1:8002'
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
