import { toast } from 'sonner'
import { NotificationToast } from './NotificationToast'
import type { TransferNotification } from './notifications'

const DURATION_MS = 5_000

export function notify(notification: TransferNotification) {
  toast.custom(id => <NotificationToast {...notification} onDismiss={() => toast.dismiss(id)} />, {
    duration: DURATION_MS,
  })
}
