import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import { cycleClass, ROTATIONS } from '../design/tokens'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'

function communityInitials(name = '?') {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase() || '?'
}

export default function Communities() {
  const toast = useToast()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [rules, setRules] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [q, setQ] = useState('')

  async function load(search = q) {
    setLoading(true)
    try {
      const { data } = await api.get('/api/communities', {
        params: { limit: 30, ...(search.trim() ? { q: search.trim() } : {}) },
      })
      setItems(data.items || [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudieron cargar las comunidades'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load('')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCreate(event) {
    event.preventDefault()
    if (!name.trim()) return
    setSubmitting(true)
    try {
      const { data } = await api.post('/api/communities', {
        name: name.trim(),
        description: description.trim() || null,
        rules: rules.trim() || null,
      })
      setItems((prev) => [data, ...prev])
      setName('')
      setDescription('')
      setRules('')
      toast.success('Comunidad creada')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo crear'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sp-container max-w-3xl sp-page py-10">
      <p className="sp-meta mb-2 text-sp-yellow">Fase 4</p>
      <h1 className="font-display text-3xl sm:text-4xl mb-2">Comunidades</h1>
      <p className="text-sp-ink-muted mb-6 max-w-xl">
        Espacios por materia o club. Únete y publica solo dentro de la comunidad.
      </p>

      <form onSubmit={handleCreate} className="sp-card rotate-sp-1 !mb-6 space-y-3">
        <div>
          <p className="sp-meta mb-1 text-sp-cyan">Nuevo espacio</p>
          <h2 className="font-display text-2xl mb-0">Crear comunidad</h2>
        </div>
        <input
          className="sp-input w-full"
          placeholder="Nombre (ej. Cálculo I)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={120}
          required
        />
        <textarea
          className="sp-input w-full min-h-20"
          placeholder="Descripción breve"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={2000}
        />
        <textarea
          className="sp-input w-full min-h-16"
          placeholder="Reglas (opcional)"
          value={rules}
          onChange={(e) => setRules(e.target.value)}
          maxLength={4000}
        />
        <button type="submit" className="sp-btn-primary" disabled={submitting} aria-busy={submitting}>
          {submitting ? 'Creando…' : 'Crear comunidad'}
        </button>
      </form>

      <form
        className="mb-5 flex flex-wrap gap-2 rounded-lg border border-dashed border-strong bg-sp-surface/80 p-3"
        onSubmit={(e) => {
          e.preventDefault()
          load(q)
        }}
      >
        <input
          className="sp-input flex-1 min-w-[12rem]"
          placeholder="Buscar comunidad…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        <button type="submit" className="sp-btn-ghost">
          Buscar
        </button>
      </form>

      <div className="mb-3 flex items-baseline justify-between gap-2">
        <h2 className="font-display text-xl mb-0">Directorio</h2>
        <p className="sp-meta mb-0 !normal-case tracking-normal">
          {loading ? 'Cargando…' : `${items.length} comunidad${items.length === 1 ? '' : 'es'}`}
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
            Crea la primera comunidad o ajusta la búsqueda.
          </p>
        </div>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {items.map((c, index) => (
            <li key={c.id}>
              <Link
                to={`/communities/${c.id}`}
                className={`sp-card !mb-0 block no-underline text-sp-ink ${cycleClass(ROTATIONS, index)}`}
              >
                <div className="flex gap-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-dashed border-sp-yellow/40 bg-sp-surface-raised font-display text-sm font-bold text-sp-yellow"
                    aria-hidden
                  >
                    {communityInitials(c.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h3 className="font-display text-xl mb-1 break-words">{c.name}</h3>
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-pin border border-dashed border-sp-cyan/40 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sp-cyan">
                          {c.members_count} miembros
                        </span>
                        <span className="rounded-pin border border-dashed border-strong px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sp-ink-muted">
                          {c.posts_count} posts
                        </span>
                      </div>
                    </div>
                    {c.description && (
                      <p className="mt-1 mb-2 text-sm text-sp-ink-muted line-clamp-2">{c.description}</p>
                    )}
                    {c.is_member && (
                      <span className="rounded-pin bg-sp-pink/20 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wide text-sp-pink">
                        Miembro{c.my_role === 'admin' ? ' · admin' : ''}
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
