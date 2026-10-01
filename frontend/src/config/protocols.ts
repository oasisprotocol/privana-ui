export type Venue = { name: string; color: string }

const DEFAULT_COLOR = '#0F4C81'

const PROTOCOLS = [
  { prefix: 'aave', label: 'Aave', color: '#8777ff', slowAfterMs: 90_000 },
  {
    prefix: 'midas',
    label: 'Midas',
    color: '#2a3e6e',
    slowAfterMs: 8 * 60_000,
    depositNotice: 'Midas has no instant liquidity - withdrawing these funds can take up to 12 hours.',
    withdrawNotice:
      'Midas has no instant liquidity - these funds can take up to 12 hours to arrive in Available.',
  },
] as const

const DEFAULT_SLOW_AFTER_MS = 90_000

const protocolFor = (strategy: string) => {
  const key = strategy.toLowerCase()
  return PROTOCOLS.find(p => key.startsWith(p.prefix))
}

export const getProtocolLabel = (strategy: string): string => protocolFor(strategy)?.label ?? strategy

export const slowSettlementMsFor = (strategy: string): number =>
  protocolFor(strategy)?.slowAfterMs ?? DEFAULT_SLOW_AFTER_MS

export const depositNoticeFor = (strategy: string): string | undefined => {
  const protocol = protocolFor(strategy)
  return protocol && 'depositNotice' in protocol ? protocol.depositNotice : undefined
}

export const withdrawNoticeFor = (strategy: string): string | undefined => {
  const protocol = protocolFor(strategy)
  return protocol && 'withdrawNotice' in protocol ? protocol.withdrawNotice : undefined
}

export function venueForStrategy(strategy: string | null | undefined): Venue | null {
  if (!strategy) return null
  const protocol = protocolFor(strategy)
  if (protocol) return { name: protocol.label, color: protocol.color }
  return { name: strategy.charAt(0).toUpperCase() + strategy.slice(1), color: DEFAULT_COLOR }
}
