import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'path'
import type { Plugin } from 'vite'
import { APP_CHAINS } from './src/config/chains'

const onRampWidgets = [
  'https://global.transak.com',
  'https://global-stg.transak.com',
  'https://buy.moonpay.com',
  'https://buy-sandbox.moonpay.com',
]

const chainRpcOrigins = [
  ...new Set(APP_CHAINS.flatMap(chain => chain.rpcUrls.default.http.map(url => new URL(url).origin))),
]

const buildCsp = (apiOrigins: string[]): Record<string, string[]> => ({
  'default-src': ["'none'"],
  'script-src': ["'self'", '__INLINE_SCRIPT_HASHES__'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': [
    "'self'",
    // Privana APIs for the mode being built (VITE_PRIVANA_*_URL)
    ...apiOrigins,
    // Prices
    'https://api.coingecko.com',
    // Turnkey
    'https://authproxy.turnkey.com',
    'https://api.turnkey.com',
    // On-ramp
    'https://api.moonpay.com',
    // WalletConnect
    'wss://relay.walletconnect.org',
    'wss://relay.walletconnect.com',
    'https://pulse.walletconnect.org',
    'https://explorer-api.walletconnect.com',
    'https://verify.walletconnect.org',
    'https://verify.walletconnect.com',
    ...chainRpcOrigins,
  ],
  'frame-src': [
    ...onRampWidgets,
    // WalletConnect verification
    'https://verify.walletconnect.org',
    'https://verify.walletconnect.com',
    // Turnkey wallet iframes
    'https://auth.turnkey.com',
    'https://export.turnkey.com',
    'https://import.turnkey.com',
  ],
  'frame-ancestors': ["'none'"],
  'base-uri': ["'self'"],
  'form-action': ["'self'"],
  'manifest-src': ["'self'"],
  'worker-src': ["'self'", 'blob:'],
})

const permissionsPolicy: Record<string, string[]> = {
  accelerometer: [],
  autoplay: [],
  camera: onRampWidgets,
  'display-capture': [],
  fullscreen: ['self'],
  geolocation: [],
  gyroscope: [],
  magnetometer: [],
  microphone: onRampWidgets,
  midi: [],
  payment: onRampWidgets,
  'picture-in-picture': [],
  'publickey-credentials-get': ['self'],
  'screen-wake-lock': [],
  usb: [],
  'xr-spatial-tracking': [],
}

export function buildHeaderLines(html: string, apiOrigins: string[]): Array<[string, string]> {
  const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
    m => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`,
  )

  const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/g)].length
  if (hashes.length !== inlineScripts) {
    throw new Error(`CSP hashed ${hashes.length} inline scripts but index.html contains ${inlineScripts}`)
  }
  const cspValue = Object.entries(buildCsp(apiOrigins))
    .map(([directive, values]) => `${directive} ${values.join(' ')}`)
    .join('; ')
    .replace('__INLINE_SCRIPT_HASHES__', hashes.join(' '))
  const permissionsValue = Object.entries(permissionsPolicy)
    .map(([feature, allow]) => `${feature}=(${allow.map(v => (v === 'self' ? v : `"${v}"`)).join(' ')})`)
    .join(', ')
  return [
    ['Content-Security-Policy', cspValue],
    ['X-Frame-Options', 'DENY'],
    ['X-Content-Type-Options', 'nosniff'],
    ['Referrer-Policy', 'strict-origin-when-cross-origin'],
    ['Permissions-Policy', permissionsValue],
  ]
}

export function renderHeadersFile(headers: Array<[string, string]>): string {
  return `/*\n${headers.map(([name, value]) => `  ${name}: ${value}`).join('\n')}\n`
}

export function securityHeaders(): Plugin {
  let apiOrigins: string[] = []
  return {
    name: 'security-headers',
    apply: 'build',
    configResolved(config) {
      apiOrigins = [
        ...new Set(
          [config.env.VITE_PRIVANA_API_URL, config.env.VITE_PRIVANA_SERVICES_API_URL].map(
            url => new URL(url).origin,
          ),
        ),
      ]
    },
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, 'dist')
      const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
      fs.writeFileSync(path.join(dist, '_headers'), renderHeadersFile(buildHeaderLines(html, apiOrigins)))
    },
  }
}
