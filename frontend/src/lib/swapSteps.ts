import type { SwapStep } from '@/api/operations'

const SWAP_STEPS: Partial<Record<SwapStep, string>> = {
  'internal_swap:pricing': 'Pricing your swap',
  'internal_swap:sent': 'Swapping privately',
  'input:sent': 'Preparing your private swap',
  'withdraw:sent': 'Moving your funds for the swap',
  'execute:funding': 'Waiting for funds to arrive',
  'execute:sent': 'Swapping privately',
  'execute:bridging': 'Bridging',
  'deposit:sent': 'Depositing to your vault',
  'deposit:crediting': 'Waiting for the deposit to be credited',
  'credit:sent': 'Crediting your vault',
  'refund:redeposit': 'Depositing your funds back',
  'refund:crediting': 'Waiting for the refund to be credited',
  'refund:payout': 'Returning your funds',
} satisfies Record<Exclude<SwapStep, 'parked' | 'no_funds_moved'>, string>

export const swapStepLabel = (step: SwapStep | null | undefined): string | undefined =>
  step ? SWAP_STEPS[step] : undefined
