import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useChat } from '../context/ChatContext'
import { useNotifications } from '../context/NotificationsContext'
import { useToast } from '../context/ToastContext'
import { TAB_ACTIVE, cycleClass, initials } from '../design/tokens'
import { mediaUrl } from '../utils/media'

const AUTH_LINKS = [
  { to: '/feed', label: 'Feed' },
  { to: '/communities', label: 'Comunidades' },
  { to: '/resources', label: 'Recursos' },
  { to: '/events', label: 'Eventos' },
  { to: '/messages', label: 'Mensajes' },
  { to: '/notifications', label: 'Avisos' },
  { to: '/search', label: 'Buscar' },
]

export default function Navbar() {
  const { isAuthenticated, user, logout, loading } = useAuth()
  const toast = useToast()
  const notices = useNotifications()
  const chat = useChat()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  useEffect(() => {
    if (!menuOpen) return undefined
    function onPointerDown(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [menuOpen])

  function handleLogout() {
    logout()
    setOpen(false)
    setMenuOpen(false)
    toast.info('Sesión cerrada')
    navigate('/')
  }

  function linkClass(index, isActive) {
    const base =
      'font-mono text-xs uppercase tracking-wide no-underline px-1 py-2 border-b-[3px] border-transparent text-sp-ink-muted hover:text-sp-ink transition-colors duration-200 ease-out'
    if (!isActive) return base
    return `${base} text-sp-ink ${cycleClass(TAB_ACTIVE, index)}`
  }

  const avatarSrc = mediaUrl(user?.avatar_url)

  return (
    <header className="sticky top-0 z-40 bg-sp-surface border-b border-dashed border-strong">
      <div className="sp-container flex items-center justify-between gap-3 py-3 max-w-5xl">
        <Link
          to="/"
          className="flex items-center gap-2 no-underline text-sp-ink hover:no-underline"
          onClick={() => setOpen(false)}
        >
          <img
            src="/logo.png"
            alt=""
            width={36}
            height={36}
            className="h-9 w-9 rounded-full border border-sp-yellow/40 object-cover"
          />
          <span className="font-display font-extrabold text-lg tracking-tight">
            Studious <span className="text-sp-yellow">Party</span>
          </span>
        </Link>

        <button
          type="button"
          className="md:hidden sp-btn-ghost px-3 py-2"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          Menú
        </button>

        <nav
          id="site-menu"
          className={`${open ? 'flex' : 'hidden'} md:flex absolute md:static left-0 right-0 top-full md:top-auto
            flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-3
            bg-sp-surface md:bg-transparent border-b md:border-0 border-dashed border-strong
            px-4 py-3 md:p-0`}
        >
          <NavLink
            to="/"
            end
            className={({ isActive }) => linkClass(0, isActive)}
            onClick={() => setOpen(false)}
          >
            Inicio
          </NavLink>

          {loading ? (
            <span className="sp-meta">Cargando…</span>
          ) : isAuthenticated ? (
            <>
              {AUTH_LINKS.map((item, index) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => linkClass(index + 1, isActive)}
                  onClick={() => {
                    setOpen(false)
                    if (item.to === '/notifications') notices.markAllRead()
                  }}
                >
                  <span className="relative inline-flex items-center gap-1">
                    {item.label}
                    {item.to === '/notifications' && notices.unread > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sp-pink px-1 font-mono text-[10px] text-[#0F2D23]">
                        {notices.unread > 9 ? '9+' : notices.unread}
                      </span>
                    )}
                    {item.to === '/messages' && chat.unreadTotal > 0 && (
                      <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-sp-yellow px-1 font-mono text-[10px] text-[#0F2D23]">
                        {chat.unreadTotal > 9 ? '9+' : chat.unreadTotal}
                      </span>
                    )}
                  </span>
                </NavLink>
              ))}

              {user && (
                <div className="relative md:ml-1" ref={menuRef}>
                  <button
                    type="button"
                    className="flex items-center gap-2 rounded-pin bg-sp-surface-raised px-2 py-1.5 border-0 cursor-pointer"
                    aria-expanded={menuOpen}
                    onClick={() => setMenuOpen((v) => !v)}
                  >
                    {avatarSrc ? (
                      <img
                        src={avatarSrc}
                        alt=""
                        className="h-7 w-7 rounded-full object-cover bg-sp-bg"
                      />
                    ) : (
                      <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sp-bg text-xs font-semibold text-sp-yellow">
                        {initials(user.username)}
                      </span>
                    )}
                    <span className="sp-meta !text-sp-ink-muted !normal-case tracking-normal hidden sm:inline">
                      @{user.username}
                    </span>
                  </button>
                  {menuOpen && (
                    <div className="absolute left-0 z-50 mt-2 w-48 rounded-lg border border-dashed border-strong bg-sp-surface-raised p-2 shadow-card md:left-auto md:right-0">
                      <Link
                        to={`/users/${user.id}`}
                        className="block rounded-md px-3 py-2 text-sm text-sp-ink no-underline hover:bg-sp-surface"
                        onClick={() => {
                          setMenuOpen(false)
                          setOpen(false)
                        }}
                      >
                        Perfil
                      </Link>
                      <Link
                        to="/dashboard"
                        className="block rounded-md px-3 py-2 text-sm text-sp-ink no-underline hover:bg-sp-surface"
                        onClick={() => {
                          setMenuOpen(false)
                          setOpen(false)
                        }}
                      >
                        Panel
                      </Link>
                      <button
                        type="button"
                        className="w-full rounded-md px-3 py-2 text-left text-sm text-sp-pink bg-transparent border-0 cursor-pointer hover:bg-sp-surface"
                        onClick={handleLogout}
                      >
                        Cerrar sesión
                      </button>
                    </div>
                  )}
                </div>
              )}
            </>
          ) : (
            <>
              <NavLink
                to="/login"
                className={({ isActive }) => linkClass(1, isActive)}
                onClick={() => setOpen(false)}
              >
                Entrar
              </NavLink>
              <NavLink
                to="/register"
                className={({ isActive }) => linkClass(2, isActive)}
                onClick={() => setOpen(false)}
              >
                Unirme
              </NavLink>
            </>
          )}
        </nav>
      </div>
    </header>
  )
}
