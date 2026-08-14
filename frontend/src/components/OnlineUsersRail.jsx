import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useToast } from '../context/ToastContext'
import { initials } from '../design/tokens'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'
import { mediaUrl } from '../utils/media'

function Avatar({ user, size = 'md' }) {
  const src = mediaUrl(user.avatar_url)
  const box = size === 'sm' ? 'h-9 w-9 text-[10px]' : 'h-9 w-9 text-xs'
  if (src) {
    return (
      <img
        src={src}
        alt=""
        className={`${box} rounded-full border border-sp-yellow/40 object-cover bg-sp-surface-raised`}
      />
    )
  }
  return (
    <span
      className={`${box} inline-flex items-center justify-center rounded-full border border-sp-yellow/40 bg-sp-surface-raised font-display font-bold text-sp-yellow`}
    >
      {initials(user.username)}
    </span>
  )
}

/**
 * @param {'rail' | 'strip'} variant
 * rail  = lateral desktop (lista vertical, abajo a la derecha)
 * strip = móvil en Mensajes (solo avatares activos)
 */
export default function OnlineUsersRail({ variant = 'rail' }) {
  const { isAuthenticated, user: me } = useAuth()
  const { subscribe, openWithUser } = useChat()
  const toast = useToast()
  const navigate = useNavigate()
  const [users, setUsers] = useState([])
  const [openingId, setOpeningId] = useState(null)

  useEffect(() => {
    if (!isAuthenticated) {
      setUsers([])
      return undefined
    }

    let cancelled = false

    async function refresh() {
      try {
        const { data } = await api.get('/api/users/online')
        if (!cancelled) setUsers(Array.isArray(data) ? data : [])
      } catch {
        /* ignore */
      }
    }

    refresh()
    const poll = window.setInterval(refresh, 20000)

    const unsubscribe = subscribe((msg) => {
      if (msg?.type === 'presence.snapshot' && Array.isArray(msg.users)) {
        setUsers(msg.users.filter((u) => u?.id && u.id !== me?.id))
        return
      }
      if (msg?.type === 'presence' && typeof msg.user_id === 'number') {
        if (msg.user_id === me?.id) return
        if (msg.status === 'offline') {
          setUsers((prev) => prev.filter((u) => u.id !== msg.user_id))
          return
        }
        if (msg.status === 'online') {
          setUsers((prev) => {
            if (prev.some((u) => u.id === msg.user_id)) return prev
            if (!msg.username) {
              refresh()
              return prev
            }
            return [
              ...prev,
              { id: msg.user_id, username: msg.username, avatar_url: msg.avatar_url || null },
            ].sort((a, b) => a.username.localeCompare(b.username))
          })
        }
      }
    })

    return () => {
      cancelled = true
      window.clearInterval(poll)
      unsubscribe()
    }
  }, [isAuthenticated, me?.id, subscribe])

  if (!isAuthenticated) return null

  if (variant === 'strip') {
    if (users.length === 0) return null
    return (
      <div className="mb-5 rounded-lg border border-dashed border-strong bg-sp-surface p-3 shadow-card">
        <div className="mb-2 flex items-center justify-between gap-2">
          <p className="sp-meta mb-0 text-sp-yellow">En línea</p>
          <span className="rounded-pin bg-sp-cyan/15 px-2 py-0.5 font-mono text-[10px] text-sp-cyan">
            {users.length}
          </span>
        </div>
        <ul className="m-0 flex list-none gap-3 overflow-x-auto p-0 pb-1">
          {users.map((u) => (
            <li key={u.id} className="shrink-0">
              <button
                type="button"
                disabled={openingId === u.id}
                className="flex w-16 flex-col items-center gap-1 border-0 bg-transparent p-0 text-sp-ink cursor-pointer"
                title={`Chatear con @${u.username}`}
                onClick={async () => {
                  setOpeningId(u.id)
                  try {
                    const conv = await openWithUser(u.id)
                    navigate(`/messages/${conv.id}`)
                  } catch (err) {
                    toast.error(apiErrorMessage(err, 'No se pudo abrir el chat'))
                  } finally {
                    setOpeningId(null)
                  }
                }}
              >
                <span className="relative">
                  <Avatar user={u} size="sm" />
                  <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-sp-surface bg-sp-cyan" />
                </span>
                <span className="w-full truncate text-center text-[10px] font-semibold">
                  {u.username}
                </span>
              </button>
            </li>
          ))}
        </ul>
      </div>
    )
  }

  return (
    <div className="overflow-hidden rounded-lg border border-dashed border-strong bg-sp-surface shadow-card">
      <div className="border-b border-dashed border-strong bg-sp-surface-raised/50 px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="sp-meta mb-0 text-sp-yellow">Conectados</p>
            <p className="sp-meta !normal-case tracking-normal mb-0 text-[10px] text-sp-ink-faint">
              En esta sesión
            </p>
          </div>
          <span className="rounded-pin bg-sp-cyan/15 px-2 py-0.5 font-mono text-[10px] text-sp-cyan">
            {users.length}
          </span>
        </div>
      </div>

      <div className="p-3">
        {users.length === 0 ? (
          <p className="sp-meta !normal-case tracking-normal mb-0 text-sp-ink-faint">
            Nadie más en línea ahora.
          </p>
        ) : (
          <ul className="m-0 max-h-64 list-none space-y-0.5 overflow-y-auto p-0">
            {users.map((u) => (
              <li key={u.id}>
                <Link
                  to={`/users/${u.id}`}
                  className="group flex items-center gap-2 rounded-lg border border-dashed border-transparent px-1.5 py-1.5 no-underline text-sp-ink hover:border-sp-yellow/40 hover:bg-sp-surface-raised/80"
                  title={`@${u.username}`}
                >
                  <span className="relative shrink-0">
                    <Avatar user={u} />
                    <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-sp-surface bg-sp-cyan" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-semibold leading-tight group-hover:text-sp-yellow">
                      {u.username}
                    </span>
                    <span className="sp-meta !normal-case tracking-normal text-[10px] text-sp-cyan">
                      En línea
                    </span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
