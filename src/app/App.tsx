import { RouterProvider } from 'react-router'
import { router } from './routes'
import { AuthProvider } from '../contexts/AuthContext'
import { PIIProvider } from '../contexts/PIIContext'

export default function App() {
  return (
    <AuthProvider>
      <PIIProvider>
        <RouterProvider router={router} />
      </PIIProvider>
    </AuthProvider>
  )
}
