import { type FC } from 'react'
import { useAccount, useChainId, useDisconnect, useSwitchChain } from 'wagmi'
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
import { wagmiConfig, type AppChainId } from '@/wagmi-config'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import { useTurnkeyWalletIntent } from '@/wallet/turnkeyIntent'
import { useConnectWallet } from '../WalletConnect/useConnectWallet'
import { ExportWalletItem } from './ExportWalletItem'
import { TurnkeyLogoutItem } from './TurnkeyLogoutItem'

const APP_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId
const SUPPORTED_CHAIN_IDS = wagmiConfig.chains.map(c => c.id)

// Wallet UI only. The Privana session is driven by the SDK's SiweAuthProvider
// (useSiweAuth), which watches the wagmi connection and runs SIWE login/logout.
export const ConnectButton: FC = () => {
  const { address, isConnected, connector } = useAccount()
  const { disconnect } = useDisconnect()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()
  const connectWallet = useConnectWallet()

  const isTurnkeyActive = connector?.id === TURNKEY_CONNECTOR_ID
  const walletIntent = useTurnkeyWalletIntent()
  const isEmbeddedWallet = isTurnkeyActive && walletIntent === 'embedded'

  if (!isConnected || !address) {
    return (
      <Button type="button" onClick={connectWallet}>
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
          {isEmbeddedWallet && <ExportWalletItem />}
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
