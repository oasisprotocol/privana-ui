import { type FC, useState } from 'react'
import { useAccount, useChainId, useSwitchChain } from 'wagmi'
import { Link } from 'react-router'
import {
  ArrowDownToLine,
  ArrowUpFromLine,
  Check,
  ChevronDown,
  ChevronRight,
  Copy,
  Globe,
  History,
  LogOut,
  Moon,
  Sun,
  Wallet,
} from 'lucide-react'
import { DepositModal, WithdrawModal } from '@oasisprotocol/privana-sdk'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { AccountAvatar } from '../AccountAvatar'
import { trimLongString } from '../../utils/trimLongString'
import { wagmiConfig, type AppChainId } from '@/wagmi-config'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import { useTurnkeyWalletIntent } from '@/wallet/turnkeyIntent'
import { usePendingActivityCount } from '@/hooks/use-merged-activity'
import { useSignOut } from '@/hooks/useSignOut'
import { activityPath } from '@/paths'
import { cn } from '@/lib/utils'
import { setThemePreference, useResolvedTheme } from '@/lib/theme'
import { ExportEmbeddedWallet } from './ExportEmbeddedWallet'
import { TurnkeyLogoutItem } from './TurnkeyLogoutItem'
import { EmbeddedWalletEmail } from './EmbeddedWalletEmail'
import { WALLET_CARD_ROW, WALLET_MENU_ROW } from './walletMenuRow'

const APP_CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10) as AppChainId
const SUPPORTED_CHAIN_IDS = wagmiConfig.chains.map(c => c.id)

const APP_CHAIN = wagmiConfig.chains.find(c => c.id === APP_CHAIN_ID)
const NETWORK_OPTIONS = wagmiConfig.chains.filter(c => !!c.testnet === !!APP_CHAIN?.testnet)

// Wallet UI only. The Privana session is driven by the SDK's SiweAuthProvider
// (useSiweAuth), which watches the wagmi connection and runs SIWE login/logout.
export const ConnectButton: FC = () => {
  const { address, isConnected, connector } = useAccount()
  const { switchChain } = useSwitchChain()
  const chainId = useChainId()

  const isTurnkeyActive = connector?.id === TURNKEY_CONNECTOR_ID
  const walletIntent = useTurnkeyWalletIntent()
  const isEmbeddedWallet = isTurnkeyActive && walletIntent === 'embedded'
  const resolvedTheme = useResolvedTheme()
  const pendingCount = usePendingActivityCount()

  const [menuOpen, setMenuOpen] = useState(false)
  const [networkOpen, setNetworkOpen] = useState(false)
  const [activeModal, setActiveModal] = useState<'deposit' | 'withdraw' | null>(null)
  const currentChain = wagmiConfig.chains.find(c => c.id === chainId)
  const openModal = (modal: 'deposit' | 'withdraw') => {
    setMenuOpen(false)
    setActiveModal(modal)
  }

  // Connected (external) wallets: full sign-out (bridge teardown + wagmi
  // disconnect + SIWE logout, which also clears any sticky auth error).
  // Embedded wallets use Turnkey's logout() via TurnkeyLogoutItem.
  const handleSignOut = useSignOut()

  if (!isConnected || !address) return null

  if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
    return (
      <Button type="button" onClick={() => switchChain({ chainId: APP_CHAIN_ID })}>
        Wrong network
      </Button>
    )
  }

  return (
    <div className="flex gap-2 items-center">
      <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="Account menu"
            className={cn(
              'inline-flex h-10 w-10 items-center justify-center rounded-full text-foreground transition-colors hover:bg-muted cursor-pointer',
              'md:h-auto md:w-auto md:gap-2 md:border md:border-border md:dark:border-[#31363f] md:bg-background md:dark:bg-card md:py-1.5 md:pl-1.5 md:pr-3 md:text-sm md:font-medium md:shadow-xs md:hover:bg-secondary/60',
            )}
          >
            <Wallet className="size-6 md:hidden" />
            <span className="hidden md:flex items-center gap-2">
              <AccountAvatar address={address} diameter={24} />
              <span className="max-w-[140px] truncate">{trimLongString(address)}</span>
              <ChevronDown className="size-4 text-muted-foreground" />
            </span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={8}
          className="w-72 rounded-2xl p-3 dark:bg-card dark:border-[#31363f]"
        >
          <div className="rounded-xl bg-muted p-3">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">Wallet</span>
            <div className="mt-1 flex items-center gap-2">
              <div className="md:hidden">
                <AccountAvatar address={address} diameter={24} />
              </div>
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
            {isEmbeddedWallet && <EmbeddedWalletEmail />}
            {isEmbeddedWallet && <ExportEmbeddedWallet />}

            <div className="my-3 border-t border-border/70" />

            <div className="grid grid-cols-2 gap-2">
              <Button className="gap-2" onClick={() => openModal('deposit')}>
                <ArrowDownToLine className="size-4" />
                Deposit
              </Button>
              <Button variant="outline" className="gap-2" onClick={() => openModal('withdraw')}>
                <ArrowUpFromLine className="size-4" />
                Withdraw
              </Button>
            </div>

            <Link
              to={activityPath()}
              onClick={() => setMenuOpen(false)}
              className={cn(WALLET_CARD_ROW, 'mt-2')}
            >
              <History className="size-4 text-muted-foreground" />
              Activity
              {pendingCount > 0 && (
                <span className="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-xs font-semibold leading-none text-primary-foreground">
                  {pendingCount}
                </span>
              )}
              <ChevronRight className="ml-auto size-4 text-muted-foreground" />
            </Link>
          </div>

          <div className="mt-2 flex items-center justify-between gap-2 rounded-xl bg-muted px-3 py-2">
            <span className="text-sm font-medium text-foreground">Appearance</span>
            <div className="inline-flex items-center gap-0.5 text-xs font-medium">
              {(['light', 'dark'] as const).map(mode => {
                const Icon = mode === 'light' ? Sun : Moon
                const active = resolvedTheme === mode
                return (
                  <button
                    key={mode}
                    type="button"
                    onClick={() => setThemePreference(mode)}
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full px-2.5 py-1 transition-colors',
                      active
                        ? 'bg-background dark:bg-card text-foreground shadow-sm dark:shadow-[var(--card-shadow)]'
                        : 'text-muted-foreground',
                    )}
                  >
                    <Icon className="size-3.5" />
                    {mode === 'light' ? 'Light' : 'Dark'}
                  </button>
                )
              })}
            </div>
          </div>

          {NETWORK_OPTIONS.length > 1 && (
            <div className="mt-2 rounded-xl bg-muted">
              <button
                type="button"
                onClick={() => setNetworkOpen(open => !open)}
                className="flex w-full items-center gap-2 px-3 py-2 text-sm font-medium text-foreground cursor-pointer"
              >
                <Globe className="size-4 text-muted-foreground" />
                Network
                <span className="ml-auto flex items-center gap-1 text-muted-foreground">
                  <span className="max-w-[120px] truncate">{currentChain?.name ?? 'Unknown'}</span>
                  <ChevronDown className={cn('size-4 transition-transform', networkOpen && 'rotate-180')} />
                </span>
              </button>
              {networkOpen && (
                <div className="px-1.5 pb-1.5">
                  {NETWORK_OPTIONS.map(chain => {
                    const active = chain.id === chainId
                    return (
                      <button
                        key={chain.id}
                        type="button"
                        disabled={active}
                        onClick={() => {
                          switchChain({ chainId: chain.id })
                          setNetworkOpen(false)
                        }}
                        className={cn(WALLET_MENU_ROW, active && 'cursor-default')}
                      >
                        {chain.name}
                        {active && <Check className="ml-auto size-4 text-primary" />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
          )}

          <div className="mt-2">
            {isEmbeddedWallet ? (
              <TurnkeyLogoutItem />
            ) : (
              <button type="button" className={WALLET_MENU_ROW} onClick={handleSignOut}>
                <LogOut className="size-4" />
                Sign out
              </button>
            )}
          </div>
        </DropdownMenuContent>
      </DropdownMenu>

      <DepositModal open={activeModal === 'deposit'} onClose={() => setActiveModal(null)} />
      <WithdrawModal open={activeModal === 'withdraw'} onClose={() => setActiveModal(null)} />
    </div>
  )
}
