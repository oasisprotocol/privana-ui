import { useState } from 'react'
import { useNavigate } from 'react-router'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import TraderTable from '@/components/TraderTable'
import { Button } from '@oasisprotocol/flexvaults-sdk'
import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'

const steps = ['1. Choose traders to copy', '2. Enter strategy details', '3. Confirm']

export const CreateStrategy = () => {
  const [step, setStep] = useState(0)
  const navigate = useNavigate()

  return (
    <>
      <div>
        <div className="text-foreground text-3xl font-semibold mb-3">Build a copy trading strategy</div>

        <Breadcrumb className="py-2 h-10">
          <BreadcrumbList>
            {steps.map((label, i) => (
              <BreadcrumbItem key={i} className="text-input-focused">
                {i === step ? <BreadcrumbPage className="underline">{label}</BreadcrumbPage> : label}
                {i < steps.length - 1 && <BreadcrumbSeparator className="pl-4" />}
              </BreadcrumbItem>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Separator />

      <div>
        <div className="text-foreground text-2xl font-medium mb-1.5">Choose traders to copy</div>
        <div className="max-w-87.5 text-muted-foreground text-sm font-normal">
          Select traders whose moves you want to mirror. Diversify across different styles for balanced risk.
        </div>
      </div>

      <TraderTable />

      <div className={'flex flex-col sm:flex-row gap-6 justify-center'}>
        <Button variant="secondary" onClick={() => navigate(-1)} className="w-full sm:w-70">
          Cancel
        </Button>
        <Button variant="default" onClick={() => {}} className="w-full sm:w-70">
          Next
        </Button>
      </div>

      <PoweredByHyperliquid />
    </>
  )
}
