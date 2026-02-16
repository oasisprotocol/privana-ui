import { NavLink, type To } from 'react-router'
import { cn } from '@/lib/utils'

interface MenuItemProps {
  label: string
  to: To
}

export const MenuItem = ({ label, to }: MenuItemProps) => {
  return (
    <NavLink
      to={to}
      viewTransition
      className={({ isActive }) =>
        cn(
          'text-sm px-3 py-2.5 rounded-md hover:bg-accent/30 transition-colors duration-250',
          isActive ? 'text-primary' : 'text-muted-foreground',
        )
      }
    >
      {label}
    </NavLink>
  )
}
