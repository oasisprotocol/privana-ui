import { emptyAccount, funded, fundedWithEarn, installApi } from './fixtures/api'
import { expect, test } from './fixtures/test'
import { installWallet } from './fixtures/wallet'

test('lists venues from the pools API and routes into the deposit flow', async ({ page }) => {
  await installWallet(page)
  await installApi(page, funded())
  await page.goto('/earn')

  await expect(page.getByText('AAVE').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('12.00% APY').filter({ visible: true }).first()).toBeVisible()

  await page.getByRole('link', { name: 'Start earning' }).click()
  await expect(page).toHaveURL(/\/earn\/create\/e2e-pool-usdc$/)
})

test('active position shows earning figures and the 24h yield badge', async ({ page }) => {
  await installWallet(page)
  await installApi(page, fundedWithEarn())
  await page.goto('/earn')

  await expect(page.getByText('$200.50').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('+$0.10 (+0.05%) 24h')).toBeVisible()
  await expect(page.getByText('+0.5USDC')).toBeVisible()

  await expect(page.getByText('200.50 USDC', { exact: true }).filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('(+0.07 USDC today)').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Add funds' })).toBeVisible()
  await expect(page.getByRole('link', { name: 'Remove funds' })).toBeVisible()
})

test('start earning without a balance opens the deposit modal', async ({ page }) => {
  await installWallet(page)
  await installApi(page, emptyAccount())
  await page.goto('/earn')

  await page.getByRole('button', { name: 'Start earning' }).click()
  await expect(page.getByRole('heading', { name: 'Choose the deposit method' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Connected wallet' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'External Wallet' })).toBeVisible()
})

test('unverifiable earned figure shows a dash, not zero', async ({ page }) => {
  const state = fundedWithEarn()
  state.earnPositions[0] = {
    ...state.earnPositions[0],
    earned_active: null,
    earned_active_status: 'ledger_incomplete',
  }
  await installWallet(page)
  await installApi(page, state)
  await page.goto('/earn')

  const earnedRow = page.getByText('Earned', { exact: true }).locator('..')
  await expect(earnedRow).toContainText('—')
  await expect(earnedRow).not.toContainText('0')
})
