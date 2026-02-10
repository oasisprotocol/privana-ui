import { Outlet } from 'react-router'
import { Layout } from '../../components/Layout'

export const Dashboard = () => {
  return (
    <Layout dashboard>
      <Outlet />
    </Layout>
  )
}
