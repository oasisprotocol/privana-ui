import { describe, expect, it } from 'vitest'
import { render } from '@testing-library/react'
import { BalanceAmount } from '@/components/BalanceAmount'

const partSpans = (container: HTMLElement) => Array.from(container.querySelectorAll('span > span'))

describe('BalanceAmount', () => {
  it('renders the full formatted amount', () => {
    const { container } = render(<BalanceAmount value={1234.5} />)
    expect(container.textContent).toBe('$1,234.50')
  })

  it('mutes only the currency symbol and the fractional part', () => {
    const { container } = render(<BalanceAmount value={1234.5} />)
    const spans = partSpans(container)
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
    const { container } = render(<BalanceAmount value={5} />)
    const currency = partSpans(container).find(s => s.textContent === '$')
    expect(currency).toHaveClass('text-[0.75em]')
  })
})
