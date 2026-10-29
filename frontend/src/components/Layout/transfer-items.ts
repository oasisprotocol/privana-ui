import { ArrowDownLeft, ArrowDownToLine, ArrowUpFromLine, ArrowUpRight } from 'lucide-react'
import { depositPath, receivePath, transferPath, withdrawPath } from '@/paths'

export const TRANSFER_ITEMS = [
  { to: transferPath(), label: 'Send', description: 'To another Privana account', Icon: ArrowUpRight },
  { to: receivePath(), label: 'Receive', description: 'From another Privana account', Icon: ArrowDownLeft },
  { to: depositPath(), label: 'Deposit', description: 'Add funds from outside', Icon: ArrowDownToLine },
  { to: withdrawPath(), label: 'Withdraw', description: 'Move funds out of Privana', Icon: ArrowUpFromLine },
]
