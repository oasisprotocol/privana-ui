import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { RainbowKitConnectButton } from '../RainbowKitConnectButton'
import Logo from '../../assets/logo.svg'
import DashboardBg from '../../assets/dashboard-bg.svg'
import { MenuItem } from './menu-item'
import { Separator } from '../ui/separator'

interface LayoutProps {
  children: ReactNode
  dashboard?: boolean
}

export const Layout = ({ children, dashboard }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div
        className=" bg-no-repeat w-full"
        style={{
          backgroundImage: `url(${dashboard ? DashboardBg : ''})`,
          backgroundPosition: 'top right',
        }}
      >
        <nav className="flex items-center justify-between px-6 h-16 border-b border-border shadow-[0_10px_15px_-3px_rgba(0,0,0,0.20),0_4px_6px_-2px_rgba(0,0,0,0.20)] bg-background">
          <Link to="/" viewTransition className="text-xl font-bold">
            <img src={Logo} alt="FlexVaults" className="h-8" />
          </Link>
          <div className="flex items-center gap-1">
            <MenuItem to="/portfolio" label="Portfolio" />
            <MenuItem to="/copy-trading" label="Copy trading" />
            <MenuItem to="/swap" label="Trading" />
          </div>

          <div className="flex items-center gap-4">
            <RainbowKitConnectButton />
          </div>
        </nav>

        {dashboard ? (
          <div className="w-full max-w-7xl mx-auto" style={{ viewTransitionName: 'page-content' }}>
            <div className="min-h-[500px] self-stretch px-8 md:px-24 py-8 md:py-16 gap-12 md:gap-16 flex flex-col border-r border-b border-l border-white/10 bg-linear-to-b from-[#18181B] to-[#09090B]">
              {children}
            </div>
          </div>
        ) : (
          <div className="w-full max-w-7xl px-6 py-12 mx-auto" style={{ viewTransitionName: 'page-content' }}>
            {children}
          </div>
        )}
        <div className="w-full max-w-7xl py-12 mx-auto flex flex-col justify-start items-center gap-16 text-xs text-muted-foreground ">
          <Separator />
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
        </div>
      </div>
    </div>
  )
}
