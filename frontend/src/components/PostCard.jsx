import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'
import { mediaUrl } from '../utils/media'
import { staggerClass } from '../design/motion'
import { PIN_COLORS, ROTATIONS, cycleClass, initials } from '../design/tokens'

function formatDate(value) {
  return new Date(value).toLocaleString('es', {
    dateStyle: 'medium',
    timeStyle: 'short',
  })
}

export default function PostCard({ post, index = 0, onUpdated }) {
  const toast = useToast()
  const [comment, setComment] = useState('')
  const [comments, setComments] = useState(null)
  const [showComments, setShowComments] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [imageBroken, setImageBroken] = useState(false)
  const [likePop, setLikePop] = useState(false)

  const imageSrc = mediaUrl(post.image_url)
  const showImage = Boolean(imageSrc) && !imageBroken

  useEffect(() => {
    setImageBroken(false)
  }, [post.id, post.image_url])

  const pinClass = cycleClass(PIN_COLORS, index)
  const rotateClass = cycleClass(ROTATIONS, index)
  const enterClass = `sp-enter ${staggerClass(index)}`

  async function toggleLike() {
    setBusy(true)
    setError('')
    setLikePop(true)
    window.setTimeout(() => setLikePop(false), 280)
    try {
      const { data } = await api.post(`/api/posts/${post.id}/like`)
      onUpdated({
        ...post,
        likes_count: data.likes_count,
        liked_by_me: data.liked,
      })
      toast.info(data.liked ? 'Like registrado' : 'Like quitado')
    } catch (err) {
      const message = apiErrorMessage(err, 'Error al dar like')
      setError(message)
      toast.error(message)
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
      toast.success('Comentario enviado')
    } catch (err) {
      const message = apiErrorMessage(err, 'Error al comentar')
      setError(message)
      toast.error(message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <article className={`sp-card ${rotateClass} ${enterClass}`}>
      <span className={`sp-pin ${pinClass}`} aria-hidden="true" />
      <header className="flex items-center gap-3 mb-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-sp-surface-raised text-sm font-semibold text-sp-yellow">
          {initials(post.author?.username)}
        </span>
        <div className="min-w-0 flex-1">
          <Link
            to={`/users/${post.author.id}`}
            className="font-semibold text-sp-ink no-underline hover:text-sp-cyan transition-colors duration-200"
          >
            @{post.author.username}
          </Link>
          <p className="sp-meta mb-0">{formatDate(post.created_at)}</p>
        </div>
      </header>
      <p className="text-sp-ink whitespace-pre-wrap mb-3 font-body">{post.content}</p>
      {showImage && (
        <img
          className="mb-3 w-full max-h-80 object-cover rounded-md border border-DEFAULT"
          src={imageSrc}
          alt="Adjunto de la publicación"
          onError={() => setImageBroken(true)}
        />
      )}
      <div className="sp-divider pt-3 mt-1 flex flex-wrap gap-3">
        <button
          type="button"
          disabled={busy}
          onClick={toggleLike}
          className={`inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold transition duration-200
            ${post.liked_by_me ? 'text-sp-pink' : 'text-sp-ink-muted hover:text-sp-pink'}`}
        >
          <span
            aria-hidden="true"
            className={likePop ? 'sp-like-pop' : 'inline-block'}
          >
            {post.liked_by_me ? '♥' : '♡'}
          </span>
          <span className="font-mono text-xs">{post.likes_count}</span>
          <span className="sp-meta !normal-case tracking-normal">Me gusta</span>
        </button>
        <button
          type="button"
          onClick={loadComments}
          className="inline-flex items-center gap-2 rounded-md px-3 py-2 text-sm font-semibold text-sp-ink-muted hover:text-sp-cyan transition duration-200"
        >
          <span className="font-mono text-xs">{post.comments_count}</span>
          <span className="sp-meta !normal-case tracking-normal">Comentarios</span>
        </button>
      </div>
      {error && <p className="sp-error-text">{error}</p>}
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
