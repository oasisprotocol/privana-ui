import { createBrowserRouter } from 'react-router'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { DashboardHome } from './pages/Dashboard/DashboardHome'
import { Deposit } from './pages/Dashboard/Deposit'
import { CopyTrading } from './pages/CopyTrading'
import { CopyTradingDetails } from './pages/CopyTradingDetails'
import { CreateStrategy } from './pages/CreateStrategy'
import { NotFound } from './components/NotFound'
import { ProtectedLayout } from './components/ProtectedLayout'
import { Swap } from './pages/Swap'
import { AuthCallback } from './pages/AuthCallback'

export const router = createBrowserRouter([
  {
    path: '/',
    element: <Home />,
  },
  {
    path: '/portfolio',
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
    path: 'copy-trading',
    children: [
      {
        element: <Dashboard />,
        children: [
          {
            index: true,
            element: <CopyTrading />,
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
                element: <CreateStrategy />,
              },
              {
                path: ':id',
                element: <CopyTradingDetails />,
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: 'swap',
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
    path: 'auth/callback',
    element: <AuthCallback />,
  },
  {
    path: '*',
    element: <NotFound />,
  },
])
