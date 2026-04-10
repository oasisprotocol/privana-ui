export const SYMBOL_OVERRIDES: Record<string, string> = {
  '0xc719650e9f4b0f27d956638c54518932ef9d15e720a1a2b2850250bcd0816514': 'USDC',
  '0x330ba47d00c7ce3018deee017b319fd7cc6473a2ddc9e6eba6ebb4207be15279': 'USDC',
  '0x335b5cccd1e63b2fe79863a0db73fce430e4e66902e2b78424f8662621e29fb7': 'WETH',
}

export const DECIMALS_OVERRIDES: Record<string, number> = {
  '0xc719650e9f4b0f27d956638c54518932ef9d15e720a1a2b2850250bcd0816514': 6,
  '0x330ba47d00c7ce3018deee017b319fd7cc6473a2ddc9e6eba6ebb4207be15279': 6,
  '0x335b5cccd1e63b2fe79863a0db73fce430e4e66902e2b78424f8662621e29fb7': 18,
}

export const getDecimals = (tokenId: string) => DECIMALS_OVERRIDES[tokenId] ?? 18
