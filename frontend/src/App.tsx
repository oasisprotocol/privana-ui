import { Button } from '@/components/ui/button'
import { ArrowRight, Check } from 'lucide-react'
import { RainbowKitConnectButton } from './components/RainbowKitConnectButton'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="flex items-center justify-between px-6 h-16 border-b border-border">
        <div className="text-xl font-bold">FlexVaults</div>
        <div className="flex items-center gap-4">
          <a href="#" className="text-primary font-medium text-sm">
            Menu item 1
          </a>
          <a href="#" className="text-muted-foreground font-medium text-sm">
            Menu item 2
          </a>
          <a href="#" className="text-muted-foreground font-medium text-sm">
            Menu item 3
          </a>
          <RainbowKitConnectButton />
        </div>
      </nav>

      <section className="flex flex-col items-center py-24 px-6">
        <p className="text-sm font-bold text-foreground mb-4">Private & diversified</p>
        <h1 className="text-5xl font-normal text-foreground text-center tracking-tight mb-8">
          Trade in absolute privacy and leverage diversification
        </h1>
        <Button>
          Get started
          <ArrowRight />
        </Button>
      </section>

      <section className="py-24 px-6 max-w-7xl mx-auto">
        <div className="flex gap-16 items-center">
          <div className="flex-1">
            <p className="text-muted-foreground font-semibold mb-5">Hero section</p>
            <h2 className="text-5xl font-bold mb-5">
              Headline that solves user's <span className="text-primary">main problem</span>
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Follow with one or two sentences that expand on your value proposition. Focus on key benefits
              and address why users should take action now.
            </p>
            <div className="flex flex-col gap-3 mb-8">
              <div className="flex items-center gap-3">
                <Check className="text-foreground" size={20} />
                <span className="font-medium">Benefit driven feature title</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="text-foreground" size={20} />
                <span className="font-medium">Benefit driven feature title</span>
              </div>
              <div className="flex items-center gap-3">
                <Check className="text-foreground" size={20} />
                <span className="font-medium">Benefit driven feature title</span>
              </div>
            </div>
            <div className="flex gap-3">
              <Button>Get started</Button>
              <Button variant="ghost">
                Explore
                <ArrowRight />
              </Button>
            </div>
          </div>
          <div className="flex-1 bg-muted rounded-md aspect-video"></div>
        </div>
      </section>
    </div>
  )
}

export default App
