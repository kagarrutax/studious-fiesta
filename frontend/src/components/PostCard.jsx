import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { API_BASE_URL } from '../services/config'
import { useAuth } from '../context/AuthContext'
import { initials } from '../design/tokens'

function formatDate(value) {
  return new Date(value).toLocaleString('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function PostCard({ post, index = 0, onUpdated, onDeleted }) {
  const { user: me } = useAuth()
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)

  const isOwner = me && me.id === post.author_id

  const imageSrc = post.image_url
    ? post.image_url.startsWith('http')
      ? post.image_url
      : `${API_BASE_URL}${post.image_url}`
    : null

  async function toggleLike() {
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(`/api/posts/${post.id}/like`)
      onUpdated?.({
        ...post,
        likes_count: data.likes_count,
        liked_by_me: data.liked,
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al dar like')
    } finally {
      setBusy(false)
    }
  }

  async function toggleComments() {
    if (showComments) {
      setShowComments(false)
      return
    }
    setShowComments(true)
    try {
      const { data } = await api.get(`/api/posts/${post.id}/comments`)
      setComments(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al cargar comentarios')
    }
  }

  async function submitComment(event) {
    event.preventDefault()
    if (!comment.trim()) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(`/api/posts/${post.id}/comments`, {
        content: comment.trim(),
      })
      setComments((prev) => [...(prev || []), data])
      setComment('')
      onUpdated?.({
        ...post,
        comments_count: post.comments_count + 1,
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al comentar')
    } finally {
      setBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Eliminar esta publicación? Esta acción no se puede deshacer.')) return
    setBusy(true)
    setError('')
    try {
      await api.delete(`/api/posts/${post.id}`)
      onDeleted?.(post.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar')
      setBusy(false)
    }
  }

  async function handleEdit(event) {
    event.preventDefault()
    if (!editContent.trim()) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.patch(`/api/posts/${post.id}`, {
        content: editContent.trim(),
      })
      onUpdated?.(data)
      setEditing(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al editar')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className="bg-sp-surface rounded-xl border border-dashed border-strong shadow-sm mb-4 overflow-hidden">
      {/* CABECERA */}
      <header className="flex items-start justify-between p-4">
        <div className="flex items-center gap-3">
          <Link to={`/users/${post.author.id}`} className="shrink-0">
            {post.author.avatar_url ? (
              <img
                src={post.author.avatar_url.startsWith('http') ? post.author.avatar_url : `${API_BASE_URL}${post.author.avatar_url}`}
                alt=""
                className="h-10 w-10 rounded-full object-cover border border-sp-ink/10"
              />
            ) : (
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sp-bg text-sm font-semibold text-sp-yellow border border-sp-ink/10">
                {initials(post.author?.username)}
              </span>
            )}
          </Link>
          <div className="min-w-0 flex flex-col">
            <Link
              to={`/users/${post.author.id}`}
              className="font-bold text-sp-ink hover:underline leading-tight"
            >
              {post.author.username}
            </Link>
            <span className="text-xs text-sp-ink-muted">
              {formatDate(post.created_at)}
            </span>
          </div>
        </div>

        {/* ACCIONES DEL DUEÑO */}
        {isOwner && (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="text-xs text-sp-cyan hover:underline font-semibold"
              onClick={() => { setEditing((v) => !v); setError(''); setEditContent(post.content) }}
              disabled={busy}
            >
              {editing ? 'Cancelar' : 'Editar'}
            </button>
            <button
              type="button"
              className="text-xs text-sp-danger hover:underline font-semibold"
              onClick={handleDelete}
              disabled={busy}
            >
              Eliminar
            </button>
          </div>
        )}
      </header>

      {/* CONTENIDO */}
      <div className="px-4 pb-3">
        {editing ? (
          <form onSubmit={handleEdit} className="space-y-2">
            <textarea
              className="sp-input w-full min-h-[80px] resize-y"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              maxLength={2000}
              required
            />
            <div className="flex gap-2">
              <button className="sp-btn-primary text-xs px-3 py-1.5" type="submit" disabled={busy || !editContent.trim()}>
                {busy ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        ) : (
          post.content && <p className="text-sp-ink whitespace-pre-wrap font-body text-sm leading-relaxed">{post.content}</p>
        )}
      </div>

      {imageSrc && (
        <div className="w-full bg-black/5 flex justify-center">
          <img
            className="w-full max-h-[500px] object-cover"
            src={imageSrc}
            alt="Adjunto de la publicación"
            loading="lazy"
          />
        </div>
      )}

      {/* INFO INTERACCIÓN */}
      <div className="px-4 py-2 flex items-center justify-between text-xs text-sp-ink-muted border-b border-strong/30 mx-2">
        <div className="flex items-center gap-1">
          <span className="bg-sp-pink rounded-full w-4 h-4 flex items-center justify-center text-[10px] text-white">👍</span>
          <span>{post.likes_count}</span>
        </div>
        <div>
          <span>{post.comments_count} comentarios</span>
        </div>
      </div>

      {error && <p className="sp-error-text px-4 py-2">{error}</p>}

      {/* BARRA DE ACCIONES */}
      <div className="flex items-center justify-between px-2 py-1 gap-1">
        <button
          type="button"
          disabled={busy}
          onClick={toggleLike}
          className={`flex-1 flex justify-center items-center gap-2 py-2 rounded-md transition-colors hover:bg-sp-surface-raised font-semibold text-sm
            ${post.liked_by_me ? 'text-sp-pink' : 'text-sp-ink-muted'}`}
        >
          <span>{post.liked_by_me ? '👍' : '👍'}</span>
          <span>Me gusta</span>
        </button>
        <button
          type="button"
          onClick={toggleComments}
          className="flex-1 flex justify-center items-center gap-2 py-2 rounded-md transition-colors hover:bg-sp-surface-raised font-semibold text-sm text-sp-ink-muted"
        >
          <span>💬</span>
          <span>Comentar</span>
        </button>
      </div>

      {/* COMENTARIOS */}
      {showComments && (
        <div className="px-4 py-3 bg-sp-surface-raised/30 border-t border-strong/30">
          <div className="space-y-3 mb-3">
            {(comments || []).map((item) => (
              <div key={item.id} className="flex gap-2">
                <Link to={`/users/${item.author.id}`} className="shrink-0 mt-1">
                  {item.author.avatar_url ? (
                    <img
                      src={item.author.avatar_url.startsWith('http') ? item.author.avatar_url : `${API_BASE_URL}${item.author.avatar_url}`}
                      alt=""
                      className="h-8 w-8 rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sp-bg text-[10px] font-bold text-sp-yellow">
                      {initials(item.author?.username)}
                    </span>
                  )}
                </Link>
                <div className="bg-sp-surface-raised rounded-2xl px-3 py-2 flex-1">
                  <Link to={`/users/${item.author.id}`} className="font-bold text-sm text-sp-ink hover:underline">
                    {item.author.username}
                  </Link>
                  <p className="text-sm text-sp-ink-muted whitespace-pre-wrap">{item.content}</p>
                </div>
              </div>
            ))}
          </div>
          
          <form className="flex gap-2 items-center" onSubmit={submitComment}>
            <div className="shrink-0">
              {me?.avatar_url ? (
                <img
                  src={me.avatar_url.startsWith('http') ? me.avatar_url : `${API_BASE_URL}${me.avatar_url}`}
                  alt=""
                  className="h-8 w-8 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-sp-bg text-[10px] font-bold text-sp-yellow">
                  {initials(me?.username)}
                </span>
              )}
            </div>
            <input
              className="sp-input flex-1 rounded-full px-4 py-2 text-sm bg-sp-bg border-sp-ink/20"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe un comentario..."
              maxLength={1000}
            />
            <button
              className="sp-btn-primary shrink-0 rounded-full px-4 text-sm py-1.5"
              type="submit"
              disabled={busy || !comment.trim()}
            >
              Enviar
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
