import { usePrivanaContext } from '@oasisprotocol/privana-sdk'
import { appNameForAddress } from '@/config/apps'
import { formatDateTime } from '@/lib/dates'
import { activityIcon } from './activityVisuals'
import { AmountValue, DetailsCard, DetailsHero, DetailsRow, HeroAmount, IdValue } from './DetailsParts'
import { progressLine } from './details'
import type { DisplayEntry } from './historyMapping'
import { historyRowCopy } from './labels'

const CounterpartyRow = ({ row }: { row: DisplayEntry }) => {
  const address = row.counterparty
  if (!address) return null
  switch (row.kind) {
    case 'withdraw':
      return (
        <DetailsRow label="To">
          <IdValue value={address} copyLabel="Copy address" />
        </DetailsRow>
      )
    case 'transfer':
      return (
        <DetailsRow label={row.entry.kind === 'transferBalanceIn' ? 'From' : 'To'}>
          <IdValue value={address} copyLabel="Copy address" />
        </DetailsRow>
      )
    case 'lock':
    case 'lockModified':
    case 'lockReleased':
      return (
        <DetailsRow label="App">
          {appNameForAddress(address) ?? <IdValue value={address} copyLabel="Copy app address" />}
        </DetailsRow>
      )
    default:
      return null
  }
}

export const HistoryDetails = ({ row, pending }: { row: DisplayEntry; pending?: boolean }) => {
  const { getTokenById, getChainById } = usePrivanaContext()
  const token = row.tokenId ? getTokenById(row.tokenId) : undefined
  const chain = token ? getChainById(token.chainId)?.name : undefined
  const status = pending ? 'in-progress' : 'completed'
  const depositId = row.entry.deposit_id

  return (
    <>
      <DetailsHero
        Icon={activityIcon(row.kind, row.entry.kind === 'transferBalanceIn')}
        status={status}
        amount={token && row.amount ? <HeroAmount amount={row.amount} token={token} /> : null}
        statusLine={pending ? progressLine(historyRowCopy(row, status).subtitle) : undefined}
      />
      <DetailsCard>
        {token && row.amount && (
          <DetailsRow label="Amount">
            <AmountValue amount={row.amount} token={token} chain={chain} />
          </DetailsRow>
        )}
        <DetailsRow label="Type">{historyRowCopy(row, 'completed').title}</DetailsRow>
        <DetailsRow label="Date">{formatDateTime(row.timestamp)}</DetailsRow>
        <CounterpartyRow row={row} />
        {depositId && (
          <DetailsRow label="Deposit ID">
            <IdValue value={depositId} copyLabel="Copy deposit ID" />
          </DetailsRow>
        )}
      </DetailsCard>
    </>
  )
}
