import { useCallback, useMemo } from 'react'
import { useSearchParams } from 'react-router'
import type { ActivityStatus } from '@/contexts/ActivityProvider/context'
import { DEFAULT_FILTERS, type ActivityFilters, type FilterTimePreset, type FilterType } from './filters'

const FILTER_TYPE_FLAGS: Record<FilterType, true> = {
  all: true,
  swap: true,
  deposit: true,
  withdraw: true,
  earnDeposit: true,
  earnWithdraw: true,
  lock: true,
  reclaim: true,
  transfer: true,
}
const STATUS_FLAGS: Record<'all' | ActivityStatus, true> = {
  all: true,
  completed: true,
  'in-progress': true,
  failed: true,
}
const TIME_FLAGS: Record<FilterTimePreset, true> = {
  all: true,
  today: true,
  last7d: true,
  lastMonth: true,
}

const isFilterType = (v: string | null): v is FilterType => v != null && v in FILTER_TYPE_FLAGS
const isStatus = (v: string | null): v is 'all' | ActivityStatus => v != null && v in STATUS_FLAGS
const isTimePreset = (v: string | null): v is FilterTimePreset => v != null && v in TIME_FLAGS

function fromParams(params: URLSearchParams): ActivityFilters {
  const type = params.get('type')
  const status = params.get('status')
  const time = params.get('time')
  return {
    app: params.get('app') ?? DEFAULT_FILTERS.app,
    type: isFilterType(type) ? type : DEFAULT_FILTERS.type,
    status: isStatus(status) ? status : DEFAULT_FILTERS.status,
    asset: params.get('asset') ?? DEFAULT_FILTERS.asset,
    time: isTimePreset(time) ? time : DEFAULT_FILTERS.time,
    search: params.get('q') ?? DEFAULT_FILTERS.search,
  }
}

function toParams(filters: ActivityFilters, current: URLSearchParams): URLSearchParams {
  const next = new URLSearchParams(current)
  const writeOrClear = (key: string, value: string, defaultValue: string) => {
    if (value === defaultValue) next.delete(key)
    else next.set(key, value)
  }
  writeOrClear('app', filters.app, DEFAULT_FILTERS.app)
  writeOrClear('type', filters.type, DEFAULT_FILTERS.type)
  writeOrClear('status', filters.status, DEFAULT_FILTERS.status)
  writeOrClear('asset', filters.asset, DEFAULT_FILTERS.asset)
  writeOrClear('time', filters.time, DEFAULT_FILTERS.time)
  const trimmed = filters.search.trim()
  if (trimmed.length === 0) next.delete('q')
  else next.set('q', trimmed)
  return next
}

export function useActivityFilters(): [ActivityFilters, (next: ActivityFilters) => void] {
  const [params, setParams] = useSearchParams()
  const filters = useMemo(() => fromParams(params), [params])
  const setFilters = useCallback(
    (next: ActivityFilters) => setParams(prev => toParams(next, prev), { replace: true }),
    [setParams],
  )
  return [filters, setFilters]
}
