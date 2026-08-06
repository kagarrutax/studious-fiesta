import { useEffect, useState } from 'react'
import api from '../services/api'
import { ACCENT_TOP, ROTATIONS, cycleClass } from '../design/tokens'

const STAT_LABELS = [
  { key: 'users', label: 'Usuarios' },
  { key: 'posts', label: 'Publicaciones' },
  { key: 'likes', label: 'Me gusta' },
  { key: 'comments', label: 'Comentarios' },
]

export default function Dashboard() {
  const [stats, setStats] = useState(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/api/stats')
      .then((res) => setStats(res.data))
      .catch((err) => setError(err.response?.data?.detail || 'No se pudieron cargar las estadísticas'))
      .finally(() => setLoading(false))
  }, [])

  return (
    <section className="sp-container max-w-4xl">
      <h1 className="font-display text-3xl mb-2">Panel</h1>
      <p className="text-sp-ink-muted mb-6">Actividad de Studious Party</p>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sp-skeleton h-28" />
          <div className="sp-skeleton h-28" />
          <div className="sp-skeleton h-28" />
          <div className="sp-skeleton h-28" />
        </div>
      )}
      {error && <p className="text-sp-danger">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STAT_LABELS.map((item, index) => (
              <article
                key={item.key}
                className={`relative bg-sp-surface border border-DEFAULT rounded-lg p-4 shadow-card border-t-[3px] ${cycleClass(ACCENT_TOP, index)} ${cycleClass(ROTATIONS, index)}`}
              >
                <p className="font-display text-3xl text-sp-ink mb-2">{stats[item.key]}</p>
                <p className="sp-meta mb-0">{item.label}</p>
              </article>
            ))}
          </div>

          <div className="rounded-lg border border-DEFAULT bg-sp-surface p-5 shadow-card">
            <h2 className="font-display text-xl mb-4">Actividad reciente</h2>
            {/* Supuesto: usamos los totales de /api/stats como filas de resumen. */}
            {STAT_LABELS.map((item, index) => (
              <div
                key={item.key}
                className={`flex items-center justify-between py-3 ${index > 0 ? 'sp-divider' : ''}`}
              >
                <span className="text-sp-ink-muted">{item.label}</span>
                <span className="font-mono text-sm text-sp-ink">{stats[item.key]}</span>
              </div>
            ))}
          </div>
        </>
      )}
    </section>
  )
}
