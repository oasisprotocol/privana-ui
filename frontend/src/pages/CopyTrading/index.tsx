import { useNavigate } from 'react-router'
import { BookCopy, KeySquare, LogOut, Wand } from 'lucide-react'
import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Separator } from '@/components/ui/separator'
import { Button } from '@oasisprotocol/flexvaults-sdk'
import { useBalance } from '@oasisprotocol/flexvaults-sdk'
import HeroImage from '../../assets/hero-create-strategy.svg'

const features = [
  {
    icon: BookCopy,
    text: 'Copy verified traders in one click',
  },
  {
    icon: KeySquare,
    text: 'Your funds stay in your vault',
  },
  {
    icon: Wand,
    text: 'Automatic rebalancing',
  },
  {
    icon: LogOut,
    text: 'Stop anytime, no lock-ups',
  },
]

export const CopyTrading = () => {
  const navigate = useNavigate()
  const { balanceWei, isLoading } = useBalance({
    tokenId: import.meta.env.VITE_USDC_TOKEN_ID,
  })
  const hasFunds = BigInt(balanceWei || 0) > 0
  const disabled = isLoading || !hasFunds

  return (
    <>
      <div className="flex flex-col md:flex-row items-center gap-6 md:gap-6">
        <div className="flex flex-col gap-8">
          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-input-focused text-2xl font-medium leading-none">Trade like the pros</p>
              <h2 className="text-foreground text-3xl font-semibold leading-9">
                Create a copy trading strategy
              </h2>
            </div>
            <p className="text-muted-foreground text-xl font-normal leading-7">
              Follow top traders automatically. Their moves, your vault, your custody Privately.
            </p>
          </div>

          <div className="flex flex-row flex-wrap gap-6">
            <Button className="w-full md:w-auto" disabled={disabled} onClick={() => navigate('create')}>
              Create your strategy
            </Button>
            <Button variant="secondary" className="w-full md:w-auto">
              Explore top traders
            </Button>
          </div>
        </div>

        <div className="w-full md:w-88 h-76 relative shrink-0">
          <img src={HeroImage} alt="Create strategy" className="w-full h-full object-contain" />
        </div>
      </div>

      <div className="flex flex-col gap-6 items-center sm:flex-wrap sm:gap-y-6 md:flex-row md:justify-between md:gap-12">
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
        <Accordion type="single" collapsible defaultValue="copy-trading" className="w-full">
          <AccordionItem value="copy-trading">
            <AccordionTrigger>What is Copy Trading?</AccordionTrigger>
            <AccordionContent>
              It’s essentially "autopilot" for your portfolio. You choose a trader based on their performance
              and risk level, and our system automatically mirrors their trades in your account. When they buy
              or sell, you do too—no manual effort required.
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="returns">
            <AccordionTrigger>How Copy Trading Works on FlexVaults</AccordionTrigger>
            <AccordionContent>-</AccordionContent>
          </AccordionItem>
          <AccordionItem value="support">
            <AccordionTrigger>Your Keys, Their Trades: How We Keep You in Control</AccordionTrigger>
            <AccordionContent>-</AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
      <PoweredByHyperliquid />
    </>
  )
}
