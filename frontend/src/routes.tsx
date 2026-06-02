import { createBrowserRouter } from 'react-router'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { DashboardHome } from './pages/Dashboard/DashboardHome'
import { Deposit } from './pages/Dashboard/Deposit'
import { NotFound } from './components/NotFound'
import { ProtectedLayout } from './components/ProtectedLayout'
import { Swap } from './pages/Swap'
import { Earn } from './pages/Earn'
import { EarnCreate } from './pages/Earn/EarnCreate'
import { EarnWithdraw } from './pages/Earn/EarnWithdraw'
import { Apps } from './pages/Apps'
import { Activity } from './pages/Activity'
import { OnRamp } from './pages/OnRamp'
import {
  activityPath,
  appsPath,
  earnPath,
  homePath,
  dashboardPath,
  onRampPath,
  tradePath,
} from './paths'

export const router = createBrowserRouter([
  {
    path: homePath(),
    element: <Home />,
  },
  {
    path: dashboardPath(),
    element: <ProtectedLayout />,
    children: [
      {
        element: <Dashboard />,
        children: [
          {
            index: true,
            element: <DashboardHome />,
          },
          {
            path: ':address',
            element: <Deposit />,
          },
        ],
      },
    ],
  },
  {
    path: tradePath(),
    children: [
      {
        element: <Dashboard />,
        children: [
          {
            index: true,
            element: <Swap />,
          },
        ],
      },
    ],
  },
  {
    path: earnPath(),
    children: [
      {
        element: <Dashboard />,
        children: [
          {
            index: true,
            element: <Earn />,
          },
        ],
      },
      {
        element: <ProtectedLayout />,
        children: [
          {
            element: <Dashboard />,
            children: [
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
        ],
      },
    ],
  },
  {
    path: appsPath(),
    children: [
      {
        element: <Dashboard />,
        children: [
          {
            index: true,
            element: <Apps />,
          },
        ],
      },
    ],
  },
  {
    path: activityPath(),
    element: <ProtectedLayout />,
    children: [
      {
        element: <Dashboard />,
        children: [
          {
            index: true,
            element: <Activity />,
          },
        ],
      },
    ],
  },
  {
    path: onRampPath(),
    element: <ProtectedLayout />,
    children: [
      {
        element: <Dashboard />,
        children: [
          {
            index: true,
            element: <OnRamp />,
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
