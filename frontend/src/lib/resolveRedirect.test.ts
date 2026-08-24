import { afterAll, beforeAll, describe, expect, it, vi } from 'vitest'
import { resolveRedirect } from '@/lib/resolveRedirect'

const ORIGIN = 'http://localhost:3000'

beforeAll(() => {
  vi.stubGlobal('window', { location: { origin: ORIGIN } })
})

afterAll(() => {
  vi.unstubAllGlobals()
})

describe('resolveRedirect', () => {
  it('keeps a same-origin path', () => {
    expect(resolveRedirect('/dashboard')).toBe('/dashboard')
  })

  it('keeps the query string', () => {
    expect(resolveRedirect('/earn?range=day&tab=all')).toBe('/earn?range=day&tab=all')
  })

  it('drops the hash', () => {
    expect(resolveRedirect('/vault#section')).toBe('/vault')
  })

  it('accepts an absolute same-origin URL and strips it to path + query', () => {
    expect(resolveRedirect(`${ORIGIN}/vault?x=1`)).toBe('/vault?x=1')
    expect(resolveRedirect(ORIGIN)).toBe('/')
  })

  it('rejects a foreign origin', () => {
    expect(resolveRedirect('https://evil.example/dashboard')).toBeNull()
  })

  it('rejects a protocol-relative URL', () => {
    expect(resolveRedirect('//evil.example/dashboard')).toBeNull()
  })

  it('rejects backslash and scheme-smuggling variants', () => {
    // URL parsing treats \ like / in http(s), so these all resolve to a
    // foreign origin — the origin check must catch them.
    expect(resolveRedirect('/\\evil.example/dashboard')).toBeNull()
    expect(resolveRedirect('\\/evil.example/dashboard')).toBeNull()
    expect(resolveRedirect('https:/evil.example')).toBeNull()
  })

  it('rejects empty and null input', () => {
    expect(resolveRedirect(null)).toBeNull()
    expect(resolveRedirect('')).toBeNull()
  })
})
