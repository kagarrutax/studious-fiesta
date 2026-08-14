import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import PostCard from '../components/PostCard'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useToast } from '../context/ToastContext'
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

function PersonChips({ people, emptyLabel }) {
  if (people.length === 0) {
    return <p className="sp-meta mb-0">{emptyLabel}</p>
  }
  return (
    <div className="flex flex-wrap gap-2">
      {people.map((person) => (
        <Link
          key={person.id}
          to={`/users/${person.id}`}
          className="inline-flex items-center gap-2 rounded-md bg-sp-surface-raised px-3 py-2 no-underline hover:border-sp-cyan border border-transparent"
        >
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sp-bg text-[10px] font-semibold text-sp-yellow">
            {initials(person.username)}
          </span>
          <span className="text-sm font-semibold text-sp-ink">@{person.username}</span>
        </Link>
      ))}
    </div>
  )
}

export default function Profile() {
  const { userId } = useParams()
  const { user: me, setUser } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const chat = useChat()
  const [profile, setProfile] = useState(null)
  const [posts, setPosts] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)
  const [editing, setEditing] = useState(false)
  const [bio, setBio] = useState('')
  const [career, setCareer] = useState('')
  const [university, setUniversity] = useState('')
  const [semester, setSemester] = useState('')
  const [saving, setSaving] = useState(false)
  const [formError, setFormError] = useState('')
  const [formOk, setFormOk] = useState('')
  const [isFollowing, setIsFollowing] = useState(false)
  const [followersCount, setFollowersCount] = useState(0)
  const [followingCount, setFollowingCount] = useState(0)
  const [followers, setFollowers] = useState([])
  const [following, setFollowing] = useState([])
  const [followBusy, setFollowBusy] = useState(false)
  const [listTab, setListTab] = useState('followers')

  const isOwnProfile = Boolean(me && String(me.id) === String(userId))

  function applyProfile(data) {
    setProfile(data)
    setBio(data.bio || '')
    setCareer(data.career || '')
    setUniversity(data.university || '')
    setSemester(data.semester != null ? String(data.semester) : '')
    setIsFollowing(data.is_following || false)
    setFollowersCount(data.followers_count || 0)
    setFollowingCount(data.following_count || 0)
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    setEditing(false)
    Promise.all([
      api.get(`/api/users/${userId}`),
      api.get(`/api/posts`, { params: { author_id: userId, limit: 50 } }),
      api.get(`/api/users/${userId}/followers`),
      api.get(`/api/users/${userId}/following`),
    ])
      .then(([profileRes, postsRes, followersRes, followingRes]) => {
        if (cancelled) return
        applyProfile(profileRes.data)
        setFollowers(followersRes.data || [])
        setFollowing(followingRes.data || [])
        setPosts(postsRes.data.items || [])
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
      const semesterValue = semester.trim() === '' ? null : Number(semester)
      const { data } = await api.patch('/api/auth/me', {
        bio: bio.trim() || null,
        career: career.trim() || null,
        university: university.trim() || null,
        semester: Number.isFinite(semesterValue) ? semesterValue : null,
      })
      applyProfile({
        ...profile,
        ...data,
        posts_count: profile?.posts_count,
        followers_count: followersCount,
        following_count: followingCount,
        is_following: isFollowing,
      })
      setUser((prev) => (prev ? { ...prev, ...data } : prev))
      setEditing(false)
      setFormOk('Perfil actualizado')
      toast.success('Perfil guardado')
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
      setProfile((prev) => (prev ? { ...prev, avatar_url: data.avatar_url } : prev))
      setUser((prev) => (prev ? { ...prev, avatar_url: data.avatar_url } : prev))
      setFormOk('Foto de perfil actualizada')
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
    setFormOk('')
    try {
      const formData = new FormData()
      formData.append('image', file)
      const { data } = await api.post('/api/auth/me/cover', formData)
      setProfile((prev) => (prev ? { ...prev, cover_url: data.cover_url } : prev))
      setUser((prev) => (prev ? { ...prev, cover_url: data.cover_url } : prev))
      setFormOk('Portada actualizada')
      toast.success('Portada actualizada')
    } catch (err) {
      setFormError(apiErrorMessage(err, 'No se pudo subir la portada'))
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
        toast.info(`Dejaste de seguir a @${profile?.username || 'usuario'}`)
      } else {
        const { data } = await api.post(`/api/users/${userId}/follow`)
        setIsFollowing(data.following)
        setFollowersCount(data.followers_count)
        toast.success(`Ahora sigues a @${profile?.username || 'usuario'}`)
      }
      const [followersRes, followingRes] = await Promise.all([
        api.get(`/api/users/${userId}/followers`),
        api.get(`/api/users/${userId}/following`),
      ])
      setFollowers(followersRes.data || [])
      setFollowing(followingRes.data || [])
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
        <Link to="/feed" className="sp-back">
          ← Volver al feed
        </Link>
      </section>
    )
  }

  const avatarSrc = mediaUrl(profile.avatar_url)
  const coverSrc = mediaUrl(profile.cover_url)
  const academicLine = [profile.career, profile.university, profile.semester != null ? `Semestre ${profile.semester}` : null]
    .filter(Boolean)
    .join(' · ')

  return (
    <section className="sp-container">
      <header className="relative mb-6 overflow-hidden rounded-lg border border-dashed border-strong bg-sp-surface">
        <div className="relative h-36 overflow-hidden bg-sp-surface-raised sm:h-44">
          {coverSrc ? (
            <img src={coverSrc} alt="" className="h-full w-full object-cover" />
          ) : (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'radial-gradient(circle at 15% 20%, rgba(255,213,74,0.22), transparent 45%), radial-gradient(circle at 85% 10%, rgba(143,209,158,0.2), transparent 40%)',
              }}
              aria-hidden
            />
          )}
          {isOwnProfile && (
            <label
              className={
                coverSrc
                  ? 'absolute bottom-3 right-3 z-10 cursor-pointer'
                  : 'absolute inset-0 z-10 flex cursor-pointer items-center justify-center bg-black/15 transition hover:bg-black/30'
              }
              title={coverSrc ? 'Cambiar portada' : 'Añadir portada'}
            >
              <span className="rounded-pin bg-sp-pink px-3 py-1.5 font-mono text-[11px] uppercase tracking-wide text-[#0F2D23]">
                {coverSrc ? 'Cambiar portada' : 'Añadir portada'}
              </span>
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

        <div className="relative px-6 pb-6 pt-0">
          {isOwnProfile && (
            <span className="sp-meta absolute right-4 top-3 rounded-pin bg-sp-surface-raised px-3 py-1 text-sp-yellow">
              Tu perfil
            </span>
          )}

          <div className="flex flex-col sm:flex-row sm:items-end gap-5 -mt-10 mb-5">
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
              {isOwnProfile && (
                <label className="absolute -bottom-2 left-1/2 -translate-x-1/2 cursor-pointer rounded-pin bg-sp-pink px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-[#0F2D23]">
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
              {academicLine && (
                <p className="mb-2 text-sm text-sp-cyan">{academicLine}</p>
              )}
              <p className="mb-2 text-sm text-sp-yellow">
                Nivel {profile.level ?? 1} · {profile.xp ?? 0} XP
              </p>
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
                Editar perfil
              </button>
            ) : !isOwnProfile && me ? (
              <div className="flex shrink-0 flex-wrap gap-2">
                <button
                  type="button"
                  className={isFollowing ? 'sp-btn-ghost' : 'sp-btn-primary'}
                  onClick={toggleFollow}
                  disabled={followBusy}
                >
                  {isFollowing ? 'Siguiendo' : 'Seguir'}
                </button>
                <button
                  type="button"
                  className="sp-btn-ghost"
                  onClick={async () => {
                    try {
                      const conv = await chat.openWithUser(profile.id)
                      navigate(`/messages/${conv.id}`)
                    } catch (err) {
                      toast.error(apiErrorMessage(err, 'No se pudo abrir el chat'))
                    }
                  }}
                >
                  Mensaje
                </button>
              </div>
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

              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="sp-label" htmlFor="profile-career">
                    Carrera
                  </label>
                  <input
                    id="profile-career"
                    className="sp-input"
                    value={career}
                    maxLength={120}
                    onChange={(e) => setCareer(e.target.value)}
                    placeholder="Ingeniería de sistemas…"
                  />
                </div>
                <div>
                  <label className="sp-label" htmlFor="profile-university">
                    Universidad
                  </label>
                  <input
                    id="profile-university"
                    className="sp-input"
                    value={university}
                    maxLength={120}
                    onChange={(e) => setUniversity(e.target.value)}
                    placeholder="Tu universidad"
                  />
                </div>
              </div>
              <div className="max-w-[12rem]">
                <label className="sp-label" htmlFor="profile-semester">
                  Semestre
                </label>
                <input
                  id="profile-semester"
                  className="sp-input"
                  type="number"
                  min={1}
                  max={20}
                  value={semester}
                  onChange={(e) => setSemester(e.target.value)}
                  placeholder="1–20"
                />
              </div>

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
                    setCareer(profile.career || '')
                    setUniversity(profile.university || '')
                    setSemester(profile.semester != null ? String(profile.semester) : '')
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

          {(profile.badges || []).length > 0 && (
            <div className="mb-5">
              <h2 className="font-display text-lg mb-2">Insignias</h2>
              <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
                {profile.badges.map((b) => (
                  <li
                    key={b.code}
                    className="rounded-md border border-dashed border-strong bg-sp-surface-raised px-3 py-2 text-sm"
                    title={b.description || ''}
                  >
                    {b.name}
                  </li>
                ))}
              </ul>
            </div>
          )}

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

          <div className="mt-5">
            <div className="mb-3 flex gap-2">
              <button
                type="button"
                className={`sp-btn-ghost text-xs px-3 py-1 ${listTab === 'followers' ? 'border-sp-yellow text-sp-ink' : ''}`}
                onClick={() => setListTab('followers')}
              >
                Seguidores
              </button>
              <button
                type="button"
                className={`sp-btn-ghost text-xs px-3 py-1 ${listTab === 'following' ? 'border-sp-yellow text-sp-ink' : ''}`}
                onClick={() => setListTab('following')}
              >
                Siguiendo
              </button>
            </div>
            {listTab === 'followers' ? (
              <PersonChips people={followers} emptyLabel="Nadie sigue este perfil todavía." />
            ) : (
              <PersonChips
                people={following}
                emptyLabel={isOwnProfile ? 'Aún no sigues a nadie.' : 'No sigue a nadie todavía.'}
              />
            )}
          </div>
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
