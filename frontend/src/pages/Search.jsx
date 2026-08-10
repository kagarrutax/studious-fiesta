import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import PostCard from '../components/PostCard'
import { initials } from '../design/tokens'

export default function Search() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleSearch(e) {
    e.preventDefault()
    if (!query.trim()) return

    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/search', { params: { q: query.trim() } })
      setResults(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ocurrió un error al buscar')
    } finally {
      setLoading(false)
    }
  }

  function handlePostUpdated(updatedPost) {
    setResults((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        posts: prev.posts.map((p) => (p.id === updatedPost.id ? updatedPost : p)),
      }
    })
  }

  return (
    <div className="sp-container max-w-2xl py-8">
      <header className="mb-8">
        <h1 className="sp-heading">Buscar en Studious Party</h1>
        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3 mt-4">
          <input
            className="sp-input flex-1"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuarios o publicaciones..."
            maxLength={100}
          />
          <button className="sp-btn-primary" type="submit" disabled={loading || !query.trim()}>
            Buscar
          </button>
        </form>
      </header>

      {error && <p className="sp-error-text mb-4">{error}</p>}
      
      {loading && <p className="sp-meta mb-4">Cargando...</p>}

      {results && !loading && (
        <div className="space-y-8">
          {results.users.length === 0 && results.posts.length === 0 ? (
            <p className="sp-meta">No se encontraron resultados.</p>
          ) : (
            <>
              {results.users.length > 0 && (
                <section>
                  <h2 className="text-xl font-display font-bold text-sp-ink mb-4 uppercase tracking-wide">
                    Usuarios
                  </h2>
                  <div className="flex flex-wrap gap-4">
                    {results.users.map((u) => (
                      <Link
                        key={u.id}
                        to={`/users/${u.id}`}
                        className="flex items-center gap-3 p-3 rounded-lg bg-sp-surface-raised border border-dashed border-strong no-underline hover:border-sp-cyan transition"
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

              {results.posts.length > 0 && (
                <section>
                  <h2 className="text-xl font-display font-bold text-sp-ink mb-4 uppercase tracking-wide">
                    Publicaciones
                  </h2>
                  <div className="flex flex-col gap-6">
                    {results.posts.map((post, i) => (
                      <PostCard key={post.id} post={post} index={i} onUpdated={handlePostUpdated} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
