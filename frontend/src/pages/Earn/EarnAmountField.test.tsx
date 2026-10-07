import { describe, expect, it, vi } from 'vitest'
import { useState } from 'react'
import { fireEvent, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { TokenInfo } from '@/api/swap'
import { EarnAmountField } from './EarnAmountField'

vi.mock('@/hooks/useAmountFiat', () => ({ useAmountFiat: () => undefined }))

const USDC = { token_id: '0xusdc', token_symbol: 'USDC', token_decimals: 6 } as TokenInfo

// Holds the amount like the deposit and withdraw screens do.
const Field = ({
  initial = '',
  onChange = vi.fn(),
}: {
  initial?: string
  onChange?: (v: string) => void
}) => {
  const [amount, setAmount] = useState(initial)
  return (
    <EarnAmountField
      amount={amount}
      onAmountChange={v => {
        onChange(v)
        setAmount(v)
      }}
      token={USDC}
      maxWei={1_234_500_000n}
      sublabel="Available"
      ariaLabel="Amount"
    />
  )
}

describe('EarnAmountField', () => {
  it('takes a pasted displayed balance as one plain number', () => {
    render(<Field />)
    fireEvent.change(screen.getByRole('textbox', { name: 'Amount' }), { target: { value: '1,234.50' } })
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('1234.50')
  })

  it('reads a typed decimal comma as the decimal point and ignores letters', async () => {
    render(<Field />)
    await userEvent.type(screen.getByRole('textbox', { name: 'Amount' }), '1,5a')
    expect(screen.getByRole('textbox', { name: 'Amount' })).toHaveValue('1.5')
  })

  it('says when the amount has more decimals than the token', () => {
    render(<Field initial="1.1234567" />)
    expect(screen.getByText('Too many decimal places (max: 6)')).toBeInTheDocument()
  })

  it('fills the exact maximum from the 100% chip', async () => {
    const onChange = vi.fn()
    render(<Field onChange={onChange} />)
    await userEvent.click(screen.getByRole('button', { name: '100%' }))
    expect(onChange).toHaveBeenLastCalledWith('1234.5')
  })
})
