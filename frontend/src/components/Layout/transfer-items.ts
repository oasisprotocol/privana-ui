import { ArrowDownLeft, ArrowUpRight } from 'lucide-react'
import { receivePath, transferPath } from '@/paths'

export const TRANSFER_ITEMS = [
  { to: transferPath(), label: 'Send', description: 'To another Privana account', Icon: ArrowUpRight },
  { to: receivePath(), label: 'Receive', description: 'From another Privana account', Icon: ArrowDownLeft },
]
