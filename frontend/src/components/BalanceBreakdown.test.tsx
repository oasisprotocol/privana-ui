import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BalanceBreakdown } from '@/components/BalanceBreakdown'

const barSegments = () => screen.queryAllByTestId('balance-bar-segment')

describe('BalanceBreakdown', () => {
  it('renders each segment label with its formatted value', () => {
    render(<BalanceBreakdown available={50} earning={25.5} locked={10} error={false} />)
    expect(screen.getByText('Available')).toBeInTheDocument()
    expect(screen.getByText('Earning')).toBeInTheDocument()
    expect(screen.getByText('In use')).toBeInTheDocument()
    expect(screen.getByText('$50.00')).toBeInTheDocument()
    expect(screen.getByText('$25.50')).toBeInTheDocument()
    expect(screen.getByText('$10.00')).toBeInTheDocument()
  })

  it('renders dashes and no bar segments on error', () => {
    render(<BalanceBreakdown available={50} earning={25} locked={10} error={true} />)
    expect(screen.getAllByText('-')).toHaveLength(3)
    expect(barSegments()).toHaveLength(0)
  })

  it('renders dashes and no bar segments while any value is missing', () => {
    render(<BalanceBreakdown available={50} earning={undefined} locked={10} error={false} />)
    expect(screen.getAllByText('-')).toHaveLength(3)
    expect(barSegments()).toHaveLength(0)
  })

  it('renders zero values without bar segments', () => {
    render(<BalanceBreakdown available={0} earning={0} locked={0} error={false} />)
    expect(screen.getAllByText('$0.00')).toHaveLength(3)
    expect(barSegments()).toHaveLength(0)
  })

  it('sizes bar segments proportionally to the totals', () => {
    render(<BalanceBreakdown available={50} earning={25} locked={25} error={false} />)
    const widths = barSegments().map(s => s.style.width)
    expect(widths).toEqual(['50%', '25%', '25%'])
  })

  it('omits zero-value segments from the bar', () => {
    render(<BalanceBreakdown available={75} earning={0} locked={25} error={false} />)
    const widths = barSegments().map(s => s.style.width)
    expect(widths).toEqual(['75%', '25%'])
  })
})
