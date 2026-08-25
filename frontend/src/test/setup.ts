import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// RTL's auto-cleanup only registers itself when the runner exposes a global
// afterEach, and vitest globals are off in this project.
afterEach(cleanup)

// recharts' ResponsiveContainer (via ui/chart.tsx) requires a ResizeObserver;
// provide a no-op when the test DOM doesn't ship one.
if (typeof globalThis.ResizeObserver === 'undefined') {
  class ResizeObserverStub {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  globalThis.ResizeObserver = ResizeObserverStub as unknown as typeof ResizeObserver
}
