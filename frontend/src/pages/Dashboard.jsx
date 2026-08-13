import { Link } from 'react-router-dom'
import { useEffect, useState } from 'react'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'
import { withApiRetry } from '../utils/withRetry'
import { ACCENT_TOP, ROTATIONS, cycleClass, initials } from '../design/tokens'

const STAT_LABELS = [
  { key: 'users', label: 'Usuarios' },
  { key: 'posts', label: 'Publicaciones' },
  { key: 'likes', label: 'Me gusta' },
  { key: 'comments', label: 'Comentarios' },
]

function formatWhen(value) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return ''
  }
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
      <p className="text-sp-ink-muted mb-6">Actividad de Studious Party</p>

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
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STAT_LABELS.map((item, index) => (
              <article
                key={item.key}
                className={`relative bg-sp-surface border border-DEFAULT rounded-lg p-4 shadow-card border-t-[3px] sp-enter ${cycleClass(ACCENT_TOP, index)} ${cycleClass(ROTATIONS, index)} ${['sp-delay-0','sp-delay-1','sp-delay-2','sp-delay-3'][index] || 'sp-delay-0'}`}
              >
                <p className="font-display text-3xl text-sp-ink mb-2">{stats[item.key]}</p>
                <p className="sp-meta mb-0">{item.label}</p>
              </article>
            ))}
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="rounded-lg border border-DEFAULT bg-sp-surface p-5 shadow-card sp-enter sp-delay-4">
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

            <div className="rounded-lg border border-DEFAULT bg-sp-surface p-5 shadow-card sp-enter sp-delay-4">
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
        </>
      )}
    </section>
  )
}
