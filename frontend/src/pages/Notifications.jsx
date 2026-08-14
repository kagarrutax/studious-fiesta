import { Link } from 'react-router-dom'
import { useNotifications } from '../context/NotificationsContext'
import { cycleClass, initials, ROTATIONS } from '../design/tokens'
import { mediaUrl } from '../utils/media'

function relativeTime(iso) {
  if (!iso) return ''
  const then = new Date(iso).getTime()
  const diff = Math.max(0, Date.now() - then)
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'ahora'
  if (mins < 60) return `hace ${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `hace ${hours} h`
  const days = Math.floor(hours / 24)
  return `hace ${days} d`
}

const TYPE_META = {
  like: { label: 'Me gusta', tone: 'border-sp-pink/40 text-sp-pink' },
  comment: { label: 'Comentario', tone: 'border-sp-cyan/40 text-sp-cyan' },
  follow: { label: 'Seguidor', tone: 'border-sp-yellow/40 text-sp-yellow' },
  message: { label: 'Mensaje', tone: 'border-sp-cyan/40 text-sp-cyan' },
}

function typeMeta(type) {
  return TYPE_META[type] || { label: type || 'Aviso', tone: 'border-strong text-sp-ink-muted' }
}

export default function Notifications() {
  const {
    items,
    unread,
    loading,
    nextCursor,
    formatNotice,
    loadList,
    markAllRead,
    markOneRead,
  } = useNotifications()

  return (
    <section className="sp-container max-w-2xl sp-page py-10">
      <p className="sp-meta mb-2 text-sp-yellow">Buzón en vivo</p>
      <div className="mb-2 flex flex-wrap items-end justify-between gap-3">
        <h1 className="font-display text-3xl sm:text-4xl mb-0">Avisos</h1>
        <div className="flex flex-wrap items-center gap-2">
          {unread > 0 && (
            <span className="rounded-pin bg-sp-pink px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-[#0F2D23]">
              {unread} sin leer
            </span>
          )}
          <button
            type="button"
            className="sp-btn-ghost text-xs px-3 py-1.5"
            disabled={unread === 0}
            onClick={markAllRead}
          >
            Marcar todo leído
          </button>
        </div>
      </div>
      <p className="text-sp-ink-muted mb-6 max-w-xl">
        Likes, comentarios y follows llegan aquí en tiempo real. Sin F5.
      </p>

      {loading && items.length === 0 ? (
        <div className="space-y-3">
          <div className="sp-skeleton h-20" />
          <div className="sp-skeleton h-20" />
          <div className="sp-skeleton h-20" />
        </div>
      ) : items.length === 0 ? (
        <div className="sp-card !mb-5 text-center py-10">
          <div
            className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-lg border border-dashed border-sp-yellow/40 bg-sp-surface-raised font-display text-xl text-sp-yellow"
            aria-hidden
          >
            ✦
          </div>
          <p className="font-display text-xl mb-2">Sin avisos todavía</p>
          <p className="sp-meta !normal-case tracking-normal mb-0 max-w-sm mx-auto text-sp-ink-faint">
            Cuando alguien dé like, comente o te siga, el aviso aparecerá aquí al instante.
          </p>
        </div>
      ) : (
        <ul className="m-0 mb-5 list-none space-y-3 p-0">
          {items.map((item, index) => {
            const unreadItem = !item.read_at
            const meta = typeMeta(item.type)
            const actor = item.actor
            const avatar = mediaUrl(actor?.avatar_url)
            const href =
              item.type === 'follow' && item.actor_id
                ? `/users/${item.actor_id}`
                : item.type === 'message'
                  ? '/messages'
                  : item.entity_type === 'post' && item.entity_id
                    ? '/feed'
                    : '/feed'
            return (
              <li key={item.id}>
                <Link
                  to={href}
                  className={`sp-card !mb-0 flex gap-3 no-underline text-sp-ink ${cycleClass(ROTATIONS, index)} ${
                    unreadItem ? 'border-sp-yellow/45 bg-sp-surface-raised/80' : ''
                  }`}
                  onClick={() => {
                    if (unreadItem) markOneRead(item.id)
                  }}
                >
                  <span className="relative shrink-0">
                    {avatar ? (
                      <img
                        src={avatar}
                        alt=""
                        className="h-11 w-11 rounded-full border border-sp-yellow/30 object-cover"
                      />
                    ) : (
                      <span className="flex h-11 w-11 items-center justify-center rounded-full border border-sp-yellow/30 bg-sp-bg font-display text-xs font-bold text-sp-yellow">
                        {initials(actor?.username || '?')}
                      </span>
                    )}
                    {unreadItem && (
                      <span className="absolute -right-0.5 -top-0.5 h-2.5 w-2.5 rounded-full bg-sp-pink" />
                    )}
                  </span>

                  <span className="min-w-0 flex-1">
                    <span className="mb-1.5 flex flex-wrap items-center gap-2">
                      <span
                        className={`rounded-pin border border-dashed px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide ${meta.tone}`}
                      >
                        {meta.label}
                      </span>
                      <span className="sp-meta !normal-case tracking-normal">
                        {relativeTime(item.created_at)}
                      </span>
                    </span>
                    <span className={`block text-sm leading-snug ${unreadItem ? 'font-semibold' : 'text-sp-ink-muted'}`}>
                      {formatNotice(item)}
                    </span>
                  </span>
                </Link>
              </li>
            )
          })}
        </ul>
      )}

      {nextCursor != null && (
        <button
          type="button"
          className="sp-btn-ghost mb-5 text-xs"
          disabled={loading}
          onClick={() => loadList({ reset: false })}
        >
          Cargar más
        </button>
      )}

      <Link to="/feed" className="sp-back">
        ← Volver al feed
      </Link>
    </section>
  )
}
