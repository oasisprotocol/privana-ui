import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { RainbowKitConnectButton } from '../RainbowKitConnectButton'
import Logo from '../../assets/logo.svg'
import { MenuItem } from './menu-item'
import { Separator } from '../ui/separator'

interface LayoutProps {
  children: ReactNode
}

export const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-6 h-16 border-b border-border">
        <Link to="/" className="text-xl font-bold">
          <img src={Logo} alt="FlexVaults" className="h-8" />
        </Link>

        <div className="flex items-center gap-1">
          <MenuItem to="/portfolio" label="Portfolio" />
          <MenuItem to="/copy-trading" label="Copy trading" />
        </div>

        <div className="flex items-center gap-4">
          <RainbowKitConnectButton />
        </div>
      </nav>

      <div className="w-full max-w-7xl px-6 py-12 mx-auto">{children}</div>

      <div className="w-full max-w-7xl px-6 py-12 mx-auto flex flex-col justify-start items-center gap-16 text-xs text-muted-foreground">
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
  )
}
