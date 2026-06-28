function requireEnv(name: string, value: string | undefined): string {
  if (!value) throw new Error(`${name} is not set`)
  return value
}

export const BASE_URL = requireEnv(
  'VITE_PRIVANA_SERVICES_API_URL',
  import.meta.env.VITE_PRIVANA_SERVICES_API_URL,
)

export class ApiError extends Error {
  readonly status: number
  readonly detail: string | null
  constructor(status: number, detail: string | null) {
    super(detail ?? `Request failed: ${status}`)
    this.name = 'ApiError'
    this.status = status
    this.detail = detail
  }
}

export async function request<T>(path: string, init?: RequestInit, bearer?: string): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' }
  if (bearer) headers.Authorization = `Bearer ${bearer}`
  const res = await fetch(`${BASE_URL}${path}`, {
    ...init,
    headers: { ...headers, ...(init?.headers as Record<string, string> | undefined) },
  })
  if (!res.ok) {
    const body = await res.json().catch(() => null)
    throw new ApiError(res.status, body?.detail ?? null)
  }
  return res.json()
}
