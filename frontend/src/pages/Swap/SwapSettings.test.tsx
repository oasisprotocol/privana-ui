import { useState } from 'react'
import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { TooltipProvider } from '@/components/ui/tooltip'
import { SwapSettings } from './SwapSettings'

const Harness = ({ initial, onChange }: { initial: string; onChange: (value: string) => void }) => {
  const [slippage, setSlippage] = useState(initial)
  return (
    <TooltipProvider>
      <SwapSettings
        slippage={slippage}
        onSlippageChange={value => {
          setSlippage(value)
          onChange(value)
        }}
      />
    </TooltipProvider>
  )
}

const renderSettings = (initial = '') => {
  const onChange = vi.fn()
  render(<Harness initial={initial} onChange={onChange} />)
  return onChange
}

const settingsButton = () => screen.getByRole('button', { name: 'Swap settings' })

describe('SwapSettings', () => {
  it('shows a custom slippage on the button', () => {
    renderSettings('1.5')
    expect(settingsButton()).toHaveTextContent('1.5%')
  })

  it('shows no percentage for Auto', () => {
    renderSettings()
    expect(settingsButton()).not.toHaveTextContent('%')
  })

  it('goes back to Auto', async () => {
    const onChange = renderSettings('2')
    await userEvent.click(settingsButton())
    await userEvent.click(screen.getByRole('button', { name: 'Auto' }))
    expect(onChange).toHaveBeenLastCalledWith('')
    expect(settingsButton()).not.toHaveTextContent('%')
  })

  it('takes a decimal comma and at most two decimals', async () => {
    renderSettings()
    await userEvent.click(settingsButton())
    const input = screen.getByRole('textbox', { name: 'Max slippage in percent' })
    await userEvent.type(input, '0,125')
    expect(input).toHaveValue('0.12')
  })

  it('drops a value left out of range when it closes', async () => {
    const onChange = renderSettings('10')
    await userEvent.click(settingsButton())
    expect(screen.getByText('Enter a value from 0.05% to 5%')).toBeInTheDocument()
    await userEvent.keyboard('{Escape}')
    expect(onChange).toHaveBeenLastCalledWith('')
  })
})
