/** Delays de entrada escalonada (más notables). Cap en 5. */
export const STAGGER_DELAYS = [
  'sp-delay-0',
  'sp-delay-1',
  'sp-delay-2',
  'sp-delay-3',
  'sp-delay-4',
]

export function staggerClass(index) {
  return STAGGER_DELAYS[Math.min(Math.max(index, 0), STAGGER_DELAYS.length - 1)]
}
