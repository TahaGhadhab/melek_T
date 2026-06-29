import { useState, useMemo, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Mail,
  Building2,
  Shield,
  Ticket,
  ArrowLeft,
  MessageSquare,
  Clock,
  CheckCircle2,
  UserPlus,
  UserX,
  ExternalLink,
  Calendar,
} from 'lucide-react'
import { useProfiles, useDepartments, useRequests, useUpdateRequest } from '../hooks/useRequests'
import { useToast } from '../contexts/ToastContext'

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

const statusPalette: Record<string, { bg: string; text: string }> = {
  new: { bg: 'var(--bg-accent)', text: '#185FA5' },
  in_progress: { bg: 'var(--bg-warning)', text: '#633806' },
  waiting: { bg: 'var(--surface-2)', text: 'var(--text-secondary)' },
  resolved: { bg: 'var(--bg-success)', text: '#27500A' },
  closed: { bg: 'var(--surface-2)', text: 'var(--text-muted)' },
}

// ============================================================
// StatCard
// ============================================================

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  bgColor,
}: {
  label: string
  value: number
  icon: typeof Ticket
  color: string
  bgColor?: string
}) {
  return (
    <div
      className="flex flex-col gap-1 rounded-card px-4 py-3"
      style={{
        backgroundColor: bgColor ?? 'var(--surface-2)',
        border: '0.5px solid var(--border)',
      }}
    >
      <div className="flex items-center gap-2">
        <Icon size={14} style={{ color }} />
        <span
          className="text-[22px] font-medium leading-none"
          style={{ color: 'var(--text-primary)' }}
        >
          {value}
        </span>
      </div>
      <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
        {label}
      </span>
    </div>
  )
}

// ============================================================
// ProfilePage
// ============================================================

export default function ProfilePage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data: profiles, isLoading: profilesLoading } = useProfiles()
  const { data: departments } = useDepartments()
  const { data: allRequests } = useRequests()
  const { showToast } = useToast()
  const updateMutation = useUpdateRequest()

  const [showAssign, setShowAssign] = useState(false)

  const profile = profiles?.find((p) => p.id === id)
  const department = departments?.find((d) => d.id === profile?.department_id)

  // Requêtes liées à ce membre
  const memberRequests = useMemo(() => {
    if (!allRequests || !id) return []
    return allRequests.filter((r) => r.requester_id === id || r.assignee_id === id)
  }, [allRequests, id])

  // Requêtes récentes (toutes, max 10)
  const recentRequests = useMemo(() => {
    return memberRequests.slice(0, 10)
  }, [memberRequests])

  // Requêtes non assignées (pour le bouton Assign)
  const unassignedRequests = useMemo(() => {
    if (!allRequests) return []
    return allRequests.filter(
      (r) =>
        !r.assignee_id &&
        r.status?.slug !== 'resolved' &&
        r.status?.slug !== 'closed'
    ).slice(0, 10)
  }, [allRequests])

  // Stats
  const stats = useMemo(() => {
    if (!id || !allRequests) return { created: 0, assigned: 0, resolved: 0, open: 0 }
    const created = allRequests.filter((r) => r.requester_id === id).length
    const assigned = allRequests.filter((r) => r.assignee_id === id).length
    const resolved = allRequests.filter(
      (r) => (r.requester_id === id || r.assignee_id === id) &&
        (r.status?.slug === 'resolved' || r.status?.slug === 'closed')
    ).length
    const open = allRequests.filter(
      (r) => (r.requester_id === id || r.assignee_id === id) &&
        r.status?.slug !== 'resolved' &&
        r.status?.slug !== 'closed'
    ).length
    return { created, assigned, resolved, open }
  }, [id, allRequests])

  const handleUnassign = useCallback(async (requestId: string) => {
    try {
      await updateMutation.mutateAsync({ id: requestId, input: { assignee_id: null } })
      showToast('Request unassigned successfully')
    } catch {
      showToast('Failed to unassign request', 'error')
    }
  }, [updateMutation, showToast])

  const handleAssign = useCallback(async (requestId: string) => {
    if (!id) return
    try {
      await updateMutation.mutateAsync({ id: requestId, input: { assignee_id: id } })
      showToast('Request assigned successfully')
    } catch {
      showToast('Failed to assign request', 'error')
    }
    setShowAssign(false)
  }, [updateMutation, id, showToast])

  // Loading
  if (profilesLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div
            className="w-3 h-3 rounded-full animate-spin"
            style={{ border: '2px solid var(--border)', borderTopColor: 'var(--fill-accent)' }}
          />
          Loading profile...
        </div>
      </div>
    )
  }

  // Not found
  if (!profile) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-xs" style={{ color: 'var(--text-muted)' }}>
        <div className="flex items-center justify-center rounded-full mb-4" style={{ width: 48, height: 48, backgroundColor: 'var(--surface-2)' }}>
          <Shield size={20} />
        </div>
        <span className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>Profile not found</span>
        <p>This member does not exist or has been removed</p>
        <button
          onClick={() => navigate('/team')}
          className="flex items-center gap-1.5 text-xs font-medium mt-4 px-3 py-2 rounded-sm cursor-pointer transition-all"
          style={{ color: 'var(--text-accent)', backgroundColor: 'var(--bg-accent)' }}
        >
          <ArrowLeft size={13} />
          Back to team
        </button>
      </div>
    )
  }

  const role = roleConfig[profile.role] ?? roleConfig.user
  const avatarColor = getAvatarColor(profile.id)
  const initials = getInitials(profile.full_name, profile.email)

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back button */}
      <button
        onClick={() => navigate('/team')}
        className="flex items-center gap-1.5 text-xs font-medium mb-4 px-2 py-1.5 rounded-sm cursor-pointer transition-all"
        style={{ color: 'var(--text-secondary)' }}
        onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 4%, transparent)' }}
        onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
      >
        <ArrowLeft size={14} />
        Back to Team
      </button>

      {/* Hero card */}
      <div
        className="rounded-card p-6 mb-5"
        style={{
          backgroundColor: 'var(--surface-1)',
          border: '0.5px solid var(--border)',
        }}
      >
        <div className="flex items-start gap-5">
          {/* Avatar large */}
          <div
            className="flex items-center justify-center rounded-full shrink-0 text-xl font-medium text-white"
            style={{ width: 64, height: 64, backgroundColor: avatarColor }}
          >
            {initials}
          </div>

          {/* Infos */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h1 className="text-lg font-medium" style={{ color: 'var(--text-primary)' }}>
                {profile.full_name || 'Unnamed'}
              </h1>
              <span
                className="text-[10px] font-medium px-2 py-0.5 rounded-sm"
                style={{ backgroundColor: role.bgColor, color: role.color }}
              >
                {role.label}
              </span>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-2.5">
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                <Mail size={12} style={{ color: 'var(--text-muted)' }} />
                {profile.email}
              </div>
              {department && (
                <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                  <Building2 size={12} style={{ color: 'var(--text-muted)' }} />
                  {department.name}
                </div>
              )}
              <div className="flex items-center gap-1.5 text-[11px]" style={{ color: 'var(--text-secondary)' }}>
                <Shield size={12} style={{ color: 'var(--text-muted)' }} />
                {role.label}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-4 gap-3 mb-5">
        <StatCard label="Created" value={stats.created} icon={Ticket} color="var(--fill-accent)" bgColor="var(--bg-accent)" />
        <StatCard label="Assigned" value={stats.assigned} icon={ExternalLink} color="#EF9F27" bgColor="var(--bg-warning)" />
        <StatCard label="Resolved" value={stats.resolved} icon={CheckCircle2} color="#639922" bgColor="var(--bg-success)" />
        <StatCard label="Open" value={stats.open} icon={Clock} color="#378ADD" />
      </div>

      {/* Assign button */}
      <div className="mb-5">
        <button
          onClick={() => setShowAssign(!showAssign)}
          className="flex items-center justify-center gap-1.5 w-full text-xs font-medium rounded-sm px-3 py-2.5 cursor-pointer transition-all"
          style={{
            backgroundColor: showAssign ? 'var(--bg-accent)' : 'var(--surface-2)',
            color: showAssign ? 'var(--text-accent)' : 'var(--text-secondary)',
            border: '0.5px solid var(--border)',
            transitionDuration: 'var(--duration-fast)',
            transitionTimingFunction: 'var(--ease-out-expo)',
          }}
        >
          <UserPlus size={14} />
          {showAssign ? 'Cancel assignment' : 'Assign a request to this member'}
        </button>

        {showAssign && (
          <div
            className="mt-2 rounded-sm overflow-hidden"
            style={{ border: '0.5px solid var(--border)', backgroundColor: 'var(--surface-1)' }}
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
                className="flex items-center gap-2 w-full px-3 py-2.5 text-left text-[10px] transition-all cursor-pointer"
                style={{ borderBottom: '0.5px solid var(--border)', transitionDuration: 'var(--duration-fast)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 4%, transparent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
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
                <UserPlus size={12} style={{ color: 'var(--text-accent)', flexShrink: 0 }} />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Recent requests */}
      <div className="mb-5">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Ticket size={14} style={{ color: 'var(--text-muted)' }} />
            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
              Recent Requests
            </span>
          </div>
          {memberRequests.length > 10 && (
            <button
              onClick={() => navigate('/requests')}
              className="text-[10px] font-medium cursor-pointer"
              style={{ color: 'var(--text-accent)' }}
            >
              View all ({memberRequests.length})
            </button>
          )}
        </div>

        <div
          className="rounded-sm overflow-hidden"
          style={{ border: '0.5px solid var(--border)', backgroundColor: 'var(--surface-1)' }}
        >
          {recentRequests.length === 0 && (
            <div className="text-[10px] py-8 text-center" style={{ color: 'var(--text-muted)' }}>
              No requests yet
            </div>
          )}
          {recentRequests.map((req) => {
            const isAssignedToMe = req.assignee_id === id
            const pStyle = statusPalette[req.status?.slug ?? ''] ?? statusPalette.new

            return (
              <div
                key={req.id}
                className="group relative flex items-center gap-3 px-4 py-3 cursor-pointer transition-all"
                style={{ borderBottom: '0.5px solid var(--border)' }}
                onClick={() => navigate(`/requests?selected=${req.id}`)}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 3%, transparent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                {/* Priority dot */}
                <div
                  className="w-2 h-2 rounded-full shrink-0"
                  style={{ backgroundColor: req.priority?.color ?? 'var(--text-muted)' }}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                      {req.title}
                    </span>
                    <span
                      className="text-[9px] font-medium px-1.5 py-[1px] rounded-sm shrink-0"
                      style={{ backgroundColor: pStyle.bg, color: pStyle.text }}
                    >
                      {req.status?.name ?? 'New'}
                    </span>
                    {isAssignedToMe && (
                      <span className="text-[9px]" style={{ color: '#0F6E56' }}>• Assigned</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <span>{req.department?.name ?? '—'}</span>
                    <span>•</span>
                    <span>{formatTimeAgo(req.created_at)}</span>
                    {req.due_date && (
                      <>
                        <span>•</span>
                        <span className="flex items-center gap-1" style={{ color: new Date(req.due_date) < new Date() ? '#A32D2D' : undefined }}>
                          <Calendar size={9} />
                          Due {formatDate(req.due_date)}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Unassign button */}
                {isAssignedToMe && (
                  <button
                    onClick={(e) => { e.stopPropagation(); handleUnassign(req.id) }}
                    className="shrink-0 flex items-center gap-1 px-2 py-1 rounded-sm text-[9px] font-medium opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
                    style={{
                      color: '#A32D2D',
                      backgroundColor: 'var(--bg-danger)',
                      transitionDuration: 'var(--duration-fast)',
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

          {recentRequests.length > 0 && memberRequests.length > 10 && (
            <button
              onClick={() => navigate('/requests')}
              className="flex items-center justify-center gap-1.5 w-full text-[10px] font-medium py-2.5 cursor-pointer transition-all"
              style={{ color: 'var(--text-accent)' }}
              onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-accent)' }}
              onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
            >
              View all {memberRequests.length} requests
              <ExternalLink size={11} />
            </button>
          )}
        </div>
      </div>

      {/* Activity timeline */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-3">
          <MessageSquare size={14} style={{ color: 'var(--text-muted)' }} />
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
            Recent Activity
          </span>
        </div>

        <div
          className="rounded-sm"
          style={{ border: '0.5px solid var(--border)', backgroundColor: 'var(--surface-1)' }}
        >
          {recentRequests.length === 0 ? (
            <div className="text-[10px] py-8 text-center" style={{ color: 'var(--text-muted)' }}>
              No activity yet
            </div>
          ) : (
            <div className="px-4 py-3 space-y-3">
              {recentRequests.slice(0, 5).map((req) => (
                <div key={`activity-${req.id}`} className="flex items-start gap-3 text-[11px]">
                  <div className="flex flex-col items-center shrink-0">
                    <div
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: req.status?.color ?? 'var(--border)' }}
                    />
                    <div
                      className="w-px flex-1 min-h-[20px] mt-1"
                      style={{ backgroundColor: 'var(--border)' }}
                    />
                  </div>
                  <div className="flex-1 min-w-0 pb-3">
                    <div className="flex items-center gap-2">
                      <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {req.title}
                      </span>
                      <span
                        className="text-[9px] font-medium px-1 py-[1px] rounded-sm shrink-0"
                        style={{ backgroundColor: statusPalette[req.status?.slug ?? '']?.bg ?? statusPalette.new.bg, color: statusPalette[req.status?.slug ?? '']?.text ?? statusPalette.new.text }}
                      >
                        {req.status?.name ?? 'New'}
                      </span>
                    </div>
                    <div className="mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {formatTimeAgo(req.created_at)}
                      {req.priority?.name && ` · ${req.priority.name} priority`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
