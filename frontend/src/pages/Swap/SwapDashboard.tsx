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

const steps = ['1. Execute your private swap', '2. Review', '3. Enjoy']

export const SwapDashboard = () => {
  const [step] = useState(0)
  const { data, isLoading, error } = useTokens()

  const [fromTokenId, setFromTokenId] = useState<string>('')
  const [toTokenId, setToTokenId] = useState<string>('')
  const [fromAmount, setFromAmount] = useState('')
  const [toAmount, setToAmount] = useState('')

  const tokens = data?.tokens ?? []

  const getTokenLabel = (token: (typeof tokens)[number]) => token.symbol ?? token.token_type_name

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
              <Select value={fromTokenId} onValueChange={setFromTokenId}>
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
                placeholder={`0.00 ${fromTokenId ? getTokenLabel(tokens.find(t => t.token_id === fromTokenId)!) : ''}`}
                value={fromAmount}
                onChange={e => setFromAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available: TODO{' '}
                {fromTokenId ? getTokenLabel(tokens.find(t => t.token_id === fromTokenId)!) : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-4 items-start">
            <div className="flex flex-col gap-2">
              <Label>Asset</Label>
              <Select value={toTokenId} onValueChange={setToTokenId}>
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
                placeholder={`0.00 ${toTokenId ? getTokenLabel(tokens.find(t => t.token_id === toTokenId)!) : ''}`}
                value={toAmount}
                onChange={e => setToAmount(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Available: TBA {toTokenId ? getTokenLabel(tokens.find(t => t.token_id === toTokenId)!) : ''}
              </p>
            </div>
          </div>

          <div className="flex gap-5 w-full">
            <Button size="sm" className="flex-1">
              swap
            </Button>
          </div>
        </div>
      )}

      <PoweredByHyperliquid />
    </>
  )
}
