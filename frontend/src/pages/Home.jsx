import { useEffect, useState } from 'react'
import api from '../services/api'

export default function Home() {
  const [status, setStatus] = useState('comprobando...')
  const [error, setError] = useState(null)

  useEffect(() => {
    api
      .get('/api/health')
      .then((res) => setStatus(res.data.status))
      .catch(() => {
        setError('No se pudo conectar con el backend')
        setStatus('offline')
      })
  }, [])

  return (
    <section className="card">
      <h1>Red social Studious Fiesta</h1>
      <p>Proyecto grupal — React + FastAPI</p>
      <p className="status">
        API: <strong>{status}</strong>
      </p>
      {error && <p className="error">{error}</p>}
      <p className="hint">Día 1 completado: estructura base lista para desarrollo.</p>
    </section>
  )
}
