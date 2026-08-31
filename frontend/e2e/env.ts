import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

// The e2e build is `vite build --mode testnet`, so the app talks to the hosts in
// .env.testnet. The fixtures intercept by URL, which means they must agree with
// the build on those hosts — read them from the same file rather than duplicating.
const envPath = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '.env.testnet')

const entries = new Map(
  readFileSync(envPath, 'utf8')
    .split('\n')
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#'))
    .map(line => {
      const eq = line.indexOf('=')
      return [line.slice(0, eq), line.slice(eq + 1)] as const
    }),
)

function requireVar(name: string): string {
  const value = entries.get(name)
  if (!value) throw new Error(`${name} is missing from .env.testnet`)
  return value
}

export const ACCOUNTING_API_URL = requireVar('VITE_PRIVANA_API_URL')
export const SERVICES_API_URL = requireVar('VITE_PRIVANA_SERVICES_API_URL')
export const CHAIN_ID = parseInt(requireVar('VITE_CHAIN_ID'), 10)
