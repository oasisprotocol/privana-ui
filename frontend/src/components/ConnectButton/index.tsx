import { type FC, useState } from 'react'
import { useConnection, useChainId, useSwitchChain } from 'wagmi'
import { ChevronDown, LogOut, Moon, Sun, Wallet } from 'lucide-react'
import { Button } from '../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger } from '../ui/dropdown-menu'
import { AccountAvatar } from '../AccountAvatar'
import { CopyButton } from '../CopyButton'
import { trimLongString } from '../../utils/trimLongString'
import { sapphire, sapphireTestnet, base, mainnet, hyperEvm, baseSepolia, sepolia } from 'viem/chains'
import { wagmiConfig, type AppChainId } from '@/wagmi-config'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import { useTurnkeyWalletIntent } from '@/wallet/turnkeyIntent'
import { useSignOut } from '@/hooks/useSignOut'
import { cn } from '@/lib/utils'
import { setThemePreference, useResolvedTheme } from '@/lib/theme'
import { extractErrorMessage } from '@/lib/errors'
import { ExportEmbeddedWallet } from './ExportEmbeddedWallet'
import { TurnkeyLogoutItem } from './TurnkeyLogoutItem'
import { EmbeddedWalletEmail } from './EmbeddedWalletEmail'
import { WALLET_MENU_ROW } from './walletMenuRow'

const SUPPORTED_CHAIN_IDS = wagmiConfig.chains.map(c => c.id)

const CHAIN_BADGES: Record<AppChainId, { label: string; color: string }> = {
  [sapphire.id]: { label: 'Sapphire', color: '#0500E2' },
  [sapphireTestnet.id]: { label: 'Sapphire Testnet', color: '#0500E2' },
  [base.id]: { label: 'Base', color: '#0052FF' },
  [mainnet.id]: { label: 'Ethereum', color: '#627EEA' },
  [hyperEvm.id]: { label: 'HyperEVM', color: '#12A594' },
  [baseSepolia.id]: { label: 'Base Sepolia', color: '#0052FF' },
  [sepolia.id]: { label: 'Sepolia', color: '#6b7280' },
}

// Wallet UI only. The Privana session is driven by the SDK's SiweAuthProvider
// (useSiweAuth), which watches the wagmi connection and runs SIWE login/logout.
export const ConnectButton: FC = () => {
  const { address, isConnected, connector } = useConnection()
  const { mutate: switchChain, error: switchError } = useSwitchChain()
  const chainId = useChainId()

  const chainBadge: { label: string; color: string } | undefined = CHAIN_BADGES[chainId as AppChainId]

  const isTurnkeyActive = connector?.id === TURNKEY_CONNECTOR_ID
  const walletIntent = useTurnkeyWalletIntent()
  const isEmbeddedWallet = isTurnkeyActive && walletIntent === 'embedded'
  const resolvedTheme = useResolvedTheme()

  const [menuOpen, setMenuOpen] = useState(false)

  // Connected (external) wallets: full sign-out (bridge teardown + wagmi
  // disconnect + SIWE logout, which also clears any sticky auth error).
  // Embedded wallets use Turnkey's logout() via TurnkeyLogoutItem.
  const handleSignOut = useSignOut()

  if (!isConnected || !address) return null

  if (!SUPPORTED_CHAIN_IDS.includes(chainId)) {
    return (
      <div className="flex flex-col items-end gap-1">
        <Button type="button" onClick={() => switchChain({ chainId: mainnet.id })}>
          Wrong network
        </Button>
        {switchError && (
          <span className="text-xs text-destructive">
            {extractErrorMessage(switchError, 'Could not switch network')}
          </span>
        )}
      </div>
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
              {chainBadge && (
                <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-background px-2 py-0.5 text-[11px] font-medium text-foreground">
                  <span
                    aria-hidden
                    className="h-2 w-2 rounded-full"
                    style={{ background: chainBadge.color }}
                  />
                  {chainBadge.label}
                </span>
              )}
              <CopyButton
                value={address}
                label="Copy wallet address"
                className="ml-auto hover:bg-background"
              />
            </div>
            {isEmbeddedWallet && <EmbeddedWalletEmail />}
            {isEmbeddedWallet && <ExportEmbeddedWallet />}
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
    </div>
  )
}
