import { StepNavigation } from './StepNavigation'
import { FC } from 'react'
import { StrategyData } from './types'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.string().min(1, 'Amount is required'),
})

type SettingsFormData = z.infer<typeof settingsSchema>

type SettingsStepProps = {
  step: number
  setStep: (step: number) => void
  strategy: StrategyData
  setStrategy: (strategy: StrategyData) => void
}

export const SettingsStep: FC<SettingsStepProps> = ({ step, setStep, strategy, setStrategy }) => {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormData, unknown, SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: strategy.name,
      amount: strategy.amount,
    },
  })
  const onSubmit = (data: SettingsFormData) => {
    setStrategy({ ...strategy, ...data })
    setStep(step + 1)
  }

  return (
    <div className="flex flex-col gap-6 max-w-145 m-auto">
      <div>
        <div className="text-foreground text-2xl font-medium mb-1.5">New copy trading strategy</div>
        <div className="max-w-87.5 text-muted-foreground text-sm font-normal">
          Configure your strategy details.
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name your strategy</Label>
          <Input id="name" placeholder="Strategy name" {...register('name')} />
          {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
        </div>

        <span className="text-muted-foreground text-sm font-normal">
          Choose the amount you want to allocate for this strategy.
        </span>

        <div className="flex flex-col gap-2">
          <Label htmlFor="amount">Amount</Label>
          <Input id="amount" placeholder="Amount" {...register('amount')} />
          {errors.amount && <p className="text-destructive text-sm">{errors.amount.message}</p>}
        </div>

        <StepNavigation back={() => setStep(step - 1)} next={() => handleSubmit(onSubmit)()} />
      </form>
    </div>
  )
}
