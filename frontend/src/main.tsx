import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './routes'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { lightTheme, RainbowKitProvider, Theme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from './wagmi-config.ts'
import { PrivanaProvider } from '@oasisprotocol/privana-sdk'
import { ALLOWED_TOKEN_IDS } from './config/tokens'
import { ActivityProvider } from './contexts/ActivityProvider'
import { TurnkeyAuthProvider, IS_TURNKEY_ENABLED } from './components/TurnkeyAuthProvider'
import { TurnkeySync } from './components/TurnkeySync'
import { WalletModalProvider } from './components/WalletConnect/WalletModalProvider'
import { TooltipProvider } from './components/ui/tooltip'
import '@rainbow-me/rainbowkit/styles.css'
import '@oasisprotocol/privana-sdk/styles.css'
import './index.css'

const queryClient = new QueryClient()

const rainbowKitTheme: Theme = {
  ...lightTheme({
    accentColor: '#fcd34d',
    accentColorForeground: '#25292e',
  }),
  fonts: {
    body: 'inherit',
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <TurnkeyAuthProvider>
      <WagmiProvider config={wagmiConfig}>
        <QueryClientProvider client={queryClient}>
          {IS_TURNKEY_ENABLED && <TurnkeySync />}
          <PrivanaProvider
            networkConfig={{
              chainId: parseInt(import.meta.env.VITE_CHAIN_ID, 10),
              accountingContract: import.meta.env.VITE_ACCOUNTING_CONTRACT_ADDRESS,
              apiUrl: import.meta.env.VITE_PRIVANA_API_URL,
            }}
            tokens={ALLOWED_TOKEN_IDS}
            siweAuth={{
              statement: 'Sign in to Privana to access your private account data.',
            }}
          >
            <RainbowKitProvider theme={rainbowKitTheme} modalSize="compact">
              <ActivityProvider>
                <TooltipProvider>
                  <WalletModalProvider>
                    <RouterProvider router={router} />
                  </WalletModalProvider>
                </TooltipProvider>
              </ActivityProvider>
            </RainbowKitProvider>
          </PrivanaProvider>
        </QueryClientProvider>
      </WagmiProvider>
    </TurnkeyAuthProvider>
  </StrictMode>,
)
