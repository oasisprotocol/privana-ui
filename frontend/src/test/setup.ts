import '@testing-library/jest-dom/vitest'
import { afterEach } from 'vitest'
import { cleanup } from '@testing-library/react'

// RTL's auto-cleanup only registers itself when the runner exposes a global
// afterEach, and vitest globals are off in this project.
afterEach(cleanup)

// happy-dom computes no layout, so measured sizes are all 0×0 and recharts'
// ResponsiveContainer collapses every chart to nothing. Replace its
// ResizeObserver with one reporting a fixed size, so charts actually draw
// and tests can assert on the rendered SVG.
class FixedSizeResizeObserver implements ResizeObserver {
  constructor(private readonly callback: ResizeObserverCallback) {}
  observe(target: Element) {
    this.callback([{ target, contentRect: { width: 800, height: 400 } } as ResizeObserverEntry], this)
  }
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver = FixedSizeResizeObserver
