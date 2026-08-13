import api from '../services/api'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

export function isNetworkError(err) {
  return Boolean(err) && !err.response
}

export async function wakeApi({ attempts = 4, delayMs = 2500 } = {}) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const { data, status } = await api.get('/api/health', { timeout: 15000 })
      if (status >= 200 && status < 300 && (data?.status === 'ok' || data)) {
        return true
      }
    } catch {
      /* keep trying */
    }
    if (i < attempts - 1) {
      await sleep(delayMs)
    }
  }
  return false
}

export async function withApiRetry(fn, opts = {}) {
  const { onWake, attempts = 4, delayMs = 2500 } = opts
  try {
    return await fn()
  } catch (err) {
    if (!isNetworkError(err)) {
      throw err
    }
    onWake?.()
    await wakeApi({ attempts, delayMs })
    return fn()
  }
}
