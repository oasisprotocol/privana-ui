import { createBrowserRouter } from 'react-router'
import { Home } from './pages/Home'
import { Dashboard } from './pages/Dashboard'
import { DashboardHome } from './pages/Dashboard/DashboardHome'
import { Deposit } from './pages/Dashboard/Deposit'
import { CopyTrading } from './pages/CopyTrading'
import { CreateStrategy } from './pages/CreateStrategy'
import { NotFound } from './components/NotFound'
import { ProtectedLayout } from './components/ProtectedLayout'

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
    element: <ProtectedLayout />,
    children: [
      {
        element: <Dashboard />,
        children: [
          {
            index: true,
            element: <CopyTrading />,
          },
          {
            path: 'create',
            element: <CreateStrategy />,
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
