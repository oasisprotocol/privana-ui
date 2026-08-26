import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BalanceAmount } from '@/components/BalanceAmount'

const partSpans = () => screen.getAllByTestId('amount-part')

describe('BalanceAmount', () => {
  it('renders the full formatted amount', () => {
    const { container } = render(<BalanceAmount value={1234.5} />)
    expect(container.textContent).toBe('$1,234.50')
  })

  it('mutes only the currency symbol and the fractional part', () => {
    render(<BalanceAmount value={1234.5} />)
    const spans = partSpans()
    const mutedText = spans
      .filter(s => s.classList.contains('text-muted-foreground'))
      .map(s => s.textContent)
      .join('')
    const plainText = spans
      .filter(s => !s.classList.contains('text-muted-foreground'))
      .map(s => s.textContent)
      .join('')
    expect(mutedText).toBe('$.50')
    expect(plainText).toBe('1,234')
  })

  it('shrinks the currency symbol', () => {
    render(<BalanceAmount value={5} />)
    const currency = partSpans().find(s => s.textContent === '$')
    expect(currency).toHaveClass('text-[0.75em]')
  })
})
