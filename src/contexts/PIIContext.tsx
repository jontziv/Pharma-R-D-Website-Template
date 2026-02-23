import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useAuth } from './AuthContext'

interface PIIContextValue {
  /** When true, PII fields are masked in the UI */
  hidePII: boolean
  /** Only lab_managers can toggle; returns false for other roles */
  canTogglePII: boolean
  togglePII: () => void
  /** Whether a specific field should be shown unmasked */
  piiVisible: boolean
}

const PIIContext = createContext<PIIContextValue | null>(null)

const STORAGE_KEY = 'pharmalab_hide_pii'

export function PIIProvider({ children }: { children: ReactNode }) {
  const { profile } = useAuth()
  const [hidePII, setHidePII] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      return stored !== null ? stored === 'true' : true // default: hide PII
    } catch {
      return true
    }
  })

  const canTogglePII = profile?.role === 'lab_manager'
  // PII is visible only when: user is lab_manager AND toggle is OFF
  const piiVisible = canTogglePII && !hidePII

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(hidePII))
    } catch {
      // ignore storage errors
    }
  }, [hidePII])

  function togglePII() {
    if (!canTogglePII) return
    setHidePII((prev) => !prev)
  }

  return (
    <PIIContext.Provider value={{ hidePII, canTogglePII, togglePII, piiVisible }}>
      {children}
    </PIIContext.Provider>
  )
}

export function usePII() {
  const ctx = useContext(PIIContext)
  if (!ctx) throw new Error('usePII must be used inside <PIIProvider>')
  return ctx
}
