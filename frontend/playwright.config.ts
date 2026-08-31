import { defineConfig, devices } from '@playwright/test'

// Speed doctrine for this suite: it runs against a prebuilt production bundle
// (vite preview, not the dev server) with every backend request stubbed, so
// nothing here has an inherent reason to be slow. Timeouts are deliberately
// tight — in a fully stubbed app, anything not rendered within seconds IS the
// bug; raising a timeout is never the fix. Never wait for 'networkidle' (the
// app polls, the network never idles) and never use waitForTimeout.
export default defineConfig({
  testDir: 'e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? '100%' : undefined,
  reporter: process.env.CI ? [['list'], ['html', { open: 'never' }]] : 'list',
  timeout: 15_000,
  expect: { timeout: 5_000 },
  use: {
    baseURL: 'http://localhost:4173',
    actionTimeout: 5_000,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
    contextOptions: { reducedMotion: 'reduce' },
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
  webServer: {
    command: 'yarn build && yarn preview --port 4173 --strictPort',
    url: 'http://localhost:4173',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
})
