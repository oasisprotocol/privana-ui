import { getProtocolIcon, getProtocolLabel } from '@/config/protocols'

export const ProtocolIcon = ({ strategy, size }: { strategy: string; size?: number }) =>
  getProtocolIcon(strategy, size)

export const ProtocolLabel = ({ strategy, iconSize }: { strategy: string; iconSize?: number }) => (
  <span className="inline-flex items-center gap-1.5">
    <ProtocolIcon strategy={strategy} size={iconSize} />
    {getProtocolLabel(strategy)}
  </span>
)
