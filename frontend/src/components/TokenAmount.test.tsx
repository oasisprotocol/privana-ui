import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { TokenAmount } from './TokenAmount'

const USDC = { symbol: 'USDC', decimals: 6 }

describe('TokenAmount', () => {
  it('shows the truncated amount, the exact one on hover and an ungrouped one for screen readers', () => {
    render(<TokenAmount amount={1_234_567_890n} token={USDC} withSymbol />)
    const el = screen.getByText('1,234.56 USDC')
    expect(el).toHaveAttribute('title', '1234.56789')
    expect(el).toHaveAttribute('aria-label', '1234.56 USDC')
  })

  it('marks dust instead of showing zero', () => {
    render(<TokenAmount amount="1" token={{ symbol: 'ETH', decimals: 18 }} />)
    expect(screen.getByText('<0.000001')).toHaveAttribute('title', '0.000000000000000001')
  })
})
