import { useState, useRef, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sun, Moon, Bell, LogOut, User as UserIcon, ChevronDown } from 'lucide-react'
import { useTheme } from '../../contexts/ThemeContext'
import { useAuth } from '../../contexts/AuthContext'
import { useUnreadCount } from '../../hooks/useRequests'

export default function Topbar() {
  const { theme, toggleTheme } = useTheme()
  const { user, signOut } = useAuth()
  const navigate = useNavigate()
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const { data: unreadCount = 0 } = useUnreadCount()
  const [isPulsing, setIsPulsing] = useState(false)
  const prevCountRef = useRef(-1)

  // Pulse animation when unread count increases
  useEffect(() => {
    if (prevCountRef.current >= 0 && unreadCount > prevCountRef.current) {
      setIsPulsing(true)
      const timer = setTimeout(() => setIsPulsing(false), 550)
      prevCountRef.current = unreadCount
      return () => clearTimeout(timer)
    }
    prevCountRef.current = unreadCount
  }, [unreadCount])

  // Fermer le menu au clic en dehors
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    if (showMenu) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  const displayName = user?.user_metadata?.full_name ?? user?.email ?? 'User'
  const initials = displayName
    .split(' ')
    .map((w: string) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join('')
    .toUpperCase()
    .padEnd(2, '?')

  return (
    <header
      className="flex items-center gap-3 px-xl border-b shrink-0"
      style={{
        height: 'var(--topbar-height)',
        backgroundColor: 'var(--surface-2)',
        borderColor: 'var(--border)',
      }}
    >
      {/* Spacer */}
      <div className="flex-1" />

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="flex items-center justify-center rounded-sm transition-all cursor-pointer"
          style={{
            width: 28,
            height: 28,
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent',
            transitionDuration: 'var(--duration-fast)',
            transitionTimingFunction: 'var(--ease-out-expo)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 6%, transparent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          aria-label="Toggle theme"
        >
          {theme === 'light' ? <Moon size={14} /> : <Sun size={14} />}
        </button>

        {/* Notifications bell */}
        <button
          className="flex items-center justify-center rounded-sm relative transition-all cursor-pointer"
          style={{
            width: 28,
            height: 28,
            color: 'var(--text-secondary)',
            backgroundColor: 'transparent',
            transitionDuration: 'var(--duration-fast)',
            transitionTimingFunction: 'var(--ease-out-expo)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 6%, transparent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
          aria-label="Notifications"
        >
          <Bell size={14} />
          {unreadCount > 0 && (
            <span
              className={`absolute -top-1 -right-1 text-[8px] font-bold px-[4px] py-[1px] rounded-full leading-none${isPulsing ? ' animate-badge-pulse' : ''}`}
              style={{
                backgroundColor: '#E24B4A',
                color: '#fff',
                minWidth: 14,
                height: 14,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </button>

        {/* Avatar + menu */}
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setShowMenu(!showMenu)}
            className="flex items-center gap-1 rounded-sm cursor-pointer transition-all"
            style={{
              padding: '2px 4px 2px 2px',
              color: 'var(--text-secondary)',
              transitionDuration: 'var(--duration-fast)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 6%, transparent)'
            }}
            onMouseLeave={(e) => {
              if (!showMenu) {
                e.currentTarget.style.backgroundColor = 'transparent'
              }
            }}
            aria-label="User menu"
          >
            <div
              className="flex items-center justify-center rounded-full text-[9px] font-medium"
              style={{
                width: 24,
                height: 24,
                backgroundColor: '#B5D4F4',
                color: '#0C447C',
              }}
              title={displayName}
            >
              {initials}
            </div>
            <ChevronDown size={10} style={{ color: 'var(--text-muted)' }} />
          </button>

          {/* Dropdown menu */}
          {showMenu && (
            <div
              className="absolute right-0 top-full mt-1 rounded-card py-1 shadow-lg z-50"
              style={{
                minWidth: 180,
                backgroundColor: 'var(--surface-1)',
                border: '0.5px solid var(--border)',
              }}
            >
              {/* User info */}
              <div className="px-3 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
                <div
                  className="text-xs font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {displayName}
                </div>
                <div
                  className="text-[10px] truncate mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {user?.email ?? ''}
                </div>
              </div>

              {/* Settings */}
              <button
                onClick={() => { setShowMenu(false); navigate('/settings') }}
                className="flex items-center gap-2 w-full text-xs px-3 py-2 cursor-pointer transition-all"
                style={{
                  color: 'var(--text-secondary)',
                  transitionDuration: 'var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 4%, transparent)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <UserIcon size={13} />
                Profile & Settings
              </button>

              {/* Sign out */}
              <button
                onClick={() => { setShowMenu(false); signOut() }}
                className="flex items-center gap-2 w-full text-xs px-3 py-2 cursor-pointer transition-all"
                style={{
                  color: '#A32D2D',
                  transitionDuration: 'var(--duration-fast)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--bg-danger)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent'
                }}
              >
                <LogOut size={13} />
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
