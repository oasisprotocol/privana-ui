import { useEffect, useRef, type FC } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { useAccount, useDisconnect } from 'wagmi'
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
  const { isConnected } = useAccount()
  const navigate = useNavigate()
  const location = useLocation()
  const wasConnected = useRef(isConnected)

  useEffect(() => {
    if (!wasConnected.current && isConnected && location.pathname === '/') {
      navigate('/portfolio')
    }
    wasConnected.current = isConnected
  }, [isConnected, navigate, location.pathname])

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
                      <div className="flex items-center gap-2 p-1 pr-3 rounded-full bg-black/8 border border-black/15 hover:bg-black/15 transition-colors cursor-pointer">
                        <AccountAvatar address={account.address as `0x${string}`} />
                        <div className="hidden md:flex items-center gap-2">
                          <span className="text-white text-sm font-normal">
                            {trimLongString(account.address)}
                          </span>
                          <ChevronDown size={16} className="text-white" />
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
