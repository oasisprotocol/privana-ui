interface TokenConfig {
  geckoId: string
  swappable?: boolean
}

// Each service (swap / earn / on-ramp) uses a different token, some aren't swappable,
// and honoroll's tokens (their own USDC deployments) are excluded.
const TESTNET_TOKENS = {
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
  },
} as const satisfies Record<string, TokenConfig>

// Mainnet ids from https://api.privana.finance/v1/accounting/tokens
// Every token is swappable. The map still has to exist for the CoinGecko ids.
const MAINNET_TOKENS = {
  // Base (8453) — native ETH
  '0xe5e6c795953f93ec9c872a4a6000788aacf182163c7abf8a5e982fedcd9f1620': {
    geckoId: 'ethereum',
  },
  // Base (8453) — USDC (0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913)
  '0x5e7facf6b7b5b9887e41398db2ae1990ff7e379d17fedb428b04265d748b33b2': {
    geckoId: 'usd-coin',
  },
  // Ethereum (1) — native ETH
  '0xa52deb863f04f0481adb11470f3e3789b541f4253662bf69b0c3e6879792cf0b': {
    geckoId: 'ethereum',
  },
  // Ethereum (1) — USDC (0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48)
  '0x6a53c372368bfca6b9cb392eec897c3b685f4380af001f48fded5c2b59f5c873': {
    geckoId: 'usd-coin',
  },
  // HyperEVM (999) — native HYPE
  '0x85b9d7ada49e51566fb5032bfc642b4799ec6c5ecc4942aa117493e946e18770': {
    geckoId: 'hyperliquid',
  },
  // HyperEVM (999) — USDC (0xb88339CB7199b77E23DB6E890353E22632Ba630f)
  '0xbb600e800a38b161b32e0f797b798f09cb12498ab1457f2b2a92d768a6dd0105': {
    geckoId: 'usd-coin',
  },
} as const satisfies Record<string, TokenConfig>

export type TokenId = keyof typeof TESTNET_TOKENS | keyof typeof MAINNET_TOKENS

const TOKENS: Record<string, TokenConfig> =
  import.meta.env?.MODE === 'mainnet' ? MAINNET_TOKENS : TESTNET_TOKENS

export const ALLOWED_TOKEN_IDS = Object.keys(TOKENS) as TokenId[]

export const SWAPPABLE_TOKEN_IDS: TokenId[] = (Object.entries(TOKENS) as [TokenId, TokenConfig][])
  .filter(([, cfg]) => cfg.swappable !== false)
  .map(([id]) => id)

export const getGeckoId = (tokenId: string): string | undefined => TOKENS[tokenId]?.geckoId
