import { useEffect, useState } from 'react'
import { MoonPayProvider } from '@moonpay/moonpay-react'
import { useTokenList } from '@oasisprotocol/privana-sdk'
import { FiatOnRampForm } from '@oasisprotocol/privana-sdk/on-ramp'
import { PageHeading } from '@/components/PageHeading'
import { getMoonpayCode } from '@/config/tokens'

const MOONPAY_API_KEY = import.meta.env.VITE_MOONPAY_API_KEY

export const OnRamp = () => {
  const { tokens, isLoading, isError, error } = useTokenList()
  const onRampable = tokens.filter(t => Boolean(getMoonpayCode(t.token_id)))
  const [selectedTokenId, setSelectedTokenId] = useState<string>('')

  useEffect(() => {
    if (!selectedTokenId && onRampable.length > 0) {
      setSelectedTokenId(onRampable[0].token_id)
    }
  }, [onRampable, selectedTokenId])

  const currencyCode = selectedTokenId ? getMoonpayCode(selectedTokenId) : undefined

  return (
    <>
      <PageHeading
        title="Buy crypto (temporary)"
        description="Temporary preview of the MoonPay on-ramp flow for product review. Not linked from the main nav."
      />
      <MoonPayProvider apiKey={MOONPAY_API_KEY} debug={import.meta.env.DEV}>
        <div className="mx-auto flex max-w-md flex-col gap-4">
          {isLoading ? (
            <p>Loading tokens…</p>
          ) : isError ? (
            <p>Error: {error?.message}</p>
          ) : onRampable.length === 0 ? (
            <p>No on-rampable tokens available.</p>
          ) : (
            <>
              <select
                className="w-full rounded border px-2 py-1 text-sm"
                value={selectedTokenId}
                onChange={e => setSelectedTokenId(e.target.value)}
              >
                {onRampable.map(t => (
                  <option key={t.token_id} value={t.token_id}>
                    {t.symbol ?? t.token_id} ({t.chain_name})
                  </option>
                ))}
              </select>
              {selectedTokenId && currencyCode && (
                <FiatOnRampForm
                  tokenId={selectedTokenId as `0x${string}`}
                  currencyCode={currencyCode}
                  onCredited={hash => console.log('[on-ramp] credited:', hash)}
                  onError={err => console.error('[on-ramp] error:', err)}
                />
              )}
            </>
          )}
        </div>
      </MoonPayProvider>
    </>
  )
}
