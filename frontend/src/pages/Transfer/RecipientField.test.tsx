import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecipientField } from './RecipientField'

const ALICE = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
const BOB = '0x2222222222222222222222222222222222222222'

const renderField = ({ value = '', recents = [ALICE, BOB], recentsLoading = false } = {}) => {
  const onChange = vi.fn()
  render(
    <RecipientField
      value={value}
      onChange={onChange}
      error={null}
      recents={recents}
      recentsLoading={recentsLoading}
    />,
  )
  return onChange
}

describe('RecipientField recents', () => {
  it('lists the full addresses', () => {
    renderField()
    expect(screen.getByText('Recents')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: ALICE })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: BOB })).toBeInTheDocument()
  })

  it('fills the input with the picked address', async () => {
    const onChange = renderField()
    await userEvent.click(screen.getByRole('button', { name: BOB }))
    expect(onChange).toHaveBeenCalledWith(BOB)
  })

  it('marks a typed address it has sent to before', () => {
    renderField({ value: ALICE.toLowerCase() })
    expect(screen.getByText('Recent recipient')).toBeInTheDocument()
  })

  it('keeps the label with placeholder rows while loading', () => {
    renderField({ recents: [], recentsLoading: true })
    expect(screen.getByText('Recents')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: ALICE })).not.toBeInTheDocument()
  })

  it('stays hidden without recents', () => {
    renderField({ value: ALICE, recents: [] })
    expect(screen.queryByText('Recents')).not.toBeInTheDocument()
    expect(screen.queryByText('Recent recipient')).not.toBeInTheDocument()
  })
})
