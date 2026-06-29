import { useState, useMemo, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Mail,
  Building2,
  Shield,
  Ticket,
  X,
  MessageSquare,
  ArrowRight,
  Clock,
  UserPlus,
  UserX,
} from 'lucide-react'
import { useProfiles, useDepartments, useRequests, useUpdateRequest } from '../../hooks/useRequests'
import { useToast } from '../../contexts/ToastContext'

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

function formatDate(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTimeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return formatDate(dateStr)
}

// ============================================================
// StatBadge
// ============================================================

function StatBadge({ label, value, icon: Icon, color }: {
  label: string
  value: number
  icon: typeof Ticket
  color: string
}) {
  return (
    <div
      className="flex-1 flex flex-col items-center gap-1 rounded-sm py-2"
      style={{ backgroundColor: 'var(--surface-2)' }}
    >
      <Icon size={13} style={{ color }} />
      <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{value}</span>
      <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>{label}</span>
    </div>
  )
}

// ============================================================
// TeamMemberDetail
// ============================================================

interface TeamMemberDetailProps {
  profileId: string
  onClose: () => void
}

export default function TeamMemberDetail({ profileId, onClose }: TeamMemberDetailProps) {
  const navigate = useNavigate()
  const { data: profiles } = useProfiles()
  const { data: departments } = useDepartments()

  const profile = profiles?.find((p) => p.id === profileId)
  const department = departments?.find((d) => d.id === profile?.department_id)

  const { showToast } = useToast()
  const [showAssign, setShowAssign] = useState(false)
  const updateMutation = useUpdateRequest()

  // Toutes les demandes, filtrées côté client pour ce membre
  const { data: allRequests } = useRequests()

  const recentRequests = useMemo(() => {
    if (!allRequests || !profileId) return []
    return allRequests
      .filter((r) => r.requester_id === profileId || r.assignee_id === profileId)
      .slice(0, 5)
  }, [allRequests, profileId])

  // Demandes non assignées (ouvertes ou en cours)
  const unassignedRequests = useMemo(() => {
    if (!allRequests) return []
    return allRequests.filter(
      (r) =>
        !r.assignee_id &&
        r.status?.slug !== 'resolved' &&
        r.status?.slug !== 'closed'
    ).slice(0, 10)
  }, [allRequests])

  const handleUnassign = useCallback(async (requestId: string) => {
    try {
      await updateMutation.mutateAsync({ id: requestId, input: { assignee_id: null } })
      showToast('Request unassigned successfully')
    } catch {
      showToast('Failed to unassign request', 'error')
    }
  }, [updateMutation, showToast])

  const handleAssign = useCallback(async (requestId: string) => {
    try {
      await updateMutation.mutateAsync({ id: requestId, input: { assignee_id: profileId } })
      showToast('Request assigned successfully')
    } catch {
      showToast('Failed to assign request', 'error')
    }
    setShowAssign(false)
  }, [updateMutation, profileId, showToast])

  if (!profile) {
    return (
      <div
        className="flex items-center justify-center h-full text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        Loading...
      </div>
    )
  }

  const role = roleConfig[profile.role] ?? roleConfig.user
  const avatarColor = getAvatarColor(profile.id)
  const initials = getInitials(profile.full_name, profile.email)

  const stats = {
    created: allRequests?.filter((r) => r.requester_id === profile.id).length ?? 0,
    assigned: allRequests?.filter((r) => r.assignee_id === profile.id).length ?? 0,
    open: recentRequests.filter((r) => r.status?.slug !== 'resolved' && r.status?.slug !== 'closed').length,
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header avec close */}
      <div
        className="flex items-center justify-between px-4 py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
          Profile
        </span>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-sm cursor-pointer transition-all"
          style={{ width: 24, height: 24, color: 'var(--text-muted)' }}
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {/* Avatar + name */}
        <div className="flex flex-col items-center py-6 px-4">
          <div
            className="flex items-center justify-center rounded-full text-lg font-medium text-white mb-3"
            style={{ width: 56, height: 56, backgroundColor: avatarColor }}
          >
            {initials}
          </div>
          <h2 className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
            {profile.full_name || profile.email}
          </h2>
          <span
            className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm mt-1"
            style={{ backgroundColor: role.bgColor, color: role.color }}
          >
            {role.label}
          </span>
        </div>

        {/* Contact info */}
        <div className="px-4 space-y-2">
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <Mail size={12} style={{ color: 'var(--text-muted)' }} />
            {profile.email}
          </div>
          {department && (
            <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
              <Building2 size={12} style={{ color: 'var(--text-muted)' }} />
              {department.name}
            </div>
          )}
          <div className="flex items-center gap-2 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
            <Shield size={12} style={{ color: 'var(--text-muted)' }} />
            {role.label}
          </div>
        </div>

        {/* Stats */}
        <div className="flex gap-2 px-4 mt-5">
          <StatBadge label="Created" value={stats.created} icon={Ticket} color="var(--fill-accent)" />
          <StatBadge label="Assigned" value={stats.assigned} icon={ArrowRight} color="#EF9F27" />
          <StatBadge label="Open" value={stats.open} icon={Clock} color="#378ADD" />
        </div>

        {/* Assign button */}
        <div className="px-4 mt-4">
          <button
            onClick={() => setShowAssign(!showAssign)}
            className="flex items-center justify-center gap-1.5 w-full text-xs font-medium rounded-sm px-3 py-2 cursor-pointer transition-all"
            style={{
              backgroundColor: showAssign ? 'var(--bg-accent)' : 'var(--surface-2)',
              color: showAssign ? 'var(--text-accent)' : 'var(--text-secondary)',
              border: '0.5px solid var(--border)',
              transitionDuration: 'var(--duration-fast)',
              transitionTimingFunction: 'var(--ease-out-expo)',
            }}
          >
            <UserPlus size={13} />
            {showAssign ? 'Cancel' : 'Assign a request'}
          </button>

          {/* Dropdown avec requêtes non assignées */}
          {showAssign && (
            <div
              className="mt-2 rounded-sm overflow-hidden"
              style={{
                border: '0.5px solid var(--border)',
                backgroundColor: 'var(--surface-1)',
              }}
            >
              {unassignedRequests.length === 0 && (
                <div className="text-[10px] py-3 text-center" style={{ color: 'var(--text-muted)' }}>
                  No unassigned requests available
                </div>
              )}
              {unassignedRequests.map((req) => (
                <button
                  key={req.id}
                  onClick={() => handleAssign(req.id)}
                  className="flex items-center gap-2 w-full px-3 py-2 text-left text-[10px] transition-all cursor-pointer"
                  style={{
                    borderBottom: '0.5px solid var(--border)',
                    transitionDuration: 'var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 4%, transparent)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: req.priority?.color ?? 'var(--text-muted)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="truncate font-medium" style={{ color: 'var(--text-primary)' }}>
                      {req.title}
                    </div>
                    <div style={{ color: 'var(--text-muted)' }}>
                      {req.status?.name ?? 'New'} — {req.department?.name ?? '—'}
                    </div>
                  </div>
                  <UserPlus size={11} style={{ color: 'var(--text-accent)', flexShrink: 0 }} />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Recent requests */}
        <div className="mt-5 px-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Recent Requests
            </span>
            {stats.created + stats.assigned > 5 && (
              <button
                onClick={() => navigate(`/requests`)}
                className="text-[10px] font-medium cursor-pointer"
                style={{ color: 'var(--text-accent)' }}
              >
                View all
              </button>
            )}
          </div>

          <div className="space-y-1">
            {recentRequests.length === 0 && (
              <div className="text-[10px] py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                No requests yet
              </div>
            )}
            {recentRequests.map((req) => {
              const isAssignedToMe = req.assignee_id === profileId
              return (
                <div
                  key={req.id}
                  className="group relative flex items-center gap-2 px-2 py-1.5 rounded-sm cursor-pointer transition-all"
                  style={{ borderBottom: '0.5px solid var(--border)' }}
                  onClick={() => navigate(`/requests?selected=${req.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 3%, transparent)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ backgroundColor: req.priority?.color ?? 'var(--text-muted)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {req.title}
                    </div>
                    <div className="flex items-center gap-2 text-[9px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      <span>{req.status?.name ?? '—'}</span>
                      {isAssignedToMe && <span>•</span>}
                      {isAssignedToMe && <span style={{ color: '#0F6E56' }}>Assigned</span>}
                      <span>•</span>
                      <span>{formatTimeAgo(req.created_at)}</span>
                    </div>
                  </div>
                  {isAssignedToMe && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleUnassign(req.id)
                      }}
                      className="shrink-0 flex items-center gap-1 px-1.5 py-1 rounded-sm text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                      style={{
                        color: '#A32D2D',
                        backgroundColor: 'var(--bg-danger)',
                        transitionDuration: 'var(--duration-fast)',
                        transitionTimingFunction: 'var(--ease-out-expo)',
                      }}
                      title="Unassign this request"
                    >
                      <UserX size={10} />
                      Unassign
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Activity placeholder */}
        <div className="mt-5 px-4 pb-6">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquare size={12} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Recent Activity
            </span>
          </div>

          <div className="space-y-2">
            {recentRequests.length === 0 ? (
              <div className="text-[10px] py-4 text-center" style={{ color: 'var(--text-muted)' }}>
                No activity yet
              </div>
            ) : (
              recentRequests.slice(0, 3).map((req) => (
                <div key={`activity-${req.id}`} className="flex items-start gap-2 text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                  <div
                    className="w-0.5 h-full min-h-[14px] rounded-full shrink-0 mt-1"
                    style={{ backgroundColor: req.status?.color ?? 'var(--border)' }}
                  />
                  <div className="flex-1 min-w-0">
                    <span className="font-medium" style={{ color: 'var(--text-primary)' }}>{req.title}</span>
                    <span className="ml-1">— {req.status?.name ?? 'New'}</span>
                    <div style={{ color: 'var(--text-muted)' }}>{formatTimeAgo(req.created_at)}</div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
