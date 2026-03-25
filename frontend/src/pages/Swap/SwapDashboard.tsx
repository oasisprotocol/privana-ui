import React, { useState } from 'react'
import {
  Breadcrumb,
  BreadcrumbList,
  BreadcrumbItem,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Separator } from '@/components/ui/separator'
import { PoweredByHyperliquid } from '@/components/PoweredByHyperliquid'
import { useTokens } from '@/api/swap'
import { Skeleton } from '@/components/ui/skeleton'
import { useBalance } from '@oasisprotocol/flexvaults-sdk'
import { formatUnits } from 'viem'

const steps = ['1. Execute your private swap', '2. Review', '3. Enjoy']
const DECIMALS = Number(import.meta.env.VITE_USDC_DECIMALS)
const SYMBOL_OVERRIDES: Record<string, string> = {
  '0xc719650e9f4b0f27d956638c54518932ef9d15e720a1a2b2850250bcd0816514': 'USDC',
}

export const SwapDashboard = () => {
  const [step] = useState(0)
  const { data, isLoading, error } = useTokens()

  const [fromTokenId, setFromTokenId] = useState<string>('')
  const [toTokenId, setToTokenId] = useState<string>('')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')

  const fromBalance = useBalance({ tokenId: fromTokenId || undefined, enabled: !!fromTokenId })
  const toBalance = useBalance({ tokenId: toTokenId || undefined, enabled: !!toTokenId })

  const tokens = data?.tokens ?? []

  const getTokenLabel = (token: (typeof tokens)[number]) =>
    SYMBOL_OVERRIDES[token.token_id] ?? token.symbol ?? token.token_type_name
  const findToken = (id: string) => tokens.find(t => t.token_id === id)

  const formatBalance = (balanceWei: string) =>
    Number(formatUnits(BigInt(balanceWei || '0'), DECIMALS)).toFixed(2)

  const handleFromTokenChange = (tokenId: string) => {
    setFromTokenId(tokenId)
    setFromAmount('')
  }

  const handleToTokenChange = (tokenId: string) => {
    setToTokenId(tokenId)
    setToAmount('')
  }

  return (
    <>
      <div>
        <div className="text-foreground text-3xl font-semibold mb-3">Execute your private swap</div>
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

      {isLoading && <Skeleton className="h-70 w-full" />}
      {error && <p>Failed to load tokens: {error.message}</p>}

      {data && (
        <div className="flex flex-col gap-6 w-full max-w-[580px]">
          <div className="flex flex-col gap-1.5">
            <h2 className="text-2xl font-medium text-foreground leading-8">Asset selection</h2>
            <p className="text-sm text-muted-foreground">
              Choose asset you want to swap &amp; asset you wish to receive.
            </p>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex flex-col gap-2">
              <Label>Asset</Label>
              <Select value={fromTokenId} onValueChange={handleFromTokenChange}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map(token => (
                    <SelectItem key={token.token_id} value={token.token_id}>
                      {getTokenLabel(token)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label>Amount</Label>
              <Input
                className="h-8"
                type="text"
                inputMode="decimal"
                placeholder={`0.00 ${fromTokenId ? getTokenLabel(findToken(fromTokenId)!) : ''}`}
                value={fromAmount}
                onChange={e => setFromAmount(e.target.value)}
              />
              <div className="text-xs text-muted-foreground flex gap-2">
                Available:{' '}
                {fromTokenId ? (
                  fromBalance.isLoading ? (
                    <Skeleton className="h-4 w-24" />
                  ) : (
                    `${formatBalance(fromBalance.balanceWei)} ${getTokenLabel(findToken(fromTokenId)!)}`
                  )
                ) : (
                  '-'
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex flex-col gap-2">
              <Label>Asset</Label>
              <Select value={toTokenId} onValueChange={handleToTokenChange}>
                <SelectTrigger size="sm">
                  <SelectValue placeholder="Select" />
                </SelectTrigger>
                <SelectContent>
                  {tokens.map(token => (
                    <SelectItem key={token.token_id} value={token.token_id}>
                      {getTokenLabel(token)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex flex-1 flex-col gap-2">
              <Label>Amount</Label>
              <Input
                className="h-8"
                type="text"
                inputMode="decimal"
                placeholder={`0.00 ${toTokenId ? getTokenLabel(findToken(toTokenId)!) : ''}`}
                value={toAmount}
                onChange={e => setToAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available:{' '}
                {toTokenId
                  ? toBalance.isLoading
                    ? '...'
                    : `${formatBalance(toBalance.balanceWei)} ${getTokenLabel(findToken(toTokenId)!)}`
                  : '-'}
              </p>
            </div>
          </div>

          <div className="flex gap-5 w-full">
            <Button size="sm" className="flex-1">
              Swap
            </Button>
          </div>
        </div>
      )}

      <PoweredByHyperliquid />
    </>
  )
}
