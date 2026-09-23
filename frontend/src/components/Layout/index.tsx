import { useState, type ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'
import { Link } from 'react-router'
import { useConnection } from 'wagmi'
import { useIsSignedIn } from '@/hooks/useIsSignedIn'
import { ConnectButton } from '../ConnectButton'
import Logo from '../../assets/logo.svg'
import { MenuItem } from './menu-item'
import { MobileBottomNav } from './MobileBottomNav'
import { Separator } from '../ui/separator'
import { earnPath, homePath, dashboardPath, tradePath } from '@/paths'

type FooterLink = { label: string; href: string }

const FOOTER_SECTIONS: { title: string; links: FooterLink[] }[] = [
  {
    title: 'Company',
    links: [
      { label: 'About Us', href: 'https://docs.privana.finance/architecture/about-us' },
      {
        label: 'Integration Partners',
        href: 'https://docs.privana.finance/architecture/integration-partners',
      },
    ],
  },
  {
    title: 'Learn',
    links: [
      { label: 'Getting Started', href: 'https://docs.privana.finance/getting-started' },
      { label: 'How It Works', href: 'https://docs.privana.finance/core-concepts' },
      { label: 'FAQ', href: 'https://docs.privana.finance/faq' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Community', href: 'https://oasis.io/discord' },
      { label: 'Report an Issue', href: 'https://github.com/oasisprotocol/privana/issues' },
    ],
  },
]

const LEGAL_LINKS: FooterLink[] = [
  { label: 'Privacy Policy', href: 'https://oasis.net/privacy-policy' },
  { label: 'Terms of Use', href: 'https://oasis.net/terms-of-use' },
]

const FooterAnchor = ({
  link,
  className,
  arrow = false,
}: {
  link: FooterLink
  className: string
  arrow?: boolean
}) => (
  <a href={link.href} target="_blank" rel="noopener noreferrer" className={className}>
    {link.label}
    {arrow && <ArrowUpRight className="size-3 opacity-60" aria-hidden />}
  </a>
)

interface LayoutProps {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  const { isConnected } = useConnection()
  const signedInNow = useIsSignedIn()
  const [everSignedIn, setEverSignedIn] = useState(false)
  if (signedInNow && !everSignedIn) setEverSignedIn(true)
  else if (!isConnected && everSignedIn) setEverSignedIn(false)
  const isSignedIn = signedInNow || (isConnected && everSignedIn)

  return (
    <div className="min-h-screen [background-image:var(--app-gradient)] text-foreground">
      <div className="flex min-h-dvh w-full flex-col pb-20 md:pb-0">
        <nav
          style={{ viewTransitionName: 'top-nav' }}
          className="relative md:sticky md:top-0 z-40 flex items-center justify-between px-6 py-3.5 backdrop-blur bg-[#fafafa]/85 dark:bg-background/85 border-b border-border/70 dark:border-[rgba(49,54,63,0.7)]"
        >
          <Link to={isSignedIn ? dashboardPath() : homePath()} viewTransition className="text-xl font-bold">
            <img src={Logo} alt="Privana" className="h-6 min-w-25 dark:brightness-0 dark:invert" />
          </Link>
          {isSignedIn && (
            <div className="hidden md:flex items-center gap-1">
              <MenuItem to={dashboardPath()} label="Portfolio" />
              <MenuItem to={earnPath()} label="Earn" />
              <MenuItem to={tradePath()} label="Swap" />
            </div>
          )}

          {isSignedIn && (
            <div className="flex items-center gap-4">
              <ConnectButton />
            </div>
          )}
        </nav>

        <div className="flex-1 px-6 py-12 md:px-8 md:py-10">
          <div className="mx-auto w-full max-w-5xl" style={{ viewTransitionName: 'page-content' }}>
            {children}
          </div>
        </div>
        <footer className="w-full max-w-7xl py-12 mx-auto flex flex-col justify-start items-center gap-12 md:gap-16 text-xs text-muted-foreground px-6 border-t border-border/70">
          <div className="flex flex-col md:flex-row gap-8 md:gap-6 items-start w-full">
            <div className="flex-1 flex flex-col gap-3">
              <img src={Logo} alt="Privana" className="h-6 self-start dark:brightness-0 dark:invert" />
              <p className="text-sm max-w-[26ch] ml-3">Your private corner of DeFi.</p>
            </div>
            {FOOTER_SECTIONS.map(section => (
              <div key={section.title} className="flex-1 flex flex-col gap-4 min-w-0">
                <p className="text-base font-medium text-foreground">{section.title}</p>
                <ul className="flex flex-col gap-3 text-sm text-muted-foreground">
                  {section.links.map(link => (
                    <li key={link.label}>
                      <FooterAnchor
                        link={link}
                        arrow
                        className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
                      />
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <Separator className="data-[orientation=horizontal]:h-[0.5px]" />
          <div className="self-stretch flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-2">
              <span>
                Copyright © <span className="md:hidden">OPF</span>
                <span className="hidden md:inline">Oasis Protocol Foundation</span> {new Date().getFullYear()}
              </span>
              <span className="hidden md:inline">·</span>
              <span>
                Price data by{' '}
                <a
                  href="https://www.coingecko.com/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-foreground hover:underline transition-colors"
                >
                  CoinGecko
                </a>
              </span>
            </div>
            <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-8">
              {LEGAL_LINKS.map(link => (
                <FooterAnchor
                  key={link.label}
                  link={link}
                  className="hover:text-foreground transition-colors"
                />
              ))}
            </div>
          </div>
        </footer>
      </div>

      {isSignedIn && <MobileBottomNav />}
    </div>
  )
}
