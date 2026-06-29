import { NavLink } from 'react-router-dom'
import {
  LayoutDashboard,
  Ticket,
  Bell,
  Users,
  Settings,
} from 'lucide-react'
import { useUnreadCount, useRequestCount } from '../../hooks/useRequests'
import { useCurrentProfile } from '../../hooks/useCurrentProfile'

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/requests', icon: Ticket, label: 'Requests' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/team', icon: Users, label: 'Team' },
  { to: '/settings', icon: Settings, label: 'Settings' },
]

// Helpers
function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

const roleColors: Record<string, string> = {
  admin: '#A32D2D',
  agent: '#185FA5',
  user: '#27500A',
}

const roleBgColors: Record<string, string> = {
  admin: 'var(--bg-danger)',
  agent: 'var(--bg-accent)',
  user: 'var(--bg-success)',
}

export default function Sidebar() {
  const { data: unreadCount = 0 } = useUnreadCount()
  const { data: requestCount = 0 } = useRequestCount()
  const { profile } = useCurrentProfile()

  const initials = getInitials(profile?.full_name ?? null, profile?.email ?? 'U')
  const role = profile?.role ?? 'user'

  return (
    <aside
      className="flex flex-col border-r shrink-0 h-full overflow-hidden"
      style={{
        width: 'var(--sidebar-width)',
        backgroundColor: 'var(--surface-1)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-xl py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <div
          className="flex items-center justify-center rounded-sm"
          style={{
            width: 20,
            height: 20,
            backgroundColor: 'var(--fill-accent)',
            borderRadius: 5,
          }}
        >
          <span className="text-[10px] font-bold text-white">O</span>
        </div>
        <span
          className="text-[13px] font-semibold tracking-tight"
          style={{ color: 'var(--text-primary)' }}
        >
          OpsHub
        </span>
      </div>

      {/* Navigation */}
      <nav className="flex flex-col gap-0.5 px-2 py-3 flex-1 overflow-y-auto">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className="relative flex items-center gap-2 px-3 py-[7px] text-xs rounded-sm transition-all"
            style={{
              transitionDuration: 'var(--duration-fast)',
              transitionTimingFunction: 'var(--ease-out-expo)',
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 4%, transparent)'
              }
            }}
            onMouseLeave={(e) => {
              if (!e.currentTarget.classList.contains('active')) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <div
                    className="absolute left-0 top-1/2 -translate-y-1/2 w-[2px] h-4 rounded-r-full"
                    style={{ backgroundColor: 'var(--fill-accent)' }}
                  />
                )}
                <item.icon
                  size={14}
                  style={{
                    color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
                  }}
                />
                <span
                  className="flex-1"
                  style={{
                    color: isActive ? 'var(--text-accent)' : 'var(--text-secondary)',
                    fontWeight: isActive ? 500 : 400,
                  }}
                >
                  {item.label}
                </span>
                {(item.label === 'Notifications' ? unreadCount > 0 : item.label === 'Requests' ? requestCount > 0 : false) && (
                  <span
                    className="text-[9px] font-medium px-[5px] py-[1px] rounded-sm"
                    style={{
                      backgroundColor: '#E24B4A',
                      color: '#fff',
                    }}
                  >
                    {item.label === 'Notifications' ? unreadCount : requestCount}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* User profile footer */}
      <div
        className="border-t shrink-0 px-xl py-3"
        style={{ borderColor: 'var(--border)' }}
      >
        <div className="flex items-center gap-2.5">
          {/* Avatar */}
          <div
            className="flex items-center justify-center rounded-full shrink-0 text-[10px] font-medium text-white"
            style={{
              width: 32,
              height: 32,
              backgroundColor: '#B5D4F4',
              color: '#0C447C',
            }}
            title={profile?.full_name ?? profile?.email ?? 'User'}
          >
            {initials}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div
              className="text-xs font-medium truncate"
              style={{ color: 'var(--text-primary)' }}
            >
              {profile?.full_name ?? profile?.email ?? 'User'}
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              {profile?.full_name && (
                <span
                  className="text-[9px] truncate"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {profile.email}
                </span>
              )}
              <span
                className="text-[9px] font-medium px-1 py-[1px] rounded-sm"
                style={{
                  backgroundColor: roleBgColors[role],
                  color: roleColors[role],
                }}
              >
                {role.charAt(0).toUpperCase() + role.slice(1)}
              </span>
            </div>
          </div>
        </div>
        <div
          className="text-[8px] mt-1.5 text-center"
          style={{ color: 'var(--text-muted)' }}
        >
          v0.1.0
        </div>
      </div>
    </aside>
  )
}
