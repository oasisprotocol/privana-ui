import { funded, installApi, USDC_TOKEN_ID } from './fixtures/api'
import { expect, test } from './fixtures/test'
import { installWallet } from './fixtures/wallet'
import { SERVICES_API_URL } from './env'

const deposit = async (page: import('@playwright/test').Page) => {
  await page.goto('/earn/create/e2e-pool-usdc')
  await page.getByRole('textbox', { name: 'Amount to deposit' }).fill('100')
  await page.getByRole('button', { name: 'Review' }).click()
  await page.getByRole('button', { name: 'Confirm' }).click()
}

test('a dropped connection leaves the deposit in progress, it does not report a failure', async ({
  page,
}) => {
  await installWallet(page)
  await installApi(page, funded())
  // The gateway hangs up on a slow deposit while the backend keeps settling it.
  await page.route(`${SERVICES_API_URL}/v1/earn/deposit`, route => route.abort('connectionreset'))

  await deposit(page)

  await expect(page.getByRole('heading', { name: 'Moving to Earn…' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Deposit failed' })).toBeHidden()
})

test('a deposit whose response was lost still resolves once the server settles it', async ({ page }) => {
  await installWallet(page)
  await installApi(page, funded())
  await page.route(`${SERVICES_API_URL}/v1/earn/deposit`, route => route.abort('connectionreset'))

  // The backend records the operation, works it, and drops it from the feed
  // once it settles. Leaving the feed is what proves it completed.
  let listed = true
  await page.route(`${SERVICES_API_URL}/v1/operations/unsettled**`, route =>
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        operations: listed
          ? [
              {
                operation_id: 'srv-deposit-1',
                operation_type: 'earn_deposit',
                status: 'pending',
                created_at: Math.floor(Date.now() / 1000),
                updated_at: Math.floor(Date.now() / 1000),
                tx_hash: null,
                error: null,
                quote_id: null,
                from_token_id: null,
                to_token_id: null,
                from_amount: null,
                to_amount_estimate: null,
                to_amount_actual: null,
                pool_id: 'e2e-pool-usdc',
                token_id: USDC_TOKEN_ID,
                amount: '100000000',
              },
            ]
          : [],
      }),
    }),
  )

  await deposit(page)
  await expect(page.getByRole('heading', { name: 'Moving to Earn…' })).toBeVisible()

  listed = false
  await expect(page.getByRole('heading', { name: 'Now earning' })).toBeVisible({ timeout: 20_000 })
})

test('a rejected deposit does report a failure', async ({ page }) => {
  await installWallet(page)
  await installApi(page, funded())
  // A 4xx is the backend saying it refused the request outright.
  await page.route(`${SERVICES_API_URL}/v1/earn/deposit`, route =>
    route.fulfill({
      status: 400,
      contentType: 'application/json',
      body: JSON.stringify({ detail: 'Pool valuation could not be confirmed' }),
    }),
  )

  await deposit(page)

  await expect(page.getByRole('heading', { name: 'Deposit failed' })).toBeVisible()
  await expect(page.getByText('Pool valuation could not be confirmed')).toBeVisible()
})

test('a settled deposit refreshes the position instead of serving the cached one', async ({ page }) => {
  await installWallet(page)
  const state = funded()
  await installApi(page, state)

  let balanceCalls = 0
  await page.route(`${SERVICES_API_URL}/v1/earn/balance`, route => {
    balanceCalls += 1
    return route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({ positions: state.earnPositions }),
    })
  })

  await page.goto('/earn')
  await expect.poll(() => balanceCalls).toBeGreaterThan(0)
  const before = balanceCalls

  await deposit(page)
  await expect(page.getByRole('heading', { name: 'Now earning' })).toBeVisible()
  await page.getByRole('button', { name: 'Back to dashboard' }).click()

  // The balance is cached for 30s. Without invalidating it on settlement the
  // dashboard serves the pre-deposit position straight from cache and never
  // refetches, which is what made the screen show a stale figure.
  await expect.poll(() => balanceCalls, { timeout: 10_000 }).toBeGreaterThan(before)
})
