import { BookCopy, KeySquare, Wand } from 'lucide-react'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Button } from '@oasisprotocol/privana-sdk'
import HeroImage from '../../assets/dashboard-hero.svg'
import { useConnectWallet } from '@/components/WalletConnect/useConnectWallet'

const features = [
  {
    icon: BookCopy,
    text: 'Best execution routes',
  },
  {
    icon: KeySquare,
    text: 'Confidential execution',
  },
  {
    icon: Wand,
    text: 'Stop anytime, no lock-ups',
  },
]

export const SwapLanding = () => {
  const connectWallet = useConnectWallet()

  return (
    <>
      <div className="flex flex-col justify-between md:flex-row items-center gap-6 md:gap-6">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-input-focused text-2xl font-medium leading-none">Privacy preserving swaps</p>
              <h2 className="text-foreground text-3xl font-semibold leading-9">
                Execute your first private swap
              </h2>
            </div>
            <p className="text-muted-foreground text-xl font-normal leading-7">
              Swap your favorite pairs, crosschain, privately and securely.
            </p>
          </div>

          <div className="flex flex-row flex-wrap gap-6">
            <Button className="w-full md:w-auto" onClick={connectWallet}>
              Start trading now
            </Button>
            <Button variant="secondary" className="w-full md:w-auto">
              Explore available assets
            </Button>
          </div>
        </div>

        <div className="w-full md:w-88 h-76 relative shrink-0">
          <img src={HeroImage} alt="Privacy preserving swaps" className="w-full h-full object-contain" />
        </div>
      </div>

      <div className="flex flex-col gap-6 items-center sm:flex-wrap sm:gap-y-6 md:flex-row justify-center md:gap-12">
        {features.map((feature, index) => {
          const Icon = feature.icon
          return (
            <div key={index} className="flex items-center gap-2">
              <Icon className="h-5 w-5 text-primary" />
              <span className="text-sm font-medium text-foreground">{feature.text}</span>
            </div>
          )
        })}
      </div>

      <Separator />
      <div className="flex flex-col items-center justify-center gap-8 px-4 sm:px-16 md:px-[20%]">
        <div className="text-foreground text-xl font-medium">Want to learn more? Check FAQ below</div>
        <div className="flex flex-col gap-6 w-full">
          <div className="flex flex-col">
            <p className="text-base font-medium text-muted-foreground">Getting Started</p>
            <Accordion type="single" collapsible defaultValue="private-swap">
              <AccordionItem value="private-swap">
                <AccordionTrigger>How does private swap work?</AccordionTrigger>
                <AccordionContent>
                  It's essentially "autopilot" for your portfolio. You choose a trader based on their
                  performance and risk level, and our system automatically mirrors their trades in your
                  account. When they buy or sell, you do too—no manual effort required.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </div>
      </div>
    </>
  )
}
