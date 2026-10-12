import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import type { DepositProgress } from '@oasisprotocol/privana-sdk'
import { PendingDepositDetails } from './PendingDepositDetails'

vi.mock('@oasisprotocol/privana-sdk', async importOriginal => ({
  ...(await importOriginal<typeof import('@oasisprotocol/privana-sdk')>()),
  usePrivanaContext: () => ({
    getTokenById: () => ({ id: '0x1', symbol: 'USDC', decimals: 6, chainId: 8453 }),
    getChainById: () => ({
      id: 8453,
      name: 'Base',
      explorerUrl: 'https://basescan.org',
      explorerName: 'Basescan',
    }),
  }),
}))

const TX = `0x${'ab'.repeat(32)}` as const

const progress = (patch: Partial<DepositProgress> = {}): DepositProgress => ({
  txHash: TX,
  chainId: 8453,
  tokenId: '0x1',
  amount: 2_500_000n,
  sentAt: new Date(2026, 9, 12, 11, 17).getTime(),
  stage: 'confirming',
  ...patch,
})

const rowValue = (label: string) => screen.getByText(label).nextElementSibling

describe('PendingDepositDetails', () => {
  it('shows the deposit and links its transaction on the source chain', () => {
    render(<PendingDepositDetails progress={progress()} />)

    expect(rowValue('Amount')).toHaveTextContent('2.50 USDC · Base')
    expect(rowValue('Sent')).toHaveTextContent(/Oct 12, 2026, 11:17\sAM/)
    expect(screen.getByRole('button', { name: 'Copy transaction hash' })).toBeInTheDocument()
    expect(screen.getByRole('link')).toHaveAttribute('href', `https://basescan.org/tx/${TX}`)
    expect(screen.queryByText('Deposit ID')).not.toBeInTheDocument()
  })

  it('adds the deposit id once crediting starts', () => {
    render(<PendingDepositDetails progress={progress({ stage: 'crediting', depositId: '0xd1' })} />)

    expect(screen.getByText('Step 2/2 · Adding your deposit to Available')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Copy deposit ID' })).toBeInTheDocument()
  })

  it('says a deposit it could not confirm may still arrive', () => {
    render(<PendingDepositDetails progress={progress({ stage: 'failed' })} />)
    expect(screen.getByText(/may still be added to Available/)).toBeInTheDocument()
    expect(screen.getByText('In progress')).toBeInTheDocument()
  })
})
