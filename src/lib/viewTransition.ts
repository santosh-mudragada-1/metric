/** Wraps a navigation in the View Transitions API where supported; falls back to a plain call. */
export function withViewTransition(fn: () => void): void {
  const doc = document as Document & { startViewTransition?: (callback: () => void) => unknown }
  if (typeof doc.startViewTransition === 'function') {
    doc.startViewTransition(fn)
  } else {
    fn()
  }
}
