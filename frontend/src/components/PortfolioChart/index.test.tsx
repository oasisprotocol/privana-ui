import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
  ChartRangeSwitcher,
  PortfolioChartPlaceholder,
  PortfolioChartSection,
  type PortfolioPoint,
} from '@/components/PortfolioChart'

const points = (n: number): PortfolioPoint[] =>
  Array.from({ length: n }, (_, i) => ({ date: String(i + 1), value: 100 + i }))

const noop = () => {}

describe('PortfolioChartSection', () => {
  it('renders the chart and switcher when there is enough data', () => {
    render(
      <PortfolioChartSection data={points(5)} range="all" onRangeChange={noop} emptyLabel="Nothing yet" />,
    )
    expect(screen.queryByText('Nothing yet')).not.toBeInTheDocument()
    expect(screen.queryByText('No data for this period.')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('shows the empty label and hides the switcher when "all" has no data', () => {
    render(<PortfolioChartSection data={[]} range="all" onRangeChange={noop} emptyLabel="Nothing yet" />)
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
    expect(screen.queryByRole('button')).not.toBeInTheDocument()
  })

  it('keeps the switcher visible for an empty narrowed range', () => {
    render(<PortfolioChartSection data={[]} range="day" onRangeChange={noop} emptyLabel="Nothing yet" />)
    expect(screen.getByText('No data for this period.')).toBeInTheDocument()
    expect(screen.queryByText('Nothing yet')).not.toBeInTheDocument()
    expect(screen.getAllByRole('button')).toHaveLength(5)
  })

  it('treats a single point as empty', () => {
    render(
      <PortfolioChartSection data={points(1)} range="all" onRangeChange={noop} emptyLabel="Nothing yet" />,
    )
    expect(screen.getByText('Nothing yet')).toBeInTheDocument()
  })
})

describe('ChartRangeSwitcher', () => {
  it('renders all five ranges in order', () => {
    render(<ChartRangeSwitcher value="all" onChange={noop} />)
    const labels = screen.getAllByRole('button').map(b => b.textContent)
    expect(labels).toEqual(['Day', 'Week', 'Month', 'Year', 'All'])
  })

  it('reports the clicked range', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<ChartRangeSwitcher value="all" onChange={onChange} />)
    await user.click(screen.getByRole('button', { name: 'Month' }))
    expect(onChange).toHaveBeenCalledExactlyOnceWith('month')
  })

  it('marks only the active range', () => {
    render(<ChartRangeSwitcher value="week" onChange={noop} />)
    expect(screen.getByRole('button', { name: 'Week' })).toHaveClass('bg-muted')
    expect(screen.getByRole('button', { name: 'Day' })).not.toHaveClass('bg-muted')
  })
})

describe('PortfolioChartPlaceholder', () => {
  it('renders its label and hides the dimmed chart from assistive tech', () => {
    const { container } = render(<PortfolioChartPlaceholder label="No history" />)
    expect(screen.getByText('No history')).toBeInTheDocument()
    expect(container.querySelector('[aria-hidden]')).not.toBeNull()
  })
})
