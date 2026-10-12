import { ExternalLink } from 'lucide-react'
import { getExplorerLabel, usePrivanaContext, type DepositProgress } from '@oasisprotocol/privana-sdk'
import { formatDateTime } from '@/lib/dates'
import { activityIcon } from './activityVisuals'
import { AmountValue, DetailsCard, DetailsHero, DetailsRow, HeroAmount, IdValue } from './DetailsParts'
import { moveCopy } from './labels'

/** A deposit on its way: what the SDK's deposit flow knows before history lists it. */
export const PendingDepositDetails = ({ progress }: { progress: DepositProgress }) => {
  const { getTokenById, getChainById } = usePrivanaContext()
  const token = progress.tokenId ? getTokenById(progress.tokenId) : undefined
  const chain = getChainById(progress.chainId)
  const amount = progress.amount.toString()

  return (
    <>
      <DetailsHero
        Icon={activityIcon('deposit')}
        status="in-progress"
        amount={token ? <HeroAmount amount={amount} token={token} /> : null}
        statusLine={
          progress.stage === 'confirming'
            ? 'Step 1/2 · Confirming your deposit on-chain'
            : 'Step 2/2 · Adding your deposit to Available'
        }
      />
      <DetailsCard>
        {token && (
          <DetailsRow label="Amount">
            <AmountValue amount={amount} token={token} chain={chain?.name} />
          </DetailsRow>
        )}
        <DetailsRow label="Type">{moveCopy('deposit', 'completed').title}</DetailsRow>
        <DetailsRow label="Sent">{formatDateTime(Math.floor(progress.sentAt / 1000))}</DetailsRow>
        <DetailsRow label="Transaction hash">
          <span className="flex items-center">
            <IdValue value={progress.txHash} copyLabel="Copy transaction hash" />
            {chain && (
              <a
                href={`${chain.explorerUrl}/tx/${progress.txHash}`}
                target="_blank"
                rel="noreferrer"
                aria-label={getExplorerLabel(chain.id)}
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            )}
          </span>
        </DetailsRow>
        {progress.depositId && (
          <DetailsRow label="Deposit ID">
            <IdValue value={progress.depositId} copyLabel="Copy deposit ID" />
          </DetailsRow>
        )}
      </DetailsCard>
    </>
  )
}
