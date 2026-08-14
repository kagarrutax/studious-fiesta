import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import { apiBaseUrl } from '../utils/apiBase'
import { useAuth } from './AuthContext'
import { useToast } from './ToastContext'

const NotificationsContext = createContext(null)

function wsNotificationsUrl(token) {
  const http = apiBaseUrl()
  const ws = http.replace(/^http/, 'ws')
  return `${ws}/ws/notifications?token=${encodeURIComponent(token)}`
}

function formatNotice(n) {
  const who = n.actor?.username || n.payload?.actor_username || 'Alguien'
  if (n.type === 'like') return `@${who} le gustó tu publicación`
  if (n.type === 'comment') return `@${who} comentó tu publicación`
  if (n.type === 'follow') return `@${who} empezó a seguirte`
  if (n.type === 'message') return `@${who} te envió un mensaje`
  return `@${who}: ${n.type}`
}

export function NotificationsProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const toast = useToast()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const wsRef = useRef(null)
  const toastRef = useRef(toast)
  toastRef.current = toast

  const refreshUnread = useCallback(async () => {
    if (!token) return
    try {
      const { data } = await api.get('/api/notifications/unread-count')
      setUnread(data.unread ?? 0)
    } catch {
      /* ignore cold start / offline */
    }
  }, [token])

  const loadList = useCallback(
    async ({ reset = false } = {}) => {
      if (!token) return
      setLoading(true)
      try {
        const params = { limit: 20 }
        if (!reset && nextCursor) params.cursor = nextCursor
        const { data } = await api.get('/api/notifications', { params: reset ? { limit: 20 } : params })
        const batch = data.items || []
        setItems((prev) => (reset ? batch : [...prev, ...batch]))
        setNextCursor(data.next_cursor ?? null)
      } catch {
        /* keep previous */
      } finally {
        setLoading(false)
      }
    },
    [token, nextCursor],
  )

  const markAllRead = useCallback(async () => {
    if (!token) return
    try {
      const { data } = await api.patch('/api/notifications/read')
      setUnread(data.unread ?? 0)
      setItems((prev) =>
        prev.map((n) => (n.read_at ? n : { ...n, read_at: new Date().toISOString() })),
      )
    } catch {
      toastRef.current.error('No se pudieron marcar los avisos')
    }
  }, [token])

  const markOneRead = useCallback(
    async (id) => {
      if (!token) return
      try {
        const { data } = await api.patch(`/api/notifications/${id}/read`)
        setUnread(data.unread ?? 0)
        setItems((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, read_at: n.read_at || new Date().toISOString() } : n,
          ),
        )
      } catch {
        /* ignore */
      }
    },
    [token],
  )

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setItems([])
      setUnread(0)
      setNextCursor(null)
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      return undefined
    }

    refreshUnread()
    loadList({ reset: true })

    let cancelled = false
    let retryTimer
    let socket

    function connect() {
      if (cancelled) return
      socket = new WebSocket(wsNotificationsUrl(token))
      wsRef.current = socket

      socket.onmessage = (event) => {
        let msg
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }
        if (msg.type === 'badge' && typeof msg.unread === 'number') {
          setUnread(msg.unread)
        } else if (msg.type === 'notification.new' && msg.notification) {
          const n = msg.notification
          setItems((prev) => [n, ...prev.filter((x) => x.id !== n.id)].slice(0, 50))
          toastRef.current.info(formatNotice(n), 2800)
        } else if (msg.type === 'notification.read' && Array.isArray(msg.ids)) {
          const idSet = new Set(msg.ids)
          setItems((prev) =>
            prev.map((n) =>
              idSet.has(n.id) ? { ...n, read_at: n.read_at || new Date().toISOString() } : n,
            ),
          )
        }
      }

      socket.onclose = () => {
        wsRef.current = null
        if (!cancelled) {
          retryTimer = window.setTimeout(connect, 4000)
        }
      }
    }

    connect()

    return () => {
      cancelled = true
      window.clearTimeout(retryTimer)
      if (socket) socket.close()
      wsRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- reset list once per token
  }, [isAuthenticated, token, refreshUnread])

  const value = useMemo(
    () => ({
      items,
      unread,
      loading,
      nextCursor,
      formatNotice,
      refreshUnread,
      loadList,
      markAllRead,
      markOneRead,
    }),
    [items, unread, loading, nextCursor, refreshUnread, loadList, markAllRead, markOneRead],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext)
  if (!ctx) {
    throw new Error('useNotifications debe usarse dentro de NotificationsProvider')
  }
  return ctx
}
