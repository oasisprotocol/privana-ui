import { useEffect } from 'react'
import { Link } from 'react-router'
import { ArrowDownUp, ArrowLeftRight } from 'lucide-react'
import { useMenuOpen } from '@/hooks/use-menu-open'
import { cn } from '@/lib/utils'
import { tradePath } from '@/paths'
import { TRANSFER_ITEMS } from './transfer-items'

const DARK_BUTTON =
  'flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-4 text-base font-medium text-white transition-transform active:scale-95 bg-[linear-gradient(180deg,hsl(220_12%_24%),hsl(220_15%_14%))] dark:bg-[linear-gradient(180deg,hsl(220_11%_30%),hsl(220_13%_19%))]'

export const MobileBottomNav = () => {
  const [transferOpen, setTransferOpen] = useMenuOpen()

  useEffect(() => {
    if (!transferOpen) return
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setTransferOpen(false)
    }
    document.addEventListener('keydown', closeOnEscape)
    return () => document.removeEventListener('keydown', closeOnEscape)
  }, [transferOpen, setTransferOpen])

  return (
    <>
      {transferOpen && (
        <div
          aria-hidden
          onClick={() => setTransferOpen(false)}
          className="fixed inset-0 z-30 bg-black/60 animate-in fade-in duration-200 md:hidden"
        />
      )}
      <nav
        aria-label="Primary"
        style={{ viewTransitionName: 'bottom-nav' }}
        className="fixed inset-x-3 bottom-[max(0.75rem,env(safe-area-inset-bottom))] z-30 md:hidden"
      >
        <div className="flex flex-col rounded-[40px] bg-[hsl(220_15%_11%)] shadow-[0_10px_30px_-8px_rgba(0,0,0,0.5)] dark:bg-[hsl(220_13%_17%)]">
          <div
            id="mobile-transfer-menu"
            aria-hidden={!transferOpen}
            className={cn(
              'grid transition-[grid-template-rows] duration-300 ease-out',
              transferOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]',
            )}
          >
            <div className="overflow-hidden">
              <div className="flex flex-col gap-1 px-3 pt-3">
                {TRANSFER_ITEMS.map(({ to, label, description, Icon }) => (
                  <Link
                    key={to}
                    to={to}
                    viewTransition
                    tabIndex={transferOpen ? 0 : -1}
                    onClick={() => setTransferOpen(false)}
                    className={cn(
                      'flex items-center gap-3 rounded-2xl px-4 py-3 text-white transition-all duration-300 ease-out hover:bg-white/10',
                      transferOpen
                        ? 'translate-y-0 opacity-100'
                        : 'pointer-events-none translate-y-3 opacity-0',
                    )}
                  >
                    <Icon className="size-5 shrink-0 text-white/75" />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium leading-tight">{label}</span>
                      <span className="block truncate text-xs text-white/55">{description}</span>
                    </span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 p-3">
            <Link
              to={tradePath()}
              viewTransition
              className={DARK_BUTTON}
              onClick={() => setTransferOpen(false)}
            >
              <ArrowLeftRight className="size-4 shrink-0" />
              Swap
            </Link>
            <button
              type="button"
              aria-expanded={transferOpen}
              aria-controls="mobile-transfer-menu"
              onClick={() => setTransferOpen(open => !open)}
              className={DARK_BUTTON}
            >
              <ArrowDownUp className="size-4 shrink-0 rotate-45" />
              Transfer
            </button>
          </div>
        </div>
      </nav>
    </>
  )
}
