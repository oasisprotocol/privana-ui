import { createBrowserRouter } from 'react-router'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { DashboardHome } from './pages/Dashboard/DashboardHome'
import { NotFound } from './components/NotFound'
import { ProtectedLayout } from './components/ProtectedLayout'
import { SwapDashboard } from './pages/Swap/SwapDashboard'
import { EarnDashboard } from './pages/Earn/EarnDashboard'
import { EarnCreate } from './pages/Earn/EarnCreate'
import { EarnWithdraw } from './pages/Earn/EarnWithdraw'
import { Activity } from './pages/Activity'
import { Vault } from './pages/Vault'
import { activityPath, earnPath, homePath, dashboardPath, tradePath, vaultPath } from './paths'

export const router = createBrowserRouter([
  {
    path: homePath(),
    element: <Home />,
  },
  {
    // Single shared layout: Dashboard renders <Layout> (top nav + mobile bottom
    // nav) once and keeps it mounted across navigations — only the <Outlet>
    // content swaps, so the menu no longer flickers between routes.
    element: <Dashboard />,
    children: [
      {
        path: dashboardPath(),
        element: <ProtectedLayout />,
        children: [
          {
            index: true,
            element: <DashboardHome />,
          },
        ],
      },
      {
        path: tradePath(),
        element: <ProtectedLayout />,
        children: [
          {
            index: true,
            element: <SwapDashboard />,
          },
        ],
      },
      {
        path: earnPath(),
        element: <ProtectedLayout />,
        children: [
          {
            index: true,
            element: <EarnDashboard />,
          },
          {
            path: 'create',
            children: [
              {
                index: true,
                element: <EarnCreate />,
              },
              {
                path: ':poolId',
                element: <EarnCreate />,
              },
            ],
          },
          {
            path: 'withdraw/:poolId',
            element: <EarnWithdraw />,
          },
        ],
      },
      {
        path: activityPath(),
        element: <ProtectedLayout />,
        children: [
          {
            index: true,
            element: <Activity />,
          },
        ],
      },
      {
        path: vaultPath(),
        element: <ProtectedLayout />,
        children: [
          {
            index: true,
            element: <Vault />,
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
