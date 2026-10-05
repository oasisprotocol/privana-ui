import { Outlet } from 'react-router'
import { Layout } from '../../components/Layout'
import { AppToaster, TransferNotifications } from '../../components/TransferNotifications'

export const Dashboard = () => {
  return (
    <Layout>
      <Outlet />
      <TransferNotifications />
      <AppToaster />
    </Layout>
  )
}
