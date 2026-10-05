import { useState } from 'react'
import { appForAddress } from '@/config/apps'
import { venueForStrategy } from '@/config/protocols'
import { PROTOCOL_ICONS } from '@/pages/Earn/ProtocolLabel'

const LOGO_SIZE = 14

const LetterMark = ({ name, color }: { name: string; color: string }) => (
  <span
    aria-hidden="true"
    className="flex size-3.5 shrink-0 items-center justify-center rounded-[4px] text-[8px] font-bold text-white"
    style={{ background: color }}
  >
    {name.charAt(0)}
  </span>
)

const AppLogo = ({ name, color, src }: { name: string; color: string; src: string }) => {
  const [failed, setFailed] = useState(false)
  if (failed) return <LetterMark name={name} color={color} />
  return (
    <img
      src={src}
      alt=""
      width={LOGO_SIZE}
      height={LOGO_SIZE}
      className="size-3.5 shrink-0 rounded-lg object-cover"
      onError={() => setFailed(true)}
    />
  )
}

export const VenueBadge = ({
  strategy,
  counterparty,
}: {
  strategy?: string | null
  counterparty?: string | null
}) => {
  const venue = venueForStrategy(strategy)
  const app = venue ? null : appForAddress(counterparty)
  const badge = venue ?? app
  if (!badge) return null

  const ProtocolLogo = strategy ? PROTOCOL_ICONS[strategy] : undefined

  return (
    <span className="flex shrink-0 items-center gap-1.5">
      {ProtocolLogo ? (
        <ProtocolLogo size={LOGO_SIZE} />
      ) : app ? (
        <AppLogo name={app.name} color={app.color} src={app.logoUrl} />
      ) : (
        <LetterMark name={badge.name} color={badge.color} />
      )}
      <span className="text-xs font-medium leading-tight text-foreground">{badge.name}</span>
    </span>
  )
}
