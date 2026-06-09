import { MoonPayProvider } from '@moonpay/moonpay-react'
import { FiatOnRampForm } from '@oasisprotocol/privana-sdk/on-ramp'
import { PageHeading } from '@/components/PageHeading'
import { ONRAMPABLE_TOKEN_IDS, getMoonpayCode } from '@/config/tokens'

const MOONPAY_API_KEY = import.meta.env.VITE_MOONPAY_API_KEY

export const OnRamp = () => {
  const tokenId = ONRAMPABLE_TOKEN_IDS[0]
  const currencyCode = tokenId ? getMoonpayCode(tokenId) : undefined

  return (
    <>
      <PageHeading
        title="On-Ramp Test"
        description="Buy crypto via MoonPay (sandbox). Funds are delivered directly to your Privana deposit address and credited to your balance."
      />

      {tokenId && currencyCode ? (
        <div className="mx-auto flex max-w-md flex-col gap-4">
          <MoonPayProvider apiKey={MOONPAY_API_KEY} debug={import.meta.env.DEV}>
            <FiatOnRampForm
              tokenId={tokenId as `0x${string}`}
              currencyCode={currencyCode}
              onCredited={hash => console.log('[on-ramp] credited:', hash)}
              onError={err => console.error('[on-ramp] error:', err)}
            />
          </MoonPayProvider>
        </div>
      ) : (
        <p className="text-muted-foreground">No on-rampable tokens configured.</p>
      )}
    </>
  )
}
