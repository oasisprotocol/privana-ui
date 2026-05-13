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
import { authCallbackPath } from './paths'
import { ActivityProvider } from './contexts/ActivityProvider'
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
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <PrivanaProvider
          networkConfig={{
            chainId: parseInt(import.meta.env.VITE_CHAIN_ID, 10),
            accountingContract: import.meta.env.VITE_ACCOUNTING_CONTRACT_ADDRESS,
            apiUrl: import.meta.env.VITE_PRIVANA_API_URL,
          }}
          tokens={ALLOWED_TOKEN_IDS}
          hostedAuth={{
            clientId: import.meta.env.VITE_PRIVANA_CLIENT_ID,
            redirectUri: `${window.location.origin}${authCallbackPath()}`,
          }}
        >
          <RainbowKitProvider theme={rainbowKitTheme} modalSize="compact">
            <ActivityProvider>
              <TooltipProvider>
                <RouterProvider router={router} />
              </TooltipProvider>
            </ActivityProvider>
          </RainbowKitProvider>
        </PrivanaProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
