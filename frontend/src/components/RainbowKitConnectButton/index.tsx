import { useEffect, type FC } from 'react'
import { useLocation } from 'react-router'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'
import { useHostedRedirectAuth } from '@oasisprotocol/flexvaults-sdk'
import { ChevronDown } from 'lucide-react'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { AccountAvatar } from '../AccountAvatar'
import { trimLongString } from '../../utils/trimLongString'
import { sapphire, sapphireTestnet, baseSepolia } from 'viem/chains'

export const RainbowKitConnectButton: FC = () => {
  const { disconnect } = useDisconnect()
  const { address: walletAddress, isConnected, status } = useAccount()
  const { login, logout, isAuthenticated, isLoading: isAuthLoading, session } = useHostedRedirectAuth()
  const location = useLocation()

  useEffect(() => {
    // Auth callback owns its own session exchange
    if (location.pathname === '/auth/callback') return

    // Wagmi is rehydrating
    if (status === 'connecting' || status === 'reconnecting') return

    // Stale session
    if (!isConnected && isAuthenticated) {
      void logout()
      return
    }

    // Connected wallet and session address mismatch
    if (
      isConnected &&
      walletAddress &&
      session &&
      walletAddress.toLowerCase() !== session.address.toLowerCase()
    ) {
      void logout()
      return
    }

    // Wallet connected without a session
    if (isConnected && !isAuthenticated && !isAuthLoading) {
      void login()
    }
  }, [
    status,
    isConnected,
    walletAddress,
    session,
    isAuthenticated,
    isAuthLoading,
    login,
    logout,
    location.pathname,
  ])

  return (
    <ConnectButton.Custom>
      {({ account, chain, openAccountModal, openChainModal, openConnectModal, mounted }) => {
        const ready = mounted
        const connected = ready && account && chain
        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <Button onClick={openConnectModal} type="button">
                    Connect Wallet
                  </Button>
                )
              }
              if (
                chain.id !== sapphire.id &&
                chain.id !== sapphireTestnet.id &&
                chain.id !== baseSepolia.id
              ) {
                return (
                  <Button onClick={openChainModal} type="button">
                    Wrong network
                  </Button>
                )
              }

              return (
                <div className="flex gap-2 items-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <div className="flex h-10 items-center px-0.5 bg-white rounded-[14px] shadow-[0_4px_12px_0_rgba(0,0,0,0.1)] cursor-pointer">
                        <div className="flex h-9 items-center gap-2 p-2 rounded-[13px]">
                          <AccountAvatar address={account.address as `0x${string}`} />
                          <div className="hidden md:flex items-center gap-0.5">
                            <span className="text-[#25292e] text-base font-semibold leading-6">
                              {trimLongString(account.address)}
                            </span>
                            <ChevronDown size={24} className="text-[#25292e]" />
                          </div>
                        </div>
                      </div>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent>
                      <DropdownMenuItem onClick={openAccountModal}>View Account</DropdownMenuItem>
                      <DropdownMenuItem onClick={() => void navigator.clipboard.writeText(account.address)}>
                        Copy Address
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={openChainModal}>Switch network</DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => disconnect()}>Disconnect</DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            })()}
          </div>
        )
      }}
    </ConnectButton.Custom>
  )
}
