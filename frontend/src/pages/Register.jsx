import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'

export default function Register() {
  const { isAuthenticated, login } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    username: '',
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)

  if (isAuthenticated) {
    return <Navigate to="/feed" replace />
  }

  function updateField(field) {
    return (event) => setForm((prev) => ({ ...prev, [field]: event.target.value }))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    setSubmitting(true)
    try {
      await api.post('/api/auth/register', form)
      const { data } = await api.post('/api/auth/login', {
        email: form.email,
        password: form.password,
      })
      login(data.access_token)
      navigate('/feed')
    } catch (err) {
      setError(apiErrorMessage(err, 'No se pudo registrar'))
    } finally {
      setSubmitting(false)
    }
  }

  const hasError = Boolean(error)

  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4">
      <section className="sp-notecard">
        <span className="sp-pin sp-pin-pink left-1/2 -translate-x-1/2" aria-hidden="true" />
        <h1 className="text-center font-display text-3xl mb-2">Unirme</h1>
        <p className="text-center text-sp-ink-muted mb-5">Crea tu perfil en la red del campus.</p>
        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="sp-label" htmlFor="reg-username">
              Usuario
            </label>
            <input
              id="reg-username"
              className={`sp-input ${hasError ? 'sp-input-error' : ''}`}
              value={form.username}
              onChange={updateField('username')}
              required
              minLength={3}
              autoComplete="username"
            />
          </div>
          <div>
            <label className="sp-label" htmlFor="reg-email">
              Email
            </label>
            <input
              id="reg-email"
              type="email"
              className={`sp-input ${hasError ? 'sp-input-error' : ''}`}
              value={form.email}
              onChange={updateField('email')}
              required
              autoComplete="email"
            />
          </div>
          <div>
            <label className="sp-label" htmlFor="reg-password">
              Contraseña
            </label>
            <input
              id="reg-password"
              type="password"
              className={`sp-input ${hasError ? 'sp-input-error' : ''}`}
              value={form.password}
              onChange={updateField('password')}
              required
              minLength={6}
              autoComplete="new-password"
            />
            {hasError && <p className="sp-error-text">{error}</p>}
          </div>
          <button className="sp-btn-primary w-full" type="submit" disabled={submitting}>
            {submitting ? 'Creando…' : 'Crear cuenta'}
          </button>
        </form>
        <p className="mt-5 mb-0 text-center text-sm text-sp-ink-muted">
          ¿Ya tienes cuenta?{' '}
          <Link to="/login" className="text-sp-yellow hover:underline">
            Inicia sesión
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
