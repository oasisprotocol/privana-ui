export const resolveRedirect = (raw: string | null): string | null => {
  if (!raw) return null
  try {
    const url = new URL(raw, window.location.origin)
    // ProtectedLayout stashes `pathname + search`, so keep the query — dropping it
    // bounces the user to a bare route without the filters they arrived with.
    return url.origin === window.location.origin ? `${url.pathname}${url.search}` : null
  } catch {
    return null
  }
}
