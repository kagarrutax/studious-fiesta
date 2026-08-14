import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import PostCard from '../components/PostCard'
import { initials } from '../design/tokens'

const TABS = [
  { id: 'all', label: 'Todo' },
  { id: 'users', label: 'Usuarios' },
  { id: 'posts', label: 'Posts' },
  { id: 'communities', label: 'Comunidades' },
  { id: 'events', label: 'Eventos' },
  { id: 'resources', label: 'Recursos' },
]

function formatWhen(value) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return ''
  }
}

export default function Search() {
  const [query, setQuery] = useState('')
  const [tab, setTab] = useState('all')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function runSearch(type, q) {
    const text = (q ?? query).trim()
    if (!text) return
    setLoading(true)
    setError('')
    try {
      const params = { q: text, type }
      const { data } = await api.get('/api/search', { params })
      setResults(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ocurrió un error al buscar')
    } finally {
      setLoading(false)
    }
  }

  async function handleSearch(e) {
    e.preventDefault()
    await runSearch(tab)
  }

  function handleTab(next) {
    setTab(next)
    if (query.trim()) runSearch(next)
  }

  function handlePostUpdated(updatedPost) {
    setResults((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        posts: (prev.posts || []).map((p) => (p.id === updatedPost.id ? updatedPost : p)),
      }
    })
  }

  function handlePostDeleted(postId) {
    setResults((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        posts: (prev.posts || []).filter((p) => p.id !== postId),
      }
    })
  }

  const users = results?.users || []
  const posts = results?.posts || []
  const communities = results?.communities || []
  const events = results?.events || []
  const resources = results?.resources || []
  const empty =
    results &&
    !loading &&
    users.length === 0 &&
    posts.length === 0 &&
    communities.length === 0 &&
    events.length === 0 &&
    resources.length === 0

  return (
    <div className="sp-container max-w-2xl py-8 sp-page">
      <header className="mb-6">
        <h1 className="sp-heading">Buscar</h1>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mt-4">
          <input
            className="sp-input flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Usuarios, posts, comunidades, eventos, recursos…"
            maxLength={100}
          />
          <button className="sp-btn-primary" type="submit" disabled={loading || !query.trim()}>
            Buscar
          </button>
        </form>
        <div className="mt-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              className={`sp-btn-ghost text-xs px-3 py-1 ${tab === t.id ? 'border-sp-yellow text-sp-ink' : ''}`}
              onClick={() => handleTab(t.id)}
            >
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {error && <p className="sp-error-text mb-4">{error}</p>}
      {loading && <p className="sp-meta mb-4">Cargando...</p>}

      {empty && <p className="sp-empty">No se encontraron resultados.</p>}

      {results && !loading && !empty && (
        <div className="space-y-8">
          {users.length > 0 && (
            <section>
              <h2 className="text-xl font-display font-bold text-sp-ink mb-4 uppercase tracking-wide">
                Usuarios
              </h2>
              <div className="flex flex-wrap gap-4">
                {users.map((u) => (
                  <Link
                    key={u.id}
                    to={`/users/${u.id}`}
                    className="flex items-center gap-3 p-3 rounded-lg bg-sp-surface-raised border border-dashed border-strong no-underline hover:border-sp-cyan"
                  >
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sp-bg text-sm font-semibold text-sp-yellow">
                      {initials(u.username)}
                    </span>
                    <span className="font-semibold text-sp-ink">@{u.username}</span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {communities.length > 0 && (
            <section>
              <h2 className="text-xl font-display font-bold text-sp-ink mb-4 uppercase tracking-wide">
                Comunidades
              </h2>
              <ul className="m-0 list-none space-y-2 p-0">
                {communities.map((c) => (
                  <li key={c.id}>
                    <Link
                      to={`/communities/${c.id}`}
                      className="block rounded-lg border border-dashed border-strong bg-sp-surface p-3 no-underline text-sp-ink"
                    >
                      <span className="font-semibold">{c.name}</span>
                      <span className="block sp-meta !normal-case tracking-normal">
                        @{c.slug} · {c.members_count} miembros
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {events.length > 0 && (
            <section>
              <h2 className="text-xl font-display font-bold text-sp-ink mb-4 uppercase tracking-wide">
                Eventos
              </h2>
              <ul className="m-0 list-none space-y-2 p-0">
                {events.map((ev) => (
                  <li key={ev.id}>
                    <Link
                      to={`/events/${ev.id}`}
                      className="block rounded-lg border border-dashed border-strong bg-sp-surface p-3 no-underline text-sp-ink"
                    >
                      <span className="font-semibold">{ev.title}</span>
                      <span className="block sp-meta !normal-case tracking-normal">
                        {formatWhen(ev.starts_at)}
                        {ev.location ? ` · ${ev.location}` : ''}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {resources.length > 0 && (
            <section>
              <h2 className="text-xl font-display font-bold text-sp-ink mb-4 uppercase tracking-wide">
                Recursos
              </h2>
              <ul className="m-0 list-none space-y-2 p-0">
                {resources.map((r) => (
                  <li key={r.id}>
                    <Link
                      to={`/resources/${r.id}`}
                      className="block rounded-lg border border-dashed border-strong bg-sp-surface p-3 no-underline text-sp-ink"
                    >
                      {r.title}
                      <span className="block sp-meta !normal-case tracking-normal">{r.category}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {posts.length > 0 && (
            <section>
              <h2 className="text-xl font-display font-bold text-sp-ink mb-4 uppercase tracking-wide">
                Publicaciones
              </h2>
              <div className="flex flex-col gap-6">
                {posts.map((post, i) => (
                  <PostCard
                    key={post.id}
                    post={post}
                    index={i}
                    onUpdated={handlePostUpdated}
                    onDeleted={handlePostDeleted}
                  />
                ))}
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  )
}
