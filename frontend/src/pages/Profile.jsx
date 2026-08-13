import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { API_BASE_URL } from '../services/config'
import { initials } from '../design/tokens'
import { apiErrorMessage } from '../utils/errors'

function mediaUrl(path) {
  if (!path || typeof path !== 'string') return null
  const trimmed = path.trim()
  if (!trimmed) return null
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed
  if (trimmed.startsWith('/uploads/')) {
    return `${API_BASE_URL}${trimmed}`
  }
  return null
}

function formatJoined(value) {
  return new Date(value).toLocaleDateString('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Profile() {
  const { userId } = useParams()
  const navigate = useNavigate()
  const { user: me, setUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [username, setUsername] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  
  const [activeTab, setActiveTab] = useState('posts')

  const isOwnProfile = Boolean(me && String(me.id) === String(userId))

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setEditing(false)
    setActiveTab('posts')
    Promise.all([api.get(`/api/users/${userId}`), api.get('/api/posts')])
      .then(([profileRes, postsRes]) => {
        if (cancelled) return
        setProfile(profileRes.data)
        setBio(profileRes.data.bio || '')
        setUsername(profileRes.data.username || '')
        setPosts(postsRes.data.filter((post) => String(post.author_id) === String(userId)))
      })
      .catch((err) => {
        if (!cancelled) setError(apiErrorMessage(err, 'Perfil no disponible'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [userId])

  const stats = useMemo(() => {
    const likesTotal = posts.reduce((sum, post) => sum + (post.likes_count || 0), 0)
    const commentsTotal = posts.reduce((sum, post) => sum + (post.comments_count || 0), 0)
    return [
      { label: 'Publicaciones', value: profile?.posts_count ?? 0 },
      { label: 'Likes', value: likesTotal },
      { label: 'Comentarios', value: commentsTotal },
    ]
  }, [posts, profile])

  const photos = useMemo(() => {
    return posts.filter(p => p.image_url).map(p => ({
      id: p.id,
      url: mediaUrl(p.image_url)
    }))
  }, [posts])

  function updatePost(updated) {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
  }

  function removePost(id) {
    setPosts((prev) => prev.filter((post) => post.id !== id))
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    try {
      const payload = {
        bio: bio.trim() || null,
        username: username.trim(),
      }
      const { data } = await api.patch('/api/auth/me', payload)
      setProfile((prev) =>
        prev
          ? { ...prev, bio: data.bio, avatar_url: data.avatar_url, username: data.username }
          : prev,
      )
      setBio(data.bio || '')
      setUsername(data.username || '')
      setUser((prev) => (prev ? { ...prev, bio: data.bio, avatar_url: data.avatar_url, username: data.username } : prev))
      
      setPosts((prev) =>
        prev.map((p) =>
          p.author_id === me.id
            ? { ...p, author: { ...p.author, username: data.username } }
            : p
        )
      )
      setEditing(false)
    } catch (err) {
      setFormError(apiErrorMessage(err, 'No se pudo guardar'))
    } finally {
      setSaving(false)
    }
  }

  async function onAvatarChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setSaving(true)
    setFormError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await api.post('/api/auth/me/avatar', formData)
      setProfile((prev) =>
        prev
          ? { ...prev, avatar_url: data.avatar_url }
          : prev,
      )
      setUser((prev) => (prev ? { ...prev, avatar_url: data.avatar_url } : prev))
    } catch (err) {
      setFormError(apiErrorMessage(err, 'No se pudo subir la foto'))
    } finally {
      setSaving(false)
      event.target.value = ''
    }
  }

  async function onCoverChange(event) {
    const file = event.target.files?.[0]
    if (!file) return
    setSaving(true)
    setFormError('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await api.post('/api/auth/me/cover', formData)
      setProfile((prev) =>
        prev
          ? { ...prev, cover_url: data.cover_url }
          : prev,
      )
      setUser((prev) => (prev ? { ...prev, cover_url: data.cover_url } : prev))
    } catch (err) {
      setFormError(apiErrorMessage(err, 'No se pudo subir la portada'))
    } finally {
      setSaving(false)
      event.target.value = ''
    }
  }

  if (loading) {
    return (
      <div className="max-w-[1080px] mx-auto px-4 w-full py-4 space-y-4">
        <div className="sp-skeleton h-64 rounded-xl" />
        <div className="sp-skeleton h-32 rounded-xl" />
        <div className="grid md:grid-cols-3 gap-4">
          <div className="sp-skeleton h-64 rounded-xl hidden md:block" />
          <div className="md:col-span-2 sp-skeleton h-[500px] rounded-xl" />
        </div>
      </div>
    )
  }

  if (error || !profile) {
    return (
      <div className="max-w-[1080px] mx-auto px-4 w-full py-10 text-center">
        <p className="text-sp-danger text-lg font-bold mb-4">{error || 'Usuario no encontrado'}</p>
        <Link to="/feed" className="sp-btn-primary px-6 py-2 rounded-lg no-underline inline-block">
          Volver al feed
        </Link>
      </div>
    )
  }

  const avatarSrc = mediaUrl(profile.avatar_url)
  const coverSrc = mediaUrl(profile.cover_url)

  return (
    <div className="max-w-[1080px] mx-auto w-full pb-10 bg-sp-bg">
      {/* CABECERA PERFIL ESTILO FACEBOOK */}
      <div className="bg-sp-surface shadow-sm mb-4">
        <div className="max-w-[1080px] mx-auto relative">
          {/* PORTADA */}
          <div 
            className="w-full h-[200px] md:h-[350px] rounded-b-xl relative bg-sp-surface-raised overflow-hidden"
            style={coverSrc ? {
              backgroundImage: `url(${coverSrc})`,
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            } : {
              backgroundImage: 'linear-gradient(135deg, rgba(255,93,162,0.3) 0%, rgba(126,232,203,0.3) 100%), repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.05) 10px, rgba(255,255,255,0.05) 20px)'
            }}
          >
            {isOwnProfile && (
              <label className="absolute bottom-4 right-4 cursor-pointer bg-white/90 hover:bg-white text-sp-ink font-semibold rounded-lg px-3 py-1.5 md:px-4 md:py-2 shadow-sm transition-colors text-sm flex items-center gap-2">
                📷 <span className="hidden md:inline">Editar foto de portada</span><span className="md:hidden">Editar portada</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  className="sr-only"
                  onChange={onCoverChange}
                  disabled={saving}
                />
              </label>
            )}
          </div>

          {/* INFO PERFIL: AVATAR Y NOMBRES */}
          <div className="px-4 pb-6 flex flex-col items-center relative z-10 -mt-20 md:-mt-24">
            {/* AVATAR */}
            <div className="relative mb-4">
              {avatarSrc ? (
                <img
                  src={avatarSrc}
                  alt={`Avatar de ${profile.username}`}
                  className="h-36 w-36 md:h-44 md:w-44 rounded-full border-4 border-sp-surface object-cover bg-sp-bg shadow-md"
                />
              ) : (
                <span className="flex h-36 w-36 md:h-44 md:w-44 items-center justify-center rounded-full border-4 border-sp-surface bg-sp-bg text-6xl font-display font-bold text-sp-yellow shadow-md">
                  {initials(profile.username)}
                </span>
              )}
              {isOwnProfile && (
                <label className="absolute bottom-2 right-2 cursor-pointer bg-sp-surface-raised hover:bg-sp-bg border border-strong rounded-full p-2.5 shadow-sm transition-colors text-lg flex items-center justify-center" title="Cambiar foto de perfil">
                  📷
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    className="sr-only"
                    onChange={onAvatarChange}
                    disabled={saving}
                  />
                </label>
              )}
            </div>

            {/* TEXTOS */}
            <div className="text-center mb-6 max-w-2xl px-4">
              <h1 className="font-display font-bold text-3xl md:text-4xl text-sp-ink mb-1">{profile.username}</h1>
              <p className="text-sp-ink-muted font-semibold text-lg mb-2">@{profile.username}</p>
              {profile.bio && (
                <p className="text-sp-ink font-medium">{profile.bio}</p>
              )}
            </div>

            {/* BOTONES DE ACCIÓN */}
            <div className="flex flex-wrap justify-center items-center gap-2 md:gap-3">
              {isOwnProfile ? (
                <>
                  <Link to="/dashboard" className="bg-sp-primary text-white hover:bg-blue-600 font-semibold px-6 py-2 rounded-lg transition-colors no-underline">
                    Panel
                  </Link>
                  <button
                    onClick={() => {
                      setEditing(true)
                      setFormError('')
                      setActiveTab('info')
                    }}
                    className="bg-sp-surface-raised hover:bg-sp-bg border border-strong text-sp-ink font-semibold px-6 py-2 rounded-lg transition-colors flex items-center gap-2"
                  >
                    ✏️ Editar perfil
                  </button>
                  <button className="bg-sp-surface-raised hover:bg-sp-bg border border-strong text-sp-ink font-semibold px-4 py-2 rounded-lg transition-colors">
                    ...
                  </button>
                </>
              ) : (
                <>
                  <button className="bg-sp-primary text-white hover:bg-blue-600 font-semibold px-6 py-2 rounded-lg transition-colors">
                    Seguir
                  </button>
                  <button
                    onClick={() => navigate(`/messages/${profile.id}`)}
                    className="bg-sp-surface-raised hover:bg-sp-bg border border-strong text-sp-ink font-semibold px-4 py-2 rounded-lg transition-colors"
                  >
                    Mensaje
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="border-t border-strong px-4 md:px-8">
            <div className="flex items-center gap-2 h-14 overflow-x-auto no-scrollbar">
              <button 
                onClick={() => setActiveTab('posts')}
                className={`h-full px-4 font-semibold text-sm transition-colors border-b-[3px] flex items-center whitespace-nowrap
                  ${activeTab === 'posts' ? 'border-sp-cyan text-sp-cyan' : 'border-transparent text-sp-ink-muted hover:bg-sp-surface-raised rounded-md my-1 h-12'}`}
              >
                Publicaciones
              </button>
              <button 
                onClick={() => setActiveTab('info')}
                className={`h-full px-4 font-semibold text-sm transition-colors border-b-[3px] flex items-center whitespace-nowrap
                  ${activeTab === 'info' ? 'border-sp-cyan text-sp-cyan' : 'border-transparent text-sp-ink-muted hover:bg-sp-surface-raised rounded-md my-1 h-12'}`}
              >
                Información
              </button>
              <button 
                onClick={() => setActiveTab('photos')}
                className={`h-full px-4 font-semibold text-sm transition-colors border-b-[3px] flex items-center whitespace-nowrap
                  ${activeTab === 'photos' ? 'border-sp-cyan text-sp-cyan' : 'border-transparent text-sp-ink-muted hover:bg-sp-surface-raised rounded-md my-1 h-12'}`}
              >
                Fotos
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* CONTENIDO PRINCIPAL (2 COLUMNAS) */}
      <div className="max-w-[1080px] mx-auto px-4 flex flex-col md:flex-row gap-4">
        
        {/* COLUMNA IZQUIERDA (Info y Fotos) - Visible solo en posts o si es seleccionada en móvil */}
        <div className={`w-full md:w-[35%] lg:w-[360px] shrink-0 space-y-4 ${activeTab === 'posts' ? 'hidden md:block' : activeTab === 'posts' ? 'hidden' : 'block'}`}>
          
          {/* TARJETA INFORMACIÓN */}
          {(activeTab === 'posts' || activeTab === 'info') && (
            <div className="bg-sp-surface rounded-xl border border-dashed border-strong p-4 shadow-sm">
              <h2 className="font-bold text-xl mb-4 text-sp-ink">Información</h2>
              {editing ? (
                <form onSubmit={saveProfile} className="space-y-4">
                  <div>
                    <label className="text-xs font-bold text-sp-ink-muted uppercase tracking-wide block mb-1">Nombre de usuario</label>
                    <input
                      className="sp-input w-full rounded-md px-3 py-2 text-sm bg-sp-bg"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      minLength={3}
                      maxLength={50}
                      required
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-sp-ink-muted uppercase tracking-wide block mb-1">Biografía</label>
                    <textarea
                      className="sp-input w-full min-h-[80px] resize-y rounded-md px-3 py-2 text-sm bg-sp-bg"
                      value={bio}
                      maxLength={500}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Presentación..."
                    />
                  </div>
                  {formError && <p className="sp-error-text text-sm">{formError}</p>}
                  <div className="flex gap-2 pt-2">
                    <button className="sp-btn-primary flex-1 py-1.5 text-sm" type="submit" disabled={saving}>
                      Guardar
                    </button>
                    <button
                      type="button"
                      className="bg-sp-surface-raised border border-strong rounded-lg flex-1 py-1.5 text-sm font-semibold hover:bg-sp-bg transition-colors"
                      disabled={saving}
                      onClick={() => {
                        setEditing(false)
                        setBio(profile.bio || '')
                        setUsername(profile.username || '')
                        setFormError('')
                      }}
                    >
                      Cancelar
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="text-center md:text-left mb-4">
                    {profile.bio ? (
                      <p className="text-sp-ink whitespace-pre-wrap">{profile.bio}</p>
                    ) : (
                      <p className="text-sp-ink-muted italic text-center text-sm p-4 bg-sp-bg rounded-lg border border-dashed border-strong/50">
                        {isOwnProfile ? 'Aún no tienes biografía. ¡Edítala para presentarte!' : 'Sin biografía todavía.'}
                      </p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-sp-ink-muted">
                    <span className="text-xl">📅</span>
                    <span>Miembro desde {formatJoined(profile.created_at)}</span>
                  </div>
                  
                  <div className="pt-4 border-t border-strong grid grid-cols-3 gap-2 text-center">
                    {stats.map((s) => (
                      <div key={s.label}>
                        <div className="font-bold text-lg text-sp-ink">{s.value}</div>
                        <div className="text-xs text-sp-ink-muted">{s.label}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TARJETA FOTOS */}
          {(activeTab === 'posts' || activeTab === 'photos') && (
            <div className="bg-sp-surface rounded-xl border border-dashed border-strong p-4 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-xl text-sp-ink">Fotos</h2>
                <button 
                  onClick={() => setActiveTab('photos')} 
                  className="text-sp-cyan hover:underline text-sm font-semibold"
                >
                  Ver todas
                </button>
              </div>
              
              {photos.length === 0 ? (
                <p className="text-sp-ink-muted text-sm text-center p-4 bg-sp-bg rounded-lg border border-dashed border-strong/50">
                  Este usuario todavía no ha publicado fotografías.
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-1 rounded-lg overflow-hidden">
                  {photos.slice(0, 9).map((photo) => (
                    <div key={photo.id} className="aspect-square bg-sp-bg relative">
                      <img src={photo.url} alt="" className="absolute inset-0 w-full h-full object-cover hover:opacity-80 transition-opacity cursor-pointer" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA (Posts) */}
        <div className={`flex-1 min-w-0 ${activeTab === 'posts' ? 'block' : 'hidden md:block'}`}>
          {activeTab === 'posts' && (
            <div className="bg-sp-surface rounded-xl border border-dashed border-strong p-4 shadow-sm mb-4">
              <h2 className="font-bold text-xl text-sp-ink">Publicaciones</h2>
            </div>
          )}
          
          {(activeTab === 'posts' || activeTab === 'info') && (
            posts.length === 0 ? (
              <div className="bg-sp-surface rounded-xl border border-dashed border-strong p-8 text-center shadow-sm">
                <p className="text-sp-ink-muted font-semibold text-lg mb-2">No hay publicaciones</p>
                <p className="text-sp-ink-muted/80 text-sm">
                  {isOwnProfile ? 'Comparte lo que piensas en el feed.' : 'Este usuario no ha publicado nada aún.'}
                </p>
                {isOwnProfile && (
                  <Link to="/feed" className="sp-btn-primary inline-block mt-4 px-6 py-2 rounded-lg no-underline">
                    Ir al feed
                  </Link>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {posts.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} onUpdated={updatePost} onDeleted={removePost} />
                ))}
              </div>
            )
          )}

          {activeTab === 'photos' && (
             <div className="bg-sp-surface rounded-xl border border-dashed border-strong p-4 shadow-sm">
              <h2 className="font-bold text-xl text-sp-ink mb-4">Todas las fotos</h2>
              {photos.length === 0 ? (
                <p className="text-sp-ink-muted text-center p-8">No hay fotos para mostrar.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {photos.map((photo) => (
                    <div key={photo.id} className="aspect-square bg-sp-bg relative rounded-lg overflow-hidden border border-strong/20">
                      <img src={photo.url} alt="" className="absolute inset-0 w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
                    </div>
                  ))}
                </div>
              )}
             </div>
          )}

        </div>
      </div>
    </div>
  )
}
