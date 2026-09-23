export type Venue = { name: string; color: string }

const DEFAULT_COLOR = '#0F4C81'

const PROTOCOLS = [
  { prefix: 'aave', label: 'Aave', color: '#8777ff', slowAfterMs: 90_000 },
  { prefix: 'midas', label: 'Midas', color: '#2a3e6e', slowAfterMs: 8 * 60_000 },
] as const

const DEFAULT_SLOW_AFTER_MS = 90_000

const protocolFor = (strategy: string) => {
  const key = strategy.toLowerCase()
  return PROTOCOLS.find(p => key.startsWith(p.prefix))
}

export const getProtocolLabel = (strategy: string): string => protocolFor(strategy)?.label ?? strategy

export const slowSettlementMsFor = (strategy: string): number =>
  protocolFor(strategy)?.slowAfterMs ?? DEFAULT_SLOW_AFTER_MS

export function venueForStrategy(strategy: string | null | undefined): Venue | null {
  if (!strategy) return null
  const protocol = protocolFor(strategy)
  if (protocol) return { name: protocol.label, color: protocol.color }
  return { name: strategy.charAt(0).toUpperCase() + strategy.slice(1), color: DEFAULT_COLOR }
}
