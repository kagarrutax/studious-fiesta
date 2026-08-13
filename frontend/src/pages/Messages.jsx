import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { API_BASE_URL } from '../services/config'
import { initials } from '../design/tokens'
import { apiErrorMessage } from '../utils/errors'

function mediaUrl(path) {
  if (!path || typeof path !== 'string') return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/uploads/')) return `${API_BASE_URL}${trimmed}`
  return null
}

function formatTime(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  return date.toLocaleTimeString('es', { hour: '2-digit', minute: '2-digit' })
}

export default function Messages() {
  const { userId } = useParams()
  const { user: me } = useAuth()
  const navigate = useNavigate()

  const [conversations, setConversations] = useState([])
  const [messages, setMessages] = useState([])
  const [activeUser, setActiveUser] = useState(null)
  const [content, setContent] = useState('')
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [sending, setSending] = useState(false)
  // Separate error states so a conversations error never shows inside the chat panel
  const [convError, setConvError] = useState('')
  const [msgError, setMsgError] = useState('')

  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  // Cargar lista de conversaciones
  // La ruta real es GET /api/messages/conversations
  async function loadConversations(quiet = false) {
    if (!quiet) setLoadingConvs(true)
    try {
      const { data } = await api.get('/api/messages/conversations')
      setConversations(data)
      if (!quiet) setConvError('')
    } catch (err) {
      if (!quiet) setConvError(apiErrorMessage(err, 'Error al cargar conversaciones'))
    } finally {
      if (!quiet) setLoadingConvs(false)
    }
  }

  // Cargar mensajes con usuario activo
  // La ruta real es GET /api/messages/{user_id}
  async function loadMessages(targetId, quiet = false) {
    if (!targetId) return
    if (!quiet) setLoadingMsgs(true)
    try {
      const { data } = await api.get(`/api/messages/${targetId}`)
      setMessages(data)
      if (!quiet) setMsgError('')
      // Obtener datos del usuario activo si no están cargados aún
      if (!activeUser || String(activeUser.id) !== String(targetId)) {
        // Primero intentar desde la lista de conversaciones
        const found = conversations.find((c) => String(c.user.id) === String(targetId))
        if (found) {
          setActiveUser(found.user)
        } else {
          // Si no está en la lista (primera vez chatando), cargar su perfil
          try {
            const userRes = await api.get(`/api/users/${targetId}`)
            setActiveUser(userRes.data)
          } catch {
            // silencioso: la cabecera queda vacía hasta que cargue
          }
        }
      }
    } catch (err) {
      if (!quiet) setMsgError(apiErrorMessage(err, 'No se pudo cargar la conversación'))
    } finally {
      if (!quiet) setLoadingMsgs(false)
    }
  }

  // Polling y carga inicial de conversaciones
  useEffect(() => {
    loadConversations()
    const interval = setInterval(() => {
      loadConversations(true)
    }, 4000)
    return () => clearInterval(interval)
  }, [])

  // Cuando cambia userId: cargar mensajes y resetear error de chat
  useEffect(() => {
    setMsgError('')
    if (userId) {
      loadMessages(userId)
      const interval = setInterval(() => {
        loadMessages(userId, true)
      }, 3000)
      return () => clearInterval(interval)
    } else {
      setMessages([])
      setActiveUser(null)
    }
  }, [userId])

  // Cuando llega la lista de conversaciones, actualizar activeUser si ya existe ahí
  useEffect(() => {
    if (userId && conversations.length > 0) {
      const found = conversations.find((c) => String(c.user.id) === String(userId))
      if (found && (!activeUser || String(activeUser.id) !== String(userId))) {
        setActiveUser(found.user)
      }
    }
  }, [conversations, userId])

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  async function handleSend(e) {
    e.preventDefault()
    if (!content.trim() || !userId || sending) return
    setSending(true)
    setMsgError('')
    try {
      const text = content.trim()
      setContent('')
      const { data } = await api.post('/api/messages', {
        receiver_id: Number(userId),
        content: text,
      })
      setMessages((prev) => [...prev, data])
      // Actualizar lista de conversaciones inmediatamente para reflejar el último mensaje
      loadConversations(true)
    } catch (err) {
      setMsgError(apiErrorMessage(err, 'No se pudo enviar el mensaje'))
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="max-w-[1200px] mx-auto px-4 w-full py-4 min-h-[calc(100vh-80px)] flex flex-col">
      <div className="bg-sp-surface rounded-2xl border border-dashed border-strong shadow-sm flex-1 flex overflow-hidden min-h-[550px]">
        {/* COLUMNA IZQUIERDA: LISTA DE CONVERSACIONES */}
        <div
          className={`w-full md:w-80 lg:w-96 border-r border-strong/30 flex flex-col bg-sp-bg/40 ${
            userId ? 'hidden md:flex' : 'flex'
          }`}
        >
          <div className="p-4 border-b border-strong/30 flex justify-between items-center bg-sp-surface">
            <h1 className="font-display font-bold text-xl text-sp-ink">Mensajes</h1>
            <span className="text-xs font-mono bg-sp-cyan/10 text-sp-cyan px-2 py-0.5 rounded-full font-bold">
              Chat
            </span>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-strong/20">
            {loadingConvs ? (
              <div className="p-4 space-y-3">
                <div className="sp-skeleton h-14 rounded-xl" />
                <div className="sp-skeleton h-14 rounded-xl" />
                <div className="sp-skeleton h-14 rounded-xl" />
              </div>
            ) : convError ? (
              <div className="p-6 text-center text-sp-ink-muted text-sm">
                <p className="text-sp-danger text-xs">{convError}</p>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-8 text-center text-sp-ink-muted text-sm">
                <p className="mb-2">No tienes conversaciones activas.</p>
                <p className="text-xs">Visita el perfil de algún usuario y pulsa "Mensaje" para chatear.</p>
              </div>
            ) : (
              conversations.map((conv) => {
                const isActive = String(conv.user.id) === String(userId)
                const avatar = mediaUrl(conv.user.avatar_url)
                return (
                  <button
                    key={conv.user.id}
                    onClick={() => navigate(`/messages/${conv.user.id}`)}
                    className={`w-full text-left p-3.5 flex items-center gap-3 transition-colors hover:bg-sp-surface-raised/60 ${
                      isActive ? 'bg-sp-surface-raised border-l-4 border-sp-cyan' : ''
                    }`}
                  >
                    <div className="relative shrink-0">
                      {avatar ? (
                        <img
                          src={avatar}
                          alt={conv.user.username}
                          className="h-11 w-11 rounded-full object-cover border border-sp-ink/10"
                        />
                      ) : (
                        <span className="flex h-11 w-11 items-center justify-center rounded-full bg-sp-surface border border-sp-ink/10 font-bold text-sp-yellow">
                          {initials(conv.user.username)}
                        </span>
                      )}
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 bg-sp-pink text-white text-[10px] font-bold h-5 w-5 rounded-full flex items-center justify-center border-2 border-sp-surface">
                          {conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between items-baseline mb-0.5">
                        <span className="font-bold text-sm text-sp-ink truncate">{conv.user.username}</span>
                        <span className="text-[10px] text-sp-ink-muted shrink-0">
                          {formatTime(conv.last_message_at)}
                        </span>
                      </div>
                      <p className={`text-xs truncate ${conv.unread_count > 0 ? 'font-bold text-sp-ink' : 'text-sp-ink-muted'}`}>
                        {conv.last_message}
                      </p>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        {/* COLUMNA DERECHA: CONVERSACIÓN ACTIVA */}
        <div
          className={`flex-1 flex flex-col bg-sp-surface ${
            !userId ? 'hidden md:flex items-center justify-center p-8 text-center' : 'flex'
          }`}
        >
          {!userId ? (
            <div className="max-w-sm space-y-3">
              <span className="text-5xl block">💬</span>
              <h2 className="font-bold text-xl text-sp-ink">Tus mensajes privados</h2>
              <p className="text-sm text-sp-ink-muted">
                Selecciona una conversación de la izquierda o inicia un nuevo chat desde el perfil de un compañero.
              </p>
            </div>
          ) : (
            <>
              {/* CABECERA CONVERSACIÓN */}
              <div className="p-3.5 border-b border-strong/30 flex items-center justify-between bg-sp-surface">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/messages')}
                    className="md:hidden sp-btn-ghost px-2.5 py-1 text-sm font-semibold text-sp-cyan flex items-center gap-1"
                  >
                    ← Volver
                  </button>
                  {activeUser && (
                    <Link to={`/users/${activeUser.id}`} className="flex items-center gap-3 no-underline text-sp-ink hover:underline">
                      {mediaUrl(activeUser.avatar_url) ? (
                        <img
                          src={mediaUrl(activeUser.avatar_url)}
                          alt={activeUser.username}
                          className="h-10 w-10 rounded-full object-cover border border-sp-ink/10"
                        />
                      ) : (
                        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sp-bg border border-sp-ink/10 font-bold text-sp-yellow">
                          {initials(activeUser.username)}
                        </span>
                      )}
                      <div>
                        <h2 className="font-bold text-sm leading-tight text-sp-ink">{activeUser.username}</h2>
                        <span className="text-xs text-sp-ink-muted">@{activeUser.username}</span>
                      </div>
                    </Link>
                  )}
                </div>
              </div>

              {/* AREA DE MENSAJES */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-sp-bg/20">
                {loadingMsgs ? (
                  <div className="text-center py-10">
                    <span className="sp-meta">Cargando mensajes…</span>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-12 text-sp-ink-muted text-sm">
                    <p>No hay mensajes previos en esta conversación.</p>
                    <p className="text-xs mt-1">¡Saluda a tu compañero!</p>
                  </div>
                ) : (
                  messages.map((msg) => {
                    const isMine = String(msg.sender_id) === String(me?.id)
                    return (
                      <div
                        key={msg.id}
                        className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[75%] md:max-w-[65%] rounded-2xl px-4 py-2.5 shadow-sm text-sm ${
                            isMine
                              ? 'bg-sp-cyan text-sp-ink font-medium rounded-br-none'
                              : 'bg-sp-surface-raised border border-strong/30 text-sp-ink rounded-bl-none'
                          }`}
                        >
                          <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                          <div
                            className={`text-[10px] mt-1 text-right ${
                              isMine ? 'text-sp-ink/70' : 'text-sp-ink-muted'
                            }`}
                          >
                            {formatTime(msg.created_at)}
                          </div>
                        </div>
                      </div>
                    )
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Error de mensajes — SOLO aquí, nunca los errores de conversaciones */}
              {msgError && (
                <p className="sp-error-text px-4 py-1 text-xs text-center">{msgError}</p>
              )}

              {/* CAJA DE TEXTO / FORMULARIO PARA ENVIAR */}
              <form onSubmit={handleSend} className="p-3 border-t border-strong/30 bg-sp-surface flex gap-2 items-center">
                <input
                  type="text"
                  className="sp-input flex-1 rounded-full px-4 py-2.5 text-sm bg-sp-bg focus:ring-2 focus:ring-sp-cyan"
                  placeholder="Escribe un mensaje..."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  maxLength={2000}
                />
                <button
                  type="submit"
                  disabled={sending || !content.trim()}
                  className="sp-btn-primary rounded-full px-5 py-2.5 text-sm font-bold shrink-0 disabled:opacity-50"
                >
                  {sending ? '...' : 'Enviar'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
