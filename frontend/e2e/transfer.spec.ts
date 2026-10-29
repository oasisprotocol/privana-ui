import type { HistoryEntry } from '@oasisprotocol/privana-sdk'
import { funded, installApi, USDC_POOL, USDC_TOKEN_ID } from './fixtures/api'
import { expect, test } from './fixtures/test'
import { installWallet } from './fixtures/wallet'

const ALICE = '0x71C7656EC7ab88b098defB751B7401B5f6d8976F'
const BOB = '0x2222222222222222222222222222222222222222'

const transfer = (kind: HistoryEntry['kind'], counterparty: string, timestamp: number): HistoryEntry => ({
  kind,
  timestamp,
  token_id: USDC_TOKEN_ID,
  amount: '1000000',
  counterparty: counterparty as `0x${string}`,
})

test.beforeEach(async ({ page }) => {
  await installWallet(page)
})

test('recents list sent-to addresses and fill the recipient', async ({ page }) => {
  await installApi(page, {
    ...funded(),
    history: [
      transfer('transferBalanceOut', ALICE.toLowerCase(), 1_788_000_000),
      transfer('transferBalanceIn', BOB, 1_788_000_100),
      transfer('transferBalanceOut', USDC_POOL.pool_address, 1_788_000_200),
    ],
  })
  await page.goto('/transfer')

  await expect(page.getByText('Recents')).toBeVisible()
  await expect(page.getByRole('button', { name: ALICE })).toBeVisible()
  await expect(page.getByRole('button', { name: BOB })).toHaveCount(0)
  await expect(page.getByRole('button', { name: USDC_POOL.pool_address })).toHaveCount(0)

  await page.getByRole('button', { name: ALICE }).click()
  await expect(page.getByRole('textbox', { name: 'Recipient address' })).toHaveValue(ALICE)
  await expect(page.getByText('Recent recipient')).toBeVisible()
})

test('recents stay hidden without sent transfers', async ({ page }) => {
  await installApi(page, funded())
  await page.goto('/transfer')

  await expect(page.getByRole('textbox', { name: 'Recipient address' })).toBeVisible()
  await expect(page.getByText('Recents')).toHaveCount(0)
})
