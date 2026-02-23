import { Outlet, NavLink, useLocation } from 'react-router'
import {
  LayoutDashboard, FlaskConical, BookOpen, ClipboardList, BarChart3, TestTube,
  Bell, Search, ChevronDown, Settings, HelpCircle, LogOut, Menu, X, Microscope,
  Eye, EyeOff, Shield,
} from 'lucide-react'
import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { usePII } from '../../contexts/PIIContext'
import { getInitials } from '../../lib/pii'

const navItems = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/experiments', label: 'Experiments', icon: FlaskConical },
  { to: '/lab-notebook', label: 'Lab Notebook', icon: BookOpen },
  { to: '/samples', label: 'Samples', icon: TestTube },
  { to: '/protocols', label: 'Protocols', icon: ClipboardList },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
]

const roleBadge: Record<string, { label: string; color: string }> = {
  scientist: { label: 'Scientist', color: 'bg-blue-500/20 text-blue-300' },
  lab_manager: { label: 'Lab Manager', color: 'bg-emerald-500/20 text-emerald-300' },
  reviewer: { label: 'Reviewer', color: 'bg-amber-500/20 text-amber-300' },
}

export function Layout() {
  const { profile, signOut } = useAuth()
  const { hidePII, canTogglePII, togglePII } = usePII()

  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [userOpen, setUserOpen] = useState(false)
  const location = useLocation()

  const currentPage = navItems.find((n) =>
    n.to === '/' ? location.pathname === '/' : location.pathname.startsWith(n.to)
  )

  const initials = getInitials(profile?.full_name)
  const displayName = profile?.full_name ?? profile?.email ?? 'User'
  const shortName = displayName.split(' ').slice(0, 2).join(' ')
  const roleInfo = roleBadge[profile?.role ?? 'scientist']

  return (
    <div className="flex h-screen bg-[#f0f4f8] overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full z-30 w-64 bg-[#0b1e3d] flex flex-col transition-transform duration-300 lg:static lg:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-5 border-b border-white/10">
          <div className="w-9 h-9 rounded-xl bg-[#2563eb] flex items-center justify-center shadow-lg">
            <Microscope className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-semibold text-sm tracking-wide">PharmaLab</p>
            <p className="text-[#7ca3d4] text-xs">R&D Platform</p>
          </div>
          <button
            className="ml-auto lg:hidden text-white/60 hover:text-white"
            onClick={() => setSidebarOpen(false)}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
          <p className="text-[#4a7aab] text-xs font-semibold px-3 mb-3 uppercase tracking-wider">
            Main Menu
          </p>
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-150 group ${
                  isActive
                    ? 'bg-[#2563eb] text-white shadow-md shadow-blue-900/40'
                    : 'text-[#7ca3d4] hover:bg-white/5 hover:text-white'
                }`
              }
              onClick={() => setSidebarOpen(false)}
            >
              <Icon className="w-4.5 h-4.5 shrink-0" />
              <span className="text-sm">{label}</span>
            </NavLink>
          ))}

          <div className="pt-4">
            <p className="text-[#4a7aab] text-xs font-semibold px-3 mb-3 uppercase tracking-wider">
              Support
            </p>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#7ca3d4] hover:bg-white/5 hover:text-white transition-all text-sm">
              <Settings className="w-4.5 h-4.5" />
              Settings
            </button>
            <button className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[#7ca3d4] hover:bg-white/5 hover:text-white transition-all text-sm">
              <HelpCircle className="w-4.5 h-4.5" />
              Help & Docs
            </button>
          </div>
        </nav>

        {/* User */}
        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-sm font-semibold shrink-0">
              {initials}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white text-sm font-medium truncate">{shortName}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full ${roleInfo.color}`}>
                {roleInfo.label}
              </span>
            </div>
            <button onClick={signOut} className="text-[#7ca3d4] hover:text-white transition" title="Sign out">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center gap-4 shrink-0">
          <button
            className="lg:hidden text-gray-500 hover:text-gray-700"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-gray-800">{currentPage?.label ?? 'PharmaLab'}</h1>
            <p className="text-gray-400 text-xs">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
              })}
            </p>
          </div>

          <div className="flex-1 max-w-md ml-4 hidden sm:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search experiments, protocols, samples..."
                className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-200 transition"
              />
            </div>
          </div>

          <div className="ml-auto flex items-center gap-3">
            {/* PII Toggle — lab_managers only */}
            {canTogglePII && (
              <button
                onClick={togglePII}
                title={hidePII ? 'PII hidden — click to reveal' : 'PII visible — click to hide'}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium transition ${
                  hidePII
                    ? 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'
                    : 'bg-amber-50 border-amber-200 text-amber-700 hover:bg-amber-100'
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{hidePII ? 'PII Hidden' : 'PII Visible'}</span>
                {hidePII ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            )}

            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => { setNotifOpen(!notifOpen); setUserOpen(false) }}
                className="relative w-9 h-9 flex items-center justify-center rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition"
              >
                <Bell className="w-4.5 h-4.5 text-gray-600" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </button>
              {notifOpen && (
                <div className="absolute right-0 top-12 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-50">
                  <div className="p-4 border-b border-gray-100">
                    <p className="font-semibold text-sm text-gray-800">Notifications</p>
                  </div>
                  <div className="py-2">
                    {[
                      { id: 1, text: 'Experiment EXP-2041 completed', time: '2m ago', dot: 'bg-emerald-400' },
                      { id: 2, text: 'Protocol review due: PCR-007', time: '1h ago', dot: 'bg-amber-400' },
                      { id: 3, text: 'Sample batch SB-192 ready', time: '3h ago', dot: 'bg-blue-400' },
                    ].map((n) => (
                      <div key={n.id} className="px-4 py-3 hover:bg-gray-50 transition cursor-pointer">
                        <div className="flex items-start gap-2.5">
                          <div className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.dot}`} />
                          <div>
                            <p className="text-sm text-gray-700">{n.text}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{n.time}</p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="p-3 border-t border-gray-100 text-center">
                    <button className="text-xs text-blue-600 hover:text-blue-700 font-medium">
                      View all notifications
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* User Menu */}
            <div className="relative">
              <button
                onClick={() => { setUserOpen(!userOpen); setNotifOpen(false) }}
                className="flex items-center gap-2 py-1.5 px-2.5 rounded-xl bg-gray-50 hover:bg-gray-100 border border-gray-200 transition"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-br from-blue-400 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                  {initials}
                </div>
                <span className="text-sm text-gray-700 hidden sm:block max-w-[120px] truncate">
                  {shortName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </button>
              {userOpen && (
                <div className="absolute right-0 top-12 w-52 bg-white border border-gray-200 rounded-2xl shadow-xl z-50 py-2">
                  <div className="px-4 py-2.5 border-b border-gray-100">
                    <p className="text-sm font-medium text-gray-800 truncate">{displayName}</p>
                    <p className="text-xs text-gray-400 truncate">{profile?.email}</p>
                    <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                      profile?.role === 'lab_manager' ? 'bg-emerald-100 text-emerald-700' :
                      profile?.role === 'reviewer' ? 'bg-amber-100 text-amber-700' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {roleInfo.label}
                    </span>
                  </div>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">Profile</button>
                  <button className="w-full text-left px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 transition">Settings</button>
                  <div className="my-1 border-t border-gray-100" />
                  <button
                    onClick={signOut}
                    className="w-full text-left px-4 py-2.5 text-sm text-red-500 hover:bg-red-50 transition"
                  >
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
