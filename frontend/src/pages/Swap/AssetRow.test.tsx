import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen } from '@testing-library/react'
import type { TokenInfo } from '@/api/swap'
import { AssetRow } from './AssetRow'

vi.mock('./TokenSelectDialog', () => ({ TokenSelectDialog: () => null }))

const USDC = { token_id: '0xusdc', token_symbol: 'USDC', token_decimals: 6 } as TokenInfo

const renderRow = (props: Partial<Parameters<typeof AssetRow>[0]> = {}) =>
  render(<AssetRow tokens={[USDC]} token={USDC} disabledId="" onTokenChange={vi.fn()} amount="" {...props} />)

describe('AssetRow', () => {
  it('normalizes what is typed or pasted before handing it on', () => {
    const onAmountChange = vi.fn()
    renderRow({ onAmountChange })
    const input = screen.getByRole('textbox')
    fireEvent.change(input, { target: { value: '1,234.50' } })
    expect(onAmountChange).toHaveBeenLastCalledWith('1234.50')
    fireEvent.change(input, { target: { value: '1,5' } })
    expect(onAmountChange).toHaveBeenLastCalledWith('1.5')
  })

  it('ignores a change that is not one number', () => {
    const onAmountChange = vi.fn()
    renderRow({ onAmountChange, amount: '1.5' })
    fireEvent.change(screen.getByRole('textbox'), { target: { value: '1.5.2' } })
    expect(onAmountChange).not.toHaveBeenCalled()
  })

  it('shows the amount error under the row', () => {
    renderRow({ amount: '1.1234567', amountError: 'Too many decimal places (max: 6)' })
    expect(screen.getByText('Too many decimal places (max: 6)')).toBeInTheDocument()
  })
})
