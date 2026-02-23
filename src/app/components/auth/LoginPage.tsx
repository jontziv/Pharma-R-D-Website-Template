import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router'
import { Microscope, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useAuth } from '../../../contexts/AuthContext'

export function LoginPage() {
  const { user, signIn, signUp, loading } = useAuth()
  const navigate = useNavigate()

  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [role, setRole] = useState('scientist')
  const [showPassword, setShowPassword] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  // Already logged in
  if (!loading && user) return <Navigate to="/" replace />

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setSubmitting(true)

    if (mode === 'login') {
      const { error: err } = await signIn(email, password)
      if (err) {
        setError(err)
        setSubmitting(false)
      } else {
        navigate('/')
      }
    } else {
      if (!fullName.trim()) {
        setError('Full name is required.')
        setSubmitting(false)
        return
      }
      const { error: err } = await signUp(email, password, fullName, role)
      if (err) {
        setError(err)
        setSubmitting(false)
      } else {
        // Email confirmation is disabled — sign in immediately after signup
        const { error: signInErr } = await signIn(email, password)
        if (signInErr) {
          // Signup succeeded but auto-login failed (shouldn't happen without email confirm)
          setSuccess('Account created! You can now sign in.')
          setMode('login')
          setSubmitting(false)
        } else {
          navigate('/')
        }
      }
    }
  }

  return (
    <div className="min-h-screen bg-[#f0f4f8] flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-blue-100 opacity-40" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-indigo-100 opacity-40" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo / Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-[#0b1e3d] shadow-xl mb-4">
            <Microscope className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-[#0b1e3d]">PharmaLab</h1>
          <p className="text-gray-500 text-sm mt-1">R&D Platform</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-gray-100">
            <button
              onClick={() => { setMode('login'); setError(null); setSuccess(null) }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-[#2563eb] border-b-2 border-[#2563eb]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode('signup'); setError(null); setSuccess(null) }}
              className={`flex-1 py-4 text-sm font-medium transition-colors ${
                mode === 'signup'
                  ? 'text-[#2563eb] border-b-2 border-[#2563eb]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Create Account
            </button>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Dr. Jane Smith"
                  required
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
                />
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Email Address</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@institution.com"
                required
                className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-700 mb-1.5">Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={mode === 'signup' ? 'Min. 8 characters' : '••••••••'}
                  minLength={mode === 'signup' ? 8 : undefined}
                  required
                  className="w-full px-4 py-2.5 pr-10 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-100 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((p) => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {mode === 'signup' && (
              <div>
                <label className="block text-sm text-gray-700 mb-1.5">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full px-4 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none appearance-none"
                >
                  <option value="scientist">Scientist</option>
                  <option value="lab_manager">Lab Manager</option>
                  <option value="reviewer">Reviewer</option>
                </select>
              </div>
            )}

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {error}
              </div>
            )}

            {success && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-700">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full flex items-center justify-center gap-2 bg-[#2563eb] hover:bg-[#1d4ed8] disabled:bg-blue-300 text-white py-3 rounded-xl text-sm font-semibold transition shadow-sm shadow-blue-200"
            >
              {submitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : mode === 'login' ? (
                'Sign In'
              ) : (
                'Create Account'
              )}
            </button>
          </form>

          {/* Role legend */}
          <div className="px-6 pb-6">
            <div className="pt-4 border-t border-gray-100">
              <p className="text-xs text-gray-400 text-center mb-2">Role permissions</p>
              <div className="grid grid-cols-3 gap-2 text-xs text-center">
                <div className="bg-blue-50 rounded-lg p-2">
                  <p className="font-medium text-blue-700">Scientist</p>
                  <p className="text-blue-500 mt-0.5">Create & edit own records</p>
                </div>
                <div className="bg-emerald-50 rounded-lg p-2">
                  <p className="font-medium text-emerald-700">Lab Manager</p>
                  <p className="text-emerald-500 mt-0.5">Full access + PII toggle</p>
                </div>
                <div className="bg-amber-50 rounded-lg p-2">
                  <p className="font-medium text-amber-700">Reviewer</p>
                  <p className="text-amber-500 mt-0.5">Read-only access</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          PharmaLab R&D Platform · Secure & Compliant
        </p>
      </div>
    </div>
  )
}
