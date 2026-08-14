import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import { apiBaseUrl } from '../utils/media'
import { useAuth } from './AuthContext'

const NotificationsContext = createContext(null)

function notificationsWsUrl(token) {
  return `${apiBaseUrl().replace(/^http/, 'ws')}/ws/notifications?token=${encodeURIComponent(token)}`
}

export function NotificationsProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  const [loading, setLoading] = useState(false)
  const [nextCursor, setNextCursor] = useState(null)
  const socketRef = useRef(null)
  const nextCursorRef = useRef(null)

  const loadList = useCallback(
    async ({ reset = true } = {}) => {
      if (!token) return
      setLoading(true)
      try {
        const { data } = await api.get('/api/notifications', {
          params: {
            limit: 30,
            ...(!reset && nextCursorRef.current ? { cursor: nextCursorRef.current } : {}),
          },
        })
        setItems((previous) => (reset ? data.items || [] : [...previous, ...(data.items || [])]))
        setNextCursor(data.next_cursor ?? null)
        nextCursorRef.current = data.next_cursor ?? null
      } finally {
        setLoading(false)
      }
    },
    [token],
  )

  const markAllRead = useCallback(async () => {
    const { data } = await api.patch('/api/notifications/read')
    setUnread(data.unread || 0)
    setItems((previous) =>
      previous.map((item) => ({ ...item, read_at: item.read_at || new Date().toISOString() })),
    )
  }, [])

  const markOneRead = useCallback(async (id) => {
    const { data } = await api.patch(`/api/notifications/${id}/read`)
    setUnread(data.unread || 0)
    setItems((previous) =>
      previous.map((item) =>
        item.id === id ? { ...item, read_at: item.read_at || new Date().toISOString() } : item,
      ),
    )
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setItems([])
      setUnread(0)
      socketRef.current?.close()
      socketRef.current = null
      return undefined
    }

    loadList({ reset: true }).catch(() => {})
    let cancelled = false
    let retryTimer
    let socket

    function connect() {
      if (cancelled) return
      socket = new WebSocket(notificationsWsUrl(token))
      socketRef.current = socket
      socket.onmessage = (event) => {
        let message
        try {
          message = JSON.parse(event.data)
        } catch {
          return
        }
        if (message.type === 'badge' && typeof message.unread === 'number') {
          setUnread(message.unread)
        } else if (message.type === 'notification.new' && message.notification) {
          setItems((previous) => [
            message.notification,
            ...previous.filter((item) => item.id !== message.notification.id),
          ])
        } else if (message.type === 'notification.read' && Array.isArray(message.ids)) {
          const ids = new Set(message.ids)
          setItems((previous) =>
            previous.map((item) =>
              ids.has(item.id)
                ? { ...item, read_at: item.read_at || new Date().toISOString() }
                : item,
            ),
          )
        }
      }
      socket.onclose = () => {
        socketRef.current = null
        if (!cancelled) retryTimer = setTimeout(connect, 4000)
      }
    }

    connect()
    return () => {
      cancelled = true
      clearTimeout(retryTimer)
      socket?.close()
      socketRef.current = null
    }
  }, [isAuthenticated, loadList, token])

  const value = useMemo(
    () => ({ items, unread, loading, nextCursor, loadList, markAllRead, markOneRead }),
    [items, unread, loading, nextCursor, loadList, markAllRead, markOneRead],
  )

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>
}

export function useNotifications() {
  const context = useContext(NotificationsContext)
  if (!context) throw new Error('useNotifications debe usarse dentro de NotificationsProvider')
  return context
}
