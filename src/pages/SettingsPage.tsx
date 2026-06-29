import { useState, useRef } from 'react'
import { useTheme } from '../contexts/ThemeContext'
import { useAuth } from '../contexts/AuthContext'
import { useCurrentProfile } from '../hooks/useCurrentProfile'
import { useUpdateProfile, useUploadProfileAvatar } from '../hooks/useRequests'
import { useToast } from '../contexts/ToastContext'
import {
  Sun, Moon, Bell, User, Info, Palette, LogOut,
  Camera, Check, X, Loader,
} from 'lucide-react'

// ============================================================
// Helpers
// ============================================================

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.split(' ').filter(Boolean)
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
    return name.slice(0, 2).toUpperCase()
  }
  return email.slice(0, 2).toUpperCase()
}

// ============================================================
// SettingRow
// ============================================================

function SettingRow({
  icon: Icon,
  label,
  description,
  children,
}: {
  icon: typeof Sun
  label: string
  description?: string
  children: React.ReactNode
}) {
  return (
    <div
      className="flex items-center justify-between px-4 py-3 rounded-sm transition-all"
      style={{ borderBottom: '0.5px solid var(--border)' }}
    >
      <div className="flex items-center gap-3">
        <div
          className="flex items-center justify-center rounded-full shrink-0"
          style={{ width: 32, height: 32, backgroundColor: 'var(--surface-2)' }}
        >
          <Icon size={14} style={{ color: 'var(--text-secondary)' }} />
        </div>
        <div>
          <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
            {label}
          </div>
          {description && (
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {description}
            </div>
          )}
        </div>
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

// ============================================================
// ToggleSwitch
// ============================================================

function ToggleSwitch({
  checked,
  onChange,
}: {
  checked: boolean
  onChange: (v: boolean) => void
}) {
  return (
    <button
      onClick={() => onChange(!checked)}
      className="relative w-8 h-4 rounded-full transition-all cursor-pointer"
      style={{
        backgroundColor: checked ? 'var(--fill-accent)' : 'var(--border)',
        transitionDuration: 'var(--duration-fast)',
        transitionTimingFunction: 'var(--ease-out-expo)',
      }}
      role="switch"
      aria-checked={checked}
    >
      <div
        className="absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all"
        style={{
          left: checked ? 'calc(100% - 14px)' : '2px',
          transitionDuration: 'var(--duration-snap)',
          transitionTimingFunction: 'var(--ease-out-expo)',
        }}
      />
    </button>
  )
}

// ============================================================
// SettingsPage
// ============================================================

export default function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { user, signOut } = useAuth()
  const { profile } = useCurrentProfile()
  const updateProfileMutation = useUpdateProfile()
  const uploadAvatarMutation = useUploadProfileAvatar()
  const { showToast } = useToast()

  // Édition du profil
  const [isEditing, setIsEditing] = useState(false)
  const [editName, setEditName] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Démarrer l'édition
  const startEditing = () => {
    setEditName(profile?.full_name ?? '')
    setIsEditing(true)
  }

  // Annuler
  const cancelEditing = () => {
    setIsEditing(false)
    setEditName('')
  }

  // Sauvegarder le nom
  const saveName = async () => {
    if (!user) return
    setIsSaving(true)
    try {
      await updateProfileMutation.mutateAsync({
        id: user.id,
        input: { full_name: editName.trim() || null },
      })
      showToast('Profile name updated successfully')
      setIsEditing(false)
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to update profile', 'error')
    } finally {
      setIsSaving(false)
    }
  }

  // Upload avatar
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validation
    if (!['image/png', 'image/jpeg', 'image/webp', 'image/gif'].includes(file.type)) {
      showToast('Please select a PNG, JPEG, WebP, or GIF image', 'error')
      return
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be smaller than 2MB', 'error')
      return
    }

    setIsSaving(true)
    try {
      const url = await uploadAvatarMutation.mutateAsync({ userId: user.id, file })
      await updateProfileMutation.mutateAsync({
        id: user.id,
        input: { avatar_url: url },
      })
      showToast('Avatar updated successfully')
    } catch (err) {
      showToast(err instanceof Error ? err.message : 'Failed to upload avatar', 'error')
    } finally {
      setIsSaving(false)
      // Reset file input
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  return (
    <div className="flex flex-col gap-6 max-w-2xl">
      {/* Header */}
      <div>
        <div
          className="text-[11px] font-medium uppercase tracking-wider mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Settings
        </div>
        <h1
          className="text-xl font-medium"
          style={{ color: 'var(--text-primary)' }}
        >
          Preferences
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
          Customize your OpsHub experience
        </p>
      </div>

      {/* Appearance */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Palette size={14} style={{ color: 'var(--text-muted)' }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Appearance
          </span>
        </div>

        <div
          className="rounded-sm"
          style={{
            border: '0.5px solid var(--border)',
            backgroundColor: 'var(--surface-1)',
          }}
        >
          <SettingRow icon={Sun} label="Theme" description="Choose your preferred appearance">
            <div className="flex gap-1">
              {[
                { value: 'light' as const, icon: Sun, label: 'Light' },
                { value: 'dark' as const, icon: Moon, label: 'Dark' },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setTheme(option.value)}
                  className="flex items-center gap-1 px-2 py-1 rounded-sm text-[10px] font-medium transition-all cursor-pointer"
                  style={{
                    backgroundColor: theme === option.value ? 'var(--fill-accent)' : 'transparent',
                    color: theme === option.value ? '#fff' : 'var(--text-secondary)',
                    transitionDuration: 'var(--duration-fast)',
                    transitionTimingFunction: 'var(--ease-out-expo)',
                  }}
                >
                  <option.icon size={12} />
                  {option.label}
                </button>
              ))}
            </div>
          </SettingRow>
        </div>
      </div>

      {/* Notifications */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Bell size={14} style={{ color: 'var(--text-muted)' }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Notifications
          </span>
        </div>

        <div
          className="rounded-sm"
          style={{
            border: '0.5px solid var(--border)',
            backgroundColor: 'var(--surface-1)',
          }}
        >
          <SettingRow icon={Bell} label="Push notifications" description="Receive browser notifications when you get new updates">
            <ToggleSwitch checked={true} onChange={() => {}} />
          </SettingRow>
          <SettingRow icon={Bell} label="Email notifications" description="Get email updates for important changes">
            <ToggleSwitch checked={true} onChange={() => {}} />
          </SettingRow>
          <SettingRow icon={Bell} label="Desktop badge" description="Show unread count on the app icon">
            <ToggleSwitch checked={true} onChange={() => {}} />
          </SettingRow>
        </div>
      </div>

      {/* Account */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <User size={14} style={{ color: 'var(--text-muted)' }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            Account
          </span>
        </div>

        <div
          className="rounded-sm"
          style={{
            border: '0.5px solid var(--border)',
            backgroundColor: 'var(--surface-1)',
          }}
        >
          {/* Profile card — version normale */}
          {profile && !isEditing && (
            <div
              className="flex items-center gap-3 px-4 py-3"
              style={{ borderBottom: '0.5px solid var(--border)' }}
            >
              {/* Avatar avec hover pour upload */}
              <div className="relative shrink-0">
                <div
                  className="flex items-center justify-center rounded-full text-sm font-medium text-white cursor-pointer group"
                  style={{
                    width: 48,
                    height: 48,
                    backgroundColor: '#B5D4F4',
                    color: '#0C447C',
                  }}
                  onClick={() => fileInputRef.current?.click()}
                  title="Click to change avatar"
                >
                  {getInitials(profile.full_name, profile.email)}
                  <div
                    className="absolute inset-0 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-all"
                    style={{
                      backgroundColor: 'rgba(0,0,0,0.4)',
                      transitionDuration: 'var(--duration-fast)',
                    }}
                  >
                    <Camera size={16} style={{ color: '#fff' }} />
                  </div>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp,image/gif"
                  className="hidden"
                  onChange={handleAvatarUpload}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div
                  className="text-sm font-medium truncate"
                  style={{ color: 'var(--text-primary)' }}
                >
                  {profile.full_name ?? 'Unnamed'}
                </div>
                <div
                  className="text-[11px] truncate mt-0.5"
                  style={{ color: 'var(--text-muted)' }}
                >
                  {profile.email}
                </div>
                <div className="flex items-center gap-1.5 mt-1">
                  <span
                    className="text-[9px] font-medium px-1.5 py-[2px] rounded-sm"
                    style={{
                      backgroundColor: profile.role === 'admin' ? 'var(--bg-danger)' : profile.role === 'agent' ? 'var(--bg-accent)' : 'var(--bg-success)',
                      color: profile.role === 'admin' ? '#A32D2D' : profile.role === 'agent' ? '#185FA5' : '#27500A',
                    }}
                  >
                    {profile.role.charAt(0).toUpperCase() + profile.role.slice(1)}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Profile card — édition du nom */}
          {profile && isEditing && (
            <div
              className="px-4 py-3"
              style={{ borderBottom: '0.5px solid var(--border)' }}
            >
              <div className="flex items-center gap-3">
                {/* Avatar inchangé */}
                <div className="relative shrink-0">
                  <div
                    className="flex items-center justify-center rounded-full text-sm font-medium text-white"
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: '#B5D4F4',
                      color: '#0C447C',
                    }}
                  >
                    {getInitials(editName || null, profile.email)}
                  </div>
                </div>

                {/* Champs édition */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      placeholder="Your full name"
                      className="flex-1 text-sm font-medium bg-transparent border-none outline-none"
                      style={{
                        color: 'var(--text-primary)',
                        borderBottom: '0.5px solid var(--border-accent)',
                      }}
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') saveName()
                        if (e.key === 'Escape') cancelEditing()
                      }}
                    />
                  </div>
                  <div
                    className="text-[11px] mt-1.5"
                    style={{ color: 'var(--text-muted)' }}
                  >
                    {profile.email}
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={cancelEditing}
                  className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-sm cursor-pointer transition-all"
                  style={{
                    color: 'var(--text-secondary)',
                    backgroundColor: 'transparent',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 6%, transparent)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <X size={12} />
                  Cancel
                </button>
                <button
                  onClick={saveName}
                  disabled={isSaving}
                  className="flex items-center gap-1 text-[10px] font-medium px-2.5 py-1.5 rounded-sm cursor-pointer transition-all disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--fill-accent)',
                    color: '#fff',
                  }}
                >
                  {isSaving ? (
                    <Loader size={12} className="animate-spin" />
                  ) : (
                    <Check size={12} />
                  )}
                  {isSaving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          )}

          <SettingRow icon={User} label="Profile" description="Edit your name and avatar">
            {!isEditing ? (
              <button
                onClick={startEditing}
                className="text-[10px] font-medium px-2.5 py-1 rounded-sm transition-all cursor-pointer"
                style={{
                  color: 'var(--text-accent)',
                  backgroundColor: 'var(--bg-accent)',
                }}
              >
                Edit
              </button>
            ) : (
              <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
                Editing...
              </span>
            )}
          </SettingRow>

          <SettingRow icon={LogOut} label="Sign out" description="Sign out of your account">
            <button
              onClick={() => signOut()}
              className="text-[10px] font-medium px-2.5 py-1 rounded-sm transition-all cursor-pointer"
              style={{
                color: '#A32D2D',
                backgroundColor: 'var(--bg-danger)',
              }}
            >
              Sign out
            </button>
          </SettingRow>
        </div>
      </div>

      {/* About */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Info size={14} style={{ color: 'var(--text-muted)' }} />
          <span
            className="text-[10px] font-semibold uppercase tracking-wider"
            style={{ color: 'var(--text-muted)' }}
          >
            About
          </span>
        </div>

        <div
          className="rounded-sm"
          style={{
            border: '0.5px solid var(--border)',
            backgroundColor: 'var(--surface-1)',
          }}
        >
          <div className="px-4 py-3 flex items-center justify-between" style={{ borderBottom: '0.5px solid var(--border)' }}>
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Version</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>0.1.0</span>
          </div>
          <div className="px-4 py-3 flex items-center justify-between">
            <span className="text-xs" style={{ color: 'var(--text-primary)' }}>Build</span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>2024</span>
          </div>
        </div>
      </div>
    </div>
  )
}
