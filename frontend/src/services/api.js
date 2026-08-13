import axios from 'axios'
import { apiBaseUrl } from '../utils/apiBase'

const api = axios.create({
  baseURL: apiBaseUrl(),
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

export const search = (q) => api.get('/api/search', { params: { q } })

export default api
