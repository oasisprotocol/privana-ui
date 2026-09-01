import type { Page, Route } from '@playwright/test'
import type {
  BalanceResponse,
  BatchBalancesResponse,
  HistoryResponse,
  JwtLogoutResponse,
  LockedFundsResponse,
  PendingWithdrawalsResponse,
  SiweDomainResponse,
  SiweLoginResponse,
  SiweNonceResponse,
  TokenBalance,
  TokenInfoResponse,
  TokenListResponse,
} from '@oasisprotocol/privana-sdk'
import type {
  ApyHistoryResponse,
  DepositQuoteResponse,
  DepositResponse,
  EarnBalance,
  EarnBalanceListResponse,
  EarnPool,
  EarnPoolListResponse,
} from '../../src/api/earn'
import type { UnsettledOperationsResponse } from '../../src/api/operations'
import type { EarnHistoryResponse, PortfolioHistoryResponse } from '../../src/api/portfolio'
import type {
  ChainListResponse,
  TokenListResponse as ServicesTokenListResponse,
} from '../../src/api/swap/types'
import { ALLOWED_TOKEN_IDS, getGeckoId } from '../../src/config/tokens'
import { ACCOUNTING_API_URL, SERVICES_API_URL } from '../env'
import { e2eAddress } from './wallet'

// Real token ids from the app config, so the stubs exercise the same id
// wiring (gecko price lookup, enabled-token filtering) as production.
export const USDC_TOKEN_ID = ALLOWED_TOKEN_IDS.find(id => getGeckoId(id) === 'usd-coin')!
export const ETH_TOKEN_ID = ALLOWED_TOKEN_IDS.find(id => getGeckoId(id) === 'ethereum')!

const TOKEN_META: Record<string, { symbol: string; name: string; decimals: number; chainId: number }> = {
  [USDC_TOKEN_ID]: { symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 84532 },
  [ETH_TOKEN_ID]: { symbol: 'ETH', name: 'Ether', decimals: 18, chainId: 11155111 },
}
const metaOf = (tokenId: string) =>
  TOKEN_META[tokenId] ?? { symbol: 'USDC', name: 'USD Coin', decimals: 6, chainId: 84532 }

export const USDC_POOL: EarnPool = {
  pool_id: 'e2e-pool-usdc',
  token_id: USDC_TOKEN_ID,
  strategy: 'aave-v3',
  total_assets: '5000000000000',
  apy_bps: 1200,
  status: 'active',
  pool_address: '0x00000000000000000000000000000000000e2e01',
}

export interface StubState {
  balances: Partial<Record<string, string>>
  earnPositions: EarnBalance[]
  pools: EarnPool[]
  prices: Record<string, number>
}

const DEFAULT_PRICES = { 'usd-coin': 1, ethereum: 2500 }

export const emptyAccount = (): StubState => ({
  balances: {},
  earnPositions: [],
  pools: [USDC_POOL],
  prices: DEFAULT_PRICES,
})

export const funded = (): StubState => ({
  ...emptyAccount(),
  balances: { [USDC_TOKEN_ID]: '1500000000', [ETH_TOKEN_ID]: '500000000000000000' },
})

export const fundedWithEarn = (): StubState => ({
  ...funded(),
  earnPositions: [
    {
      pool_id: USDC_POOL.pool_id,
      token_id: USDC_TOKEN_ID,
      shares: '200000000',
      underlying_amount: '200500000',
      exchange_rate: '1.0025',
      change_24h: '100000',
      change_24h_pct: '0.000499',
      earned_active: '500000',
      earned_active_status: 'ok',
      cost_basis: '200000000',
      deposit_count: 1,
      first_deposit_at: 1756000000,
    },
  ],
})

const json = (route: Route, body: unknown) =>
  route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

/**
 * Stubs every backend the page talks to. Register BEFORE page.goto. Later
 * registrations win in Playwright, so the catch-all goes first: any request to
 * a host without an explicit stub is aborted and reported — a test must never
 * hang on (or silently depend on) an unstubbed backend.
 */
const unstubbedByPage = new WeakMap<Page, Set<string>>()

/** Unstubbed backend requests seen on this page — asserted empty after every test. */
export const unstubbedRequests = (page: Page): string[] => [...(unstubbedByPage.get(page) ?? [])]

export async function installApi(page: Page, state: StubState) {
  const unstubbed = new Set<string>()
  unstubbedByPage.set(page, unstubbed)
  await page.route('**/*', route => {
    const url = new URL(route.request().url())
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.fallback()
    const key = `${route.request().method()} ${url.origin}${url.pathname}`
    if (!unstubbed.has(key)) {
      unstubbed.add(key)
      console.warn(`[e2e] aborted unstubbed request: ${key}`)
    }
    return route.abort()
  })

  // --- Turnkey auth proxy ---
  // The wallet kit blocks on these two at boot; without them clientState never
  // reaches Ready and the connected-wallet restore path never runs. Only
  // `enabledProviders` is read unconditionally — the rest is optional.
  await page.route('https://authproxy.turnkey.com/v1/wallet_kit_config', route =>
    json(route, { enabledProviders: ['email'], oauthClientIds: {}, sessionExpirationSeconds: '900' }),
  )
  await page.route('https://authproxy.turnkey.com/v1/wallet_kit_client_params', route => json(route, {}))
  // Fired by the kit's WalletConnect bootstrap; irrelevant to the tests but
  // stubbed so the unstubbed-request warning stays meaningful.
  await page.route('https://verify.walletconnect.org/**', route => json(route, {}))
  // The sign-in form renders the WalletConnect option's icon from here.
  await page.route('https://raw.githubusercontent.com/WalletConnect/**', route =>
    route.fulfill({
      status: 200,
      contentType: 'image/svg+xml',
      body: '<svg xmlns="http://www.w3.org/2000/svg"/>',
    }),
  )

  // --- Accounting API ---

  const accountingTokens: TokenListResponse = {
    tokens: ALLOWED_TOKEN_IDS.map((id): TokenInfoResponse => {
      const meta = metaOf(id)
      return {
        token_id: id,
        token_type: 1,
        token_type_name: 'erc20',
        data: '0x',
        chain_id: meta.chainId,
        chain_name: meta.chainId === 84532 ? 'Base Sepolia' : 'Sepolia',
        token_address: '0x00000000000000000000000000000000000e2e02',
        symbol: meta.symbol,
        name: meta.name,
        decimals: meta.decimals,
      }
    }),
  }
  await page.route(`${ACCOUNTING_API_URL}/v1/accounting/tokens`, route => json(route, accountingTokens))

  await page.route(`${ACCOUNTING_API_URL}/v1/accounting/auth/domain`, route =>
    json(route, { domain: 'localhost' } satisfies SiweDomainResponse),
  )
  await page.route(`${ACCOUNTING_API_URL}/v1/accounting/auth/nonce**`, route =>
    json(route, {
      address: e2eAddress,
      nonce: 'e2enonce0000000000000000',
      expires_in: 300,
    } satisfies SiweNonceResponse),
  )
  await page.route(`${ACCOUNTING_API_URL}/v1/accounting/auth/login`, route =>
    json(route, {
      siwe_token: '0xe2e000000000000000000000000000000000000000000000000000000000000000',
      jwt_access_token: 'e2e-jwt-access',
      jwt_refresh_token: 'e2e-jwt-refresh',
      address: e2eAddress,
      jwt_expires_in: 86_400,
      jwt_refresh_expires_in: 604_800,
    } satisfies SiweLoginResponse),
  )
  await page.route(`${ACCOUNTING_API_URL}/v1/accounting/auth/jwt/logout`, route =>
    json(route, { message: 'ok', revoked_tokens: 1 } satisfies JwtLogoutResponse),
  )

  await page.route(`${ACCOUNTING_API_URL}/v1/accounting/balances/*`, route => {
    const tokenId = new URL(route.request().url()).pathname.split('/').pop()!
    return json(route, {
      user_address: e2eAddress,
      token_id: tokenId as `0x${string}`,
      balance: state.balances[tokenId] ?? '0',
      token_symbol: metaOf(tokenId).symbol,
      chain_id: String(metaOf(tokenId).chainId),
    } satisfies BalanceResponse)
  })

  const balances: TokenBalance[] = ALLOWED_TOKEN_IDS.map(id => ({
    token_id: id,
    balance: state.balances[id] ?? '0',
    token_symbol: metaOf(id).symbol,
    chain_id: String(metaOf(id).chainId),
  }))
  await page.route(`${ACCOUNTING_API_URL}/v1/accounting/balances/batch`, route =>
    json(route, { user_address: e2eAddress, balances } satisfies BatchBalancesResponse),
  )

  await page.route(`${ACCOUNTING_API_URL}/v1/accounting/funds/locked**`, route =>
    json(route, { user_address: e2eAddress, locks: [], total_locked: '0' } satisfies LockedFundsResponse),
  )
  await page.route(`${ACCOUNTING_API_URL}/v1/accounting/withdraw/pending/**`, route =>
    json(route, { user_address: e2eAddress, pending_withdrawals: [] } satisfies PendingWithdrawalsResponse),
  )
  await page.route(`${ACCOUNTING_API_URL}/v1/accounting/history**`, route =>
    json(route, { history: [], total: 0 } satisfies HistoryResponse),
  )

  // --- Services API ---

  const servicesTokens: ServicesTokenListResponse = {
    tokens: ALLOWED_TOKEN_IDS.map(id => {
      const meta = metaOf(id)
      return {
        token_id: id,
        token_type: 1,
        token_type_name: 'erc20',
        chain_id: meta.chainId,
        chain_name: meta.chainId === 84532 ? 'Base Sepolia' : 'Sepolia',
        token_address: '0x00000000000000000000000000000000000e2e02',
        token_symbol: meta.symbol,
        token_name: meta.name,
        token_decimals: meta.decimals,
      }
    }),
  }
  await page.route(`${SERVICES_API_URL}/v1/tokens`, route => json(route, servicesTokens))
  await page.route(`${SERVICES_API_URL}/v1/chains`, route =>
    json(route, {
      chains: [
        { chain_id: 84532, name: 'Base Sepolia' },
        { chain_id: 11155111, name: 'Sepolia' },
      ],
    } satisfies ChainListResponse),
  )

  await page.route(`${SERVICES_API_URL}/v1/earn/pools`, route =>
    json(route, { pools: state.pools } satisfies EarnPoolListResponse),
  )
  await page.route(`${SERVICES_API_URL}/v1/earn/quote**`, route => {
    const params = new URL(route.request().url()).searchParams
    return json(route, {
      quote_id: 'e2e-quote-1',
      pool_id: params.get('pool_id') ?? USDC_POOL.pool_id,
      token_id: USDC_TOKEN_ID,
      amount: params.get('amount') ?? '0',
      shares_estimate: params.get('amount') ?? '0',
      exchange_rate: '1.0',
      pool_address: USDC_POOL.pool_address,
      transfer_nonce: 7,
      expires_at: Math.floor(Date.now() / 1000) + 300,
    } satisfies DepositQuoteResponse)
  })
  await page.route(`${SERVICES_API_URL}/v1/earn/deposit`, route => {
    const body = route.request().postDataJSON() as { pool_id: string; amount: string }
    return json(route, {
      deposit_id: 'e2e-deposit-1',
      pool_id: body.pool_id,
      amount: body.amount,
      shares_minted: body.amount,
      exchange_rate: '1.0',
      tx_hash: null,
      status: 'completed',
      error: null,
    } satisfies DepositResponse)
  })
  await page.route(`${SERVICES_API_URL}/v1/earn/pools/*/apy-history**`, route =>
    json(route, { pool_id: USDC_POOL.pool_id, points: [] } satisfies ApyHistoryResponse),
  )
  await page.route(`${SERVICES_API_URL}/v1/earn/balance`, route =>
    json(route, { positions: state.earnPositions } satisfies EarnBalanceListResponse),
  )
  await page.route(`${SERVICES_API_URL}/v1/operations/unsettled**`, route =>
    json(route, { operations: [] } satisfies UnsettledOperationsResponse),
  )
  await page.route(`${SERVICES_API_URL}/v1/portfolio/history**`, route =>
    json(route, { points: [] } satisfies PortfolioHistoryResponse),
  )
  await page.route(`${SERVICES_API_URL}/v1/earn/history**`, route =>
    json(route, { points: [] } satisfies EarnHistoryResponse),
  )

  // --- CoinGecko ---

  await page.route('https://api.coingecko.com/api/v3/simple/price**', route =>
    json(route, Object.fromEntries(Object.entries(state.prices).map(([geckoId, usd]) => [geckoId, { usd }]))),
  )
}
