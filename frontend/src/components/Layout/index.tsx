import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ConnectButton } from '../ConnectButton'
import Logo from '../../assets/logo.svg'
import DashboardBg from '../../assets/dashboard-bg.svg'
import { MenuItem } from './menu-item'
import { MobileBottomNav } from './MobileBottomNav'
import { Separator } from '../ui/separator'
import { activityPath, earnPath, homePath, dashboardPath, tradePath } from '@/paths'
import { useActivity } from '@/contexts/ActivityProvider/useActivity'

const FOOTER_SECTIONS = [
  { title: 'Company', links: ['About Us', 'Partners'] },
  { title: 'Resources', links: ['Guides', 'Tutorials', 'FAQ'] },
  { title: 'Account', links: ['Settings', 'Terms'] },
  {
    title: 'Help & Feedback',
    links: ['Get In Touch', 'Help Articles', 'Feedback Form'],
  },
]

interface LayoutProps {
  children: ReactNode
  dashboard?: boolean
}

export const Layout = ({ children, dashboard }: LayoutProps) => {
  const { pendingCount } = useActivity()
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className=" bg-no-repeat w-full pb-20 md:pb-0"
        style={{
          backgroundImage: `url(${dashboard ? DashboardBg : ''})`,
          backgroundPosition: 'top right',
        }}
      >
        <nav
          style={{ viewTransitionName: 'top-nav' }}
          className="flex items-center justify-between px-6 h-16 border-b border-border shadow-[0_1px_2px_0_rgba(0,0,0,0.05)] bg-background"
        >
          <Link to={homePath()} viewTransition className="text-xl font-bold">
            <img src={Logo} alt="Privana" className="h-5 min-w-25" />
          </Link>
          <div className="hidden md:flex items-center gap-1">
            <MenuItem to={dashboardPath()} label="Home" />
            <MenuItem to={earnPath()} label="Earn" />
            <MenuItem to={tradePath()} label="Swap" />
            <MenuItem to={activityPath()} label="Activity" badge={pendingCount} />
          </div>

          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </nav>

        {dashboard ? (
          <div className="w-full max-w-7xl mx-auto" style={{ viewTransitionName: 'page-content' }}>
            <div className="min-h-[500px] self-stretch px-8 md:px-24 py-8 md:py-16 gap-8 md:gap-16 flex flex-col border-r border-b border-l border-border bg-[linear-gradient(to_bottom,#F3F4F6_0px,#FFFFFF_460px)] dark:bg-none">
              {children}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-7xl px-6 py-12 mx-auto" style={{ viewTransitionName: 'page-content' }}>
            {children}
          </div>
        )}
        <footer className="w-full max-w-7xl py-12 mx-auto flex flex-col justify-start items-center gap-16 text-xs text-muted-foreground px-6">
          <div className="flex flex-col md:flex-row gap-8 md:gap-6 items-start w-full">
            <div className="flex-1">
              <img src={Logo} alt="Privana" className="h-5" />
            </div>
            {FOOTER_SECTIONS.map(section => (
              <div key={section.title} className="flex-1 flex flex-col gap-4 min-w-0">
                <p className="text-base font-medium text-foreground">{section.title}</p>
                <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                  {section.links.map(label => (
                    <li key={label}>
                      <a
                        href="#"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-foreground transition-colors"
                      >
                        {label}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Separator className="data-[orientation=horizontal]:h-[0.5px]" />
          <div className="self-stretch inline-flex justify-between items-center">
            <div className="justify-start">
              Copyright © <span className="md:hidden">OPF</span>
              <span className="hidden md:inline">Oasis Protocol Foundation</span> {new Date().getFullYear()}
            </div>
            <div className="flex items-center gap-4 md:gap-8">
              <span className="justify-start">Privacy Policy</span>
              <span className="justify-start">Terms of Service</span>
              <span className="justify-start">Cookies Settings</span>
            </div>
          </div>
        </footer>
      </div>

      <MobileBottomNav activityBadge={pendingCount} />
    </div>
  )
}
