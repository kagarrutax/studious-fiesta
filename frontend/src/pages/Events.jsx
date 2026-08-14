import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'

function toLocalInputValue(date) {
  const pad = (n) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatWhen(value) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return ''
  }
}

function isPastEvent(ev) {
  const end = ev.ends_at ? new Date(ev.ends_at) : new Date(ev.starts_at)
  return end.getTime() < Date.now()
}

export default function Events() {
  const toast = useToast()
  const navigate = useNavigate()
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [filter, setFilter] = useState('all')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [startsAt, setStartsAt] = useState(() => {
    const d = new Date()
    d.setHours(d.getHours() + 24)
    return toLocalInputValue(d)
  })
  const [endsAt, setEndsAt] = useState('')

  async function load(nextFilter = filter) {
    setLoading(true)
    try {
      const { data } = await api.get('/api/events', {
        params: { upcoming: nextFilter === 'upcoming', limit: 40 },
      })
      setItems(data.items || [])
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudieron cargar los eventos'))
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    load(filter)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter])

  async function handleCreate(event) {
    event.preventDefault()
    if (!title.trim() || !startsAt) return
    setSubmitting(true)
    try {
      const payload = {
        title: title.trim(),
        description: description.trim() || null,
        location: location.trim() || null,
        starts_at: new Date(startsAt).toISOString(),
        ends_at: endsAt ? new Date(endsAt).toISOString() : null,
      }
      const { data } = await api.post('/api/events', payload)
      toast.success('Evento publicado')
      navigate(`/events/${data.id}`)
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo crear el evento'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="sp-container max-w-3xl sp-page py-10">
      <p className="sp-meta mb-2 text-sp-yellow">Fase 6</p>
      <h1 className="font-display text-3xl mb-2">Eventos</h1>
      <p className="text-sp-ink-muted mb-6">Agenda del campus: publica, confirma asistencia y reúnete.</p>

      <form
        onSubmit={handleCreate}
        className="mb-8 space-y-3 rounded-lg border border-dashed border-strong bg-sp-surface p-4"
      >
        <h2 className="font-display text-lg mb-0">Crear evento</h2>
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
          placeholder="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={4000}
        />
        <input
          className="sp-input w-full"
          placeholder="Lugar"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          maxLength={200}
        />
        <div className="flex flex-wrap gap-2">
          <label className="sp-meta !normal-case tracking-normal flex-1 min-w-[12rem]">
            Inicio
            <input
              type="datetime-local"
              className="sp-input w-full mt-1"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </label>
          <label className="sp-meta !normal-case tracking-normal flex-1 min-w-[12rem]">
            Fin (opcional)
            <input
              type="datetime-local"
              className="sp-input w-full mt-1"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
            />
          </label>
        </div>
        <button type="submit" className="sp-btn" disabled={submitting}>
          {submitting ? 'Publicando…' : 'Publicar evento'}
        </button>
      </form>

      <div className="mb-4 flex flex-wrap gap-2">
        <button
          type="button"
          className={`sp-btn ${filter === 'all' ? '' : 'sp-btn-ghost'}`}
          onClick={() => setFilter('all')}
        >
          Todos
        </button>
        <button
          type="button"
          className={`sp-btn ${filter === 'upcoming' ? '' : 'sp-btn-ghost'}`}
          onClick={() => setFilter('upcoming')}
        >
          Próximos
        </button>
      </div>

      {loading ? (
        <p className="sp-meta">Cargando…</p>
      ) : items.length === 0 ? (
        <p className="sp-meta">
          {filter === 'upcoming'
            ? 'No hay eventos próximos. Cambia a Todos o crea uno nuevo.'
            : 'No hay eventos. Crea el primero.'}
        </p>
      ) : (
        <ul className="m-0 list-none space-y-3 p-0">
          {items.map((ev) => {
            const past = isPastEvent(ev)
            return (
              <li key={ev.id}>
                <Link
                  to={`/events/${ev.id}`}
                  className="block rounded-lg border border-dashed border-strong bg-sp-surface p-4 no-underline text-sp-ink hover:border-sp-yellow/50"
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-xl mb-0">{ev.title}</h2>
                    <span className="sp-meta !normal-case tracking-normal">
                      {past ? 'Pasado · ' : ''}
                      {ev.going_count} van · {ev.interested_count} interesados
                    </span>
                  </div>
                  <p className="mt-1 mb-0 text-sm text-sp-ink-muted">
                    {formatWhen(ev.starts_at)}
                    {ev.location ? ` · ${ev.location}` : ''}
                  </p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}
