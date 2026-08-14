import { useEffect, useRef, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useToast } from '../context/ToastContext'
import { initials } from '../design/tokens'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'
import { mediaUrl } from '../utils/media'

function formatTime(iso) {
  try {
    return new Date(iso).toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return ''
  }
}

export default function MessageThread() {
  const { conversationId } = useParams()
  const cid = Number(conversationId)
  const { user } = useAuth()
  const toast = useToast()
  const { conversations, subscribe, sendTyping, markRead, upsertConversation } = useChat()
  const [conversation, setConversation] = useState(null)
  const [messages, setMessages] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [body, setBody] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [typing, setTyping] = useState(false)
  const [peerReadAt, setPeerReadAt] = useState(null)
  const bottomRef = useRef(null)
  const typingTimer = useRef(null)
  const lastTypingSent = useRef(0)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setMessages([])
    Promise.all([
      api.get(`/api/conversations/${cid}`),
      api.get(`/api/conversations/${cid}/messages`, { params: { limit: 40 } }),
    ])
      .then(([detail, hist]) => {
        if (cancelled) return
        setConversation(detail.data)
        upsertConversation(detail.data)
        setMessages(hist.data.items || [])
        setNextCursor(hist.data.next_cursor ?? null)
        markRead(cid).catch(() => {})
      })
      .catch((err) => {
        if (!cancelled) toast.error(apiErrorMessage(err, 'No se pudo abrir el chat'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [cid, markRead, toast, upsertConversation])

  useEffect(() => {
    return subscribe((msg) => {
      if (msg.type === 'message.new' && msg.conversation_id === cid && msg.message) {
        setMessages((prev) =>
          prev.some((m) => m.id === msg.message.id) ? prev : [...prev, msg.message],
        )
        if (msg.message.sender_id !== user?.id) {
          markRead(cid).catch(() => {})
        }
      } else if (msg.type === 'typing' && msg.conversation_id === cid && msg.user_id !== user?.id) {
        setTyping(true)
        window.clearTimeout(typingTimer.current)
        typingTimer.current = window.setTimeout(() => setTyping(false), 2500)
      } else if (msg.type === 'message.read' && msg.conversation_id === cid && msg.user_id !== user?.id) {
        setPeerReadAt(msg.last_read_at)
      } else if (msg.type === 'presence' && conversation?.peer?.id === msg.user_id) {
        setConversation((c) => (c ? { ...c, peer_online: msg.status === 'online' } : c))
      }
    })
  }, [cid, conversation?.peer?.id, markRead, subscribe, user?.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages.length, typing])

  const live = conversations.find((c) => c.id === cid)
  const peer = live?.peer || conversation?.peer
  const online = live?.peer_online ?? conversation?.peer_online

  async function loadOlder() {
    if (!nextCursor) return
    try {
      const { data } = await api.get(`/api/conversations/${cid}/messages`, {
        params: { limit: 40, cursor: nextCursor },
      })
      setMessages((prev) => [...(data.items || []), ...prev])
      setNextCursor(data.next_cursor ?? null)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo cargar el historial'))
    }
  }

  async function handleSend(event) {
    event.preventDefault()
    const text = body.trim()
    if (!text) return
    setSending(true)
    try {
      const { data } = await api.post(`/api/conversations/${cid}/messages`, { body: text })
      setMessages((prev) => (prev.some((m) => m.id === data.id) ? prev : [...prev, data]))
      setBody('')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo enviar'))
    } finally {
      setSending(false)
    }
  }

  function onBodyChange(event) {
    setBody(event.target.value)
    const now = Date.now()
    if (now - lastTypingSent.current > 1200) {
      lastTypingSent.current = now
      sendTyping(cid)
    }
  }

  const avatar = mediaUrl(peer?.avatar_url)

  if (loading && messages.length === 0 && !conversation) {
    return (
      <section className="sp-container max-w-2xl py-10">
        <div className="sp-skeleton h-16 mb-4" />
        <div className="sp-skeleton h-64" />
      </section>
    )
  }

  return (
    <section className="sp-container max-w-2xl sp-page py-8 flex flex-col min-h-[70vh]">
      <Link to="/messages" className="sp-back mb-4">
        ← Inbox
      </Link>

      <header className="sp-card !mb-4 flex items-center gap-3">
        <span className="relative shrink-0">
          {avatar ? (
            <img
              src={avatar}
              alt=""
              className="h-12 w-12 rounded-full border border-sp-yellow/40 object-cover"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-sp-yellow/40 bg-sp-surface-raised font-display text-sm font-bold text-sp-yellow">
              {initials(peer?.username)}
            </span>
          )}
          {online && (
            <span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-sp-surface bg-sp-cyan" />
          )}
        </span>
        <div className="min-w-0">
          <p className="sp-meta mb-1 text-sp-yellow">Conversación</p>
          <h1 className="font-display text-2xl mb-0 truncate">@{peer?.username || 'chat'}</h1>
          <p className="sp-meta !normal-case tracking-normal mb-0">
            {typing ? (
              <span className="text-sp-pink">Escribiendo…</span>
            ) : online ? (
              <span className="text-sp-cyan">En línea</span>
            ) : (
              'Chat 1:1'
            )}
          </p>
        </div>
        {peer?.id && (
          <Link
            to={`/users/${peer.id}`}
            className="sp-btn-ghost ml-auto shrink-0 text-xs no-underline hover:no-underline"
          >
            Perfil
          </Link>
        )}
      </header>

      {nextCursor != null && (
        <button type="button" className="sp-btn-ghost self-center mb-3 text-xs" onClick={loadOlder}>
          Mensajes anteriores
        </button>
      )}

      <div className="flex-1 space-y-3 rounded-lg border border-dashed border-strong bg-sp-surface/90 p-4 mb-4 overflow-y-auto max-h-[50vh] shadow-card">
        {messages.length === 0 ? (
          <div className="flex h-full min-h-32 flex-col items-center justify-center text-center px-4">
            <p className="font-display text-lg mb-1">Di hola</p>
            <p className="sp-meta !normal-case tracking-normal mb-0">
              El hilo se actualiza en vivo.
            </p>
          </div>
        ) : (
          messages.map((m) => {
            const mine = m.sender_id === user?.id
            return (
              <div key={m.id} className={`flex ${mine ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[80%] rounded-lg px-3.5 py-2.5 text-sm border ${
                    mine
                      ? 'border-sp-yellow/40 bg-sp-yellow/15 text-sp-ink'
                      : 'border-dashed border-strong bg-sp-surface-raised text-sp-ink'
                  }`}
                >
                  <p className="mb-1.5 whitespace-pre-wrap leading-relaxed">{m.body}</p>
                  <p className="sp-meta !normal-case tracking-normal mb-0 text-right opacity-80">
                    {formatTime(m.created_at)}
                    {mine && peerReadAt && new Date(peerReadAt) >= new Date(m.created_at)
                      ? ' · leído'
                      : ''}
                  </p>
                </div>
              </div>
            )
          })
        )}
        {typing && (
          <p className="sp-meta mb-0 text-sp-pink animate-pulse">@{peer?.username} está escribiendo…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form
        onSubmit={handleSend}
        className="flex gap-2 rounded-lg border border-dashed border-strong bg-sp-surface p-2 shadow-card"
      >
        <input
          className="sp-input flex-1 border-0 bg-transparent shadow-none focus:ring-0"
          placeholder="Escribe un mensaje…"
          value={body}
          onChange={onBodyChange}
          maxLength={2000}
        />
        <button
          type="submit"
          className="sp-btn-primary shrink-0"
          disabled={sending || !body.trim()}
          aria-busy={sending}
        >
          {sending ? '…' : 'Enviar'}
        </button>
      </form>
    </section>
  )
}
