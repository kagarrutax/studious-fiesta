import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'

export default function Login() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      const { data } = await api.post('/api/auth/login', { email, password })
      login(data.access_token)
      navigate('/feed')
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo iniciar sesión'))
    } finally {
      setSubmitting(false)
    }
  }

  const hasError = Boolean(error)

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <section className="sp-notecard">
        <span className="sp-pin sp-pin-pink left-1/2 -translate-x-1/2" aria-hidden="true" />
        <h1 className="text-center font-display text-3xl mb-2">Entrar</h1>
        <p className="text-center text-sp-ink-muted mb-5">Accede a tu cuenta de Studious Party.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="sp-label" htmlFor="login-email">
              Email
            </label>
            <input
              id="login-email"
              type="email"
              className={`sp-input ${hasError ? 'sp-input-error' : ''}`}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="sp-label" htmlFor="login-password">
              Contraseña
            </label>
            <input
              id="login-password"
              type="password"
              className={`sp-input ${hasError ? 'sp-input-error' : ''}`}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={6}
              autoComplete="current-password"
            />
            {hasError && <p className="sp-error-text">{error}</p>}
          </div>
          <button className="sp-btn-primary w-full" type="submit" disabled={submitting}>
            {submitting ? 'Entrando…' : 'Iniciar sesión'}
          </button>
        </form>
        <p className="mt-5 mb-0 text-center text-sm text-sp-ink-muted">
          ¿No tienes cuenta?{' '}
          <Link to="/register" className="text-sp-yellow hover:underline">
            Regístrate
          </Link>
        </p>
        <p className="mt-3 mb-0 text-center">
          <Link to="/" className="sp-meta text-sp-cyan hover:underline">
            Volver al inicio
          </Link>
        </p>
      </section>
    </div>
  )
}
