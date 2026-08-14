import { Link } from 'react-router-dom'

/**
 * Placeholder for platform sections not built yet (plan Fase 4–8).
 */
export default function ComingSoon({ title, blurb, phase }) {
  return (
    <section className="sp-container max-w-2xl sp-page py-10">
      <p className="sp-meta mb-2 text-sp-yellow">{phase}</p>
      <h1 className="font-display text-3xl mb-3">{title}</h1>
      <p className="text-sp-ink-muted mb-6">{blurb}</p>
      <div className="rounded-lg border border-dashed border-strong bg-sp-surface p-6">
        <p className="sp-meta mb-3">En construcción</p>
        <p className="mb-4 text-sm text-sp-ink-muted">
          Esta sección forma parte del plan de plataforma académica. Mientras tanto puedes usar el
          feed, el perfil y la búsqueda.
        </p>
        <div className="flex flex-wrap gap-2">
          <Link to="/feed" className="sp-btn-primary no-underline hover:no-underline">
            Ir al feed
          </Link>
          <Link to="/search" className="sp-btn-ghost no-underline hover:no-underline">
            Buscar
          </Link>
        </div>
      </div>
    </section>
  )
}
