import { createHash } from 'node:crypto'
import { describe, expect, it } from 'vitest'
import { base, sapphire } from 'viem/chains'
import { buildHeaderLines, renderHeadersFile } from '../security-headers'

const API_ORIGINS = ['https://api.testnet.privana.finance', 'https://services.testnet.privana.finance']
const HTML = '<html><head><script>console.log(1)</script><script src="/app.js"></script></head></html>'

const cspOf = (headers: Array<[string, string]>) =>
  headers.find(([name]) => name === 'Content-Security-Policy')?.[1] ?? ''

describe('buildHeaderLines', () => {
  it('hashes attribute-less inline scripts into script-src', () => {
    const hash = createHash('sha256').update('console.log(1)').digest('base64')
    expect(cspOf(buildHeaderLines(HTML, API_ORIGINS))).toContain(`script-src 'self' 'sha256-${hash}'`)
  })

  it('throws when an inline script would go unhashed', () => {
    // type="module" inline scripts don't match the hashing regex; shipping a
    // CSP that blocks them must fail the build, not the page.
    const html = '<script type="module">boot()</script>'
    expect(() => buildHeaderLines(html, API_ORIGINS)).toThrow(/hashed 0 inline scripts .* contains 1/)
  })

  it('puts the given API origins into connect-src', () => {
    const csp = cspOf(buildHeaderLines(HTML, API_ORIGINS))
    const connect = csp.split('; ').find(d => d.startsWith('connect-src'))
    expect(connect).toContain('https://api.testnet.privana.finance')
    expect(connect).toContain('https://services.testnet.privana.finance')
  })

  it("allows every app chain's default RPC origin", () => {
    // Derived from the same viem chain objects as wagmi-config, so this stays
    // true across viem upgrades; spot-check two chains.
    const connect = cspOf(buildHeaderLines(HTML, API_ORIGINS))
      .split('; ')
      .find(d => d.startsWith('connect-src'))
    expect(connect).toContain(new URL(sapphire.rpcUrls.default.http[0]).origin)
    expect(connect).toContain(new URL(base.rpcUrls.default.http[0]).origin)
  })

  it('grants camera/microphone/payment only to the on-ramp widgets', () => {
    const permissions = buildHeaderLines(HTML, API_ORIGINS).find(
      ([name]) => name === 'Permissions-Policy',
    )?.[1]
    expect(permissions).toContain('camera=("https://global.transak.com')
    expect(permissions).not.toContain('camera=(self')
    expect(permissions).toContain('geolocation=()')
  })

  it('emits the full header set in Cloudflare Pages format', () => {
    const rendered = renderHeadersFile(buildHeaderLines(HTML, API_ORIGINS))
    expect(rendered.startsWith('/*\n')).toBe(true)
    for (const name of [
      'Content-Security-Policy',
      'X-Frame-Options',
      'X-Content-Type-Options',
      'Referrer-Policy',
      'Permissions-Policy',
    ]) {
      expect(rendered).toContain(`  ${name}: `)
    }
  })
})
