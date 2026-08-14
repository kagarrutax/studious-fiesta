import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import { apiBaseUrl } from '../utils/apiBase'
import { useAuth } from './AuthContext'

const ChatContext = createContext(null)

function wsChatUrl(token) {
  const http = apiBaseUrl()
  const ws = http.replace(/^http/, 'ws')
  return `${ws}/ws/chat?token=${encodeURIComponent(token)}`
}

export function ChatProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(false)
  const wsRef = useRef(null)
  const listenersRef = useRef(new Set())

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, c) => sum + (c.unread_count || 0), 0),
    [conversations],
  )

  const subscribe = useCallback((fn) => {
    listenersRef.current.add(fn)
    return () => listenersRef.current.delete(fn)
  }, [])

  const emit = useCallback((msg) => {
    listenersRef.current.forEach((fn) => {
      try {
        fn(msg)
      } catch {
        /* ignore listener errors */
      }
    })
  }, [])

  const upsertConversation = useCallback((conv) => {
    if (!conv?.id) return
    setConversations((prev) => {
      const rest = prev.filter((c) => c.id !== conv.id)
      return [conv, ...rest].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      )
    })
  }, [])

  const loadInbox = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const { data } = await api.get('/api/conversations', { params: { limit: 40 } })
      setConversations(data.items || [])
    } catch {
      /* keep previous */
    } finally {
      setLoading(false)
    }
  }, [token])

  const openWithUser = useCallback(async (userId) => {
    const { data } = await api.post('/api/conversations', { user_id: userId })
    upsertConversation(data)
    return data
  }, [upsertConversation])

  const sendTyping = useCallback((conversationId) => {
    const ws = wsRef.current
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ type: 'typing', conversation_id: conversationId }))
    }
  }, [])

  const markRead = useCallback(async (conversationId) => {
    await api.post(`/api/conversations/${conversationId}/read`)
    setConversations((prev) =>
      prev.map((c) => (c.id === conversationId ? { ...c, unread_count: 0 } : c)),
    )
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setConversations([])
      if (wsRef.current) {
        wsRef.current.close()
        wsRef.current = null
      }
      return undefined
    }

    loadInbox()

    let cancelled = false
    let retryTimer
    let socket

    function connect() {
      if (cancelled) return
      socket = new WebSocket(wsChatUrl(token))
      wsRef.current = socket

      socket.onmessage = (event) => {
        let msg
        try {
          msg = JSON.parse(event.data)
        } catch {
          return
        }
        if (msg.type === 'conversation.updated' && msg.conversation) {
          upsertConversation(msg.conversation)
        } else if (msg.type === 'presence' && typeof msg.user_id === 'number') {
          setConversations((prev) =>
            prev.map((c) =>
              c.peer?.id === msg.user_id
                ? { ...c, peer_online: msg.status === 'online' }
                : c,
            ),
          )
        }
        emit(msg)
      }

      socket.onclose = () => {
        wsRef.current = null
        if (!cancelled) retryTimer = window.setTimeout(connect, 4000)
      }
    }

    connect()

    return () => {
      cancelled = true
      window.clearTimeout(retryTimer)
      if (socket) socket.close()
      wsRef.current = null
    }
  }, [isAuthenticated, token, loadInbox, upsertConversation, emit])

  const value = useMemo(
    () => ({
      conversations,
      unreadTotal,
      loading,
      loadInbox,
      openWithUser,
      sendTyping,
      markRead,
      subscribe,
      upsertConversation,
    }),
    [
      conversations,
      unreadTotal,
      loading,
      loadInbox,
      openWithUser,
      sendTyping,
      markRead,
      subscribe,
      upsertConversation,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const ctx = useContext(ChatContext)
  if (!ctx) {
    throw new Error('useChat debe usarse dentro de ChatProvider')
  }
  return ctx
}
