import { StepNavigation } from './StepNavigation'
import { FC } from 'react'
import { StrategyData } from './types'
import { Controller, useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

const tokens = ['ROSE', 'USDC'] as const

const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  amount: z.string().min(1, 'Amount is required'),
  token: z.enum(tokens, { error: 'Token is required' }),
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
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SettingsFormData, unknown, SettingsFormData>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      name: strategy.name,
      amount: strategy.amount,
      token: (strategy.token as SettingsFormData['token']) || undefined,
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
          Fund your wallet to start trading.
        </div>
      </div>
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <Label htmlFor="name">Name your strategy</Label>
          <Input id="name" placeholder="Strategy name" {...register('name')} />
          {errors.name && <p className="text-destructive text-sm">{errors.name.message}</p>}
        </div>

        <span className="text-muted-foreground text-sm font-normal">
          Choose the asset &amp; amount you want to allocate for this strategy.
        </span>

        <div className="flex gap-4">
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="token">Token</Label>
            <Controller
              name="token"
              control={control}
              render={({ field }) => (
                <Select value={field.value} onValueChange={field.onChange}>
                  <SelectTrigger id="token" className="w-full">
                    <SelectValue placeholder="Select token" />
                  </SelectTrigger>
                  <SelectContent>
                    {tokens.map(token => (
                      <SelectItem key={token} value={token}>
                        {token}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            {errors.token && <p className="text-destructive text-sm">{errors.token.message}</p>}
          </div>
          <div className="flex flex-1 flex-col gap-2">
            <Label htmlFor="amount">Amount</Label>
            <Input id="amount" placeholder="Amount" {...register('amount')} />
            {errors.amount && <p className="text-destructive text-sm">{errors.amount.message}</p>}
          </div>
        </div>

        <span className="text-muted-foreground text-sm font-normal">Below you can see estimated fees.</span>

        <StepNavigation back={() => setStep(step - 1)} next={() => handleSubmit(onSubmit)()} />
      </form>
    </div>
  )
}
