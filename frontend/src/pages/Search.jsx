import { useState, useEffect } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import api, { search } from '../services/api'
import { API_BASE_URL } from '../services/config'
import PostCard from '../components/PostCard'
import { initials } from '../design/tokens'

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialQuery = searchParams.get('q') || ''
  
  const [query, setQuery] = useState(initialQuery)
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    const q = searchParams.get('q')
    if (q) {
      setQuery(q)
      performSearch(q)
    }
  }, [searchParams])

  async function performSearch(searchQuery) {
    if (!searchQuery.trim()) return
    setLoading(true)
    setError('')
    try {
      const { data } = await search(searchQuery.trim())
      setResults(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Ocurrió un error al buscar')
    } finally {
      setLoading(false)
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (!query.trim()) return
    setSearchParams({ q: query.trim() })
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

  function handlePostDeleted(id) {
    setResults((prev) => {
      if (!prev) return prev
      return {
        ...prev,
        posts: prev.posts.filter((p) => p.id !== id),
      }
    })
  }

  return (
    <div className="max-w-[1080px] mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="font-display font-bold text-3xl mb-4 text-sp-ink">Resultados de búsqueda</h1>
        <form onSubmit={handleSearchSubmit} className="flex flex-col sm:flex-row gap-3 mt-4 max-w-2xl">
          <input
            className="sp-input flex-1 rounded-full px-6 bg-sp-bg"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar usuarios o publicaciones..."
            maxLength={100}
          />
          <button className="sp-btn-primary rounded-full px-8" type="submit" disabled={loading || !query.trim()}>
            Buscar
          </button>
        </form>
      </header>

      {error && <p className="sp-error-text mb-4 text-center">{error}</p>}
      
      {loading && (
        <div className="space-y-4 max-w-2xl">
          <div className="sp-skeleton h-24 rounded-xl" />
          <div className="sp-skeleton h-48 rounded-xl" />
        </div>
      )}

      {results && !loading && (
        <div className="space-y-8">
          {results.users.length === 0 && results.posts.length === 0 ? (
            <div className="bg-sp-surface rounded-xl border border-dashed border-strong p-10 text-center">
              <p className="text-sp-ink-muted text-lg font-semibold">No se encontraron resultados para "{searchParams.get('q')}".</p>
            </div>
          ) : (
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* COLUMNA IZQUIERDA (Usuarios) */}
              <div className="w-full lg:w-[350px] shrink-0 space-y-4">
                {results.users.length > 0 ? (
                  <section className="bg-sp-surface rounded-xl border border-dashed border-strong p-4 shadow-sm">
                    <h2 className="text-lg font-bold text-sp-ink mb-4">Personas</h2>
                    <div className="flex flex-col gap-3">
                      {results.users.map((u) => (
                        <Link
                          key={u.id}
                          to={`/users/${u.id}`}
                          className="flex items-center gap-3 p-3 rounded-xl hover:bg-sp-bg border border-transparent hover:border-strong transition-colors no-underline group"
                        >
                          {u.avatar_url ? (
                            <img
                              src={u.avatar_url.startsWith('http') ? u.avatar_url : `${API_BASE_URL}${u.avatar_url}`}
                              alt=""
                              className="h-14 w-14 rounded-full object-cover border border-sp-ink/10 shrink-0"
                            />
                          ) : (
                            <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-sp-bg text-xl font-bold text-sp-yellow border border-sp-ink/10">
                              {initials(u.username)}
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <span className="font-bold text-sp-ink block truncate group-hover:text-sp-cyan transition-colors">{u.username}</span>
                            <span className="text-sp-ink-muted text-sm truncate block">@{u.username}</span>
                          </div>
                          <span className="bg-sp-surface-raised text-sp-cyan text-xs font-semibold px-3 py-1.5 rounded-lg shrink-0">
                            Ver
                          </span>
                        </Link>
                      ))}
                    </div>
                  </section>
                ) : (
                  <section className="bg-sp-surface rounded-xl border border-dashed border-strong p-4 shadow-sm">
                    <h2 className="text-lg font-bold text-sp-ink mb-2">Personas</h2>
                    <p className="text-sp-ink-muted text-sm">No se encontraron usuarios.</p>
                  </section>
                )}
              </div>

              {/* COLUMNA DERECHA (Posts) */}
              <div className="flex-1 w-full max-w-[680px]">
                {results.posts.length > 0 ? (
                  <section>
                    <h2 className="text-lg font-bold text-sp-ink mb-4 hidden lg:block">Publicaciones</h2>
                    <div className="flex flex-col">
                      {results.posts.map((post, i) => (
                        <PostCard key={post.id} post={post} index={i} onUpdated={handlePostUpdated} onDeleted={handlePostDeleted} />
                      ))}
                    </div>
                  </section>
                ) : (
                  <section className="bg-sp-surface rounded-xl border border-dashed border-strong p-8 text-center shadow-sm">
                    <p className="text-sp-ink-muted font-semibold text-lg">No se encontraron publicaciones.</p>
                  </section>
                )}
              </div>

            </div>
          )}
        </div>
      )}

    </div>
  )
}
