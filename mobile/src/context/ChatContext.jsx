import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import api from '../services/api'
import { apiBaseUrl } from '../utils/media'
import { useAuth } from './AuthContext'

const ChatContext = createContext(null)

function chatWsUrl(token) {
  return `${apiBaseUrl().replace(/^http/, 'ws')}/ws/chat?token=${encodeURIComponent(token)}`
}

export function ChatProvider({ children }) {
  const { token, isAuthenticated } = useAuth()
  const [conversations, setConversations] = useState([])
  const [onlineUsers, setOnlineUsers] = useState([])
  const [loading, setLoading] = useState(false)
  const listeners = useRef(new Set())
  const socketRef = useRef(null)

  const unreadTotal = useMemo(
    () => conversations.reduce((sum, item) => sum + Number(item.unread_count || 0), 0),
    [conversations],
  )

  const emit = useCallback((message) => {
    listeners.current.forEach((listener) => listener(message))
  }, [])

  const subscribe = useCallback((listener) => {
    listeners.current.add(listener)
    return () => listeners.current.delete(listener)
  }, [])

  const upsertConversation = useCallback((conversation) => {
    if (!conversation?.id) return
    setConversations((previous) =>
      [conversation, ...previous.filter((item) => item.id !== conversation.id)].sort(
        (a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime(),
      ),
    )
  }, [])

  const loadInbox = useCallback(async () => {
    if (!token) return
    setLoading(true)
    try {
      const { data } = await api.get('/api/conversations', { params: { limit: 40 } })
      setConversations(data.items || [])
    } finally {
      setLoading(false)
    }
  }, [token])

  const openWithUser = useCallback(
    async (userId) => {
      const { data } = await api.post('/api/conversations', { user_id: Number(userId) })
      upsertConversation(data)
      return data
    },
    [upsertConversation],
  )

  const markRead = useCallback(async (conversationId) => {
    await api.post(`/api/conversations/${conversationId}/read`)
    setConversations((previous) =>
      previous.map((item) =>
        item.id === Number(conversationId) ? { ...item, unread_count: 0 } : item,
      ),
    )
  }, [])

  const sendTyping = useCallback((conversationId) => {
    const socket = socketRef.current
    if (socket?.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'typing', conversation_id: Number(conversationId) }))
    }
  }, [])

  useEffect(() => {
    if (!isAuthenticated || !token) {
      setConversations([])
      setOnlineUsers([])
      socketRef.current?.close()
      socketRef.current = null
      return undefined
    }

    loadInbox().catch(() => {})
    let cancelled = false
    let retryTimer
    let socket

    function connect() {
      if (cancelled) return
      socket = new WebSocket(chatWsUrl(token))
      socketRef.current = socket
      socket.onmessage = (event) => {
        let message
        try {
          message = JSON.parse(event.data)
        } catch {
          return
        }
        if (message.type === 'conversation.updated' && message.conversation) {
          upsertConversation(message.conversation)
        } else if (message.type === 'presence.snapshot') {
          setOnlineUsers(Array.isArray(message.users) ? message.users : [])
        } else if (message.type === 'presence' && Number.isInteger(message.user_id)) {
          setConversations((previous) =>
            previous.map((item) =>
              item.peer?.id === message.user_id
                ? { ...item, peer_online: message.status === 'online' }
                : item,
            ),
          )
          setOnlineUsers((previous) => {
            if (message.status === 'offline') {
              return previous.filter((item) => item.id !== message.user_id)
            }
            if (previous.some((item) => item.id === message.user_id) || !message.username) {
              return previous
            }
            return [
              ...previous,
              {
                id: message.user_id,
                username: message.username,
                avatar_url: message.avatar_url || null,
              },
            ]
          })
        }
        emit(message)
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
  }, [emit, isAuthenticated, loadInbox, token, upsertConversation])

  const value = useMemo(
    () => ({
      conversations,
      onlineUsers,
      loading,
      unreadTotal,
      loadInbox,
      openWithUser,
      markRead,
      sendTyping,
      subscribe,
      upsertConversation,
    }),
    [
      conversations,
      onlineUsers,
      loading,
      unreadTotal,
      loadInbox,
      openWithUser,
      markRead,
      sendTyping,
      subscribe,
      upsertConversation,
    ],
  )

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>
}

export function useChat() {
  const context = useContext(ChatContext)
  if (!context) throw new Error('useChat debe usarse dentro de ChatProvider')
  return context
}
