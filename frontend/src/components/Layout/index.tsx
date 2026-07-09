import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { useAccount } from 'wagmi'
import { ConnectButton } from '../ConnectButton'
import Logo from '../../assets/logo.svg'
import { MenuItem } from './menu-item'
import { MobileBottomNav } from './MobileBottomNav'
import { Separator } from '../ui/separator'
import { earnPath, homePath, dashboardPath, tradePath } from '@/paths'

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
}

export const Layout = ({ children }: LayoutProps) => {
  const { address, isConnected } = useAccount()
  const isWalletConnected = isConnected && !!address

  return (
    <div className="min-h-screen [background-image:var(--app-gradient)] text-foreground">
      <div className="w-full pb-20 md:pb-0">
        <nav
          style={{ viewTransitionName: 'top-nav' }}
          className="relative md:sticky md:top-0 z-40 flex items-center justify-between px-6 py-3.5 backdrop-blur bg-[#fafafa]/85 dark:bg-background/85 border-b border-border/70 dark:border-[rgba(49,54,63,0.7)]"
        >
          <Link
            to={isWalletConnected ? dashboardPath() : homePath()}
            viewTransition
            className="text-xl font-bold"
          >
            <img src={Logo} alt="Privana" className="h-6 min-w-25 dark:brightness-0 dark:invert" />
          </Link>
          {isWalletConnected && (
            <div className="hidden md:flex items-center gap-1">
              <MenuItem to={dashboardPath()} label="Portfolio" />
              <MenuItem to={earnPath()} label="Earn" />
              <MenuItem to={tradePath()} label="Swap" />
            </div>
          )}

          <div className="flex items-center gap-4">
            <ConnectButton />
          </div>
        </nav>

        <div
          className="w-full max-w-6xl px-6 py-12 mx-auto md:px-8 md:py-10"
          style={{ viewTransitionName: 'page-content' }}
        >
          {children}
        </div>
        <footer className="w-full max-w-7xl py-12 mx-auto flex flex-col justify-start items-center gap-16 text-xs text-muted-foreground px-6 border-t border-border/70">
          <div className="flex flex-col md:flex-row gap-8 md:gap-6 items-start w-full">
            <div className="flex-1">
              <img src={Logo} alt="Privana" className="h-6 dark:brightness-0 dark:invert" />
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

      {isWalletConnected && <MobileBottomNav />}
    </div>
  )
}
