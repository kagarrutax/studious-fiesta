import { useEffect, useRef, useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import { TAB_ACTIVE, cycleClass, initials } from '../design/tokens'

export default function Navbar() {
  const { isAuthenticated, user, logout, loading } = useAuth()
  const toast = useToast()
  const [open, setOpen] = useState(false)
  const [noticesOpen, setNoticesOpen] = useState(false)
  const noticesRef = useRef(null)

  useEffect(() => {
    if (!noticesOpen) return undefined
    function onPointerDown(event) {
      if (noticesRef.current && !noticesRef.current.contains(event.target)) {
        setNoticesOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [noticesOpen])

  function handleLogout() {
    logout()
    setOpen(false)
    setNoticesOpen(false)
    toast.info('Sesión cerrada')
  }

  function linkClass(index, isActive) {
    const base =
      'font-mono text-xs uppercase tracking-wide no-underline px-1 py-2 border-b-[3px] border-transparent text-sp-ink-muted hover:text-sp-ink transition-colors duration-200 ease-out'
    if (!isActive) return base
    return `${base} text-sp-ink ${cycleClass(TAB_ACTIVE, index)}`
  }

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
            flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4
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
              <NavLink
                to="/feed"
                className={({ isActive }) => linkClass(1, isActive)}
                onClick={() => setOpen(false)}
              >
                Feed
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => linkClass(2, isActive)}
                onClick={() => setOpen(false)}
              >
                Panel
              </NavLink>
              <NavLink
                to="/search"
                className={({ isActive }) => linkClass(3, isActive)}
                onClick={() => setOpen(false)}
              >
                Buscar
              </NavLink>
              {user && (
                <NavLink
                  to={`/users/${user.id}`}
                  className={({ isActive }) => linkClass(0, isActive)}
                  onClick={() => setOpen(false)}
                >
                  Perfil
                </NavLink>
              )}
              {user && (
                <div className="flex items-center gap-2 rounded-pin bg-sp-surface-raised px-3 py-1.5">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sp-bg text-xs font-semibold text-sp-yellow">
                    {initials(user.username)}
                  </span>
                  <span className="sp-meta !text-sp-ink-muted !normal-case tracking-normal">
                    @{user.username}
                  </span>
                </div>
              )}
              {user && (
                <div className="relative" ref={noticesRef}>
                  <button
                    type="button"
                    className="relative sp-btn-ghost px-3 py-2 text-xs"
                    aria-expanded={noticesOpen}
                    onClick={() => {
                      setNoticesOpen((v) => !v)
                      toast.markNoticesRead()
                    }}
                  >
                    Avisos
                    {toast.unread > 0 && (
                      <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-sp-pink px-1 font-mono text-[10px] text-[#0F2D23]">
                        {toast.unread}
                      </span>
                    )}
                  </button>
                  {noticesOpen && (
                    <div className="absolute left-0 z-50 mt-2 w-72 max-w-[calc(100vw-2rem)] rounded-lg border border-dashed border-strong bg-sp-surface-raised p-3 shadow-card md:left-auto md:right-0">
                      <div className="mb-2 flex items-center justify-between">
                        <p className="sp-meta mb-0">Centro de avisos</p>
                        <button
                          type="button"
                          className="text-xs text-sp-cyan bg-transparent border-0 cursor-pointer"
                          onClick={toast.clearNotices}
                        >
                          Limpiar
                        </button>
                      </div>
                      {toast.notices.length === 0 ? (
                        <p className="mb-0 text-sm text-sp-ink-muted">Sin avisos todavía.</p>
                      ) : (
                        <ul className="m-0 max-h-64 list-none space-y-2 overflow-y-auto p-0">
                          {toast.notices.map((item) => (
                            <li key={item.id} className="text-sm text-sp-ink">
                              {item.message}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  )}
                </div>
              )}
              <button type="button" className="sp-btn-ghost px-3 py-2 text-xs" onClick={handleLogout}>
                Salir
              </button>
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
