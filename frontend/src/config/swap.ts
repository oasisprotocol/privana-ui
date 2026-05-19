// Optional: missing only degrades Activity labeling (swap entries fall back to "Transfer")
const raw = import.meta.env.VITE_SWAP_LP_ADDRESS
if (raw && !/^0x[a-fA-F0-9]{40}$/.test(raw)) {
  throw new Error(`VITE_SWAP_LP_ADDRESS must be a 0x-prefixed 20-byte address; got "${raw}"`)
}
if (!raw && import.meta.env.PROD) {
  console.warn('VITE_SWAP_LP_ADDRESS is not set — swap history entries will be labeled as "Transfer".')
}

export const SWAP_LP_ADDRESS: string = raw?.toLowerCase() ?? ''

export const isSwapLpAddress = (address: string | null | undefined): boolean =>
  !!SWAP_LP_ADDRESS && !!address && address.toLowerCase() === SWAP_LP_ADDRESS
