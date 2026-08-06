import { useState } from 'react'
import { Link, NavLink } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TAB_ACTIVE, cycleClass, initials } from '../design/tokens'

export default function Navbar() {
  const { isAuthenticated, user, logout, loading } = useAuth()
  const [open, setOpen] = useState(false)

  function linkClass(index, isActive) {
    const base =
      'font-mono text-xs uppercase tracking-wide no-underline px-1 py-2 border-b-[3px] border-transparent text-sp-ink-muted hover:text-sp-ink'
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
          <span className="text-sp-yellow text-xl leading-none" aria-hidden="true">
            ✺
          </span>
          <span className="font-display font-extrabold text-lg tracking-tight">Studious Party</span>
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
              <button type="button" className="sp-btn-ghost px-3 py-2 text-xs" onClick={logout}>
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
