import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'
import { withApiRetry } from '../utils/withRetry'
import { ACCENT_TOP, ROTATIONS, cycleClass, initials } from '../design/tokens'

const GLOBAL_LABELS = [
  { key: 'users', label: 'Usuarios' },
  { key: 'posts', label: 'Publicaciones' },
  { key: 'likes', label: 'Me gusta' },
  { key: 'comments', label: 'Comentarios' },
]

const ME_LABELS = [
  { key: 'posts', label: 'Mis posts' },
  { key: 'followers', label: 'Seguidores' },
  { key: 'following', label: 'Siguiendo' },
  { key: 'unread_notifications', label: 'Avisos' },
]

function formatWhen(value) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return ''
  }
}

function noticeLabel(item) {
  const who = item.actor_username ? `@${item.actor_username}` : 'Alguien'
  if (item.type === 'like') return `${who} le gustó tu post`
  if (item.type === 'comment') return `${who} comentó`
  if (item.type === 'follow') return `${who} te sigue`
  if (item.type === 'message') return `${who} te escribió`
  return `${who}: ${item.type}`
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    withApiRetry(() => api.get('/api/stats'))
      .then((res) => setStats(res.data))
      .catch((err) => setError(apiErrorMessage(err, 'No se pudieron cargar las estadísticas')))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="sp-container max-w-4xl sp-page">
      <h1 className="font-display text-3xl mb-2">Panel</h1>
      <p className="text-sp-ink-muted mb-6">Tu actividad y atajos del campus</p>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sp-skeleton h-28" />
          <div className="sp-skeleton h-28" />
          <div className="sp-skeleton h-28" />
          <div className="sp-skeleton h-28" />
        </div>
      )}
      {error && <p className="text-sp-danger">{error}</p>}

      {stats && (
        <>
          <h2 className="font-display text-lg mb-3">Tu cuenta</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {ME_LABELS.map((item, index) => (
              <article
                key={item.key}
                className={`relative bg-sp-surface border border-DEFAULT rounded-lg p-4 shadow-card border-t-[3px] sp-enter ${cycleClass(ACCENT_TOP, index)} ${cycleClass(ROTATIONS, index)}`}
              >
                <p className="font-display text-3xl text-sp-ink mb-2">{stats.me?.[item.key] ?? 0}</p>
                <p className="sp-meta mb-0">{item.label}</p>
              </article>
            ))}
          </div>

          <h2 className="font-display text-lg mb-3">Campus</h2>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {GLOBAL_LABELS.map((item, index) => (
              <article
                key={item.key}
                className={`relative bg-sp-surface border border-DEFAULT rounded-lg p-4 shadow-card border-t-[3px] ${cycleClass(ACCENT_TOP, index)}`}
              >
                <p className="font-display text-3xl text-sp-ink mb-2">{stats[item.key]}</p>
                <p className="sp-meta mb-0">{item.label}</p>
              </article>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-DEFAULT bg-sp-surface p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl mb-0">Avisos recientes</h2>
                <Link to="/notifications" className="text-sp-cyan text-sm">
                  Buzón
                </Link>
              </div>
              {(stats.recent_notifications || []).length === 0 ? (
                <p className="sp-meta mb-0">Sin avisos todavía.</p>
              ) : (
                (stats.recent_notifications || []).map((item) => (
                  <p key={item.id} className="sp-divider py-2 first:border-0 first:pt-0 mb-0 text-sm">
                    {noticeLabel(item)}
                    <span className="block sp-meta !normal-case tracking-normal">{formatWhen(item.created_at)}</span>
                  </p>
                ))
              )}
            </div>

            <div className="rounded-lg border border-DEFAULT bg-sp-surface p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl mb-0">Mis comunidades</h2>
                <Link to="/communities" className="text-sp-cyan text-sm">
                  Ver
                </Link>
              </div>
              {(stats.my_communities || []).length === 0 ? (
                <p className="sp-meta mb-0">Aún no te unes a ninguna.</p>
              ) : (
                (stats.my_communities || []).map((c) => (
                  <Link
                    key={c.id}
                    to={`/communities/${c.id}`}
                    className="block sp-divider py-2 first:border-0 first:pt-0 no-underline text-sp-ink"
                  >
                    {c.name}
                    <span className="block sp-meta !normal-case tracking-normal">@{c.slug}</span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="rounded-lg border border-DEFAULT bg-sp-surface p-5 shadow-card">
              <h2 className="font-display text-xl mb-4">Últimos posts</h2>
              {(stats.recent_posts || []).length === 0 ? (
                <p className="sp-meta mb-0">Aún no hay publicaciones.</p>
              ) : (
                (stats.recent_posts || []).map((post) => (
                  <div key={post.id} className="sp-divider py-3 first:border-0 first:pt-0">
                    <Link
                      to={`/users/${post.author?.id}`}
                      className="font-semibold text-sp-ink no-underline hover:text-sp-cyan"
                    >
                      @{post.author?.username}
                    </Link>
                    <p className="mb-0 mt-1 text-sm text-sp-ink-muted line-clamp-2">{post.content}</p>
                    <p className="sp-meta mb-0 mt-1">{formatWhen(post.created_at)}</p>
                  </div>
                ))
              )}
            </div>

            <div className="rounded-lg border border-DEFAULT bg-sp-surface p-5 shadow-card">
              <h2 className="font-display text-xl mb-4">Usuarios nuevos</h2>
              {(stats.recent_users || []).length === 0 ? (
                <p className="sp-meta mb-0">Aún no hay usuarios.</p>
              ) : (
                (stats.recent_users || []).map((person) => (
                  <Link
                    key={person.id}
                    to={`/users/${person.id}`}
                    className="flex items-center gap-3 py-3 sp-divider first:border-0 first:pt-0 no-underline hover:no-underline"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-sp-surface-raised text-xs font-semibold text-sp-yellow">
                      {initials(person.username)}
                    </span>
                    <span>
                      <span className="block font-semibold text-sp-ink">@{person.username}</span>
                      <span className="sp-meta mb-0">{formatWhen(person.created_at)}</span>
                    </span>
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4 mt-4">
            <div className="rounded-lg border border-DEFAULT bg-sp-surface p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h2 className="font-display text-xl mb-0">Próximos eventos</h2>
                <Link to="/events" className="text-sp-cyan text-sm">
                  Ver agenda
                </Link>
              </div>
              {(stats.upcoming_events || []).length === 0 ? (
                <p className="sp-meta mb-0">No hay eventos próximos.</p>
              ) : (
                (stats.upcoming_events || []).map((event) => (
                  <Link
                    key={event.id}
                    to={`/events/${event.id}`}
                    className="block sp-divider py-3 first:border-0 first:pt-0 no-underline text-sp-ink"
                  >
                    <span className="font-semibold">{event.title}</span>
                    <span className="block sp-meta !normal-case tracking-normal mb-0 mt-1">
                      {formatWhen(event.starts_at)}
                      {event.location ? ` · ${event.location}` : ''}
                      {` · ${event.going_count || 0} van`}
                    </span>
                  </Link>
                ))
              )}
            </div>

            <div className="rounded-lg border border-DEFAULT bg-sp-surface p-5 shadow-card">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="font-display text-xl mb-0">Mis recursos</h2>
                <Link to="/resources" className="text-sp-cyan text-sm">
                  Biblioteca
                </Link>
              </div>
              {(stats.my_resources || []).length === 0 ? (
                <p className="sp-meta mb-0">Aún no subes materiales.</p>
              ) : (
                (stats.my_resources || []).map((r) => (
                  <Link
                    key={r.id}
                    to={`/resources/${r.id}`}
                    className="block sp-divider py-2 first:border-0 first:pt-0 no-underline text-sp-ink"
                  >
                    {r.title}
                  </Link>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 rounded-lg border border-DEFAULT bg-sp-surface p-5 shadow-card">
            <h2 className="font-display text-xl mb-4">Ranking XP</h2>
            {(stats.leaderboard || []).length === 0 ? (
              <p className="sp-meta mb-0">Aún no hay ranking.</p>
            ) : (
              (stats.leaderboard || []).map((entry, index) => (
                <Link
                  key={entry.id}
                  to={`/users/${entry.id}`}
                  className="flex items-center justify-between gap-3 sp-divider py-2 first:border-0 first:pt-0 no-underline text-sp-ink"
                >
                  <span>
                    <span className="font-mono text-xs text-sp-ink-muted mr-2">#{index + 1}</span>
                    @{entry.username}
                  </span>
                  <span className="sp-meta !normal-case tracking-normal mb-0">
                    Nv. {entry.level} · {entry.xp} XP
                  </span>
                </Link>
              ))
            )}
          </div>
        </>
      )}
    </section>
  )
}
