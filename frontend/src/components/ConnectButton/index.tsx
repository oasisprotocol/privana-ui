import { type FC } from 'react'
import { useAccount, useChainId, useDisconnect, useSwitchChain } from 'wagmi'
import { ArrowDownToLine, ArrowUpFromLine, Copy, LogOut, Moon, Sun, Wallet } from 'lucide-react'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { AccountAvatar } from '../AccountAvatar'
import { trimLongString } from '../../utils/trimLongString'
import { wagmiConfig, type AppChainId } from '@/wagmi-config'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import { useTurnkeyWalletIntent } from '@/wallet/turnkeyIntent'
import { useConnectWallet } from '../WalletConnect/useConnectWallet'
import { ExportEmbeddedWallet } from './ExportEmbeddedWallet'
import { TurnkeyLogoutItem } from './TurnkeyLogoutItem'
import { WALLET_MENU_ROW } from './walletMenuRow'

const APP_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId
const SUPPORTED_CHAIN_IDS = wagmiConfig.chains.map(c => c.id)
const getEmbeddedWalletEmail = (): string | undefined => undefined

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
  const email = getEmbeddedWalletEmail()

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
          <button
            type="button"
            aria-label="Account menu"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted cursor-pointer"
          >
            <Wallet className="size-6" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-72 rounded-2xl p-3">
          <div className="rounded-xl bg-muted px-3 py-2.5">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Wallet</span>
            <div className="mt-1 flex items-center gap-2">
              <AccountAvatar address={address} diameter={24} />
              <span className="truncate font-mono text-base font-semibold text-foreground">
                {trimLongString(address)}
              </span>
              <button
                type="button"
                aria-label="Copy wallet address"
                onClick={() => void navigator.clipboard.writeText(address)}
                className="ml-auto inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-background hover:text-foreground"
              >
                <Copy className="h-3.5 w-3.5" />
              </button>
            </div>
            {isEmbeddedWallet && email && (
              <div className="mt-2 truncate border-t border-border/70 pt-2 text-xs text-muted-foreground">
                {email}
              </div>
            )}
          </div>

          {isEmbeddedWallet && (
            <div className="mt-1">
              <ExportEmbeddedWallet />
            </div>
          )}

          <div className="mt-2 grid grid-cols-2 gap-2">
            <Button className="gap-2">
              <ArrowDownToLine className="size-4" />
              Deposit
            </Button>
            <Button variant="outline" className="gap-2">
              <ArrowUpFromLine className="size-4" />
              Withdraw
            </Button>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2">
            <span className="text-sm font-medium text-foreground">Appearance</span>
            <div className="inline-flex items-center gap-0.5 text-xs font-medium">
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-1 text-foreground shadow-sm"
              >
                <Sun className="size-3.5" />
                Light
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-muted-foreground"
              >
                <Moon className="size-3.5" />
                Dark
              </button>
            </div>
          </div>

          <div className="mt-2">
            {isTurnkeyActive ? (
              <TurnkeyLogoutItem />
            ) : (
              <button type="button" className={WALLET_MENU_ROW} onClick={() => disconnect()}>
                <LogOut className="size-4" />
                Sign out
              </button>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
