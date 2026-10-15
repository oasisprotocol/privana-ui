import { describe, expect, it } from 'vitest'
import type { Operation } from '@/api/operations'
import type { EarnActivity, SwapActivity } from '@/contexts/ActivityProvider/context'
import { toOperationView } from './operationView'

const USDC = { id: '0x1', symbol: 'USDC', decimals: 6 }
const ETH = { id: '0x2', symbol: 'ETH', decimals: 18 }

const swap: SwapActivity = {
  id: 'local-1',
  type: 'swap',
  status: 'in-progress',
  createdAt: 1_000_500,
  fromToken: USDC,
  toToken: ETH,
  fromAmount: '1000000',
  toAmount: '400',
  swapId: 'op-1',
  txHash: '0xlocal',
}

const earn: EarnActivity = {
  id: 'local-2',
  type: 'earn',
  direction: 'deposit',
  status: 'in-progress',
  createdAt: 1_000_500,
  token: USDC,
  amount: '5000000',
  poolId: '0xpool',
  protocol: 'aave',
  depositId: 'op-2',
  stages: [{ stage: 'recording', at: 1_000 }],
}

const op = (patch: Partial<Operation>): Operation => ({
  operation_id: 'op-1',
  operation_type: 'swap',
  status: 'executing',
  created_at: 990,
  updated_at: 1_020,
  tx_hash: null,
  error: null,
  reason: null,
  quote_id: null,
  from_token_id: null,
  to_token_id: null,
  from_amount: null,
  to_amount_estimate: '390',
  to_amount_actual: null,
  pool_id: null,
  token_id: null,
  amount: null,
  nonce: null,
  ...patch,
})

describe('toOperationView', () => {
  it('uses the local activity before the services list the operation', () => {
    expect(toOperationView(swap)).toMatchObject({
      type: 'swap',
      operationId: 'op-1',
      serviceStatus: undefined,
      createdAt: 1_000,
      updatedAt: undefined,
      txHash: '0xlocal',
      estimate: '400',
      received: undefined,
    })
    expect(toOperationView(earn)).toMatchObject({ type: 'earn', stages: earn.stages })
  })

  it("prefers the services' row, keeping local values it lacks", () => {
    const view = toOperationView(swap, op({ to_amount_actual: '395' }))
    expect(view).toMatchObject({
      serviceStatus: 'executing',
      createdAt: 990,
      updatedAt: 1_020,
      txHash: '0xlocal',
      estimate: '390',
      received: '395',
    })
    expect(toOperationView(earn, op({ stages: [] }))).toMatchObject({ stages: [] })
  })

  it('leaves out a services status the badge already shows, and an unchanged update time', () => {
    const view = toOperationView(
      { ...swap, status: 'completed' },
      op({ status: 'completed', updated_at: 990 }),
    )
    expect(view.serviceStatus).toBeUndefined()
    expect(view.updatedAt).toBeUndefined()
    expect(view).toMatchObject({ received: '400' })
  })
})
