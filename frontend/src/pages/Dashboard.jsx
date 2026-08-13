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
    <section className="max-w-[1080px] mx-auto px-4 py-8">
      <h1 className="font-display font-bold text-3xl mb-2 text-sp-ink">Panel de control</h1>
      <p className="text-sp-ink-muted mb-6">Estadísticas generales de la comunidad.</p>

      {loading && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="sp-skeleton h-32 rounded-xl" />
          <div className="sp-skeleton h-32 rounded-xl" />
          <div className="sp-skeleton h-32 rounded-xl" />
          <div className="sp-skeleton h-32 rounded-xl" />
        </div>
      )}
      {error && <p className="text-sp-danger">{error}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {STAT_LABELS.map((item, index) => (
              <article
                key={item.key}
                className={`bg-sp-surface border border-dashed border-strong rounded-xl p-5 shadow-sm border-t-[4px] ${cycleClass(ACCENT_TOP, index)}`}
              >
                <p className="font-display font-bold text-4xl text-sp-ink mb-1">{stats[item.key]}</p>
                <p className="sp-meta mb-0 uppercase tracking-wide text-xs">{item.label}</p>
              </article>
            ))}
          </div>

          <div className="rounded-xl border border-dashed border-strong bg-sp-surface p-6 shadow-sm">
            <h2 className="font-display font-bold text-xl mb-4 text-sp-ink">Resumen de Actividad</h2>
            <div className="space-y-1">
              {STAT_LABELS.map((item, index) => (
                <div
                  key={item.key}
                  className={`flex items-center justify-between py-3 ${index > 0 ? 'border-t border-strong/30' : ''}`}
                >
                  <span className="text-sp-ink font-semibold">{item.label} en total</span>
                  <span className="font-mono text-sm bg-sp-bg px-3 py-1 rounded-md text-sp-ink font-bold border border-strong/20">{stats[item.key]}</span>
                </div>
              ))}
            </div>
          </div>
        </>
      )}
    </section>
  )
}
