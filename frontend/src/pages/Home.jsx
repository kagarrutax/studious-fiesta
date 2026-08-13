import { Link } from 'react-router-dom'
import { ANDROID_APK_URL, ANDROID_BUILD_PAGE } from '../config/mobile'
import { useAuth } from '../context/AuthContext'

export default function Home() {
  const { isAuthenticated } = useAuth()

  return (
    <section className="sp-container max-w-3xl py-10 md:py-16">
      <div className="relative sp-card rotate-sp-1 !mb-0 !p-8 md:!p-10 sp-page">
        <span className="sp-pin sp-pin-yellow" aria-hidden="true" />
        <div className="mb-5 flex justify-center sp-enter sp-delay-0">
          <img
            src="/logo.png"
            alt="Studious Party"
            className="h-28 w-28 rounded-full border-2 border-sp-yellow/50 object-cover shadow-raised sm:h-36 sm:w-36"
          />
        </div>
        <p className="sp-meta mb-3 text-center sp-enter sp-delay-1">Red estudiantil</p>
        <h1 className="font-display font-extrabold text-4xl md:text-6xl tracking-tight mb-4 text-center sp-enter sp-delay-1">
          Studious <span className="text-sp-yellow">Party</span>
        </h1>
        <p className="text-lg text-sp-ink-muted max-w-xl mx-auto mb-8 text-center sp-enter sp-delay-2">
          El campus, clavado en el tablón: publica, da like y comenta con tu gente.
        </p>
        <div className="flex flex-wrap justify-center gap-3 sp-enter sp-delay-3">
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
          <a
            href={ANDROID_APK_URL}
            className="sp-btn-ghost no-underline hover:no-underline"
            download="studious-party.apk"
          >
            Descargar app Android
          </a>
        </div>

        <div className="mt-6 rounded-md border border-dashed border-strong bg-sp-surface-raised/50 p-4 sp-enter sp-delay-4">
          <p className="sp-meta mb-2 text-sp-yellow">Android · aviso importante</p>
          <p className="mb-2 text-sm text-sp-ink-muted">
            El APK no está en Play Store, así que Play Protect / el antivirus del teléfono suele
            marcarlo como “riesgoso” o “virus”. Es un falso positivo habitual en apps académicas
            instaladas por fuera de la tienda. La app solo habla con nuestra API pública.
          </p>
          <p className="mb-3 text-sm text-sp-ink-muted">
            Si Android bloquea la instalación: abre el aviso →{' '}
            <strong className="text-sp-ink">Más detalles</strong> →{' '}
            <strong className="text-sp-ink">Instalar de todos modos</strong>. Opcional: después de
            instalar, en Play Protect toca <strong className="text-sp-ink">Escanear app</strong>.
          </p>
          <p className="mb-0 text-sm text-sp-ink-muted">
            Alternativa sin APK:{' '}
            <a
              className="text-sp-cyan"
              href="https://play.google.com/store/apps/details?id=host.exp.exponent"
              target="_blank"
              rel="noreferrer"
            >
              Expo Go
            </a>{' '}
            (desde Play Store). Detalles del build:{' '}
            <a className="text-sp-cyan" href={ANDROID_BUILD_PAGE} target="_blank" rel="noreferrer">
              página EAS
            </a>
            .
          </p>
        </div>
      </div>
    </section>
  )
}
