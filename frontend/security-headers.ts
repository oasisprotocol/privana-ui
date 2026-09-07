import crypto from 'node:crypto'
import fs from 'node:fs'
import path from 'path'
import type { Plugin } from 'vite'

const onRampWidgets = [
  'https://global.transak.com',
  'https://global-stg.transak.com',
  'https://buy.moonpay.com',
  'https://buy-sandbox.moonpay.com',
]

const csp: Record<string, string[]> = {
  'default-src': ["'none'"],
  'script-src': ["'self'", '__INLINE_SCRIPT_HASHES__'],
  'style-src': ["'self'", "'unsafe-inline'"],
  'font-src': ["'self'"],
  'img-src': ["'self'", 'data:', 'https:'],
  'connect-src': [
    "'self'",
    // Privana APIs
    'https://api.privana.finance',
    'https://api.testnet.privana.finance',
    'https://services.privana.finance',
    'https://services.testnet.privana.finance',
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
    // Chain RPCs: viem defaults for every chain in src/wagmi-config.ts
    'https://sapphire.oasis.io',
    'https://testnet.sapphire.oasis.dev',
    'https://mainnet.base.org',
    'https://ethereum.reth.rs',
    'https://rpc.hyperliquid.xyz',
    'https://sepolia.base.org',
    'https://11155111.rpc.thirdweb.com',
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
}

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
  'web-share': [],
  'xr-spatial-tracking': [],
}

export function securityHeaders(): Plugin {
  return {
    name: 'security-headers',
    apply: 'build',
    closeBundle() {
      const dist = path.resolve(import.meta.dirname, 'dist')
      const html = fs.readFileSync(path.join(dist, 'index.html'), 'utf8')
      const hashes = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(
        m => `'sha256-${crypto.createHash('sha256').update(m[1]).digest('base64')}'`,
      )

      const inlineScripts = [...html.matchAll(/<script\b(?![^>]*\bsrc=)[^>]*>/g)].length
      if (hashes.length !== inlineScripts) {
        throw new Error(`CSP hashed ${hashes.length} inline scripts but index.html contains ${inlineScripts}`)
      }
      const cspValue = Object.entries(csp)
        .map(([directive, values]) => `${directive} ${values.join(' ')}`)
        .join('; ')
        .replace('__INLINE_SCRIPT_HASHES__', hashes.join(' '))
      const permissionsValue = Object.entries(permissionsPolicy)
        .map(([feature, allow]) => `${feature}=(${allow.map(v => (v === 'self' ? v : `"${v}"`)).join(' ')})`)
        .join(', ')
      const headers: Array<[string, string]> = [
        ['Content-Security-Policy', cspValue],
        ['X-Frame-Options', 'DENY'],
        ['X-Content-Type-Options', 'nosniff'],
        ['Referrer-Policy', 'strict-origin-when-cross-origin'],
        ['Permissions-Policy', permissionsValue],
      ]
      fs.writeFileSync(
        path.join(dist, '_headers'),
        `/*\n${headers.map(([name, value]) => `  ${name}: ${value}`).join('\n')}\n`,
      )
    },
  }
}
