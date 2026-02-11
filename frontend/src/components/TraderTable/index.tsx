import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ChevronDownIcon } from 'lucide-react'
import { cn } from '@/lib/utils'
import { trimLongString } from '@/utils/trimLongString'
import { FC } from 'react'

type TraderTableProps = {
  className?: string
  strategy: any
  setStrategy: any
}

const traders = [
  {
    id: '1',
    trader: '0x4838b106fce9647bdf1e7877bf73ce8b0bad5f97',
    lastTrade: '1 min ago',
    size: '$7.24M',
    monthlyPnl: '+35.5%',
    allocation: '30%',
  },
  {
    id: '2',
    trader: '0x4675C7e5BaAFBFFbca748158bEcBA61ef3b0a263',
    lastTrade: '3min ago',
    size: '$3.54M',
    monthlyPnl: '+23.5%',
    allocation: '40%',
  },
  {
    id: '3',
    trader: '0xab97925eB84fe0260779F58B7cb08d77dcB1ee2B',
    lastTrade: '6 min ago',
    size: '$1.24M',
    monthlyPnl: '+16.5%',
    allocation: '30%',
  },
]

export const TraderTable: FC<TraderTableProps> = ({
  className,
  strategy: _strategy,
  setStrategy: _setStrategy,
}) => {
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
          {traders.map(trader => (
            <TableRow key={trader.id}>
              <TableCell className="font-medium">{trimLongString(trader.trader)}</TableCell>
              <TableCell>{trader.lastTrade}</TableCell>
              <TableCell>{trader.size}</TableCell>
              <TableCell className="text-chart-1">{trader.monthlyPnl}</TableCell>
              <TableCell>
                <Button variant="destructive" size="sm" className="w-full">
                  Remove
                </Button>
              </TableCell>
              <TableCell className="max-w-30">
                <Input value={trader.allocation} className="w-full" onChange={() => {}} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

export default TraderTable
