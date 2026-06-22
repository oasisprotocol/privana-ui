import { KNOWN_APPS } from '@/config/apps'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'
import type { MergedRow } from '@/hooks/use-merged-activity'

export const PRIVANA_APP_ID = 'privana'

const knownAppIdByAddress = new Map<string, string>(
  KNOWN_APPS.map(app => [app.serviceAddress.toLowerCase(), app.id]),
)

function appIdForAddress(address: string | null | undefined): string | null {
  if (!address) return null
  return knownAppIdByAddress.get(address.toLowerCase()) ?? null
}

export type FilterType =
  | 'all'
  | 'swap'
  | 'deposit'
  | 'withdraw'
  | 'earnDeposit'
  | 'earnWithdraw'
  | 'lock'
  | 'reclaim'
  | 'transfer'

export type FilterTimePreset = 'all' | 'today' | 'last7d' | 'lastMonth'

export type ActivityFilters = {
  app: 'all' | string
  type: FilterType
  status: 'all' | ActivityStatus
  asset: 'all' | string
  time: FilterTimePreset
  search: string
}

export const DEFAULT_FILTERS: ActivityFilters = {
  app: 'all',
  type: 'all',
  status: 'all',
  asset: 'all',
  time: 'all',
  search: '',
}

export function filterTypeOf(r: MergedRow): FilterType {
  if (r.source === 'local') {
    if (r.activity.type === 'swap') return 'swap'
    return r.activity.direction === 'deposit' ? 'earnDeposit' : 'earnWithdraw'
  }
  if (r.row.kind === 'unknown') return 'transfer'
  // Modify/release rows are filtered alongside plain locks.
  if (r.row.kind === 'lockModified' || r.row.kind === 'lockReleased') return 'lock'
  return r.row.kind
}

export function appOf(r: MergedRow): string {
  if (r.source === 'local') return PRIVANA_APP_ID
  switch (r.row.kind) {
    case 'swap':
    case 'earnDeposit':
    case 'deposit':
    case 'withdraw':
      return PRIVANA_APP_ID
    default:
      return appIdForAddress(r.row.counterparty) ?? r.row.counterparty?.toLowerCase() ?? PRIVANA_APP_ID
  }
}

export function statusOf(r: MergedRow): ActivityStatus {
  return r.source === 'local' ? r.activity.status : 'completed'
}

export type ResolveSymbol = (tokenId: string | null | undefined) => string | undefined

export function assetsOf(r: MergedRow): string[] {
  if (r.source === 'local') {
    if (r.activity.type === 'swap') {
      return [r.activity.fromToken.id, r.activity.toToken.id]
    }
    return [r.activity.token.id]
  }
  return r.row.tokenId ? [r.row.tokenId] : []
}

export function timeBoundsFor(preset: FilterTimePreset, now: number = Date.now()): [number, number] {
  const nowSec = Math.floor(now / 1000)
  const dayStart = Math.floor(new Date(now).setHours(0, 0, 0, 0) / 1000)
  switch (preset) {
    case 'today':
      return [dayStart, nowSec]
    case 'last7d':
      return [nowSec - 7 * 86400, nowSec]
    case 'lastMonth':
      return [nowSec - 30 * 86400, nowSec]
    case 'all':
    default:
      return [0, Number.POSITIVE_INFINITY]
  }
}

export function searchableTextOf(r: MergedRow, resolveSymbol?: ResolveSymbol): string {
  const parts: string[] = []
  if (r.source === 'local') {
    if (r.activity.type === 'swap') {
      parts.push(r.activity.fromToken.symbol, r.activity.toToken.symbol)
      if (r.activity.swapId) parts.push(r.activity.swapId)
      if (r.activity.txHash) parts.push(r.activity.txHash)
    } else {
      parts.push(r.activity.token.symbol, r.activity.protocol)
      if (r.activity.poolId) parts.push(r.activity.poolId)
      if (r.activity.txHash) parts.push(r.activity.txHash)
    }
  } else {
    if (r.row.counterparty) parts.push(r.row.counterparty)
    if (r.row.pool) parts.push(r.row.pool.strategy, r.row.pool.pool_id)
    if (resolveSymbol) {
      const symbol = resolveSymbol(r.row.tokenId)
      if (symbol) parts.push(symbol)
    }
  }
  return parts.join(' ').toLowerCase()
}

export function applyFilters(
  rows: MergedRow[],
  filters: ActivityFilters,
  options: { now?: number; resolveSymbol?: ResolveSymbol } = {},
): MergedRow[] {
  const now = options.now ?? Date.now()
  const resolveSymbol = options.resolveSymbol ?? (() => undefined)
  const [tFrom, tTo] = timeBoundsFor(filters.time, now)
  const search = filters.search.trim().toLowerCase()
  const wantedAsset = filters.asset === 'all' ? null : filters.asset
  return rows.filter(r => {
    if (filters.type !== 'all' && filterTypeOf(r) !== filters.type) return false
    if (filters.status !== 'all' && statusOf(r) !== filters.status) return false
    if (filters.app !== 'all' && appOf(r) !== filters.app) return false
    if (wantedAsset && !assetsOf(r).includes(wantedAsset)) return false
    if (r.timestamp < tFrom || r.timestamp > tTo) return false
    if (search && !searchableTextOf(r, resolveSymbol).includes(search)) return false
    return true
  })
}
