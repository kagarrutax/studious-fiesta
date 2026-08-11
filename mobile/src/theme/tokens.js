export const colors = {
  bg: '#0f1419',
  surface: '#1a2332',
  surfaceRaised: '#243044',
  ink: '#f0f4f8',
  inkMuted: '#9aa8b8',
  inkFaint: '#6b7a8c',
  pink: '#ff4d8d',
  cyan: '#3dfff3',
  yellow: '#ffe566',
  border: '#2a3a4d',
  error: '#ff6b6b',
  success: '#5eead4',
}

export function initials(name = '?') {
  return String(name).slice(0, 2).toUpperCase()
}
