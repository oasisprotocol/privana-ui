export const STRATEGY_LABELS: Record<string, string> = {
  'aave-v3': 'Max Yield Strategy',
}

export const PROTOCOL_LABELS: Record<string, string> = {
  'aave-v3': 'AAVE',
}

export const formatApyBps = (bps: number): string => `${(bps / 100).toFixed(2)}%`
