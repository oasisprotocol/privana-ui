import { appForAddress, PRIVANA_VENUE } from '@/config/apps'

export const CounterpartyBadge = ({ counterparty }: { counterparty?: string | null }) => {
  const venue = appForAddress(counterparty) ?? PRIVANA_VENUE
  return (
    <span
      className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
      style={{ background: venue.color }}
    >
      {venue.name}
    </span>
  )
}
