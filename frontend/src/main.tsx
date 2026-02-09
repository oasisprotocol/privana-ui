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
import { sapphireTestnet } from 'viem/chains'

const queryClient = new QueryClient()

const rainbowKitTheme: Theme = {
  ...darkTheme({
    accentColor: 'rgba(255, 255, 255, 0.60)',
  }),
  fonts: {
    body: 'inherit',
  },
}

const flexvaultsNetwork =
  parseInt(import.meta.env.VITE_CHAIN_ID, 10) === sapphireTestnet.id ? 'testnet' : 'mainnet'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <WagmiProvider config={wagmiConfig}>
      <QueryClientProvider client={queryClient}>
        <FlexvaultsProvider network={flexvaultsNetwork}>
          <RainbowKitProvider theme={rainbowKitTheme} modalSize="compact">
            <RouterProvider router={router} />
          </RainbowKitProvider>
        </FlexvaultsProvider>
      </QueryClientProvider>
    </WagmiProvider>
  </StrictMode>,
)
