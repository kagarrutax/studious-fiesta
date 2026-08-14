import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useToast } from '../context/ToastContext'
import api from '../services/api'
import { apiErrorMessage } from '../utils/errors'

function formatWhen(value) {
  try {
    return new Date(value).toLocaleString('es', { dateStyle: 'medium', timeStyle: 'short' })
  } catch {
    return ''
  }
}

const RSVP_OPTIONS = [
  { value: 'going', label: 'Voy' },
  { value: 'interested', label: 'Me interesa' },
  { value: 'declined', label: 'No puedo' },
]

export default function EventDetail() {
  const { eventId } = useParams()
  const { user } = useAuth()
  const toast = useToast()
  const navigate = useNavigate()
  const [event, setEvent] = useState(null)
  const [attendees, setAttendees] = useState([])
  const [loading, setLoading] = useState(true)

  async function refresh() {
    const [detail, people] = await Promise.all([
      api.get(`/api/events/${eventId}`),
      api.get(`/api/events/${eventId}/attendees`),
    ])
    setEvent(detail.data)
    setAttendees(people.data || [])
  }

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    refresh()
      .catch((err) => {
        if (!cancelled) toast.error(apiErrorMessage(err, 'Evento no encontrado'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [eventId])

  async function handleRsvp(status) {
    try {
      const { data } = await api.post(`/api/events/${eventId}/rsvp`, { status })
      setEvent(data)
      const people = await api.get(`/api/events/${eventId}/attendees`)
      setAttendees(people.data || [])
      toast.success('RSVP actualizado')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo confirmar'))
    }
  }

  async function handleDelete() {
    if (!window.confirm('¿Borrar este evento?')) return
    try {
      await api.delete(`/api/events/${eventId}`)
      toast.success('Evento eliminado')
      navigate('/events')
    } catch (err) {
      toast.error(apiErrorMessage(err, 'No se pudo borrar'))
    }
  }

  if (loading) {
    return (
      <section className="sp-container max-w-3xl py-10">
        <p className="sp-meta">Cargando…</p>
      </section>
    )
  }

  if (!event) {
    return (
      <section className="sp-container max-w-3xl py-10">
        <p className="sp-meta">No encontrado.</p>
        <Link to="/events" className="sp-back">
          ← Volver
        </Link>
      </section>
    )
  }

  return (
    <section className="sp-container max-w-3xl sp-page py-10">
      <Link to="/events" className="sp-back mb-4">
        ← Eventos
      </Link>
      <div className="mt-3 mb-4 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl mb-1">{event.title}</h1>
          <p className="sp-meta !normal-case tracking-normal mb-0">
            {formatWhen(event.starts_at)}
            {event.ends_at ? ` → ${formatWhen(event.ends_at)}` : ''}
            {event.location ? ` · ${event.location}` : ''}
          </p>
          {event.creator && (
            <p className="sp-meta !normal-case tracking-normal mt-1 mb-0">
              Por{' '}
              <Link to={`/users/${event.creator.id}`} className="text-sp-cyan">
                @{event.creator.username}
              </Link>
            </p>
          )}
        </div>
        {user?.id === event.creator_id && (
          <button type="button" className="sp-btn-ghost text-sp-pink" onClick={handleDelete}>
            Borrar
          </button>
        )}
      </div>

      {event.description && (
        <p className="text-sp-ink-muted mb-6 whitespace-pre-wrap">{event.description}</p>
      )}

      <div className="mb-6 rounded-lg border border-dashed border-strong bg-sp-surface p-4">
        <h2 className="font-display text-lg mb-3">¿Vas?</h2>
        <div className="flex flex-wrap gap-2">
          {RSVP_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              className={`sp-btn-ghost px-3 py-1 ${
                event.my_status === opt.value ? 'border-sp-yellow text-sp-ink' : ''
              }`}
              onClick={() => handleRsvp(opt.value)}
            >
              {opt.label}
            </button>
          ))}
        </div>
        <p className="sp-meta !normal-case tracking-normal mt-3 mb-0">
          {event.going_count} van · {event.interested_count} interesados
        </p>
      </div>

      <h2 className="font-display text-lg mb-3">Participantes</h2>
      {attendees.length === 0 ? (
        <p className="sp-meta">Nadie todavía.</p>
      ) : (
        <ul className="m-0 flex list-none flex-wrap gap-2 p-0">
          {attendees.map((person) => (
            <li key={`${person.id}-${person.status}`}>
              <Link
                to={`/users/${person.id}`}
                className="rounded-md border border-DEFAULT bg-sp-surface-raised px-2 py-1 text-xs text-sp-ink no-underline"
              >
                @{person.username} · {person.status}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
