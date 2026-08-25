import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import { QuoteCountdown } from '@/components/QuoteCountdown'

const nowSeconds = () => Math.floor(Date.now() / 1000)

describe('QuoteCountdown', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('renders nothing while idle', () => {
    const { container } = render(<QuoteCountdown />)
    expect(container).toBeEmptyDOMElement()
  })

  it('shows a spinner while the quote is loading', () => {
    const { container } = render(<QuoteCountdown quoteLoading />)
    expect(screen.getByText(/Quote will update in/)).toBeInTheDocument()
    expect(container.querySelector('.animate-spin')).not.toBeNull()
  })

  it('shows the remaining seconds and ticks down', () => {
    render(<QuoteCountdown expiresAt={nowSeconds() + 30} />)
    expect(screen.getByText('30s')).toBeInTheDocument()

    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByText('20s')).toBeInTheDocument()
  })

  it('clamps at zero after expiry', () => {
    render(<QuoteCountdown expiresAt={nowSeconds() + 2} />)

    act(() => {
      vi.advanceTimersByTime(10_000)
    })
    expect(screen.getByText('0s')).toBeInTheDocument()
  })
})
