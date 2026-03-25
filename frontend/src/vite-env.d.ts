/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_USDC_TOKEN_ID: `0x${string}`
  readonly VITE_USDC_DECIMALS: string
  readonly VITE_ACCOUNTING_CONTRACT_ADDRESS: `0x${string}`
  readonly VITE_SWAP_API_URL?: string
  readonly VITE_SERVICE_ADDRESS: `0x${string}`
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@metamask/jazzicon' {
  const jazzicon: (diameter: number, seed: number) => HTMLDivElement
  export default jazzicon
}
