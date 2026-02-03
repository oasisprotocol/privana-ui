/// <reference types="vite/client" />

interface ViteTypeOptions {
  strictImportMetaEnv: unknown;
}

interface ImportMetaEnv {
  readonly VITE_WALLET_CONNECT_PROJECT_ID: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

declare module '@metamask/jazzicon' {
  const jazzicon: (diameter: number, seed: number) => HTMLDivElement;
  export default jazzicon;
}
