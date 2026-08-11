import axios from 'axios'
import { apiBaseUrl } from '../utils/media'

let authToken = null

export function setAuthToken(token) {
  authToken = token || null
}

const api = axios.create({
  baseURL: apiBaseUrl(),
  timeout: 45000,
})

api.interceptors.request.use((config) => {
  if (authToken) {
    config.headers.Authorization = `Bearer ${authToken}`
  }
  if (!(config.data instanceof FormData)) {
    config.headers['Content-Type'] = 'application/json'
  }
  return config
})

export default api
