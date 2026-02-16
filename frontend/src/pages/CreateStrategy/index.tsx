import React, { useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Separator } from '@/components/ui/separator'
import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'
import { StrategyData } from './types'
import { ChooseTradersStep } from './ChooseTradersStep'
import { SettingsStep } from './SettingsStep'
import { BootstrapStep } from './BootstrapStep'

const steps = ['1. Choose traders to copy', '2. Enter strategy details', '3. Confirm']

export const CreateStrategy = () => {
  const [step, setStep] = useState(0)
  const [strategy, setStrategy] = useState<StrategyData>({ name: '', amount: '', token: '', traders: [] })

  return (
    <>
      <div>
        <div className="text-foreground text-3xl font-semibold mb-3">Build a copy trading strategy</div>

        <Breadcrumb className="py-2 h-10">
          <BreadcrumbList>
            {steps.map((label, i) => (
              <React.Fragment key={i}>
                <BreadcrumbItem className="text-input-focused">
                  {i === step ? <BreadcrumbPage className="underline">{label}</BreadcrumbPage> : label}
                </BreadcrumbItem>
                {i < steps.length - 1 && <BreadcrumbSeparator className="pl-4" />}
              </React.Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      </div>

      <Separator />

      {step === 0 && (
        <ChooseTradersStep step={step} setStep={setStep} strategy={strategy} setStrategy={setStrategy} />
      )}
      {step === 1 && (
        <SettingsStep step={step} setStep={setStep} strategy={strategy} setStrategy={setStrategy} />
      )}
      {step === 2 && <BootstrapStep strategy={strategy} />}

      <PoweredByHyperliquid />
    </>
  )
}
