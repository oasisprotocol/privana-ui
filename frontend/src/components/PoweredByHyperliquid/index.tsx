import HyperliquidLogo from '../../assets/hyperliquid.svg'

export const PoweredByHyperliquid = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-2.5">
      <div className="text-muted-foreground text-sm font-normal">Powered by</div>
      <img src={HyperliquidLogo} alt="Hyperliquid" className="h-5" />
    </div>
  )
}
