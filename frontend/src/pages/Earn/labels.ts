export const PROTOCOL_LABELS: Record<string, string> = {
  'aave-v3': 'AAVE',
  'midas-mtbill': 'Midas',
}

export const getProtocolLabel = (strategy: string) => PROTOCOL_LABELS[strategy] ?? strategy
