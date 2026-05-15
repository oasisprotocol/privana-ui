export const SWAP_LP_ADDRESS: string = (import.meta.env.VITE_SWAP_LP_ADDRESS ?? '').toLowerCase()

export const isSwapLpAddress = (address: string | null | undefined): boolean =>
  !!SWAP_LP_ADDRESS && !!address && address.toLowerCase() === SWAP_LP_ADDRESS
