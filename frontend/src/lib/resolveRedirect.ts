export const resolveRedirect = (raw: string | null): string | null => {
  if (!raw) return null
  try {
    const url = new URL(raw, window.location.origin)
    return url.origin === window.location.origin ? url.pathname : null
  } catch {
    return null
  }
}
