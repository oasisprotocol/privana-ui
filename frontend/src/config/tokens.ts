interface TokenConfig {
  geckoId: string
  swappable?: boolean
  moonpayCode?: string
}

const TOKENS = {
  '0x330ba47d00c7ce3018deee017b319fd7cc6473a2ddc9e6eba6ebb4207be15279': {
    geckoId: 'usd-coin',
  },
  '0x335b5cccd1e63b2fe79863a0db73fce430e4e66902e2b78424f8662621e29fb7': {
    geckoId: 'ethereum',
  },
  '0xc719650e9f4b0f27d956638c54518932ef9d15e720a1a2b2850250bcd0816514': {
    geckoId: 'usd-coin',
    swappable: false,
  },
  '0xbd3a41ffd21be1cfcdca7a4e7755842a5b78c9443fb7ea008e6a7314f0caea87': {
    geckoId: 'usd-coin',
    swappable: false,
    moonpayCode: 'usdc',
  },
} as const satisfies Record<string, TokenConfig>

export type TokenId = keyof typeof TOKENS

export const ALLOWED_TOKEN_IDS: TokenId[] = Object.keys(TOKENS) as TokenId[]

export const SWAPPABLE_TOKEN_IDS: TokenId[] = (Object.entries(TOKENS) as [TokenId, TokenConfig][])
  .filter(([, cfg]) => cfg.swappable !== false)
  .map(([id]) => id)

export const ONRAMPABLE_TOKEN_IDS: TokenId[] = (Object.entries(TOKENS) as [TokenId, TokenConfig][])
  .filter(([, cfg]) => Boolean(cfg.moonpayCode))
  .map(([id]) => id)

export const getGeckoId = (tokenId: string): string | undefined =>
  (TOKENS as Record<string, TokenConfig>)[tokenId]?.geckoId

export const getMoonpayCode = (tokenId: string): string | undefined =>
  (TOKENS as Record<string, TokenConfig>)[tokenId]?.moonpayCode
