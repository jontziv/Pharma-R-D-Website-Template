import { createBrowserRouter } from 'react-router'
import { Layout } from './components/Layout'
import { Dashboard } from './components/Dashboard'
import { Experiments } from './components/Experiments'
import { ExperimentDetail } from './components/ExperimentDetail'
import { LabNotebook } from './components/LabNotebook'
import { Protocols } from './components/Protocols'
import { Analytics } from './components/Analytics'
import { Samples } from './components/Samples'
import { LoginPage } from './components/auth/LoginPage'
import { ProtectedRoute } from './components/auth/ProtectedRoute'

export const router = createBrowserRouter([
  {
    path: '/login',
    Component: LoginPage,
  },
  {
    path: '/',
    Component: ProtectedRoute,
    children: [
      {
        Component: Layout,
        children: [
          { index: true, Component: Dashboard },
          { path: 'experiments', Component: Experiments },
          { path: 'experiments/:id', Component: ExperimentDetail },
          { path: 'lab-notebook', Component: LabNotebook },
          { path: 'protocols', Component: Protocols },
          { path: 'analytics', Component: Analytics },
          { path: 'samples', Component: Samples },
        ],
      },
    ],
  },
])
