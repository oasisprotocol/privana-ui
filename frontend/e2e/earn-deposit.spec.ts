import { funded, installApi, USDC_POOL } from './fixtures/api'
import { expect, test } from './fixtures/test'
import { installWallet } from './fixtures/wallet'

test('deposits into a venue through configure, review, and confirm', async ({ page }) => {
  await installWallet(page)
  await installApi(page, funded())
  await page.goto('/earn/create/e2e-pool-usdc')

  await expect(page.getByRole('heading', { name: 'Add to AAVE' })).toBeVisible()
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

test('a Midas deposit needs its liquidity notice accepted, remembered for that venue only', async ({
  page,
}) => {
  const state = funded()
  state.pools = [USDC_POOL, { ...USDC_POOL, pool_id: 'e2e-pool-midas', strategy: 'midas-mtbill' }]
  await installWallet(page)
  await installApi(page, state)
  await page.goto('/earn/create')

  await page.getByRole('textbox', { name: 'Amount to deposit' }).fill('100')
  const review = page.getByRole('button', { name: 'Review' })
  await expect(review).toBeEnabled()

  await page.getByRole('button', { name: /Midas/ }).click()
  const notice = page.getByRole('checkbox', { name: /no instant liquidity/ })
  await expect(review).toBeDisabled()
  await notice.check()
  await expect(review).toBeEnabled()

  await page.getByRole('button', { name: /Aave/ }).click()
  await expect(page.getByRole('checkbox')).toHaveCount(0)
  await expect(review).toBeEnabled()
  await page.getByRole('button', { name: /Midas/ }).click()
  await expect(notice).toBeChecked()
})
