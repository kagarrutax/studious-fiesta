import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <section className="sp-container max-w-3xl py-10 md:py-16">
      <div className="relative sp-card rotate-sp-1 !mb-0 !p-8 md:!p-10 sp-page">
        <span className="sp-pin sp-pin-yellow" aria-hidden="true" />
        <p className="sp-meta mb-3 sp-enter sp-delay-0">Red estudiantil</p>
        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight mb-4 sp-enter sp-delay-1">
          <span className="text-sp-yellow">✺</span> Studious Party
        </h1>
        <p className="text-lg text-sp-ink-muted max-w-xl mb-8 sp-enter sp-delay-2">
          El campus, clavado en el tablón: publica, da like y comenta con tu gente.
        </p>
        <div className="flex flex-wrap gap-3 sp-enter sp-delay-3">
          {isAuthenticated ? (
            <Link to="/feed" className="sp-btn-primary no-underline hover:no-underline">
              Ir al feed
            </Link>
          ) : (
            <>
              <Link to="/register" className="sp-btn-primary no-underline hover:no-underline">
                Crear cuenta
              </Link>
              <Link to="/login" className="sp-btn-ghost no-underline hover:no-underline">
                Iniciar sesión
              </Link>
            </>
          )}
        </div>
      </div>
      <p className="sp-meta mt-4 text-center sp-enter sp-delay-4">
        Tip: recarga la página para ver la entrada del tablón
      </p>
    </section>
  )
}
