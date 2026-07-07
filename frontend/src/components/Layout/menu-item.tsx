import { NavLink, type To } from 'react-router'
import { cn } from '@/lib/utils'

interface MenuItemProps {
  label: string
  to: To
  badge?: number
}

export const MenuItem = ({ label, to, badge }: MenuItemProps) => {
  const showBadge = badge != null && badge > 0
  return (
    <NavLink
      to={to}
      viewTransition
      className={({ isActive }) =>
        cn(
          'inline-flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-full transition-colors duration-250',
          isActive
            ? 'bg-secondary text-foreground'
            : 'text-muted-foreground hover:bg-secondary/60 hover:text-foreground',
        )
      }
    >
      {label}
      {showBadge && (
        <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-primary text-primary-foreground text-xs font-semibold leading-none">
          {badge}
        </span>
      )}
    </NavLink>
  )
}
