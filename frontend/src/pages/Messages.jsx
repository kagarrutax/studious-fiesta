import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import OnlineUsersRail from '../components/OnlineUsersRail'
import { useChat } from '../context/ChatContext'
import { useToast } from '../context/ToastContext'
import { cycleClass, initials, ROTATIONS } from '../design/tokens'
import { apiErrorMessage } from '../utils/errors'
import { mediaUrl } from '../utils/media'

function formatWhen(iso) {
  if (!iso) return ''
  try {
    return new Date(iso).toLocaleString('es', { dateStyle: 'short', timeStyle: 'short' })
  } catch {
    return ''
  }
}

export default function Messages() {
  const { conversations, loading, openWithUser } = useChat()
  const toast = useToast()
  const navigate = useNavigate()
  const [peerId, setPeerId] = useState('')
  const [busy, setBusy] = useState(false)

  async function startChat(event) {
    event.preventDefault()
    const id = Number(peerId)
    if (!id) return
    setBusy(true)
    try {
      const conv = await openWithUser(id)
      setPeerId('')
      navigate(`/messages/${conv.id}`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo abrir el chat'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="sp-container max-w-2xl sp-page py-10">
      <p className="sp-meta mb-2 text-sp-yellow">Chat en vivo</p>
      <h1 className="font-display text-3xl sm:text-4xl mb-2">Mensajes</h1>
      <p className="text-sp-ink-muted mb-6 max-w-xl">
        Inbox 1:1. Los mensajes nuevos llegan sin recargar.
      </p>

      <div className="lg:hidden">
        <OnlineUsersRail variant="strip" />
      </div>

      <form onSubmit={startChat} className="sp-card rotate-sp-1 !mb-6">
        <p className="sp-meta mb-1 text-sp-cyan">Nuevo hilo</p>
        <h2 className="font-display text-xl mb-3">Abrir chat</h2>
        <div className="flex flex-wrap gap-2">
          <input
            className="sp-input flex-1 min-w-[10rem]"
            placeholder="ID de usuario"
            value={peerId}
            onChange={(e) => setPeerId(e.target.value)}
            inputMode="numeric"
          />
          <button
            type="submit"
            className="sp-btn-primary"
            disabled={busy || !peerId}
            aria-busy={busy}
          >
            {busy ? 'Abriendo…' : 'Nuevo chat'}
          </button>
        </div>
        <p className="sp-meta !normal-case tracking-normal mt-3 mb-0 text-sp-ink-faint">
          Tip: también puedes abrir un chat desde el perfil de alguien.
        </p>
      </form>

      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl mb-0">Inbox</h2>
        <p className="sp-meta mb-0 !normal-case tracking-normal">
          {loading && conversations.length === 0
            ? 'Cargando…'
            : `${conversations.length} chat${conversations.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading && conversations.length === 0 ? (
        <div className="space-y-3">
          <div className="sp-skeleton h-20" />
          <div className="sp-skeleton h-20" />
        </div>
      ) : conversations.length === 0 ? (
        <div className="rounded-lg border border-dashed border-strong bg-sp-surface p-6 text-center">
          <p className="font-display text-lg mb-1">Sin conversaciones</p>
          <p className="sp-meta !normal-case tracking-normal mb-0">
            Abre un chat con un ID o desde un perfil.
          </p>
        </div>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {conversations.map((c, index) => {
            const avatar = mediaUrl(c.peer?.avatar_url)
            const unread = (c.unread_count || 0) > 0
            return (
              <li key={c.id}>
                <Link
                  to={`/messages/${c.id}`}
                  className={`sp-card !mb-0 flex items-center gap-3 no-underline text-sp-ink ${cycleClass(ROTATIONS, index)} ${
                    unread ? 'border-sp-yellow/50' : ''
                  }`}
                >
                  <span className="relative shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt=""
                        className="h-12 w-12 rounded-full border border-sp-yellow/30 object-cover"
                      />
                    ) : (
                      <span className="flex h-12 w-12 items-center justify-center rounded-full border border-sp-yellow/30 bg-sp-surface-raised font-display text-sm font-bold text-sp-yellow">
                        {initials(c.peer?.username)}
                      </span>
                    )}
                    {c.peer_online && (
                      <span
                        className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-sp-surface bg-sp-cyan"
                        title="En línea"
                      />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="mb-0.5 flex flex-wrap items-center gap-2">
                      <span className="font-display text-lg leading-tight">
                        @{c.peer?.username || 'usuario'}
                      </span>
                      {unread && (
                        <span className="rounded-pin bg-sp-pink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#0F2D23]">
                          {c.unread_count} nuevo{c.unread_count === 1 ? '' : 's'}
                        </span>
                      )}
                      {c.peer_online && (
                        <span className="sp-meta !normal-case tracking-normal text-sp-cyan">
                          En línea
                        </span>
                      )}
                    </span>
                    <span
                      className={`block truncate text-sm ${
                        unread ? 'font-semibold text-sp-ink' : 'text-sp-ink-muted'
                      }`}
                    >
                      {c.last_message?.body || 'Sin mensajes todavía'}
                    </span>
                  </span>

                  <span className="sp-meta shrink-0 self-start !normal-case tracking-normal">
                    {formatWhen(c.last_message?.created_at || c.updated_at)}
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
