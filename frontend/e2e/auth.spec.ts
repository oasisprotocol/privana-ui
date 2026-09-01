import { funded, installApi } from './fixtures/api'
import { expect, test } from './fixtures/test'
import { installWallet } from './fixtures/wallet'

test('signs in by connecting a wallet', async ({ page }) => {
  await installWallet(page, { signedIn: false })
  await installApi(page, funded())
  await page.goto('/')

  await expect(page.getByRole('button', { name: 'Sign in with your email' })).toBeVisible()
  await page.getByRole('button', { name: 'E2E Wallet' }).click()

  await expect(page).toHaveURL(/\/dashboard$/)
  await expect(page.getByText('$2,750.00').filter({ visible: true }).first()).toBeVisible()
})

test('signs out from the account menu', async ({ page }) => {
  await installWallet(page)
  await installApi(page, funded())
  await page.goto('/dashboard')
  await expect(page.getByText('$2,750.00').filter({ visible: true }).first()).toBeVisible()

  await page.getByRole('button', { name: 'Account menu' }).click()
  await page.getByRole('button', { name: 'Sign out' }).click()

  await expect(page).toHaveURL('/')
  await expect(page.getByRole('button', { name: 'Sign in with your email' })).toBeVisible()
  const staleKeys = await page.evaluate(() =>
    Object.keys(window.localStorage).filter(
      key => key.startsWith('privana:siwe-auth') || key === 'turnkey.connected-wallet',
    ),
  )
  expect(staleKeys).toEqual([])
})
