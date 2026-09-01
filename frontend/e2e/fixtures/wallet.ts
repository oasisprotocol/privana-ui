import type { Page } from '@playwright/test'
import { privateKeyToAccount } from 'viem/accounts'
import { ACCOUNTING_API_URL, CHAIN_ID } from '../env'

const E2E_PRIVATE_KEY = '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80'

export const e2eAccount = privateKeyToAccount(E2E_PRIVATE_KEY)
export const e2eAddress = e2eAccount.address

// Stable identity for the injected wallet. ConnectWalletProvider persists this
// as the connected-wallet providerKey (rdns wins), and its restore-on-reload
// path looks the provider up by the same key in Turnkey's EIP-6963 discovery.
const E2E_WALLET_RDNS = 'finance.privana.e2e'

const E2E_WALLET_ICON =
  'data:image/svg+xml;base64,' +
  Buffer.from(
    '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32"><rect width="32" height="32" rx="8" fill="#fcd34d"/></svg>',
  ).toString('base64')

declare global {
  interface Window {
    __e2eSignMessage: (message: `0x${string}`) => Promise<`0x${string}`>
    __e2eSignTypedData: (payload: string) => Promise<`0x${string}`>
  }
}

export interface InstallWalletOptions {
  /**
   * Seed localStorage so the app restores the wallet + SIWE session on load
   * and the test starts signed in (the default). Pass false for tests that
   * drive the sign-in UI itself.
   */
  signedIn?: boolean
}

/**
 * Injects a fake EIP-1193 wallet announced via EIP-6963 before any app code
 * runs. Turnkey's wallet kit discovers it like any browser extension; the
 * connected-wallet restore path then bridges it into wagmi (TurnkeySync), and
 * the seeded SIWE record signs the session in without touching the UI.
 */
export async function installWallet(page: Page, { signedIn = true }: InstallWalletOptions = {}) {
  // Signing runs in Node (viem), reached from the page shim via this binding —
  // keeps the private key and crypto out of serialized page code.
  await page.exposeFunction('__e2eSignMessage', (message: `0x${string}`) =>
    e2eAccount.signMessage({ message: { raw: message } }),
  )
  await page.exposeFunction('__e2eSignTypedData', (payload: string) =>
    e2eAccount.signTypedData(JSON.parse(payload) as Parameters<typeof e2eAccount.signTypedData>[0]),
  )

  const seed: Record<string, string> = {}
  if (signedIn) {
    seed['turnkey.connected-wallet'] = JSON.stringify({
      providerKey: E2E_WALLET_RDNS,
      address: e2eAddress,
    })
    const now = Date.now()
    const day = 24 * 60 * 60 * 1000
    const siweKey = ['privana', 'siwe-auth', ACCOUNTING_API_URL.replace(/\/$/, ''), String(CHAIN_ID)].join(
      ':',
    )
    // PersistedSiweAuthRecord v2 (sdk/auth/siwe-persistence.ts). Token values are
    // opaque to the client; far-future expiries keep the refresh path dormant.
    seed[siweKey] = JSON.stringify({
      version: 2,
      tokens: {
        siwe_token: 'e2e-siwe-token',
        jwt_access_token: 'e2e-jwt-access',
        jwt_refresh_token: 'e2e-jwt-refresh',
        address: e2eAddress,
      },
      accessTokenExpiresAt: now + day,
      refreshTokenExpiresAt: now + 7 * day,
      siweTokenExpiresAt: now + day,
      updatedAt: now,
    })
  }

  await page.addInitScript(
    ({ address, chainIdHex, rdns, icon, seedEntries }) => {
      let chainId = chainIdHex
      const listeners = new Map<string, Set<(...args: unknown[]) => void>>()
      const emit = (event: string, ...args: unknown[]) => listeners.get(event)?.forEach(l => l(...args))

      const provider = {
        request: async ({ method, params }: { method: string; params?: unknown[] }): Promise<unknown> => {
          switch (method) {
            case 'eth_accounts':
            case 'eth_requestAccounts':
              return [address]
            case 'eth_chainId':
              return chainId
            case 'personal_sign':
              // params: [hex-encoded message, address]
              return window.__e2eSignMessage(params![0] as `0x${string}`)
            case 'eth_signTypedData_v4':
              return window.__e2eSignTypedData(params![1] as string)
            case 'wallet_switchEthereumChain':
              chainId = (params![0] as { chainId: string }).chainId
              emit('chainChanged', chainId)
              return null
            default:
              throw new Error(`E2E wallet: unhandled request ${method}`)
          }
        },
        on: (event: string, listener: (...args: unknown[]) => void) => {
          if (!listeners.has(event)) listeners.set(event, new Set())
          listeners.get(event)!.add(listener)
          return provider
        },
        removeListener: (event: string, listener: (...args: unknown[]) => void) => {
          listeners.get(event)?.delete(listener)
          return provider
        },
      }

      const detail = Object.freeze({
        info: Object.freeze({
          uuid: 'e2e00000-0000-4000-8000-000000000001',
          name: 'E2E Wallet',
          icon,
          rdns,
        }),
        provider,
      })
      const announce = () => window.dispatchEvent(new CustomEvent('eip6963:announceProvider', { detail }))
      window.addEventListener('eip6963:requestProvider', announce)
      announce()

      for (const [key, value] of Object.entries(seedEntries)) {
        window.localStorage.setItem(key, value)
      }
    },
    {
      address: e2eAddress,
      chainIdHex: `0x${CHAIN_ID.toString(16)}`,
      rdns: E2E_WALLET_RDNS,
      icon: E2E_WALLET_ICON,
      seedEntries: seed,
    },
  )
}
