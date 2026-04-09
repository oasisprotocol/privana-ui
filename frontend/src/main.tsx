import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'
import { router } from './routes'
import { WagmiProvider } from 'wagmi'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { darkTheme, RainbowKitProvider, Theme } from '@rainbow-me/rainbowkit'
import { wagmiConfig } from './wagmi-config.ts'
import { FlexvaultsProvider } from '@oasisprotocol/flexvaults-sdk'
import '@rainbow-me/rainbowkit/styles.css'
import './index.css'
import '@oasisprotocol/flexvaults-sdk/styles.css'

const queryClient = new QueryClient()

const rainbowKitTheme: Theme = {
  ...darkTheme({
    accentColor: 'rgba(255, 255, 255, 0.60)',
  }),
  fonts: {
    body: 'inherit',
  },
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FlexvaultsProvider
          networkConfig={{
            chainId: parseInt(import.meta.env.VITE_CHAIN_ID, 10),
            accountingContract: import.meta.env.VITE_ACCOUNTING_CONTRACT_ADDRESS,
            apiUrl: import.meta.env.VITE_FLEXVAULTS_API_URL,
          }}
          tokens={[
            '0x330ba47d00c7ce3018deee017b319fd7cc6473a2ddc9e6eba6ebb4207be15279',
            '0x335b5cccd1e63b2fe79863a0db73fce430e4e66902e2b78424f8662621e29fb7',
          ]}
          hostedAuth={{
            clientId: import.meta.env.VITE_FLEXVAULTS_CLIENT_ID,
            redirectUri: `${window.location.origin}/auth/callback`,
          }}
        >
          <RainbowKitProvider theme={rainbowKitTheme} modalSize="compact">
            <RouterProvider router={router} />
          </RainbowKitProvider>
        </FlexvaultsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
