import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { BalanceBreakdown } from '@/components/BalanceBreakdown'

const barSegments = (container: HTMLElement) => container.querySelectorAll('.h-2 > span')

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
    const { container } = render(<BalanceBreakdown available={50} earning={25} locked={10} error={true} />)
    expect(screen.getAllByText('-')).toHaveLength(3)
    expect(barSegments(container)).toHaveLength(0)
  })

  it('renders dashes and no bar segments while any value is missing', () => {
    const { container } = render(
      <BalanceBreakdown available={50} earning={undefined} locked={10} error={false} />,
    )
    expect(screen.getAllByText('-')).toHaveLength(3)
    expect(barSegments(container)).toHaveLength(0)
  })

  it('renders zero values without bar segments', () => {
    const { container } = render(<BalanceBreakdown available={0} earning={0} locked={0} error={false} />)
    expect(screen.getAllByText('$0.00')).toHaveLength(3)
    expect(barSegments(container)).toHaveLength(0)
  })

  it('sizes bar segments proportionally to the totals', () => {
    const { container } = render(<BalanceBreakdown available={50} earning={25} locked={25} error={false} />)
    const widths = Array.from(barSegments(container)).map(s => (s as HTMLElement).style.width)
    expect(widths).toEqual(['50%', '25%', '25%'])
  })

  it('omits zero-value segments from the bar', () => {
    const { container } = render(<BalanceBreakdown available={75} earning={0} locked={25} error={false} />)
    const widths = Array.from(barSegments(container)).map(s => (s as HTMLElement).style.width)
    expect(widths).toEqual(['75%', '25%'])
  })
})
