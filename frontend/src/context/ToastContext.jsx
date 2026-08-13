import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])
  const [notices, setNotices] = useState([])
  const [unread, setUnread] = useState(0)

  const remove = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const dismiss = useCallback(
    (id) => {
      setToasts((prev) =>
        prev.map((t) => (t.id === id ? { ...t, exiting: true } : t)),
      )
      window.setTimeout(() => remove(id), 150)
    },
    [remove],
  )

  const markNoticesRead = useCallback(() => {
    setUnread(0)
  }, [])

  const clearNotices = useCallback(() => {
    setNotices([])
    setUnread(0)
  }, [])

  const push = useCallback(
    (message, type = 'info', duration = 3200) => {
      const id = ++toastId
      const entry = { id, message, type, at: Date.now(), exiting: false }
      setToasts((prev) => [...prev.slice(-4), entry])
      setNotices((prev) => [entry, ...prev].slice(0, 8))
      setUnread((n) => Math.min(n + 1, 9))
      if (duration > 0) {
        window.setTimeout(() => dismiss(id), duration)
      }
      return id
    },
    [dismiss],
  )

  const value = useMemo(
    () => ({
      toasts,
      notices,
      unread,
      markNoticesRead,
      clearNotices,
      push,
      dismiss,
      success: (message, duration) => push(message, 'success', duration),
      error: (message, duration) => push(message, 'error', duration ?? 4500),
      info: (message, duration) => push(message, 'info', duration),
    }),
    [toasts, notices, unread, markNoticesRead, clearNotices, push, dismiss],
  )

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) {
    throw new Error('useToast debe usarse dentro de ToastProvider')
  }
  return ctx
}
