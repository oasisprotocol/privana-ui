import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trimLongString } from '@/utils/trimLongString'
import { Skeleton } from '@/components/ui/skeleton'
import { FC } from 'react'
import { Control, Controller, FieldArrayWithId, FieldErrors, useWatch } from 'react-hook-form'
import { TraderDisplayData, TradersFormValues } from '@/pages/CreateStrategy/types'

type TraderTableProps = {
  className?: string
  isLoading: boolean
  control: Control<TradersFormValues>
  fields: FieldArrayWithId<TradersFormValues, 'traders', 'id'>[]
  traders: TraderDisplayData[]
  append: (value: { address: string; allocation: number }) => void
  remove: (index: number) => void
  errors?: FieldErrors<TradersFormValues>
}

export const TraderTable: FC<TraderTableProps> = ({
  className,
  isLoading,
  control,
  fields,
  traders,
  append,
  remove,
  errors,
}) => {
  const watchedTraders = useWatch({ control, name: 'traders' })
  const totalAllocation = (watchedTraders ?? []).reduce((sum, t) => sum + (Number(t?.allocation) || 0), 0)

  return (
    <div className={cn('w-full overflow-auto', className)}>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Trader</TableHead>
            <TableHead>Last trade</TableHead>
            <TableHead>Size</TableHead>
            <TableHead>
              <div className="flex items-center">
                Monthly PnL
                <ChevronDownIcon className="ml-1 h-4 w-4" />
              </div>
            </TableHead>
            <TableHead>Add / Remove</TableHead>
            <TableHead className="max-w-30">Allocation</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {isLoading
            ? Array.from({ length: 15 }, (_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            : traders.map(trader => {
                const fieldIndex = fields.findIndex(f => f.address === trader.address)
                const isSelected = fieldIndex !== -1

                return (
                  <TableRow key={trader.id}>
                    <TableCell className="font-medium">{trimLongString(trader.address)}</TableCell>
                    <TableCell>{trader.lastTrade}</TableCell>
                    <TableCell>{trader.size}</TableCell>
                    <TableCell className="text-chart-1">{trader.monthlyPnl}</TableCell>
                    <TableCell>
                      {isSelected ? (
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-40"
                          type="button"
                          onClick={() => remove(fieldIndex)}
                        >
                          Remove
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="w-40"
                          type="button"
                          onClick={() => append({ address: trader.address, allocation: 0 })}
                        >
                          Add to strategy
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="w-40">
                      {isSelected ? (
                        <Controller
                          control={control}
                          name={`traders.${fieldIndex}.allocation`}
                          render={({ field: controllerField }) => (
                            <Input
                              type="number"
                              min={0}
                              max={100}
                              className="w-full"
                              value={controllerField.value === 0 ? '' : controllerField.value}
                              onChange={e => {
                                const val = e.target.value
                                controllerField.onChange(val === '' ? 0 : Number(val))
                              }}
                              onBlur={controllerField.onBlur}
                            />
                          )}
                        />
                      ) : (
                        <div className="h-9 flex items-center">0%</div>
                      )}
                    </TableCell>
                  </TableRow>
                )
              })}
        </TableBody>
        <TableFooter>
          <TableRow>
            <TableCell colSpan={6}>
              <div
                className={cn(
                  'text-right text-sm',
                  totalAllocation === 100 ? 'text-chart-1' : 'text-destructive',
                )}
              >
                Total allocation: {totalAllocation}%
              </div>
            </TableCell>
          </TableRow>
        </TableFooter>
      </Table>
      {!isLoading && errors?.traders && (
        <div className="py-3 text-center text-destructive text-sm">
          {errors.traders.root?.message || errors.traders.message}
        </div>
      )}
    </div>
  )
}
