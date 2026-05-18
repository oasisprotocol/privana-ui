export type KnownApp = {
  id: string
  name: string
  serviceAddress: string
  logoUrl: string
  appUrl: string
  tagline: string
}

export const KNOWN_APPS: KnownApp[] = [
  {
    id: 'honoroll',
    name: 'Honoroll',
    serviceAddress: '0xDCFF0891F0Aea40b0ae4A7Ca3e00AD1012Fc2d16',
    // TODO: sync when prod is deployed
    logoUrl: 'https://testnet.honoroll.io/favicon-32x32.png',
    appUrl: 'https://testnet.honoroll.io/',
    tagline: 'Onchain casino · bet with locked chips',
  },
]
