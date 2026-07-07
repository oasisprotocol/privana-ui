import { NavLink, type To } from 'react-router'
import { ArrowLeftRight, History, House, PiggyBank, type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { activityPath, dashboardPath, earnPath, tradePath } from '@/paths'

type NavItem = { label: string; to: To; icon: LucideIcon; badge?: number }

export const MobileBottomNav = ({ activityBadge }: { activityBadge?: number }) => {
  const items: NavItem[] = [
    { label: 'Portfolio', to: dashboardPath(), icon: House },
    { label: 'Earn', to: earnPath(), icon: PiggyBank },
    { label: 'Swap', to: tradePath(), icon: ArrowLeftRight },
    { label: 'Activity', to: activityPath(), icon: History, badge: activityBadge },
  ]

  return (
    <nav
      aria-label="Primary"
      style={{ viewTransitionName: 'bottom-nav' }}
      className="fixed inset-x-0 bottom-0 z-50 flex border-t border-border bg-background pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      {items.map(({ label, to, icon: Icon, badge }) => {
        const showBadge = badge != null && badge > 0
        return (
          <NavLink
            key={label}
            to={to}
            viewTransition
            className="flex flex-1 flex-col items-center gap-1 pt-2 pb-3"
          >
            {({ isActive }) => (
              <>
                <span className="relative">
                  <span
                    className={cn(
                      'flex h-8 w-12 items-center justify-center rounded-full transition-colors',
                      isActive && 'bg-primary/20',
                    )}
                  >
                    <Icon className={cn('size-5', isActive ? 'text-foreground' : 'text-muted-foreground')} />
                  </span>
                  {showBadge && (
                    <span className="absolute -top-0.5 right-2 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold leading-none text-primary-foreground">
                      {badge}
                    </span>
                  )}
                </span>
                <span
                  className={cn(
                    'text-[11px] font-medium leading-normal',
                    isActive ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {label}
                </span>
              </>
            )}
          </NavLink>
        )
      })}
    </nav>
  )
}
