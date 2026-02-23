import { Navigate, Outlet } from 'react-router'
import { Loader2, Microscope } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'

export function ProtectedRoute() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#f0f4f8] flex flex-col items-center justify-center gap-4">
        <div className="w-14 h-14 rounded-2xl bg-[#0b1e3d] flex items-center justify-center shadow-xl">
          <Microscope className="w-7 h-7 text-white" />
        </div>
        <Loader2 className="w-6 h-6 text-[#2563eb] animate-spin" />
        <p className="text-sm text-gray-500">Loading PharmaLab…</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Outlet />
}
