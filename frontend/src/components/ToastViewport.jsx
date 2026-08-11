import { useToast } from '../context/ToastContext'

const TYPE_STYLES = {
  success: 'border-sp-cyan/50 text-sp-ink',
  error: 'border-sp-danger/60 text-sp-ink',
  info: 'border-sp-yellow/45 text-sp-ink',
}

const TYPE_PIN = {
  success: 'sp-pin-cyan',
  error: 'sp-pin-pink',
  info: 'sp-pin-yellow',
}

const TYPE_LABEL = {
  success: 'Listo',
  error: 'Atención',
  info: 'Aviso',
}

export default function ToastViewport() {
  const { toasts, dismiss } = useToast()

  if (toasts.length === 0) return null

  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[60] flex flex-col items-end gap-3 p-4 sm:p-6"
      aria-live="polite"
      aria-relevant="additions"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role="status"
          className={`pointer-events-auto relative w-full max-w-sm rounded-lg border border-dashed bg-sp-surface-raised px-4 py-3 pr-10 shadow-card motion-reduce:animate-none ${
            toast.exiting
              ? 'motion-safe:animate-sp-toast-out'
              : 'motion-safe:animate-sp-toast-in'
          } ${TYPE_STYLES[toast.type] || TYPE_STYLES.info}`}
        >
          <span
            className={`sp-pin ${TYPE_PIN[toast.type] || TYPE_PIN.info} left-3 top-0`}
            aria-hidden="true"
          />
          <p className="sp-meta mb-1 pl-2">{TYPE_LABEL[toast.type] || 'Aviso'}</p>
          <p className="m-0 pl-2 text-sm leading-snug">{toast.message}</p>
          <button
            type="button"
            className="absolute right-2 top-2 rounded px-2 py-1 text-xs text-sp-ink-muted hover:bg-sp-surface hover:text-sp-ink"
            aria-label="Cerrar aviso"
            onClick={() => dismiss(toast.id)}
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )
}
