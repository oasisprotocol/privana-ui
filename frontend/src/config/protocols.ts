export type Venue = { name: string; color: string }

const DEFAULT_COLOR = '#0F4C81'

const PROTOCOLS = [
  { prefix: 'aave', label: 'Aave', color: DEFAULT_COLOR },
  { prefix: 'midas', label: 'Midas', color: DEFAULT_COLOR },
] as const

const protocolFor = (strategy: string) => {
  const key = strategy.toLowerCase()
  return PROTOCOLS.find(p => key.startsWith(p.prefix))
}

export const getProtocolLabel = (strategy: string): string => protocolFor(strategy)?.label ?? strategy

export function venueForStrategy(strategy: string | null | undefined): Venue | null {
  if (!strategy) return null
  const protocol = protocolFor(strategy)
  if (protocol) return { name: protocol.label, color: protocol.color }
  return { name: strategy.charAt(0).toUpperCase() + strategy.slice(1), color: DEFAULT_COLOR }
}
