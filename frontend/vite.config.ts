/// <reference types="vitest/config" />
import fs from 'node:fs'
import path from 'path'
import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// Inlines the reflect-metadata polyfill so it runs before the app bundle.
// tsyringe (via @turnkey/crypto → @peculiar/x509) throws at module-load if
// Reflect.getMetadata is missing, and that runs in a vendor chunk before any app module
function reflectMetadataPolyfill(): Plugin {
  return {
    name: 'reflect-metadata-polyfill',
    transformIndexHtml: () => [
      {
        tag: 'script',
        injectTo: 'head-prepend',
        children: fs.readFileSync(
          path.resolve(import.meta.dirname, 'node_modules/reflect-metadata/Reflect.js'),
          'utf8',
        ),
      },
    ],
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), reflectMetadataPolyfill()],
  server: {
    port: 3000,
  },
  resolve: {
    alias: {
      '@': path.resolve(import.meta.dirname, './src'),
    },
  },
  test: {
    environment: 'happy-dom',
    setupFiles: ['src/test/setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
})
