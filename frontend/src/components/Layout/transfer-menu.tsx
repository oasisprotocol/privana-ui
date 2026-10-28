import { ArrowDownLeft, ArrowUpRight, ChevronDown } from 'lucide-react'
import { Link, useLocation } from 'react-router'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { cn } from '@/lib/utils'
import { receivePath, transferPath } from '@/paths'

const ITEMS = [
  { to: transferPath(), label: 'Send', description: 'To another Privana account', Icon: ArrowUpRight },
  { to: receivePath(), label: 'Receive', description: 'From another Privana account', Icon: ArrowDownLeft },
]

export const TransferMenu = () => {
  const { pathname } = useLocation()
  const active = ITEMS.some(item => pathname.startsWith(item.to))

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className={cn(
          'group inline-flex cursor-pointer items-center gap-1.5 px-3.5 py-2 text-sm font-medium transition-colors data-[state=open]:text-foreground',
          active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
        )}
      >
        <span className={cn('underline-offset-[6px]', active && 'underline decoration-2')}>Transfer</span>
        <ChevronDown className="size-4 transition-transform group-data-[state=open]:rotate-180" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" sideOffset={8} className="w-72 rounded-2xl p-2">
        {ITEMS.map(({ to, label, description, Icon }) => (
          <DropdownMenuItem
            key={to}
            asChild
            className="cursor-pointer gap-3 rounded-xl px-3 py-2.5 focus:bg-muted"
          >
            <Link to={to} viewTransition>
              <Icon className="size-5" />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium leading-tight text-foreground">{label}</span>
                <span className="block truncate text-xs text-muted-foreground">{description}</span>
              </span>
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
