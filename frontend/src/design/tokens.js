/** Constantes estáticas — no construir clases Tailwind con template strings. */
export const PIN_COLORS = ['sp-pin-pink', 'sp-pin-yellow', 'sp-pin-cyan']
export const ROTATIONS = ['rotate-sp-1', 'rotate-sp-2', 'rotate-sp-3']
export const ACCENT_BORDERS = ['border-sp-pink', 'border-sp-yellow', 'border-sp-cyan']
export const ACCENT_TOP = ['border-t-sp-pink', 'border-t-sp-yellow', 'border-t-sp-cyan']
export const TAB_ACTIVE = ['border-sp-pink', 'border-sp-yellow', 'border-sp-cyan']

export function cycleClass(list, index) {
  return list[index % list.length]
}

export function initials(name = '?') {
  return name.slice(0, 2).toUpperCase()
}
