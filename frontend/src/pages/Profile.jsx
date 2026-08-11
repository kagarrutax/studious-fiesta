import { useEffect, useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { ACCENT_TOP, cycleClass, initials } from '../design/tokens'
import { apiErrorMessage } from '../utils/errors'
import { mediaUrl } from '../utils/media'

function formatJoined(value) {
  return new Date(value).toLocaleDateString('es', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function Profile() {
  const { userId } = useParams()
  const { user: me, setUser } = useAuth()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formOk, setFormOk] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followBusy, setFollowBusy] = useState(false)

  const isOwnProfile = Boolean(me && String(me.id) === String(userId))

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setEditing(false)
    Promise.all([api.get(`/api/users/${userId}`), api.get('/api/posts')])
      .then(([profileRes, postsRes]) => {
        if (cancelled) return
        setProfile(profileRes.data)
        setBio(profileRes.data.bio || '')
        setIsFollowing(profileRes.data.is_following || false)
        setFollowersCount(profileRes.data.followers_count || 0)
        setFollowingCount(profileRes.data.following_count || 0)
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
      { label: 'Seguidores', value: followersCount },
      { label: 'Siguiendo', value: followingCount },
      { label: 'Likes recibidos', value: likesTotal },
      { label: 'Comentarios', value: commentsTotal },
    ]
  }, [posts, profile, followersCount, followingCount])

  function updatePost(updated) {
    setPosts((prev) => prev.map((post) => (post.id === updated.id ? updated : post)))
  }

  function handlePostDeleted(postId) {
    setPosts((prev) => prev.filter((post) => post.id !== postId))
  }

  async function saveProfile(event) {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    setFormOk('')
    try {
      const { data } = await api.patch('/api/auth/me', { bio: bio.trim() || null })
      setProfile((prev) =>
        prev
          ? { ...prev, bio: data.bio, avatar_url: data.avatar_url }
          : prev,
      )
      setBio(data.bio || '')
      setUser((prev) => (prev ? { ...prev, bio: data.bio, avatar_url: data.avatar_url } : prev))
      setEditing(false)
      setFormOk('Perfil actualizado')
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
    setFormOk('')
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
      setFormOk('Foto de perfil actualizada')
    } catch (err) {
      setFormError(apiErrorMessage(err, 'No se pudo subir la foto'))
    } finally {
      setSaving(false)
      event.target.value = ''
    }
  }

  async function toggleFollow() {
    setFollowBusy(true)
    setError('')
    try {
      if (isFollowing) {
        const { data } = await api.delete(`/api/users/${userId}/follow`)
        setIsFollowing(data.following)
        setFollowersCount(data.followers_count)
      } else {
        const { data } = await api.post(`/api/users/${userId}/follow`)
        setIsFollowing(data.following)
        setFollowersCount(data.followers_count)
      }
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo cambiar estado de seguimiento'))
    } finally {
      setFollowBusy(false)
    }
  }

  if (loading) {
    return (
      <section className="sp-container">
        <div className="sp-skeleton h-48" />
        <div className="sp-skeleton" />
        <div className="sp-skeleton" />
      </section>
    )
  }

  if (error || !profile) {
    return (
      <section className="sp-container">
        <p className="text-sp-danger">{error || 'Usuario no encontrado'}</p>
        <Link to="/feed" className="text-sp-cyan">
          Volver al feed
        </Link>
      </section>
    )
  }

  const avatarSrc = mediaUrl(profile.avatar_url)

  return (
    <section className="sp-container">
      <header
        className="relative mb-6 overflow-hidden rounded-lg border border-dashed border-strong bg-sp-surface p-6"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 20%, rgba(255,93,162,0.18), transparent 45%), radial-gradient(circle at 85% 10%, rgba(126,232,203,0.16), transparent 40%)',
        }}
      >
        {isOwnProfile && (
          <span className="sp-meta absolute right-4 top-4 rounded-pin bg-sp-surface-raised px-3 py-1 text-sp-yellow">
            Tu perfil
          </span>
        )}

        <div className="flex flex-col sm:flex-row sm:items-end gap-5 mb-5">
          <div className="relative inline-block shrink-0">
            {avatarSrc ? (
              <img
                src={avatarSrc}
                alt={`Avatar de ${profile.username}`}
                className="h-[88px] w-[88px] rounded-full border-4 border-sp-bg object-cover bg-sp-surface-raised"
              />
            ) : (
              <span className="flex h-[88px] w-[88px] items-center justify-center rounded-full border-4 border-sp-bg bg-sp-surface-raised text-2xl font-display font-bold text-sp-yellow">
                {initials(profile.username)}
              </span>
            )}
            <span className="sp-pin sp-pin-yellow !left-auto right-1 top-1" aria-hidden="true" />
            {isOwnProfile && (
              <label className="absolute -bottom-2 left-1/2 -translate-x-1/2 cursor-pointer rounded-pin bg-sp-pink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#1B1220]">
                Foto
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

          <div className="min-w-0 flex-1">
            <h1 className="font-display text-3xl mb-1">{profile.username}</h1>
            <p className="sp-meta mb-2">@{profile.username}</p>
            <p className="sp-meta mb-0 !normal-case tracking-normal text-sp-ink-faint">
              Miembro desde {formatJoined(profile.created_at)}
            </p>
          </div>

          {isOwnProfile && !editing ? (
            <button
              type="button"
              className="sp-btn-ghost shrink-0"
              onClick={() => {
                setEditing(true)
                setFormOk('')
                setFormError('')
              }}
            >
              Editar bio
            </button>
          ) : !isOwnProfile && me ? (
            <button
              type="button"
              className={`shrink-0 ${isFollowing ? 'sp-btn-ghost' : 'sp-btn-primary'}`}
              onClick={toggleFollow}
              disabled={followBusy}
            >
              {isFollowing ? 'Siguiendo' : 'Seguir'}
            </button>
          ) : null}
        </div>

        {editing ? (
          <form onSubmit={saveProfile} className="mb-5 space-y-3">
            <label className="sp-label" htmlFor="profile-bio">
              Biografía
            </label>
            <textarea
              id="profile-bio"
              className="sp-input min-h-[96px]"
              value={bio}
              maxLength={500}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Cuenta algo sobre ti en el campus…"
            />
            <p className="sp-meta mb-0 text-right">{bio.length}/500</p>
            {formError && <p className="sp-error-text">{formError}</p>}
            <div className="flex flex-wrap gap-2">
              <button className="sp-btn-primary" type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Guardar'}
              </button>
              <button
                type="button"
                className="sp-btn-ghost"
                disabled={saving}
                onClick={() => {
                  setEditing(false)
                  setBio(profile.bio || '')
                  setFormError('')
                }}
              >
                Cancelar
              </button>
            </div>
          </form>
        ) : (
          <p className="text-sp-ink-muted mb-5 max-w-2xl">
            {profile.bio || (isOwnProfile ? 'Aún no tienes biografía. ¡Edítala!' : 'Sin biografía todavía.')}
          </p>
        )}

        {formOk && !editing && <p className="mb-4 text-sm text-sp-cyan">{formOk}</p>}
        {formError && !editing && <p className="sp-error-text mb-4">{formError}</p>}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {stats.map((stat, index) => (
            <div
              key={stat.label}
              className={`rounded-md bg-sp-surface-raised/60 px-3 py-3 border-t-[3px] ${cycleClass(ACCENT_TOP, index)}`}
            >
              <p className="font-display text-2xl text-sp-ink mb-1">{stat.value}</p>
              <p className="sp-meta mb-0">{stat.label}</p>
            </div>
          ))}
        </div>
      </header>

      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="font-display text-xl mb-0">Publicaciones</h2>
        {isOwnProfile && (
          <Link to="/feed" className="sp-btn-ghost no-underline hover:no-underline text-xs px-3 py-2">
            Nueva en el feed
          </Link>
        )}
      </div>

      {posts.length === 0 ? (
        <div className="rounded-lg border border-dashed border-strong bg-sp-surface p-6 text-center">
          <p className="text-sp-ink-muted mb-4">
            {isOwnProfile
              ? 'Todavía no has publicado nada en el tablón.'
              : 'Este usuario aún no ha publicado.'}
          </p>
          {isOwnProfile && (
            <Link to="/feed" className="sp-btn-primary no-underline hover:no-underline">
              Crear primera publicación
            </Link>
          )}
        </div>
      ) : (
        posts.map((post, index) => (
          <PostCard key={post.id} post={post} index={index} onUpdated={updatePost} onDeleted={handlePostDeleted} />
        ))
      )}
    </section>
  )
}
