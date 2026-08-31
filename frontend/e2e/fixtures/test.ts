import { expect, test as base } from '@playwright/test'
import { unstubbedRequests } from './api'

// Base test for every spec: after each test, fail if any request reached a
// host without a stub. The catch-all in installApi aborts such requests, but
// an abort alone can be silently swallowed by the app — this makes it loud.
export const test = base.extend<{ _stubGuard: void }>({
  _stubGuard: [
    async ({ page }, use) => {
      await use()
      expect(unstubbedRequests(page), 'requests reached hosts without a stub').toEqual([])
    },
    { auto: true },
  ],
})

export { expect } from '@playwright/test'
