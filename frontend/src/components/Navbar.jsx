import { useState } from 'react'
import { Link, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { TAB_ACTIVE, cycleClass, initials } from '../design/tokens'

export default function Navbar() {
  const { isAuthenticated, user, logout, loading } = useAuth()
  const [open, setOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const navigate = useNavigate()

  function linkClass(index, isActive) {
    const base =
      'font-mono text-xs uppercase tracking-wide no-underline px-1 py-2 border-b-[3px] border-transparent text-sp-ink-muted hover:text-sp-ink transition-colors'
    if (!isActive) return base
    return `${base} text-sp-ink ${cycleClass(TAB_ACTIVE, index)}`
  }

  function handleSearch(e) {
    e.preventDefault()
    if (!searchQuery.trim()) return
    setOpen(false)
    navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`)
    setSearchQuery('')
  }

  return (
    <header className="sticky top-0 z-40 bg-sp-surface border-b border-dashed border-strong shadow-sm">
      <div className="max-w-[1440px] mx-auto px-4 flex flex-wrap md:flex-nowrap items-center justify-between gap-3 py-3">
        {/* IZQUIERDA */}
        <Link
          to="/"
          className="flex items-center gap-2 no-underline text-sp-ink hover:no-underline shrink-0"
          onClick={() => setOpen(false)}
        >
          <span className="text-sp-yellow text-2xl leading-none" aria-hidden="true">
            ✺
          </span>
          <span className="font-display font-extrabold text-xl tracking-tight hidden sm:block">Studious Party</span>
        </Link>

        {/* CENTRO (Buscador) */}
        {isAuthenticated && (
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-4">
            <input
              type="text"
              placeholder="Buscar en Studious Party..."
              className="sp-input w-full rounded-full bg-sp-bg border-sp-ink-muted text-sm px-4 py-2"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </form>
        )}

        {/* DERECHA */}
        <button
          type="button"
          className="md:hidden sp-btn-ghost px-3 py-2 shrink-0 ml-auto"
          aria-expanded={open}
          aria-controls="site-menu"
          onClick={() => setOpen((v) => !v)}
        >
          Menú
        </button>

        <nav
          id="site-menu"
          className={`${open ? 'flex' : 'hidden'} md:flex w-full md:w-auto flex-col md:flex-row items-stretch md:items-center gap-2 md:gap-4
            bg-sp-surface md:bg-transparent border-t md:border-0 border-dashed border-strong
            pt-3 md:pt-0 shrink-0`}
        >
          {isAuthenticated && (
            <form onSubmit={handleSearch} className="flex md:hidden mb-2">
              <input
                type="text"
                placeholder="Buscar..."
                className="sp-input w-full rounded-full bg-sp-bg border-sp-ink-muted text-sm px-4 py-2"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
          )}

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
                to="/search"
                className={({ isActive }) => linkClass(2, isActive)}
                onClick={() => setOpen(false)}
              >
                Buscar
              </NavLink>
              <NavLink
                to="/messages"
                className={({ isActive }) => linkClass(0, isActive)}
                onClick={() => setOpen(false)}
              >
                Mensajes
              </NavLink>
              <NavLink
                to="/dashboard"
                className={({ isActive }) => linkClass(1, isActive)}
                onClick={() => setOpen(false)}
              >
                Panel
              </NavLink>
              {user && (
                <NavLink
                  to={`/users/${user.id}`}
                  className={({ isActive }) => linkClass(2, isActive)}
                  onClick={() => setOpen(false)}
                >
                  Perfil
                </NavLink>
              )}
              {user && (
                <div className="hidden md:flex items-center gap-2 rounded-full bg-sp-surface-raised px-2 py-1 ml-2">
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-sp-bg text-xs font-semibold text-sp-yellow border border-sp-ink/10">
                    {initials(user.username)}
                  </span>
                  <span className="font-semibold text-sm text-sp-ink mr-2">
                    {user.username}
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
