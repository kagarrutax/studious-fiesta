import { useEffect, useState } from 'react'
import PostCard from '../components/PostCard'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'

export default function Feed() {
  const toast = useToast()
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  async function loadFeed() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/posts')
      setPosts(data)
    } catch (err) {
      const message = apiErrorMessage(err, 'No se pudo cargar el feed')
      setError(message)
      toast.error(message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [])

  async function handleCreate(event) {
    event.preventDefault()
    if (!content.trim()) return
    setSubmitting(true)
    setError('')
    try {
      let data
      if (imageFile) {
        const formData = new FormData()
        formData.append('content', content.trim())
        formData.append('image', imageFile)
        ;({ data } = await api.post('/api/posts/upload', formData))
      } else {
        ;({ data } = await api.post('/api/posts', {
          content: content.trim(),
          image_url: null,
        }))
      }
      setPosts((prev) => [data, ...prev])
      setContent('')
      setImageFile(null)
      event.target.reset()
      toast.success('Tu post se publicó en el tablón')
    } catch (err) {
      const message = apiErrorMessage(err, 'No se pudo publicar')
      setError(message)
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  function updatePost(updated) {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
  }

  return (
    <section className="sp-container">
      <h1 className="font-display text-3xl mb-4 sp-enter">Feed</h1>

      <form
        onSubmit={handleCreate}
        className="relative mb-6 rounded-lg border border-dashed border-strong bg-sp-surface p-4 shadow-card sp-enter sp-delay-1"
      >
        <textarea
          className="w-full min-h-[96px] resize-y bg-transparent border-0 text-sp-ink placeholder:text-sp-ink-faint focus:outline-none focus:ring-0"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          maxLength={2000}
          required
          placeholder="¿Qué se cuece en el campus?"
        />
        <div className="sp-divider pt-3 mt-2 flex flex-wrap items-center justify-between gap-3">
          <label className="sp-btn-ghost cursor-pointer px-3 py-2 text-xs">
            + Imagen
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="sr-only"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
            />
          </label>
          <div className="flex items-center gap-3">
            {imageFile && (
              <span className="sp-meta truncate max-w-[10rem]">{imageFile.name}</span>
            )}
            <button
              className="sp-btn-primary"
              type="submit"
              disabled={submitting || !content.trim()}
              aria-busy={submitting}
            >
              {submitting ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        </div>
      </form>

      {error && <p className="text-sp-danger mb-4">{error}</p>}

      {loading ? (
        <>
          <div className="sp-skeleton" />
          <div className="sp-skeleton" />
          <div className="sp-skeleton" />
        </>
      ) : posts.length === 0 ? (
        <p className="sp-empty">Aún no hay publicaciones. Sé el primero.</p>
      ) : (
        posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} onUpdated={updatePost} />
        ))
      )}
    </section>
  )
}
