import type { WalletClient } from 'viem'

const WITHDRAW_TYPES = {
  Withdraw: [
    { name: 'user', type: 'address' },
    { name: 'poolId', type: 'bytes32' },
    { name: 'amount', type: 'uint256' },
    { name: 'nonce', type: 'uint256' },
  ],
} as const

export interface SignWithdrawConsentParams {
  walletClient: WalletClient
  chainId: number
  earnManagerAddress: `0x${string}`
  message: {
    user: `0x${string}`
    poolId: `0x${string}`
    amount: bigint
    nonce: bigint
  }
}

export async function signWithdrawConsent({
  walletClient,
  chainId,
  earnManagerAddress,
  message,
}: SignWithdrawConsentParams): Promise<`0x${string}`> {
  const account = walletClient.account
  if (!account) throw new Error('No account connected to wallet client')

  return walletClient.signTypedData({
    account,
    domain: {
      name: 'EarnManager',
      version: '1',
      chainId,
      verifyingContract: earnManagerAddress,
    },
    types: WITHDRAW_TYPES,
    primaryType: 'Withdraw',
    message,
  })
}
