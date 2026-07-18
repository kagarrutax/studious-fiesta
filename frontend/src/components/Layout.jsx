import { Link, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Layout() {
  const { isAuthenticated, logout } = useAuth()

  return (
    <div className="app">
      <header className="navbar">
        <Link to="/" className="brand">
          Studious Fiesta
        </Link>
        <nav>
          {isAuthenticated ? (
            <>
              <Link to="/feed">Feed</Link>
              <button type="button" className="link-btn" onClick={logout}>
                Salir
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Iniciar sesión</Link>
              <Link to="/register">Registrarse</Link>
            </>
          )}
        </nav>
      </header>
      <main className="main">
        <Outlet />
      </main>
    </div>
  )
}
