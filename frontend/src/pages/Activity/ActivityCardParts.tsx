import { ArrowRight, type LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { getTokenIcon } from '@oasisprotocol/privana-sdk'
import { cn } from '@/lib/utils'
import { TokenAmount } from '@/components/TokenAmount'
import type { ActivityStatus, ActivityTokenInfo } from '@/contexts/ActivityProvider/context'
import { describeFailure } from './failureCopy'

export const ActivityIcon = ({ Icon, status }: { Icon: LucideIcon; status?: ActivityStatus }) => (
  <span className="flex w-4 shrink-0 items-center justify-center">
    {status === 'in-progress' ? (
      <span
        role="img"
        aria-label="In progress"
        className="size-2 rounded-full bg-primary motion-safe:animate-blink"
      />
    ) : status === 'failed' ? (
      <span role="img" aria-label="Failed" className="size-2 rounded-full bg-destructive" />
    ) : (
      <Icon aria-hidden="true" className="size-4 text-foreground" />
    )}
  </span>
)

export const ActivityCard = ({ children, divider }: { children: ReactNode; divider?: boolean }) => (
  <div
    className={cn(
      'flex min-h-[58px] flex-col justify-center px-4 py-2.5 transition-colors hover:bg-secondary/40',
      divider && 'border-t border-border',
    )}
  >
    {children}
  </div>
)

export const ActivityRowBody = ({
  icon,
  title,
  amount,
  subtitle,
  failure,
  aside,
}: {
  icon: ReactNode
  title: string
  amount?: ReactNode
  subtitle?: ReactNode
  failure?: string
  /** Right side of the second line: the venue, or what a swap received. */
  aside?: ReactNode
}) => (
  <>
    <div className="flex items-center justify-between gap-3">
      <span className="flex min-w-0 items-center gap-1.5">
        {icon}
        <span className="truncate text-sm font-semibold leading-tight text-foreground">{title}</span>
      </span>
      {amount != null && <span className="shrink-0">{amount}</span>}
    </div>
    {(subtitle != null || failure || aside != null) && (
      <div className="mt-0.5 flex items-center justify-between gap-3">
        {subtitle != null || failure ? (
          <p
            title={failure}
            className={cn(
              'min-w-0 text-xs',
              failure ? 'break-all text-destructive' : 'truncate text-muted-foreground',
            )}
          >
            {failure ? describeFailure(failure) : subtitle}
          </p>
        ) : (
          <span />
        )}
        {aside}
      </div>
    )}
  </>
)

export const ActivityAmount = ({
  token,
  amount,
  chain,
}: {
  token: ActivityTokenInfo
  amount: string
  /** Tells apart tokens sharing a symbol, like USDC on Base and on HyperEVM. */
  chain?: string
}) => (
  <span className="inline-flex items-center gap-1.5 whitespace-nowrap text-sm font-semibold leading-none tabular-nums text-foreground">
    <span className="inline-flex size-3 shrink-0 overflow-hidden rounded-full">
      {getTokenIcon(token.symbol, 12)}
    </span>
    <TokenAmount amount={amount} token={token} withSymbol />
    {chain && <span className="text-xs font-normal text-muted-foreground">{chain}</span>}
  </span>
)

export const SwapAmounts = ({
  from,
  fromAmount,
  fromChain,
  to,
  toAmount,
  toChain,
}: {
  from: ActivityTokenInfo
  fromAmount: string
  fromChain?: string
  to: ActivityTokenInfo
  toAmount: string
  toChain?: string
}) => (
  <span className="flex items-center gap-1.5">
    <ActivityAmount token={from} amount={fromAmount} chain={fromChain} />
    <ArrowRight aria-hidden="true" className="size-3.5 shrink-0 text-muted-foreground" />
    <span className="sr-only">for</span>
    <ActivityAmount token={to} amount={toAmount} chain={toChain} />
  </span>
)
