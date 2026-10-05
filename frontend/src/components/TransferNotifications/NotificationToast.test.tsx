import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NotificationToast } from './NotificationToast'

describe('NotificationToast', () => {
  it('links nowhere, whatever the outcome', () => {
    for (const tone of ['success', 'warning', 'failure'] as const) {
      const { unmount } = render(
        <NotificationToast tone={tone} title="Title" detail="Detail" onDismiss={vi.fn()} />,
      )
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      unmount()
    }
  })

  it('dismisses', async () => {
    const onDismiss = vi.fn()
    render(<NotificationToast tone="failure" title="Title" detail="Detail" onDismiss={onDismiss} />)
    await userEvent.click(screen.getByRole('button', { name: 'Dismiss' }))
    expect(onDismiss).toHaveBeenCalledTimes(1)
  })
})
