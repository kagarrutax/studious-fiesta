import { useEffect, useState } from 'react'
import PostCard from '../components/PostCard'
import Sidebar from '../components/Sidebar'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../services/config'
import { initials } from '../design/tokens'

export default function Feed() {
  const { user: me } = useAuth()
  const [posts, setPosts] = useState([])
  const [content, setContent] = useState('')
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [preview, setPreview] = useState(null)

  async function loadFeed() {
    setLoading(true)
    setError('')
    try {
      const { data } = await api.get('/api/posts')
      setPosts(data)
    } catch (err) {
      setError(err.response?.data?.detail || 'No se pudo cargar el feed')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadFeed()
  }, [])

  function handleImageChange(e) {
    const file = e.target.files?.[0]
    if (file) {
      setImageFile(file)
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result)
      reader.readAsDataURL(file)
    } else {
      setImageFile(null)
      setPreview(null)
    }
  }

  async function handleCreate(event) {
    event.preventDefault()
    if (!content.trim() && !imageFile) return
    setSubmitting(true)
    setError('')
    try {
      let data
      if (imageFile) {
        const formData = new FormData()
        if (content.trim()) formData.append('content', content.trim())
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
      setPreview(null)
      event.target.reset()
    } catch (err) {
      const detail = err.response?.data?.detail
      setError(typeof detail === 'string' ? detail : 'No se pudo publicar')
    } finally {
      setSubmitting(false)
    }
  }

  function updatePost(updated) {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
  }

  function removePost(id) {
    setPosts((prev) => prev.filter((post) => post.id !== id))
  }

  return (
    <div className="max-w-[1440px] mx-auto px-4 w-full flex justify-center gap-6">
      <Sidebar />
      
      <div className="flex-1 max-w-[680px] w-full py-4 min-w-0">
        <form
          onSubmit={handleCreate}
          className="mb-6 rounded-xl border border-dashed border-strong bg-sp-surface p-4 shadow-sm"
        >
          <div className="flex gap-3 mb-3">
            <div className="shrink-0 mt-1">
              {me?.avatar_url ? (
                <img
                  src={me.avatar_url.startsWith('http') ? me.avatar_url : `${API_BASE_URL}${me.avatar_url}`}
                  alt=""
                  className="h-10 w-10 rounded-full object-cover border border-sp-ink/10"
                />
              ) : (
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-sp-bg text-sm font-semibold text-sp-yellow border border-sp-ink/10">
                  {initials(me?.username)}
                </span>
              )}
            </div>
            <textarea
              className="w-full min-h-[60px] resize-none bg-sp-bg rounded-xl px-4 py-3 text-sp-ink placeholder:text-sp-ink-faint focus:outline-none focus:ring-2 focus:ring-sp-cyan transition-all border border-transparent focus:border-transparent text-lg"
              value={content}
              onChange={(e) => {
                setContent(e.target.value)
                e.target.style.height = 'auto'
                e.target.style.height = e.target.scrollHeight + 'px'
              }}
              maxLength={2000}
              placeholder={`¿Qué estás pensando, ${me?.username || 'usuario'}?`}
            />
          </div>

          {preview && (
            <div className="relative mb-3 mx-12">
              <img src={preview} alt="Vista previa" className="max-h-64 rounded-lg object-contain bg-black/5" />
              <button
                type="button"
                className="absolute top-2 right-2 bg-sp-surface rounded-full p-1 border border-sp-ink shadow-sm"
                onClick={() => {
                  setImageFile(null)
                  setPreview(null)
                }}
              >
                ❌
              </button>
            </div>
          )}

          <div className="border-t border-strong/30 pt-3 flex flex-wrap items-center justify-between gap-3 px-2">
            <label className="sp-btn-ghost cursor-pointer px-4 py-2 text-sm rounded-lg hover:bg-sp-surface-raised font-semibold text-sp-ink-muted">
              📷 Foto
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                className="sr-only"
                onChange={handleImageChange}
              />
            </label>
            <button
              className="sp-btn-primary px-6 py-1.5 rounded-lg font-bold"
              type="submit"
              disabled={submitting || (!content.trim() && !imageFile)}
            >
              {submitting ? 'Publicando…' : 'Publicar'}
            </button>
          </div>
        </form>

        {error && <p className="text-sp-danger mb-4 text-center">{error}</p>}

        {loading ? (
          <div className="space-y-4">
            <div className="sp-skeleton h-48 rounded-xl" />
            <div className="sp-skeleton h-64 rounded-xl" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-10 bg-sp-surface rounded-xl border border-dashed border-strong">
            <p className="text-sp-ink-muted font-semibold text-lg">Aún no hay publicaciones. Sé el primero.</p>
          </div>
        ) : (
          posts.map((post, index) => (
            <PostCard key={post.id} post={post} index={index} onUpdated={updatePost} onDeleted={removePost} />
          ))
        )}
      </div>
      
      {/* ESPACIO VACÍO A LA DERECHA PARA CENTRAR EL FEED */}
      <div className="hidden xl:block w-[280px] shrink-0"></div>
    </div>
  )
}
