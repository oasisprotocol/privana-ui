import { useLockedFunds } from '@oasisprotocol/privana-sdk'
import { PageHeading } from '@/components/PageHeading'
import { Skeleton } from '@/components/ui/skeleton'
import { ConnectedAppCard } from './ConnectedAppCard'
import { KNOWN_APPS } from '@/config/apps'

export const Apps = () => {
  const { locks, isLoading } = useLockedFunds()

  return (
    <>
      <PageHeading
        title="Connected apps"
        description="Apps with active or expired locks against your Privana balance. Reclaim funds the moment a lock expires."
      />
      <div className="flex flex-col gap-4">
        {isLoading
          ? KNOWN_APPS.map(app => (
              <Skeleton key={app.serviceAddress} className="h-32 w-full max-w-120 mx-auto rounded-[14px]" />
            ))
          : KNOWN_APPS.map(app => {
              const appLocks = locks.filter(
                l => l.service_address.toLowerCase() === app.serviceAddress.toLowerCase(),
              )
              return <ConnectedAppCard key={app.serviceAddress} app={app} locks={appLocks} />
            })}
      </div>
    </>
  )
}
