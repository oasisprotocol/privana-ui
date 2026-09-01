import { funded, installApi } from './fixtures/api'
import { expect, test } from './fixtures/test'
import { installWallet } from './fixtures/wallet'

test('deposits into a venue through configure, review, and confirm', async ({ page }) => {
  await installWallet(page)
  await installApi(page, funded())
  await page.goto('/earn/create/e2e-pool-usdc')

  await expect(page.getByRole('heading', { name: 'Move to AAVE' })).toBeVisible()
  await expect(page.getByText('1,500.00 USDC')).toBeVisible()
  await page.getByRole('textbox', { name: 'Amount to deposit' }).fill('100')
  await expect(page.getByText('≈ $100.00')).toBeVisible()
  await page.getByRole('button', { name: 'Review' }).click()

  await expect(page.getByText('Review transaction')).toBeVisible()
  await expect(page.getByText('Available → AAVE')).toBeVisible()
  await page.getByRole('button', { name: 'Confirm' }).click()

  await expect(page.getByRole('heading', { name: 'Now earning' })).toBeVisible()
  await expect(page.getByText('100.00 USDC is now earning in AAVE.')).toBeVisible()

  await page.getByRole('button', { name: 'Back to dashboard' }).click()
  await expect(page).toHaveURL(/\/earn$/)
})

test('review is blocked when the amount exceeds the balance', async ({ page }) => {
  await installWallet(page)
  await installApi(page, funded())
  await page.goto('/earn/create/e2e-pool-usdc')

  await page.getByRole('textbox', { name: 'Amount to deposit' }).fill('2000')
  await expect(page.getByText('Exceeds balance')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Review' })).toBeDisabled()
})
