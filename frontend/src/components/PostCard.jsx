import { useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../services/api'
import { PIN_COLORS, ROTATIONS, cycleClass, initials } from '../design/tokens'
import { useAuth } from '../context/AuthContext'

function formatDate(value) {
  return new Date(value).toLocaleString('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function PostCard({ post, index = 0, onUpdated, onDeleted }) {
  const { user } = useAuth()
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  
  const [isEditing, setIsEditing] = useState(false)
  const [editContent, setEditContent] = useState(post.content)

  const isOwner = user?.id === post.author.id

  const apiBase = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8002'
  const imageSrc = post.image_url
    ? post.image_url.startsWith('http')
      ? post.image_url
      : `${apiBase}${post.image_url}`
    : null

  const pinClass = cycleClass(PIN_COLORS, index)
  const rotateClass = cycleClass(ROTATIONS, index)

  async function toggleLike() {
    setBusy(true)
    setError('')
    try {
      const { data } = await api.post(`/api/posts/${post.id}/like`)
      onUpdated({
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

  async function loadComments() {
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
      onUpdated({
        ...post,
        comments_count: post.comments_count + 1,
      })
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al comentar')
    } finally {
      setBusy(false)
    }
  }

  async function deletePost() {
    if (!window.confirm('¿Seguro que deseas eliminar esta publicación?')) return
    setBusy(true)
    setError('')
    try {
      await api.delete(`/api/posts/${post.id}`)
      if (onDeleted) onDeleted(post.id)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al eliminar el post')
      setBusy(false)
    }
  }

  async function saveEdit() {
    if (!editContent.trim()) return
    setBusy(true)
    setError('')
    try {
      const { data } = await api.put(`/api/posts/${post.id}`, {
        content: editContent.trim(),
      })
      onUpdated(data)
      setIsEditing(false)
    } catch (err) {
      setError(err.response?.data?.detail || 'Error al editar el post')
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`sp-card ${rotateClass}`}>
      <span className={`sp-pin ${pinClass}`} aria-hidden="true" />
      <header className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sp-surface-raised text-sm font-semibold text-sp-yellow">
            {initials(post.author?.username)}
          </span>
          <div className="min-w-0 flex-1">
            <Link
              to={`/users/${post.author.id}`}
              className="font-semibold text-sp-ink no-underline hover:text-sp-cyan"
            >
              @{post.author.username}
            </Link>
            <p className="sp-meta mb-0">{formatDate(post.created_at)}</p>
          </div>
        </div>
        {isOwner && !isEditing && (
          <div className="flex gap-2">
            <button
              onClick={() => setIsEditing(true)}
              className="text-xs text-sp-cyan hover:underline bg-transparent border-0 cursor-pointer"
              disabled={busy}
            >
              Editar
            </button>
            <button
              onClick={deletePost}
              className="text-xs text-sp-pink hover:underline bg-transparent border-0 cursor-pointer"
              disabled={busy}
            >
              Borrar
            </button>
          </div>
        )}
      </header>

      {isEditing ? (
        <div className="mb-3">
          <textarea
            className="sp-input w-full min-h-[100px] mb-2"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            disabled={busy}
          />
          <div className="flex gap-2 justify-end">
            <button
              className="text-xs text-sp-ink-muted hover:underline bg-transparent border-0 cursor-pointer"
              onClick={() => {
                setIsEditing(false)
                setEditContent(post.content)
                setError('')
              }}
              disabled={busy}
            >
              Cancelar
            </button>
            <button
              className="sp-btn-primary py-1 px-3 text-xs"
              onClick={saveEdit}
              disabled={busy || !editContent.trim()}
            >
              Guardar
            </button>
          </div>
        </div>
      ) : (
        <p className="text-sp-ink whitespace-pre-wrap mb-3 font-body">{post.content}</p>
      )}

      {imageSrc && !isEditing && (
        <img
          className="mb-3 w-full max-h-80 object-cover rounded-md border border-DEFAULT"
          src={imageSrc}
          alt="Adjunto de la publicación"
        />
      )}

      <div className="sp-divider pt-3 mt-1 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={toggleLike}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition
            ${post.liked_by_me ? 'text-sp-pink' : 'text-sp-ink-muted hover:text-sp-pink'}`}
        >
          <span aria-hidden="true">{post.liked_by_me ? '♥' : '♡'}</span>
          <span className="font-mono text-xs">{post.likes_count}</span>
          <span className="sp-meta !normal-case tracking-normal">Me gusta</span>
        </button>
        <button
          type="button"
          onClick={loadComments}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-sp-ink-muted hover:text-sp-cyan"
        >
          <span className="font-mono text-xs">{post.comments_count}</span>
          <span className="sp-meta !normal-case tracking-normal">Comentarios</span>
        </button>
      </div>
      
      {error && <p className="sp-error-text mt-2">{error}</p>}
      
      {showComments && (
        <div className="mt-3 space-y-2">
          {(comments || []).map((item) => (
            <p key={item.id} className="mb-0 text-sm text-sp-ink-muted">
              <strong className="text-sp-ink">@{item.author.username}</strong> {item.content}
            </p>
          ))}
          <form className="flex flex-col sm:flex-row gap-2 mt-2" onSubmit={submitComment}>
            <input
              className="sp-input"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Escribe un comentario…"
              maxLength={1000}
              disabled={busy}
            />
            <button className="sp-btn-primary shrink-0" type="submit" disabled={busy || !comment.trim()}>
              Enviar
            </button>
          </form>
        </div>
      )}
    </article>
  )
}
