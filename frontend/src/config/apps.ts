import type { Venue } from './protocols'

export type KnownApp = {
  id: string
  name: string
  color: string
  serviceAddress: string
  logoUrl: string
  appUrl: string
  tagline: string
}

export const PRIVANA_VENUE: Venue = { name: 'Privana', color: '#0500E2' }

const TESTNET_APPS: KnownApp[] = [
  {
    id: 'honoroll',
    name: 'Honoroll',
    color: '#0F4C81',
    serviceAddress: '0xDCFF0891F0Aea40b0ae4A7Ca3e00AD1012Fc2d16',
    logoUrl: 'https://testnet.honoroll.io/favicon-32x32.png',
    appUrl: 'https://testnet.honoroll.io/',
    tagline: 'Onchain casino · bet with locked chips',
  },
]

const MAINNET_APPS: KnownApp[] = []

export const KNOWN_APPS: KnownApp[] = import.meta.env?.MODE === 'mainnet' ? MAINNET_APPS : TESTNET_APPS

const knownAppByAddress = new Map<string, KnownApp>(
  KNOWN_APPS.map(app => [app.serviceAddress.toLowerCase(), app]),
)

export function appForAddress(address: string | null | undefined): KnownApp | null {
  if (!address) return null
  return knownAppByAddress.get(address.toLowerCase()) ?? null
}

const knownAppNameByAddress = new Map<string, string>(
  KNOWN_APPS.map(app => [app.serviceAddress.toLowerCase(), app.name]),
)

export function appNameForAddress(address: string | null | undefined): string | null {
  if (!address) return null
  return knownAppNameByAddress.get(address.toLowerCase()) ?? null
}
