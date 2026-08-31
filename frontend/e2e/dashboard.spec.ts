import { emptyAccount, funded, fundedWithEarn, installApi } from './fixtures/api'
import { expect, test } from './fixtures/test'
import { installWallet } from './fixtures/wallet'

test.beforeEach(async ({ page }) => {
  await installWallet(page)
})

test('empty account shows the onboarding card', async ({ page }) => {
  await installApi(page, emptyAccount())
  await page.goto('/dashboard')

  await expect(page.getByText('Add funds to get started')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Deposit crypto' })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Buy with card' })).toBeVisible()
  await expect(page.getByText('$0.00').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('Put your deposit to work')).toHaveCount(0)
})

test('funded account shows the account value and vault breakdown', async ({ page }) => {
  await installApi(page, funded())
  await page.goto('/dashboard')

  await expect(page.getByText('$2,750.00').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('Privana vault').first()).toBeVisible()
  await expect(page.getByText('Available').first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Deposit', exact: true }).first()).toBeVisible()
  await expect(page.getByRole('button', { name: 'Withdraw', exact: true }).first()).toBeVisible()
  await expect(page.getByText('Add funds to get started')).toHaveCount(0)
  await expect(page.getByText('Put your deposit to work')).toBeVisible()
})

test('account with an active earn position shows the earning bucket', async ({ page }) => {
  await installApi(page, fundedWithEarn())
  await page.goto('/dashboard')

  await expect(page.getByText('$2,950.50').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('Earning').filter({ visible: true }).first()).toBeVisible()
  await expect(page.getByText('$200.50').filter({ visible: true }).first()).toBeVisible()
})
