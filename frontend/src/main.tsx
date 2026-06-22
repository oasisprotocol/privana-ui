import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './routes'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { wagmiConfig } from './wagmi-config.ts'
import { PrivanaProvider } from '@oasisprotocol/privana-sdk'
import { ALLOWED_TOKEN_IDS } from './config/tokens'
import { ActivityProvider } from './contexts/ActivityProvider'
import { TurnkeyAuthProvider, IS_TURNKEY_ENABLED } from './components/TurnkeyAuthProvider'
import { TurnkeySync } from './components/TurnkeySync'
import { ConnectWalletProvider } from './components/WalletConnect/ConnectWalletProvider'
import { TooltipProvider } from './components/ui/tooltip'
import '@oasisprotocol/privana-sdk/styles.css'
import './index.css'

const queryClient = new QueryClient()

const CHAIN_ID = parseInt(import.meta.env.VITE_CHAIN_ID, 10)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TurnkeyAuthProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {IS_TURNKEY_ENABLED && <TurnkeySync />}
          <PrivanaProvider
            networkConfig={{
              chainId: CHAIN_ID,
              accountingContract: import.meta.env.VITE_ACCOUNTING_CONTRACT_ADDRESS,
              apiUrl: import.meta.env.VITE_PRIVANA_API_URL,
            }}
            tokens={ALLOWED_TOKEN_IDS}
            siweAuth
          >
            <ActivityProvider>
              <TooltipProvider>
                <ConnectWalletProvider>
                  <RouterProvider router={router} />
                </ConnectWalletProvider>
              </TooltipProvider>
            </ActivityProvider>
          </PrivanaProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </TurnkeyAuthProvider>
  </StrictMode>,
)
