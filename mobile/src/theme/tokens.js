export const colors = {
  bg: '#0F2D23',
  surface: '#16382C',
  surfaceRaised: '#1E5A43',
  ink: '#FFF8E1',
  inkMuted: '#B8CFC0',
  inkFaint: '#7A9A88',
  pink: '#FFC107',
  cyan: '#8FD19E',
  yellow: '#FFD54A',
  border: '#2A4F3F',
  error: '#FF6B6B',
  success: '#8FD19E',
}

export function initials(name = '?') {
  return String(name).slice(0, 2).toUpperCase()
}
