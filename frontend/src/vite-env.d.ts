/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown
}

interface ImportMetaEnv {
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string
  readonly VITE_CHAIN_ID: string
  readonly VITE_ACCOUNTING_CONTRACT_ADDRESS: `0x${string}`
  readonly VITE_EARN_MANAGER_CONTRACT_ADDRESS: `0x${string}`
  readonly VITE_PRIVANA_API_URL: string
  readonly VITE_PRIVANA_SERVICES_API_URL?: string
  readonly VITE_SWAP_LP_ADDRESS?: `0x${string}`
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@metamask/jazzicon' {
  const jazzicon: (diameter: number, seed: number) => HTMLDivElement
  export default jazzicon
}
