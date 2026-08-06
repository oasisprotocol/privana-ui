export type KnownApp = {
  id: string
  name: string
  color: string
  serviceAddress: string
  logoUrl: string
  appUrl: string
  tagline: string
}

export type Venue = { name: string; color: string }

export const PRIVANA_VENUE: Venue = { name: 'Privana', color: '#0500E2' }

export const KNOWN_APPS: KnownApp[] = [
  {
    id: 'honoroll',
    name: 'Honoroll',
    color: '#0F4C81',
    serviceAddress: '0xDCFF0891F0Aea40b0ae4A7Ca3e00AD1012Fc2d16',
    // TODO: sync when prod is deployed
    logoUrl: 'https://testnet.honoroll.io/favicon-32x32.png',
    appUrl: 'https://testnet.honoroll.io/',
    tagline: 'Onchain casino · bet with locked chips',
  },
]

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
