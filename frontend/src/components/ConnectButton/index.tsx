import { useEffect, type FC } from 'react'
import { useLocation } from 'react-router'
import { useAccount, useChainId, useDisconnect, useSwitchChain } from 'wagmi'
import { useHostedRedirectAuth } from '@oasisprotocol/privana-sdk'
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
import { authCallbackPath } from '@/paths'
import { wagmiConfig, type AppChainId } from '@/wagmi-config'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import { useOpenWalletModal } from '../WalletConnect/useOpenWalletModal'
import { ExportWalletItem } from './ExportWalletItem'
import { TurnkeyLogoutItem } from './TurnkeyLogoutItem'

const APP_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId
const SUPPORTED_CHAIN_IDS = wagmiConfig.chains.map(c => c.id)

export const ConnectButton: FC = () => {
  const { address, isConnected, status, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()
  const openWalletModal = useOpenWalletModal()
  const { login, logout, isAuthenticated, isLoading: isAuthLoading, session } = useHostedRedirectAuth()
  const location = useLocation()

  // Keep the Privana hosted-auth session in step with the connected wallet.
  // Wallet-vendor agnostic — works the same for external wallets and the
  // Turnkey embedded wallet (both surface through wagmi).
  useEffect(() => {
    // Auth callback owns its own session exchange
    if (location.pathname === authCallbackPath()) return

    // Wagmi is rehydrating
    if (status === 'connecting' || status === 'reconnecting') return

    // Stale session
    if (!isConnected && isAuthenticated) {
      void logout()
      return
    }

    // Connected wallet and session address mismatch
    if (isConnected && address && session && address.toLowerCase() !== session.address.toLowerCase()) {
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
    address,
    session,
    isAuthenticated,
    isAuthLoading,
    login,
    logout,
    location.pathname,
  ])

  const isTurnkeyActive = connector?.id === TURNKEY_CONNECTOR_ID

  if (!isConnected || !address) {
    return (
      <Button type="button" onClick={openWalletModal}>
        Connect Wallet
      </Button>
    )
  }

  if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
    return (
      <Button type="button" onClick={() => switchChain({ chainId: APP_CHAIN_ID })}>
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
              <AccountAvatar address={address} />
              <div className="hidden md:flex items-center gap-0.5">
                <span className="text-[#25292e] text-base font-semibold leading-6">
                  {trimLongString(address)}
                </span>
                <ChevronDown size={24} className="text-[#25292e]" />
              </div>
            </div>
          </div>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem onClick={() => void navigator.clipboard.writeText(address)}>
            Copy Address
          </DropdownMenuItem>
          <DropdownMenuItem onClick={() => switchChain({ chainId: APP_CHAIN_ID })}>
            Switch network
          </DropdownMenuItem>
          {isTurnkeyActive && <ExportWalletItem />}
          <DropdownMenuSeparator />
          {isTurnkeyActive ? (
            <TurnkeyLogoutItem />
          ) : (
            <DropdownMenuItem onClick={() => disconnect()}>Disconnect</DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
