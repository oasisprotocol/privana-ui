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
import { useTokens } from '@/api/swap'

const steps = ['1. Execute your private swap', '2. Review', '3. Enjoy']

export const SwapDashboard = () => {
  const [step] = useState(0)
  const { data, isLoading, error } = useTokens()

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

      {isLoading && <p>Loading tokens...</p>}
      {error && <p>Failed to load tokens: {error.message}</p>}
      {data && (
        <ul>
          {data.tokens.map((token) => (
            <li key={token.token_id}>
              {token.symbol ?? token.token_type_name} — {token.chain_name ?? `Chain ${token.chain_id}`} ({token.token_address ?? token.token_id})
            </li>
          ))}
        </ul>
      )}

      <PoweredByHyperliquid />
    </>
  )
}
