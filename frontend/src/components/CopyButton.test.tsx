import { describe, expect, it } from 'vitest'
import { act, render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CopyButton } from './CopyButton'

describe('CopyButton', () => {
  it('copies the value and confirms it for a moment', async () => {
    const user = userEvent.setup()
    render(<CopyButton value="op-123" label="Copy transaction ID" />)

    await user.click(screen.getByRole('button', { name: 'Copy transaction ID' }))
    expect(await navigator.clipboard.readText()).toBe('op-123')
    expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument()

    await act(() => new Promise(resolve => setTimeout(resolve, 1600)))
    expect(screen.getByRole('button', { name: 'Copy transaction ID' })).toBeInTheDocument()
  })
})
