import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion'
import { Button } from '@oasisprotocol/privana-sdk'
import { useOpenWalletModal } from '@/components/WalletConnect/useOpenWalletModal'
import { EarnHeader } from './EarnHeader'

export const EarnLanding = () => {
  const openWalletModal = useOpenWalletModal()

  return (
    <>
      <EarnHeader
        action={
          <Button className="w-full md:w-auto" onClick={openWalletModal}>
            Start earning now
          </Button>
        }
      />

      <div className="flex flex-col items-center justify-center gap-8 px-4 sm:px-16 md:px-[20%]">
        <div className="text-foreground text-xl font-medium">Want to learn more? Check FAQ below</div>
        <Accordion type="single" collapsible defaultValue="earn" className="w-full">
          <AccordionItem value="earn">
            <AccordionTrigger>How does earning work on Privana?</AccordionTrigger>
            <AccordionContent>
              Your allowance earns yield automatically while sitting in your vault. Funds are deployed to
              trusted protocols like Aave. You can recall at any time — no lock-ups.
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </>
  )
}
