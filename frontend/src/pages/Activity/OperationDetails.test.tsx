import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { Operation } from '@/api/operations'
import type { EarnActivity, SwapActivity } from '@/contexts/ActivityProvider/context'
import { OperationDetails } from './OperationDetails'

vi.mock('@oasisprotocol/privana-sdk', async importOriginal => ({
  ...(await importOriginal<typeof import('@oasisprotocol/privana-sdk')>()),
  usePrivanaContext: () => ({
    getTokenById: () => ({ chainId: 8453 }),
    getChainById: () => ({ name: 'Base' }),
  }),
}))

let operations: Operation[] = []
vi.mock('@/api/operations', async importOriginal => ({
  ...(await importOriginal<typeof import('@/api/operations')>()),
  useOperations: () => ({ data: { operations, next_cursor: null } }),
}))

const USDC = { id: '0x1', symbol: 'USDC', decimals: 6 }
const ETH = { id: '0x2', symbol: 'ETH', decimals: 18 }

const op = (patch: Partial<Operation>): Operation => ({
  operation_id: 'op-1',
  operation_type: 'swap',
  status: 'completed',
  created_at: 1_000,
  updated_at: 1_060,
  tx_hash: '0x' + 'ab'.repeat(32),
  error: null,
  reason: null,
  quote_id: 'q-1',
  from_token_id: USDC.id,
  to_token_id: ETH.id,
  from_amount: '1000000',
  to_amount_estimate: '400000000000000',
  to_amount_actual: null,
  pool_id: null,
  token_id: null,
  amount: null,
  nonce: '7',
  ...patch,
})

const swap = (patch: Partial<SwapActivity>): SwapActivity => ({
  id: 'op-1',
  type: 'swap',
  status: 'completed',
  createdAt: 1_000_000,
  fromToken: USDC,
  toToken: ETH,
  fromAmount: '1000000',
  toAmount: '400000000000000',
  swapId: 'op-1',
  ...patch,
})

const rowValue = (label: string) => screen.getByText(label).nextElementSibling

beforeEach(() => {
  operations = []
})

describe('OperationDetails: swap', () => {
  it('shows what was paid and received, with the services status and ids', () => {
    operations = [op({ to_amount_actual: '390000000000000' })]
    render(<OperationDetails activity={swap({ toAmount: '390000000000000' })} />)

    expect(rowValue('You paid')).toHaveTextContent('1.00 USDC · Base')
    expect(rowValue('You received')).toHaveTextContent('0.00039 ETH · Base')
    expect(rowValue('Rate')).toHaveTextContent('1 USDC = 0.00039 ETH')
    // The badge already says it; the Status row is for finer states.
    expect(screen.queryByText('Status')).not.toBeInTheDocument()
    expect(screen.getByText('Last updated')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy operation ID' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy transaction hash' })).toBeInTheDocument()
  })

  it('marks the payout of a swap in progress as an estimate', () => {
    operations = [op({ status: 'executing' })]
    render(<OperationDetails activity={swap({ status: 'in-progress' })} />)

    expect(rowValue('You receive')).toHaveTextContent('≈ 0.0004 ETH')
    expect(rowValue('Status')).toHaveTextContent('Executing')
    expect(screen.getByText('Executing')).toHaveClass('motion-safe:animate-pulse')
    expect(screen.getByText(/You can safely leave this screen/)).toBeInTheDocument()
  })

  it('shows the full error when the swap failed', () => {
    const error = 'This swap could not be completed. Contact Privana support with swap ID op-1.'
    operations = [op({ status: 'failed', error, reason: 'needs_support' })]
    render(<OperationDetails activity={swap({ status: 'failed', error })} />)

    expect(screen.getByText(error)).toHaveClass('text-destructive')
    expect(screen.queryByText(/Reason/)).not.toBeInTheDocument()
    expect(rowValue('Quoted')).toHaveTextContent('≈ 0.0004 ETH')
    expect(screen.queryByText('Rate')).not.toBeInTheDocument()
  })

  it('tells a refund apart from a plain failure', () => {
    operations = [op({ status: 'refunded' })]
    render(<OperationDetails activity={swap({ status: 'failed' })} />)
    expect(rowValue('Status')).toHaveTextContent('Refunded')
  })
})

describe('OperationDetails: earn', () => {
  const earn: EarnActivity = {
    id: 'op-2',
    type: 'earn',
    direction: 'deposit',
    status: 'in-progress',
    createdAt: 1_000_000,
    token: USDC,
    amount: '5000000',
    poolId: '0xpool',
    protocol: 'aave',
    depositId: 'op-2',
  }

  it('shows the venue and every step so far', () => {
    operations = [
      op({
        operation_id: 'op-2',
        operation_type: 'earn_deposit',
        status: 'pending',
        stages: [
          { stage: 'recording', at: 1_000 },
          { stage: 'bridging', at: 1_030 },
        ],
      }),
    ]
    render(<OperationDetails activity={earn} />)

    expect(rowValue('Amount')).toHaveTextContent('5.00 USDC · Base')
    expect(rowValue('Type')).toHaveTextContent('Moved to Earn')
    expect(screen.getByRole('list', { name: 'Progress' })).toBeInTheDocument()
  })

  it('drops the steps once the move has settled', () => {
    operations = [
      op({
        operation_id: 'op-2',
        operation_type: 'earn_withdraw',
        status: 'completed',
        stages: [{ stage: 'paying_out', at: 1_000 }],
      }),
    ]
    render(<OperationDetails activity={{ ...earn, direction: 'withdraw', status: 'completed' }} />)
    expect(screen.queryByRole('list', { name: 'Progress' })).not.toBeInTheDocument()
  })
})
