import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users,
  Shield,
  Search,
  X,
  ChevronRight,
} from 'lucide-react'
import { useProfiles, useDepartments } from '../hooks/useRequests'
import type { Profile } from '../types/requests'

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

function getAvatarColor(id: string): string {
  const colors = ['#378ADD', '#0F6E56', '#E24B4A', '#EF9F27', '#639922', '#7B61FF', '#D4449A', '#185FA5']
  let hash = 0
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

const roleConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  admin: { label: 'Admin', color: '#A32D2D', bgColor: 'var(--bg-danger)' },
  agent: { label: 'Agent', color: '#185FA5', bgColor: 'var(--bg-accent)' },
  user: { label: 'User', color: '#27500A', bgColor: 'var(--bg-success)' },
}

// ============================================================
// ProfileCard
// ============================================================

function ProfileCard({
  profile,
  departmentName,
}: {
  profile: Profile
  departmentName: string | null
}) {
  const navigate = useNavigate()
  const role = roleConfig[profile.role] ?? roleConfig.user
  const avatarColor = getAvatarColor(profile.id)
  const initials = getInitials(profile.full_name, profile.email)

  return (
    <div
      className="flex items-center gap-3 px-3 py-3 rounded-sm cursor-pointer transition-all"
      style={{
        backgroundColor: 'transparent',
        border: '0.5px solid transparent',
        transitionDuration: 'var(--duration-fast)',
        transitionTimingFunction: 'var(--ease-out-expo)',
      }}
      onClick={() => navigate(`/profile/${profile.id}`)}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 3%, transparent)'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = 'transparent'
      }}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full shrink-0 text-xs font-medium text-white"
        style={{ width: 36, height: 36, backgroundColor: avatarColor }}
      >
        {initials}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span
            className="text-xs font-medium truncate"
            style={{ color: 'var(--text-primary)' }}
          >
            {profile.full_name || profile.email}
          </span>
          <span
            className="text-[9px] font-medium px-1 py-[1px] rounded-sm shrink-0"
            style={{ backgroundColor: role.bgColor, color: role.color }}
          >
            {role.label}
          </span>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          {profile.full_name && (
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              {profile.email}
            </span>
          )}
          {departmentName && (
            <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
              {departmentName}
            </span>
          )}
        </div>
      </div>

      <ChevronRight size={14} style={{ color: 'var(--text-muted)' }} />
    </div>
  )
}

// ============================================================
// TeamPage
// ============================================================

export default function TeamPage() {
  const { data: profiles, isLoading, error } = useProfiles()
  const { data: departments } = useDepartments()

  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDepartment, setSelectedDepartment] = useState('')
  const [selectedRole, setSelectedRole] = useState('')

  // Filtrer
  const filtered = useMemo(() => {
    if (!profiles) return []
    let result = profiles

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(
        (p) =>
          (p.full_name?.toLowerCase().includes(q) ?? false) ||
          p.email.toLowerCase().includes(q)
      )
    }
    if (selectedDepartment) {
      result = result.filter((p) => p.department_id === selectedDepartment)
    }
    if (selectedRole) {
      result = result.filter((p) => p.role === selectedRole)
    }
    return result
  }, [profiles, searchQuery, selectedDepartment, selectedRole])

  const deptMap = useMemo(() => {
    const map = new Map<string, string>()
    departments?.forEach((d) => map.set(d.id, d.name))
    return map
  }, [departments])

  const clearFilters = useCallback(() => {
    setSearchQuery('')
    setSelectedDepartment('')
    setSelectedRole('')
  }, [])

  const hasFilters = searchQuery || selectedDepartment || selectedRole

  const counts = useMemo(() => {
    if (!profiles) return { total: 0, admins: 0, agents: 0, users: 0 }
    return {
      total: profiles.length,
      admins: profiles.filter((p) => p.role === 'admin').length,
      agents: profiles.filter((p) => p.role === 'agent').length,
      users: profiles.filter((p) => p.role === 'user').length,
    }
  }, [profiles])

  return (
    <div className="flex flex-col gap-4 h-full">
      {/* Header */}
      <div>
        <div
          className="text-[11px] font-medium uppercase tracking-wider mb-1"
          style={{ color: 'var(--text-muted)' }}
        >
          Team
        </div>
        <h1
          className="text-xl font-medium flex items-center gap-2"
          style={{ color: 'var(--text-primary)' }}
        >
          Team Directory
          {profiles && (
            <span className="text-sm font-normal" style={{ color: 'var(--text-muted)' }}>
              ({profiles.length})
            </span>
          )}
        </h1>
      </div>

      {/* Stats row */}
      {profiles && (
        <div className="flex gap-3">
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm flex-1" style={{ backgroundColor: 'var(--surface-2)' }}>
            <Users size={13} style={{ color: 'var(--fill-accent)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{counts.total}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Total</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm flex-1" style={{ backgroundColor: 'var(--bg-accent)' }}>
            <Shield size={13} style={{ color: '#185FA5' }} />
            <span className="text-sm font-medium" style={{ color: '#185FA5' }}>{counts.admins}</span>
            <span className="text-[10px]" style={{ color: '#185FA5' }}>Admins</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm flex-1" style={{ backgroundColor: 'var(--bg-success)' }}>
            <Users size={13} style={{ color: '#27500A' }} />
            <span className="text-sm font-medium" style={{ color: '#27500A' }}>{counts.agents}</span>
            <span className="text-[10px]" style={{ color: '#27500A' }}>Agents</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 rounded-sm flex-1" style={{ backgroundColor: 'var(--surface-2)' }}>
            <Users size={13} style={{ color: 'var(--text-muted)' }} />
            <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{counts.users}</span>
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Users</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Search */}
        <div
          className="flex items-center gap-1.5 px-2 py-1.5 rounded-sm"
          style={{ backgroundColor: 'var(--surface-2)', border: '0.5px solid var(--border)' }}
        >
          <Search size={12} style={{ color: 'var(--text-muted)' }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name or email..."
            className="text-[10px] bg-transparent border-none outline-none w-36"
            style={{ color: 'var(--text-primary)' }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="cursor-pointer" style={{ color: 'var(--text-muted)' }}>
              <X size={12} />
            </button>
          )}
        </div>

        {/* Department filter */}
        <select
          value={selectedDepartment}
          onChange={(e) => setSelectedDepartment(e.target.value)}
          className="text-[10px] font-medium px-2 py-1.5 rounded-sm cursor-pointer outline-none"
          style={{
            backgroundColor: selectedDepartment ? 'var(--bg-accent)' : 'var(--surface-2)',
            color: selectedDepartment ? 'var(--text-accent)' : 'var(--text-secondary)',
            border: '0.5px solid var(--border)',
          }}
          aria-label="Filter by department"
        >
          <option value="">All departments</option>
          {departments?.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </select>

        {/* Role filter */}
        <select
          value={selectedRole}
          onChange={(e) => setSelectedRole(e.target.value)}
          className="text-[10px] font-medium px-2 py-1.5 rounded-sm cursor-pointer outline-none"
          style={{
            backgroundColor: selectedRole ? 'var(--bg-warning)' : 'var(--surface-2)',
            color: selectedRole ? '#633806' : 'var(--text-secondary)',
            border: '0.5px solid var(--border)',
          }}
          aria-label="Filter by role"
        >
          <option value="">All roles</option>
          <option value="admin">Admin</option>
          <option value="agent">Agent</option>
          <option value="user">User</option>
        </select>

        {hasFilters && (
          <button
            onClick={clearFilters}
            className="text-[10px] font-medium cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            Clear
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-0.5">
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div
                className="w-3 h-3 rounded-full animate-spin"
                style={{
                  border: '2px solid var(--border)',
                  borderTopColor: 'var(--fill-accent)',
                }}
              />
              Loading team...
            </div>
          </div>
        )}

        {error && (
          <div className="flex flex-col items-center justify-center py-12 text-xs" style={{ color: 'var(--text-muted)' }}>
            <p style={{ color: '#A32D2D' }} className="mb-1">Failed to load team</p>
            <p>{error instanceof Error ? error.message : 'Check your Supabase connection'}</p>
          </div>
        )}

        {!isLoading && !error && filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-xs" style={{ color: 'var(--text-muted)' }}>
            <div className="flex items-center justify-center rounded-full mb-4" style={{ width: 48, height: 48, backgroundColor: 'var(--surface-2)' }}>
              <Users size={20} />
            </div>
            <span className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              {hasFilters ? 'No team members match your filters' : 'No team members yet'}
            </span>
          </div>
        )}

        {filtered.map((profile) => (
          <ProfileCard
            key={profile.id}
            profile={profile}
            departmentName={deptMap.get(profile.department_id ?? '') ?? null}
          />
        ))}
      </div>

      {filtered.length > 0 && (
        <div
          className="text-[10px] pt-2 border-t shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          Showing {filtered.length} member{filtered.length !== 1 ? 's' : ''}
          {hasFilters && profiles && filtered.length < profiles.length && (
            <span> (filtered from {profiles.length})</span>
          )}
        </div>
      )}
    </div>
  )
}
