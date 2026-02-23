import { useNavigate } from 'react-router'
import { TraderTable } from '@/components/TraderTable'
import { StepNavigation } from './StepNavigation'
import { FC } from 'react'
import { StrategyData, TraderDisplayData } from './types'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const traderSchema = z.object({
  address: z.string().min(1),
  allocation: z.number().min(0, 'Min 0%').max(100, 'Max 100%'),
})

const chooseTradersSchema = z.object({
  traders: z
    .array(traderSchema)
    .min(1, 'At least one trader is required')
    .refine(traders => traders.reduce((sum, t) => sum + t.allocation, 0) === 100, {
      message: 'Total allocation must equal 100%',
    }),
})

type ChooseTradersFormData = z.infer<typeof chooseTradersSchema>

type ChooseTradersStepProps = {
  step: number
  setStep: (step: number) => void
  strategy: StrategyData
  setStrategy: (strategy: StrategyData) => void
}

const mockTraders = [
  {
    address: '0x4838b106fce9647bdf1e7877bf73ce8b0bad5f97',
    allocation: 30,
    id: '1',
    lastTrade: '1 min ago',
    size: '$7.24M',
    monthlyPnl: '+35.5%',
  },
  {
    address: '0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263',
    allocation: 40,
    id: '2',
    lastTrade: '3min ago',
    size: '$3.54M',
    monthlyPnl: '+23.5%',
  },
  {
    address: '0xab97925eB84fe0260779F58B7cb08d77dcB1ee2B',
    allocation: 30,
    id: '3',
    lastTrade: '6 min ago',
    size: '$1.24M',
    monthlyPnl: '+16.5%',
  },
]

export const ChooseTradersStep: FC<ChooseTradersStepProps> = ({ step, setStep, strategy, setStrategy }) => {
  const navigate = useNavigate()
  const isLoading = false

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<ChooseTradersFormData, unknown, ChooseTradersFormData>({
    resolver: zodResolver(chooseTradersSchema),
    defaultValues: { traders: strategy.traders },
  })

  const { fields, remove, append } = useFieldArray({ control, name: 'traders' })

  const allTraders: TraderDisplayData[] = mockTraders.map(t => ({
    id: t.id,
    address: t.address,
    lastTrade: t.lastTrade,
    size: t.size,
    monthlyPnl: t.monthlyPnl,
  }))

  const onSubmit = (data: ChooseTradersFormData) => {
    setStrategy({ ...strategy, traders: data.traders })
    setStep(step + 1)
  }

  return (
    <>
      <div>
        <div className="text-foreground text-2xl font-medium mb-1.5">Choose traders to copy</div>
        <div className="max-w-87.5 text-muted-foreground text-sm font-normal">
          Select traders whose moves you want to mirror. Diversify across different styles for balanced risk.
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="max-w-95 flex flex-col gap-2 items-start">
          <Label htmlFor="address-search" className="font-medium">
            Search for specific address
          </Label>
          <Input id="address-search" placeholder='e.g., "0x71F3wef34r3r2a92b"' className="w-full" />
        </div>

        <TraderTable
          isLoading={isLoading}
          control={control}
          fields={fields}
          traders={allTraders}
          append={append}
          remove={remove}
          errors={errors}
        />

        <StepNavigation
          disabled={isLoading}
          back={() => navigate(-1)}
          next={() => handleSubmit(onSubmit)()}
          step={step}
        />
      </form>
    </>
  )
}
