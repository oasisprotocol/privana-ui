import { funded, installApi } from './fixtures/api'
import { SERVICES_API_URL } from './env'
import { expect, test } from './fixtures/test'
import { installWallet } from './fixtures/wallet'

const serverError = { status: 500, contentType: 'application/json', body: '{}' }

test('price feed failure degrades fiat values to dashes', async ({ page }) => {
  await installWallet(page)
  await installApi(page, funded())
  await page.route('https://api.coingecko.com/api/v3/simple/price**', route => route.fulfill(serverError))
  await page.goto('/dashboard')

  const accountValue = page.getByText('Account value').filter({ visible: true }).first().locator('..')
  await expect(accountValue).toContainText('-')
  await expect(page.getByText('$2,750.00')).toHaveCount(0)
})

test('pools API failure shows the earn error banner', async ({ page }) => {
  await installWallet(page)
  await installApi(page, funded())
  await page.route(`${SERVICES_API_URL}/v1/earn/pools`, route => route.fulfill(serverError))
  await page.goto('/earn')

  await expect(page.getByText('Unable to load earn pools')).toBeVisible({ timeout: 10_000 })
})
