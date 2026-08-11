import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Platform } from 'react-native'
import * as SecureStore from 'expo-secure-store'
import api, { setAuthToken } from '../services/api'

const TOKEN_KEY = 'sp_token'
const AuthContext = createContext(null)

async function readToken() {
  if (Platform.OS === 'web') {
    try {
      return globalThis.localStorage?.getItem(TOKEN_KEY) || null
    } catch {
      return null
    }
  }
  return SecureStore.getItemAsync(TOKEN_KEY)
}

async function writeToken(value) {
  if (Platform.OS === 'web') {
    try {
      if (value) globalThis.localStorage?.setItem(TOKEN_KEY, value)
      else globalThis.localStorage?.removeItem(TOKEN_KEY)
    } catch {
      /* ignore */
    }
    return
  }
  if (value) await SecureStore.setItemAsync(TOKEN_KEY, value)
  else await SecureStore.deleteItemAsync(TOKEN_KEY)
}

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null)
  const [user, setUser] = useState(null)
  const [booting, setBooting] = useState(true)
  const [loading, setLoading] = useState(false)

  const logout = useCallback(async () => {
    setAuthToken(null)
    setToken(null)
    setUser(null)
    try {
      await writeToken(null)
    } catch {
      /* ignore */
    }
  }, [])

  const login = useCallback(async (newToken, userData = null) => {
    setAuthToken(newToken)
    setToken(newToken)
    if (userData) setUser(userData)
    await writeToken(newToken)
  }, [])

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const stored = await readToken()
        if (cancelled) return
        if (stored) {
          setAuthToken(stored)
          setToken(stored)
        }
      } catch {
        /* ignore */
      } finally {
        if (!cancelled) setBooting(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (booting) return
    if (!token) {
      setUser(null)
      setLoading(false)
      return
    }

    let cancelled = false
    setLoading(true)
    api
      .get('/api/auth/me')
      .then((res) => {
        if (!cancelled) setUser(res.data)
      })
      .catch(() => {
        if (!cancelled) logout()
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [token, booting, logout])

  const value = useMemo(
    () => ({
      token,
      user,
      booting,
      loading,
      isAuthenticated: Boolean(token),
      login,
      logout,
      setUser,
    }),
    [token, user, booting, loading, login, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth debe usarse dentro de AuthProvider')
  }
  return context
}
