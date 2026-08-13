import api from '../services/api'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/** True when the request never got an HTTP response (network / timeout / cold start). */
export function isNetworkError(err) {
  return Boolean(err) && !err.response
}

/**
 * Ping /api/health until the API answers (Render free cold start).
 * @returns {Promise<boolean>} true if health became ok
 */
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

/**
 * Run an async API call; on network failure, wake the API and retry once more.
 * @param {() => Promise<T>} fn
 * @param {{ onWake?: () => void, attempts?: number, delayMs?: number }} [opts]
 */
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
