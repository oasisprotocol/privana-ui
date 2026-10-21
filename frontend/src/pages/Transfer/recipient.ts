import { ethAddress, isAddress, zeroAddress } from 'viem'

const BURN_ADDRESS = '0x000000000000000000000000000000000000dead'

export const recipientError = (
  recipient: string,
  ownAddress: string | undefined,
  systemAddresses: readonly string[],
): string | null => {
  if (!isAddress(recipient)) return 'Enter a valid 0x address.'
  const lower = recipient.toLowerCase()
  if (lower === zeroAddress) return "That's the zero address - funds would be lost."
  if (lower === BURN_ADDRESS) return "That's a burn address - funds would be lost."
  if (lower === ethAddress) return "That's a placeholder address - funds would be lost."
  if (lower === ownAddress?.toLowerCase()) return "That's your own address - pick a different recipient."
  if (systemAddresses.includes(lower)) return "That's a Privana system address."
  return null
}
