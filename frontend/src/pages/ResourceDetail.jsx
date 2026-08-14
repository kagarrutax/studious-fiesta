import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'

const CATEGORY_LABELS = {
  notes: 'Apuntes',
  slides: 'Diapositivas',
  exam: 'Exámenes',
  other: 'Otros',
}

function formatBytes(n) {
  if (!n) return '0 B'
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function fileKind(fileType = '') {
  const t = String(fileType).toLowerCase()
  if (t.includes('pdf')) return { label: 'PDF', tone: 'text-sp-pink border-sp-pink/50' }
  if (t.includes('zip') || t.includes('compressed')) return { label: 'ZIP', tone: 'text-sp-cyan border-sp-cyan/50' }
  if (t.includes('word') || t.includes('document')) return { label: 'DOC', tone: 'text-sp-yellow border-sp-yellow/50' }
  if (t.includes('image')) return { label: 'IMG', tone: 'text-sp-cyan border-sp-cyan/50' }
  return { label: 'FILE', tone: 'text-sp-ink-muted border-strong' }
}

function Stars({ value = 0, size = 'md' }) {
  const full = Math.round(Number(value) || 0)
  const cls = size === 'lg' ? 'text-xl tracking-wide' : 'text-sm tracking-wide'
  return (
    <span className={`${cls} text-sp-yellow`} aria-label={`${full} de 5`}>
      {'★'.repeat(Math.max(0, Math.min(5, full)))}
      <span className="text-sp-ink-faint">{'★'.repeat(Math.max(0, 5 - full))}</span>
    </span>
  )
}

export default function ResourceDetail() {
  const { resourceId } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [resource, setResource] = useState(null)
  const [loading, setLoading] = useState(true)
  const [downloading, setDownloading] = useState(false)
  const [ratingBusy, setRatingBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    api
      .get(`/api/resources/${resourceId}`)
      .then(({ data }) => {
        if (!cancelled) setResource(data)
      })
      .catch((err) => {
        if (!cancelled) toast.error(apiErrorMessage(err, 'Recurso no encontrado'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [resourceId, toast])

  async function handleDownload() {
    setDownloading(true)
    try {
      const res = await api.get(`/api/resources/${resourceId}/download`, {
        responseType: 'blob',
      })
      const blob = new Blob([res.data], { type: resource?.file_type || 'application/octet-stream' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${resource?.title || 'recurso'}`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      setResource((r) => (r ? { ...r, downloads_count: (r.downloads_count || 0) + 1 } : r))
      toast.success('Descarga lista')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo descargar'))
    } finally {
      setDownloading(false)
    }
  }

  async function handleRate(score) {
    if (ratingBusy) return
    setRatingBusy(true)
    try {
      const { data } = await api.post(`/api/resources/${resourceId}/rate`, { score })
      setResource((r) =>
        r ? { ...r, avg_rating: data.avg_rating, my_rating: data.my_rating } : r,
      )
      toast.success('Valoración guardada')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo valorar'))
    } finally {
      setRatingBusy(false)
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Borrar este recurso?')) return
    try {
      await api.delete(`/api/resources/${resourceId}`)
      toast.success('Recurso eliminado')
      navigate('/resources')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo borrar'))
    }
  }

  if (loading) {
    return (
      <section className="sp-container max-w-3xl py-10">
        <div className="sp-skeleton h-8 w-40 mb-4" />
        <div className="sp-skeleton h-48 mb-4" />
        <div className="sp-skeleton h-28" />
      </section>
    )
  }

  if (!resource) {
    return (
      <section className="sp-container max-w-3xl py-10">
        <p className="sp-meta mb-3">No encontrado.</p>
        <Link to="/resources" className="sp-back">
          ← Volver a recursos
        </Link>
      </section>
    )
  }

  const kind = fileKind(resource.file_type)
  const categoryLabel = CATEGORY_LABELS[resource.category] || resource.category
  const isOwner = user?.id === resource.uploader_id

  return (
    <section className="sp-container max-w-3xl sp-page py-10">
      <Link to="/resources" className="sp-back mb-4">
        ← Recursos
      </Link>

      <article className="sp-card mt-4 !mb-0 rotate-sp-1">
        <div className="flex flex-wrap items-start gap-4 mb-5">
          <div
            className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-dashed bg-sp-surface-raised font-display text-lg font-bold ${kind.tone}`}
            aria-hidden
          >
            {kind.label}
          </div>
          <div className="min-w-0 flex-1">
            <p className="sp-meta mb-2 text-sp-yellow">Biblioteca académica</p>
            <h1 className="font-display text-3xl sm:text-4xl mb-3 break-words">{resource.title}</h1>
            <div className="flex flex-wrap gap-2">
              <span className="rounded-pin border border-dashed border-sp-cyan/40 bg-sp-bg/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-sp-cyan">
                {resource.subject?.name || 'Sin materia'}
              </span>
              <span className="rounded-pin border border-dashed border-sp-yellow/40 bg-sp-bg/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-sp-yellow">
                {categoryLabel}
              </span>
              <span className="rounded-pin border border-dashed border-strong bg-sp-bg/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-sp-ink-muted">
                {formatBytes(resource.size_bytes)}
              </span>
              <span className="rounded-pin border border-dashed border-strong bg-sp-bg/40 px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-sp-ink-muted">
                {resource.downloads_count || 0} descargas
              </span>
            </div>
          </div>
        </div>

        {resource.description && (
          <p className="mb-5 whitespace-pre-wrap rounded-lg border border-dashed border-strong/70 bg-sp-bg/30 px-4 py-3 text-sp-ink-muted">
            {resource.description}
          </p>
        )}

        <div className="mb-5 flex flex-wrap items-center gap-3">
          {resource.uploader ? (
            <Link
              to={`/users/${resource.uploader.id}`}
              className="sp-meta !normal-case tracking-normal text-sp-cyan no-underline hover:underline"
            >
              Subido por @{resource.uploader.username}
            </Link>
          ) : (
            <span className="sp-meta !normal-case tracking-normal">Autor desconocido</span>
          )}
          <span className="text-sp-ink-faint">·</span>
          <span className="inline-flex items-center gap-2 sp-meta !normal-case tracking-normal">
            <Stars value={resource.avg_rating} />
            {Number(resource.avg_rating || 0).toFixed(1)}
          </span>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="sp-btn-primary"
            disabled={downloading}
            aria-busy={downloading}
            onClick={handleDownload}
          >
            {downloading ? 'Descargando…' : `Descargar · ${resource.downloads_count || 0}`}
          </button>
          {isOwner && (
            <button type="button" className="sp-btn-ghost text-sp-pink" onClick={handleDelete}>
              Borrar recurso
            </button>
          )}
        </div>
      </article>

      <section className="sp-card mt-5 !mb-0 rotate-sp-2">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="sp-meta mb-1 text-sp-yellow">Tu opinión</p>
            <h2 className="font-display text-2xl mb-0">Valoración</h2>
          </div>
          <div className="text-right">
            <Stars value={resource.avg_rating} size="lg" />
            <p className="sp-meta !normal-case tracking-normal mb-0 mt-1">
              Promedio {Number(resource.avg_rating || 0).toFixed(1)}
              {resource.my_rating ? ` · Tu nota: ${resource.my_rating}` : ' · Aún no valoraste'}
            </p>
          </div>
        </div>

        <p className="mb-3 text-sm text-sp-ink-muted">Elige una nota del 1 al 5:</p>
        <div className="flex flex-wrap gap-2" role="group" aria-label="Valorar recurso">
          {[1, 2, 3, 4, 5].map((score) => {
            const active = resource.my_rating === score
            return (
              <button
                key={score}
                type="button"
                disabled={ratingBusy}
                className={`min-w-12 rounded-lg border px-3 py-2 font-display text-lg transition ${
                  active
                    ? 'border-sp-yellow bg-sp-yellow/15 text-sp-yellow'
                    : 'border-dashed border-strong bg-sp-surface-raised text-sp-ink-muted hover:border-sp-yellow/60 hover:text-sp-ink'
                }`}
                onClick={() => handleRate(score)}
                aria-pressed={active}
              >
                {score}
                <span className="ml-1 text-sm" aria-hidden>
                  ★
                </span>
              </button>
            )
          })}
        </div>
      </section>
    </section>
  )
}
