import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'
import { cycleClass, ROTATIONS } from '../design/tokens'

const CATEGORIES = [
  { value: 'notes', label: 'Apuntes' },
  { value: 'slides', label: 'Diapositivas' },
  { value: 'exam', label: 'Exámenes' },
  { value: 'other', label: 'Otros' },
]

const CATEGORY_LABELS = Object.fromEntries(CATEGORIES.map((c) => [c.value, c.label]))

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
  if (t.includes('presentation') || t.includes('powerpoint')) {
    return { label: 'PPT', tone: 'text-sp-yellow border-sp-yellow/50' }
  }
  if (t.includes('image')) return { label: 'IMG', tone: 'text-sp-cyan border-sp-cyan/50' }
  return { label: 'FILE', tone: 'text-sp-ink-muted border-strong' }
}

function Stars({ value = 0 }) {
  const full = Math.round(Number(value) || 0)
  return (
    <span className="text-sp-yellow text-sm tracking-wide" aria-hidden>
      {'★'.repeat(Math.max(0, Math.min(5, full)))}
      <span className="text-sp-ink-faint">{'★'.repeat(Math.max(0, 5 - full))}</span>
    </span>
  )
}

export default function Resources() {
  const toast = useToast()
  const [subjects, setSubjects] = useState([])
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [subjectId, setSubjectId] = useState('')
  const [category, setCategory] = useState('')
  const [q, setQ] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [uploadCategory, setUploadCategory] = useState('notes')
  const [uploadSubject, setUploadSubject] = useState('')
  const [file, setFile] = useState(null)

  async function loadSubjects() {
    const { data } = await api.get('/api/subjects')
    setSubjects(data || [])
  }

  async function loadList(params = {}) {
    setLoading(true)
    try {
      const { data } = await api.get('/api/resources', {
        params: {
          limit: 30,
          ...(params.subject_id ? { subject_id: params.subject_id } : {}),
          ...(params.category ? { category: params.category } : {}),
          ...(params.q ? { q: params.q } : {}),
        },
      })
      setItems(data.items || [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudieron cargar los recursos'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadSubjects()
      .then(() => loadList({}))
      .catch((err) => toast.error(apiErrorMessage(err, 'Error al iniciar recursos')))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleFilter(event) {
    event.preventDefault()
    await loadList({
      subject_id: subjectId || undefined,
      category: category || undefined,
      q: q.trim() || undefined,
    })
  }

  async function handleUpload(event) {
    event.preventDefault()
    if (!title.trim() || !file) {
      toast.error('Título y archivo son obligatorios')
      return
    }
    setSubmitting(true)
    try {
      const form = new FormData()
      form.append('title', title.trim())
      if (description.trim()) form.append('description', description.trim())
      form.append('category', uploadCategory)
      if (uploadSubject) form.append('subject_id', uploadSubject)
      form.append('file', file)
      const { data } = await api.post('/api/resources', form)
      setItems((prev) => [data, ...prev])
      setTitle('')
      setDescription('')
      setFile(null)
      event.target.reset()
      toast.success('Recurso subido')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo subir'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sp-container max-w-3xl sp-page py-10">
      <p className="sp-meta mb-2 text-sp-yellow">Fase 5</p>
      <h1 className="font-display text-3xl sm:text-4xl mb-2">Recursos</h1>
      <p className="text-sp-ink-muted mb-6 max-w-xl">
        Biblioteca de PDF, apuntes y materiales por materia. Descarga y valora.
      </p>

      <form onSubmit={handleUpload} className="sp-card rotate-sp-1 !mb-6 space-y-3">
        <div className="mb-1">
          <p className="sp-meta mb-1 text-sp-cyan">Nuevo material</p>
          <h2 className="font-display text-2xl mb-0">Subir archivo</h2>
        </div>
        <input
          className="sp-input w-full"
          placeholder="Título"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          maxLength={200}
          required
        />
        <textarea
          className="sp-input w-full min-h-16"
          placeholder="Descripción (opcional)"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
        />
        <div className="flex flex-wrap gap-2">
          <select
            className="sp-input flex-1 min-w-[8rem]"
            value={uploadCategory}
            onChange={(e) => setUploadCategory(e.target.value)}
          >
            {CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
          <select
            className="sp-input flex-1 min-w-[8rem]"
            value={uploadSubject}
            onChange={(e) => setUploadSubject(e.target.value)}
          >
            <option value="">Sin materia</option>
            {subjects.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <label className="flex flex-wrap items-center gap-3 rounded-lg border border-dashed border-strong bg-sp-bg/30 px-3 py-3 cursor-pointer hover:border-sp-yellow/50">
          <span className="rounded-pin bg-sp-pink px-2.5 py-1 font-mono text-[10px] uppercase tracking-wide text-[#0F2D23]">
            Elegir archivo
          </span>
          <span className="text-sm text-sp-ink-muted truncate">
            {file ? file.name : 'PDF, DOC, PPT, ZIP o imagen · máx. según API'}
          </span>
          <input
            type="file"
            className="sr-only"
            accept=".pdf,.doc,.docx,.ppt,.pptx,.zip,image/*"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            required
          />
        </label>
        <button type="submit" className="sp-btn-primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Subiendo…' : 'Subir recurso'}
        </button>
      </form>

      <form
        onSubmit={handleFilter}
        className="mb-5 flex flex-wrap gap-2 rounded-lg border border-dashed border-strong bg-sp-surface/80 p-3"
      >
        <input
          className="sp-input flex-1 min-w-[10rem]"
          placeholder="Buscar por título…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <select className="sp-input" value={subjectId} onChange={(e) => setSubjectId(e.target.value)}>
          <option value="">Todas las materias</option>
          {subjects.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
        <select className="sp-input" value={category} onChange={(e) => setCategory(e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIES.map((c) => (
            <option key={c.value} value={c.value}>
              {c.label}
            </option>
          ))}
        </select>
        <button type="submit" className="sp-btn-ghost">
          Filtrar
        </button>
      </form>

      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl mb-0">Biblioteca</h2>
        <p className="sp-meta mb-0 !normal-case tracking-normal">
          {loading ? 'Cargando…' : `${items.length} recurso${items.length === 1 ? '' : 's'}`}
        </p>
      </div>

      {loading ? (
        <div className="space-y-3">
          <div className="sp-skeleton h-24" />
          <div className="sp-skeleton h-24" />
        </div>
      ) : items.length === 0 ? (
        <div className="rounded-lg border border-dashed border-strong bg-sp-surface p-6 text-center">
          <p className="font-display text-lg mb-1">Sin resultados</p>
          <p className="sp-meta !normal-case tracking-normal mb-0">
            Sube el primero o ajusta los filtros.
          </p>
        </div>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {items.map((r, index) => {
            const kind = fileKind(r.file_type)
            const categoryLabel = CATEGORY_LABELS[r.category] || r.category
            return (
              <li key={r.id}>
                <Link
                  to={`/resources/${r.id}`}
                  className={`sp-card !mb-0 block no-underline text-sp-ink ${cycleClass(ROTATIONS, index)}`}
                >
                  <div className="flex gap-3">
                    <div
                      className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed bg-sp-surface-raised font-display text-xs font-bold ${kind.tone}`}
                      aria-hidden
                    >
                      {kind.label}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-start justify-between gap-2">
                        <h3 className="font-display text-xl mb-1 break-words">{r.title}</h3>
                        <span className="inline-flex items-center gap-1.5 sp-meta !normal-case tracking-normal shrink-0">
                          <Stars value={r.avg_rating} />
                          {Number(r.avg_rating || 0).toFixed(1)}
                        </span>
                      </div>
                      <div className="mb-2 flex flex-wrap gap-1.5">
                        <span className="rounded-pin border border-dashed border-sp-cyan/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sp-cyan">
                          {r.subject?.name || 'Sin materia'}
                        </span>
                        <span className="rounded-pin border border-dashed border-sp-yellow/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sp-yellow">
                          {categoryLabel}
                        </span>
                        <span className="rounded-pin border border-dashed border-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sp-ink-muted">
                          {formatBytes(r.size_bytes)}
                        </span>
                      </div>
                      <p className="mb-0 text-sm text-sp-ink-muted">
                        {r.downloads_count || 0} descargas
                        {r.uploader ? ` · @${r.uploader.username}` : ''}
                      </p>
                    </div>
                  </div>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
