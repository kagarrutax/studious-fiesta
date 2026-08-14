import { useCallback, useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { useToast } from '../context/ToastContext'
import { initials } from '../design/tokens'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'
import { mediaUrl } from '../utils/media'

function communityInitials(name = '?') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'
}

export default function CommunityDetail() {
  const { communityId } = useParams()
  const toast = useToast()
  const [community, setCommunity] = useState(null)
  const [members, setMembers] = useState([])
  const [posts, setPosts] = useState([])
  const [nextCursor, setNextCursor] = useState(null)
  const [content, setContent] = useState('')
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [joining, setJoining] = useState(false)

  const loadCommunity = useCallback(async () => {
    const { data } = await api.get(`/api/communities/${communityId}`)
    setCommunity(data)
  }, [communityId])

  const loadMembers = useCallback(async () => {
    const { data } = await api.get(`/api/communities/${communityId}/members`)
    setMembers(data || [])
  }, [communityId])

  const loadPosts = useCallback(
    async (cursor = null, append = false) => {
      const { data } = await api.get(`/api/communities/${communityId}/posts`, {
        params: { limit: 10, ...(cursor ? { cursor } : {}) },
      })
      const items = data.items || []
      setPosts((prev) => (append ? [...prev, ...items] : items))
      setNextCursor(data.next_cursor ?? null)
    },
    [communityId],
  )

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([loadCommunity(), loadMembers(), loadPosts()])
      .catch((err) => {
        if (!cancelled) toast.error(apiErrorMessage(err, 'No se pudo abrir la comunidad'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [communityId, loadCommunity, loadMembers, loadPosts, toast])

  async function toggleMembership() {
    if (!community) return
    setJoining(true)
    try {
      const { data } = community.is_member
        ? await api.delete(`/api/communities/${communityId}/join`)
        : await api.post(`/api/communities/${communityId}/join`)
      setCommunity(data)
      await loadMembers()
      toast.success(data.is_member ? 'Te uniste' : 'Saliste de la comunidad')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo actualizar membresía'))
    } finally {
      setJoining(false)
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    try {
      const { data } = await api.post(`/api/communities/${communityId}/posts`, {
        content: content.trim(),
      })
      setPosts((prev) => [data, ...prev])
      setContent('')
      toast.success('Publicado en la comunidad')
      setCommunity((c) => (c ? { ...c, posts_count: (c.posts_count || 0) + 1 } : c))
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo publicar'))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading && !community) {
    return (
      <section className="sp-container max-w-3xl py-10">
        <div className="sp-skeleton h-40 mb-4" />
        <div className="sp-skeleton h-24" />
      </section>
    )
  }

  if (!community) {
    return (
      <section className="sp-container max-w-3xl py-10">
        <p className="sp-meta mb-3">Comunidad no encontrada.</p>
        <Link to="/communities" className="sp-back">
          ← Volver
        </Link>
      </section>
    )
  }

  return (
    <section className="sp-container max-w-3xl sp-page py-10">
      <Link to="/communities" className="sp-back">
        ← Comunidades
      </Link>

      <article className="sp-card mt-4 !mb-5 rotate-sp-1">
        <div className="flex flex-wrap items-start gap-4">
          <div
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed border-sp-yellow/50 bg-sp-surface-raised font-display text-xl font-bold text-sp-yellow"
            aria-hidden
          >
            {communityInitials(community.name)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="sp-meta mb-1 text-sp-yellow">Espacio académico</p>
            <h1 className="font-display text-3xl sm:text-4xl mb-2 break-words">{community.name}</h1>
            <div className="mb-3 flex flex-wrap gap-1.5">
              <span className="rounded-pin border border-dashed border-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sp-ink-muted">
                @{community.slug}
              </span>
              <span className="rounded-pin border border-dashed border-sp-cyan/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sp-cyan">
                {community.members_count} miembros
              </span>
              <span className="rounded-pin border border-dashed border-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sp-ink-muted">
                {community.posts_count} posts
              </span>
              {community.is_member && (
                <span className="rounded-pin bg-sp-pink/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sp-pink">
                  Miembro{community.my_role === 'admin' ? ' · admin' : ''}
                </span>
              )}
            </div>
            {community.description && (
              <p className="mb-0 text-sp-ink-muted whitespace-pre-wrap">{community.description}</p>
            )}
          </div>
          <button
            type="button"
            className={community.is_member ? 'sp-btn-ghost text-sp-pink' : 'sp-btn-primary'}
            disabled={joining}
            aria-busy={joining}
            onClick={toggleMembership}
          >
            {joining ? '…' : community.is_member ? 'Salir' : 'Unirme'}
          </button>
        </div>
      </article>

      {community.rules && (
        <section className="sp-card !mb-5 rotate-sp-2">
          <p className="sp-meta mb-1 text-sp-cyan">Convenciones</p>
          <h2 className="font-display text-xl mb-2">Reglas</h2>
          <p className="mb-0 whitespace-pre-wrap text-sm text-sp-ink-muted">{community.rules}</p>
        </section>
      )}

      <section className="mb-6">
        <div className="mb-3 flex items-baseline justify-between gap-2">
          <h2 className="font-display text-xl mb-0">Miembros</h2>
          <p className="sp-meta mb-0 !normal-case tracking-normal">{members.length}</p>
        </div>
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {members.map((m) => {
            const avatar = mediaUrl(m.avatar_url)
            return (
              <li key={m.id}>
                <Link
                  to={`/users/${m.id}`}
                  className="inline-flex items-center gap-2 rounded-lg border border-dashed border-strong bg-sp-surface px-2.5 py-1.5 text-sp-ink no-underline hover:border-sp-yellow/50"
                >
                  {avatar ? (
                    <img src={avatar} alt="" className="h-6 w-6 rounded-full object-cover" />
                  ) : (
                    <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sp-surface-raised text-[10px] font-bold text-sp-yellow">
                      {initials(m.username)}
                    </span>
                  )}
                  <span className="text-xs font-semibold">@{m.username}</span>
                  {m.role === 'admin' && (
                    <span className="font-mono text-[9px] uppercase text-sp-pink">admin</span>
                  )}
                </Link>
              </li>
            )
          })}
        </ul>
      </section>

      {community.is_member ? (
        <form onSubmit={handleCreate} className="sp-card !mb-6 space-y-3">
          <p className="sp-meta mb-0 text-sp-yellow">Tablón del club</p>
          <textarea
            className="sp-input w-full min-h-24"
            placeholder="Escribe en esta comunidad…"
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
          />
          <button
            type="submit"
            className="sp-btn-primary"
            disabled={submitting || !content.trim()}
            aria-busy={submitting}
          >
            {submitting ? 'Publicando…' : 'Publicar'}
          </button>
        </form>
      ) : (
        <div className="mb-6 rounded-lg border border-dashed border-strong bg-sp-surface p-4 text-center">
          <p className="sp-meta !normal-case tracking-normal mb-0">
            Únete para publicar en esta comunidad.
          </p>
        </div>
      )}

      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl mb-0">Publicaciones</h2>
        <p className="sp-meta mb-0 !normal-case tracking-normal">{posts.length}</p>
      </div>
      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-strong bg-sp-surface p-6 text-center">
          <p className="font-display text-lg mb-1">Sin posts todavía</p>
          <p className="sp-meta !normal-case tracking-normal mb-0">Sé el primero en escribir.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {posts.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              onUpdated={(updated) =>
                setPosts((prev) => prev.map((p) => (p.id === updated.id ? updated : p)))
              }
              onDeleted={(id) => setPosts((prev) => prev.filter((p) => p.id !== id))}
            />
          ))}
        </div>
      )}

      {nextCursor != null && (
        <button
          type="button"
          className="sp-btn-ghost mt-4"
          onClick={() => loadPosts(nextCursor, true)}
        >
          Cargar más
        </button>
      )}
    </section>
  )
}
