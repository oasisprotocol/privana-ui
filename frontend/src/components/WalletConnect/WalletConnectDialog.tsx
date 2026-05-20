import { useConnect } from 'wagmi'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog'
import { Button } from '../ui/button'
import { TURNKEY_CONNECTOR_ID } from '@/wallet/turnkeyConnector'
import { IS_TURNKEY_ENABLED } from '../TurnkeyAuthProvider'
import { EmbeddedLoginButton } from './EmbeddedLoginButton'

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export const WalletConnectDialog = ({ open, onOpenChange }: Props) => {
  const { connect, connectors } = useConnect()
  // The Turnkey connector is driven by handleLogin (see EmbeddedLoginButton),
  // not a direct wagmi connect, so it's excluded from the external list.
  const externalConnectors = connectors.filter(c => c.id !== TURNKEY_CONNECTOR_ID)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Connect a wallet</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-2">
          {IS_TURNKEY_ENABLED && <EmbeddedLoginButton onDone={() => onOpenChange(false)} />}
          {externalConnectors.map(connector => (
            <Button
              key={connector.uid}
              variant="secondary"
              onClick={() => {
                connect({ connector })
                onOpenChange(false)
              }}
            >
              {connector.name}
            </Button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  )
}
