import { appForAddress, PRIVANA_VENUE, type Venue } from '@/config/apps'

export const CounterpartyBadge = ({
  counterparty,
  venue,
}: {
  counterparty?: string | null
  venue?: Venue | null
}) => {
  const resolved = venue ?? appForAddress(counterparty) ?? PRIVANA_VENUE
  return (
    <span
      className="shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold text-white"
      style={{ background: resolved.color }}
    >
      {resolved.name}
    </span>
  )
}
