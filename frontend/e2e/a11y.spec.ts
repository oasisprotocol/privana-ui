import AxeBuilder from '@axe-core/playwright'
import { emptyAccount, funded, fundedWithEarn, installApi } from './fixtures/api'
import { expect, test } from './fixtures/test'
import { installWallet } from './fixtures/wallet'
import type { Page } from '@playwright/test'

const scan = (page: Page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa']).analyze()

const summarize = (results: Awaited<ReturnType<AxeBuilder['analyze']>>) =>
  results.violations.map(v => ({
    id: v.id,
    impact: v.impact,
    help: v.help,
    targets: v.nodes.map(n => n.target.join(' ')),
  }))

test('sign-in page has no WCAG violations', async ({ page }) => {
  await installWallet(page, { signedIn: false })
  await installApi(page, emptyAccount())
  await page.goto('/')
  await expect(page.getByRole('button', { name: 'E2E Wallet' })).toBeVisible()

  expect(summarize(await scan(page))).toEqual([])
})

test('dashboard has no WCAG violations', async ({ page }) => {
  await installWallet(page)
  await installApi(page, fundedWithEarn())
  await page.goto('/dashboard')
  await expect(page.getByText('$2,950.50').filter({ visible: true }).first()).toBeVisible()

  expect(summarize(await scan(page))).toEqual([])
})

test('earn page has no WCAG violations', async ({ page }) => {
  await installWallet(page)
  await installApi(page, fundedWithEarn())
  await page.goto('/earn')
  await expect(page.getByText('$200.50').filter({ visible: true }).first()).toBeVisible()

  expect(summarize(await scan(page))).toEqual([])
})

test('deposit configure step has no WCAG violations', async ({ page }) => {
  await installWallet(page)
  await installApi(page, funded())
  await page.goto('/earn/create/e2e-pool-usdc')
  await expect(page.getByText('1,500.00 USDC')).toBeVisible()

  expect(summarize(await scan(page))).toEqual([])
})
