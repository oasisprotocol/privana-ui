import { NavLink } from 'react-router'
import { ArrowLeftRight, PiggyBank, type LucideIcon } from 'lucide-react'
import { earnPath, tradePath } from '@/paths'

type NavItem = { label: string; to: string; icon: LucideIcon }

const items: NavItem[] = [
  { label: 'Earn', to: earnPath(), icon: PiggyBank },
  { label: 'Swap', to: tradePath(), icon: ArrowLeftRight },
]

export const MobileBottomNav = () => {
  return (
    <nav
      aria-label="Primary"
      style={{ viewTransitionName: 'bottom-nav' }}
      className="pointer-events-none fixed inset-x-0 bottom-6 z-30 flex justify-center px-4 md:hidden"
    >
      <div className="pointer-events-auto flex items-center gap-2 rounded-full bg-neutral-900 p-2 shadow-[0_10px_30px_-8px_rgba(0,0,0,0.45)]">
        {items.map(({ label, to, icon: Icon }) => (
          <NavLink
            key={label}
            to={to}
            viewTransition
            className="flex items-center gap-2 rounded-full bg-neutral-800 px-8 py-4 text-sm font-medium text-white transition-colors hover:bg-neutral-700 active:scale-95"
          >
            <Icon className="h-4 w-4" />
            {label}
          </NavLink>
        ))}
      </div>
    </nav>
  )
}
