import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { API_BASE_URL } from '../services/config'
import { initials } from '../design/tokens'

export default function Sidebar() {
  const { user } = useAuth()

  if (!user) return null

  const avatarSrc = user.avatar_url
    ? user.avatar_url.startsWith('http')
      ? user.avatar_url
      : `${API_BASE_URL}${user.avatar_url}`
    : null

  return (
    <aside className="hidden lg:flex flex-col w-[280px] shrink-0 sticky top-[80px] self-start space-y-2 p-2">
      <Link
        to={`/users/${user.id}`}
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-sp-surface-raised transition-colors no-underline group"
      >
        {avatarSrc ? (
          <img
            src={avatarSrc}
            alt=""
            className="w-9 h-9 rounded-full object-cover border border-sp-ink/10"
          />
        ) : (
          <span className="flex w-9 h-9 items-center justify-center rounded-full bg-sp-bg text-sm font-semibold text-sp-yellow border border-sp-ink/10">
            {initials(user.username)}
          </span>
        )}
        <span className="font-semibold text-sp-ink group-hover:text-sp-cyan">{user.username}</span>
      </Link>

      <Link
        to="/feed"
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-sp-surface-raised transition-colors no-underline text-sp-ink font-semibold"
      >
        <span className="flex w-9 h-9 items-center justify-center text-xl">📰</span>
        Feed
      </Link>
      <Link
        to="/search"
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-sp-surface-raised transition-colors no-underline text-sp-ink font-semibold"
      >
        <span className="flex w-9 h-9 items-center justify-center text-xl">🔍</span>
        Buscar
      </Link>
      <Link
        to="/messages"
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-sp-surface-raised transition-colors no-underline text-sp-ink font-semibold"
      >
        <span className="flex w-9 h-9 items-center justify-center text-xl">💬</span>
        Mensajes
      </Link>
      <Link
        to="/dashboard"
        className="flex items-center gap-3 p-2 rounded-lg hover:bg-sp-surface-raised transition-colors no-underline text-sp-ink font-semibold"
      >
        <span className="flex w-9 h-9 items-center justify-center text-xl">📊</span>
        Panel
      </Link>
    </aside>
  )
}
