import { useState, useEffect, useMemo } from 'react'
import { Routes, Route, Navigate, useSearchParams, useNavigate } from 'react-router-dom'
import { ThemeProvider } from './contexts/ThemeContext'
import { ToastProvider } from './contexts/ToastContext'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import AppLayout from './components/layout/AppLayout'
import RequestsPage from './pages/RequestsPage'
import NotificationsPage from './pages/NotificationsPage'
import TeamPage from './pages/TeamPage'
import SettingsPage from './pages/SettingsPage'
import ProfilePage from './pages/ProfilePage'
import LoginPage from './pages/LoginPage'
import EditRequestPanel from './components/requests/EditRequestPanel'
import WelcomeOverlay from './components/WelcomeOverlay'
import { useFaviconBadge } from './hooks/useFaviconBadge'
import { useBrowserNotifications } from './hooks/useBrowserNotifications'
import { useAppBadge } from './hooks/useAppBadge'
import { useDashboardStats } from './hooks/useDashboardStats'
import { useCurrentProfile } from './hooks/useCurrentProfile'
import { useCountUp } from './hooks/useCountUp'
import {
  useStatuses,
  usePriorities,
  useDepartments,
  useProfiles,
  useRequests,
  useUpdateRequest,
  useDeleteRequest,
  useUnreadCount,
} from './hooks/useRequests'

// ─── Priority donut chart colors ───
const donutPriorityColors: Record<string, string> = {
  urgent: '#E24B4A',
  high: '#EF9F27',
  medium: '#378ADD',
  low: '#639922',
}

// ─── Status colors (from RequestCard) ───
const statusColorMap: Record<string, { bg: string; text: string }> = {
  new: { bg: '#EEEDFE', text: '#3C3489' },
  in_progress: { bg: '#E1F5EE', text: '#085041' },
  waiting: { bg: '#FAEEDA', text: '#633806' },
  blocked: { bg: '#FCEBEB', text: '#791F1F' },
  resolved: { bg: '#EAF3DE', text: '#27500A' },
  closed: { bg: '#D3D1C7', text: '#2C2C2A' },
}

// ─── Priority label map ───
const priorityLabelMap: Record<string, string> = {
  urgent: 'Urgent',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
}

// ─── Donut segment helper ───
function donutSegments(data: { value: number; color: string }[], r = 36) {
  const total = data.reduce((s, d) => s + d.value, 0)
  if (total === 0) return []
  const circumference = 2 * Math.PI * r
  let offset = 0
  return data.map((d) => {
    const length = (d.value / total) * circumference
    const seg = { color: d.color, length, offset }
    offset += length
    return seg
  })
}

function HomePage() {
  const { kpis, isLoading } = useDashboardStats()
  const { profile } = useCurrentProfile()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { data: requests } = useRequests()

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good morning'
    if (h < 17) return 'Good afternoon'
    return 'Good evening'
  })()

  const displayName = profile?.full_name ?? profile?.email?.split('@')[0] ?? 'there'
  const firstName = displayName.split(' ')[0]

  // Count-up hooks — called at top level
  const openCount = useCountUp(kpis[0]?.value ?? 0, 900, 350)
  const urgentCount = useCountUp(kpis[1]?.value ?? 0, 900, 450)
  const dueTodayCount = useCountUp(kpis[2]?.value ?? 0, 900, 550)
  const resolvedCount = useCountUp(kpis[3]?.value ?? 0, 900, 650)

  // ─── Dashboard enhancements: computed from full requests data ───
  const enhancements = useMemo(() => {
    if (!requests) return null

    const isClosed = (r: { status?: { slug?: string } }) =>
      r.status?.slug === 'resolved' || r.status?.slug === 'closed'
    const open = requests.filter((r) => !isClosed(r))
    const closed = requests.filter((r) => isClosed(r))

    // 5. Priority breakdown for donut chart
    const priorityBreakdown = [
      { slug: 'urgent', count: open.filter((r) => r.priority?.slug === 'urgent').length },
      { slug: 'high', count: open.filter((r) => r.priority?.slug === 'high').length },
      { slug: 'medium', count: open.filter((r) => r.priority?.slug === 'medium').length },
      { slug: 'low', count: open.filter((r) => r.priority?.slug === 'low').length },
    ]
    const totalOpen = priorityBreakdown.reduce((s, p) => s + p.count, 0)

    // 2. Status distribution chips
    const statusCounts: Record<string, number> = {}
    requests.forEach((r) => {
      const slug = r.status?.slug ?? 'new'
      statusCounts[slug] = (statusCounts[slug] || 0) + 1
    })
    const statusDistribution = Object.entries(statusCounts)
      .map(([slug, count]) => ({ slug, count }))
      .sort((a, b) => b.count - a.count)

    // 6. Requests assigned to current user
    const assignedToMe = open.filter((r) => r.assignee_id === user?.id)

    // 10. Average resolution time
    const resolvedWithDates = closed.filter((r) => r.updated_at && r.created_at)
    let avgResolutionTime: number | null = null
    if (resolvedWithDates.length > 0) {
      const totalMs = resolvedWithDates.reduce((sum, r) => {
        return sum + (new Date(r.updated_at).getTime() - new Date(r.created_at).getTime())
      }, 0)
      avgResolutionTime = totalMs / resolvedWithDates.length / (1000 * 60 * 60 * 24)
    }

    // 10. Department leaderboard (top 3)
    const deptCounts: Record<string, number> = {}
    open.forEach((r) => {
      const dept = r.department?.name ?? 'Other'
      deptCounts[dept] = (deptCounts[dept] || 0) + 1
    })
    const deptLeaderboard = Object.entries(deptCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 3)

    return { priorityBreakdown, totalOpen, statusDistribution, assignedToMe, avgResolutionTime, deptLeaderboard }
  }, [requests, user?.id])

  const hasEnhancements = enhancements && requests && requests.length > 0

  return (
    <div className="flex flex-col gap-6 max-w-4xl">
      {/* ── Header ── */}
      <div className="animate-fade-slide-up" style={{ animationDelay: '0ms' }}>
        <div className="text-[11px] font-medium uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>
          Dashboard
        </div>
        <h1 className="text-xl font-medium" style={{ color: 'var(--text-primary)' }}>
          {greeting}, {firstName}
        </h1>
        <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
          Key metrics and recent activity across your department
        </p>
      </div>

      {/* ── Welcome card ── */}
      {profile && (
        <div className="flex items-center gap-3 rounded-card px-4 py-3 animate-fade-slide-up"
          style={{
            backgroundColor: 'var(--surface-2)',
            border: '0.5px solid var(--border)',
            animationDelay: '150ms',
          }}
        >
          <div className="flex items-center justify-center rounded-full shrink-0 text-sm font-medium text-white"
            style={{ width: 40, height: 40, backgroundColor: '#B5D4F4', color: '#0C447C' }}
          >
            {profile.full_name
              ? profile.full_name.split(' ').map((w: string) => w[0]).filter(Boolean).slice(0, 2).join('').toUpperCase()
              : profile.email.slice(0, 2).toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>
              {profile.full_name ?? 'Unnamed'}
            </div>
            <div className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              {profile.email}
              <span className="ml-2 text-[9px] font-medium px-1 py-[1px] rounded-sm"
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

      {/* ── KPI Grid (Row 1) ── */}
      <div className="grid grid-cols-4 gap-3">
        {isLoading && (
          <div className="col-span-4 flex items-center justify-center py-4 animate-fade-slide-up" style={{ animationDelay: '250ms' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div className="w-3 h-3 rounded-full animate-spin"
                style={{ border: '2px solid var(--border)', borderTopColor: 'var(--fill-accent)' }}
              />
              Loading metrics...
            </div>
          </div>
        )}
        {kpis.map((kpi, index) => {
          const delay = 250 + index * 100
          const animatedValues = [openCount, urgentCount, dueTodayCount, resolvedCount]
          return (
            <div key={kpi.label}
              className="rounded-card p-3 cursor-default animate-fade-slide-up"
              style={{
                backgroundColor: kpi.bgColor,
                border: kpi.urgent ? '0.5px solid #F09595' : '0.5px solid var(--border)',
                animationDelay: `${delay}ms`,
                transition: 'transform 200ms var(--ease-out-expo), box-shadow 200ms var(--ease-out-expo)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-3px)'
                e.currentTarget.style.boxShadow = kpi.urgent ? '0 4px 16px rgba(227, 75, 74, 0.15)' : '0 4px 16px rgba(0, 0, 0, 0.08)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)'
                e.currentTarget.style.boxShadow = 'none'
              }}
            >
              <div className="text-[22px] font-medium leading-none tabular-nums"
                style={{ color: kpi.urgent ? '#A32D2D' : 'var(--text-primary)' }}
              >
                {animatedValues[index]}
              </div>
              <div className="text-[10px] mt-1" style={{ color: 'var(--text-muted)' }}>{kpi.label}</div>
              {kpi.delta && (
                <div className="text-[10px] mt-0.5" style={{ color: kpi.up ? '#0F6E56' : '#A32D2D' }}>
                  {kpi.delta}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Row 2: Priority donut chart (5) + Status chips (2) ── */}
      {hasEnhancements && (
        <div className="grid grid-cols-5 gap-3 animate-fade-slide-up" style={{ animationDelay: '650ms' }}>
          {/* Donut chart — priority breakdown */}
          <div className="col-span-2 rounded-card p-3"
            style={{ backgroundColor: 'var(--surface-2)', border: '0.5px solid var(--border)' }}
          >
            <div className="text-[10px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Priority breakdown
            </div>
            <div className="flex items-center gap-4">
              {/* SVG Donut */}
              <svg width={80} height={80} viewBox="0 0 100 100" className="shrink-0">
                {(() => {
                  const segments = donutSegments(
                    enhancements!.priorityBreakdown.map((p) => ({
                      value: p.count,
                      color: donutPriorityColors[p.slug],
                    }))
                  )
                  if (segments.length === 0) {
                    return (
                      <circle cx="50" cy="50" r="36" fill="none"
                        stroke="var(--border)" strokeWidth="8" />
                    )
                  }
                  const circumference = 2 * Math.PI * 36
                  return segments.map((seg, i) => (
                    <circle key={i} cx="50" cy="50" r="36" fill="none"
                      stroke={seg.color} strokeWidth="8"
                      strokeDasharray={`${seg.length} ${circumference - seg.length}`}
                      strokeDashoffset={-seg.offset}
                      transform="rotate(-90 50 50)"
                      style={{ transition: 'stroke-dashoffset 500ms var(--ease-out-expo)' }}
                    />
                  ))
                })()}
              </svg>

              {/* Legend */}
              <div className="flex flex-col gap-1">
                {enhancements!.priorityBreakdown.map((p) => (
                  <div key={p.slug} className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full shrink-0"
                      style={{ backgroundColor: donutPriorityColors[p.slug] }}
                    />
                    <span className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                      {priorityLabelMap[p.slug]}
                    </span>
                    <span className="text-[10px] font-medium ml-auto" style={{ color: 'var(--text-primary)' }}>
                      {p.count}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-1 mt-1" style={{ borderColor: 'var(--border)' }}>
                  <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
                    {enhancements!.totalOpen} total open
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Status distribution chips */}
          <div className="col-span-3 rounded-card p-3"
            style={{ backgroundColor: 'var(--surface-2)', border: '0.5px solid var(--border)' }}
          >
            <div className="text-[10px] font-medium mb-2" style={{ color: 'var(--text-muted)' }}>
              Status distribution
            </div>
            <div className="flex flex-wrap gap-2">
              {enhancements!.statusDistribution.map((s) => {
                const colors = statusColorMap[s.slug] ?? statusColorMap.new
                return (
                  <div key={s.slug}
                    className="flex items-center gap-1.5 px-2 py-1 rounded-sm"
                    style={{ backgroundColor: colors.bg }}
                  >
                    <span className="text-[10px] font-medium" style={{ color: colors.text }}>
                      {s.count}
                    </span>
                    <span className="text-[9px]" style={{ color: colors.text, opacity: 0.75 }}>
                      {s.slug === 'in_progress' ? 'In Prog' : s.slug.charAt(0).toUpperCase() + s.slug.slice(1)}
                    </span>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── Row 3: Second KPIs (10) — Avg resolution + Dept leaderboard ── */}
      {hasEnhancements && (
        <div className="grid grid-cols-2 gap-3 animate-fade-slide-up" style={{ animationDelay: '750ms' }}>
          {/* Avg resolution time */}
          <div className="rounded-card p-3"
            style={{ backgroundColor: 'var(--surface-2)', border: '0.5px solid var(--border)' }}
          >
            <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Avg. resolution time
            </div>
            <div className="text-lg font-semibold" style={{ color: 'var(--text-primary)' }}>
              {enhancements!.avgResolutionTime !== null
                ? `${enhancements!.avgResolutionTime < 1
                    ? Math.round(enhancements!.avgResolutionTime * 24) + 'h'
                    : enhancements!.avgResolutionTime.toFixed(1) + 'd'
                  }`
                : '—'
              }
            </div>
          </div>

          {/* Department leaderboard */}
          <div className="rounded-card p-3"
            style={{ backgroundColor: 'var(--surface-2)', border: '0.5px solid var(--border)' }}
          >
            <div className="text-[10px] font-medium mb-1" style={{ color: 'var(--text-muted)' }}>
              Most requests by dept.
            </div>
            {enhancements!.deptLeaderboard.length > 0 ? (
              <div className="flex flex-col gap-1">
                {enhancements!.deptLeaderboard.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-2">
                    <span className="text-[9px] font-medium w-3" style={{ color: 'var(--text-muted)' }}>
                      {i + 1}
                    </span>
                    <div className="flex-1 h-4 rounded-sm"
                      style={{
                        backgroundColor: 'var(--surface-0)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div className="h-full rounded-sm"
                        style={{
                          width: `${(d.count / enhancements!.deptLeaderboard[0].count) * 100}%`,
                          backgroundColor: i === 0 ? 'var(--fill-accent)' : i === 1 ? '#EF9F27' : '#639922',
                          transition: 'width 500ms var(--ease-out-expo)',
                        }}
                      />
                      <div className="absolute inset-0 flex items-center px-1.5">
                        <span className="text-[9px] truncate" style={{ color: i === 0 ? '#fff' : 'var(--text-secondary)' }}>
                          {d.name}
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-medium w-5 text-right" style={{ color: 'var(--text-primary)' }}>
                      {d.count}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>No data</div>
            )}
          </div>
        </div>
      )}

      {/* ── Row 4: Assigned to me (6) ── */}
      {hasEnhancements && enhancements!.assignedToMe.length > 0 && (
        <div className="animate-fade-slide-up" style={{ animationDelay: '850ms' }}>
          <div className="text-[10px] font-medium uppercase tracking-wider mb-2" style={{ color: 'var(--text-muted)' }}>
            Your tasks ({enhancements!.assignedToMe.length})
          </div>
          <div className="flex flex-col gap-1.5">
            {enhancements!.assignedToMe.slice(0, 5).map((req) => {
              const pSlug = req.priority?.slug ?? 'medium'
              const sSlug = req.status?.slug ?? 'new'
              const pStyle = donutPriorityColors[pSlug]
              const sStyle = statusColorMap[sSlug] ?? statusColorMap.new
              return (
                <div key={req.id}
                  onClick={() => navigate(`/requests?selected=${req.id}`)}
                  className="flex items-center gap-2 px-3 py-2 rounded-sm cursor-pointer transition-all"
                  style={{
                    backgroundColor: 'var(--surface-2)',
                    border: '0.5px solid var(--border)',
                    transitionDuration: 'var(--duration-fast)',
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-accent)' }}
                  onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--surface-2)' }}
                >
                  <span className="flex-1 text-[11px] font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                    {req.title}
                  </span>
                  <span className="text-[9px] font-medium px-1.5 py-[1px] rounded-sm shrink-0"
                    style={{ backgroundColor: pStyle, color: '#fff' }}
                  >
                    {req.priority?.name ?? 'Medium'}
                  </span>
                  <span className="text-[9px] font-medium px-1.5 py-[1px] rounded-sm shrink-0"
                    style={{ backgroundColor: sStyle.bg, color: sStyle.text }}
                  >
                    {req.status?.name ?? 'New'}
                  </span>
                </div>
              )
            })}
            {enhancements!.assignedToMe.length > 5 && (
              <button onClick={() => navigate('/requests')}
                className="text-[10px] font-medium text-left px-3 py-1 rounded-sm cursor-pointer transition-all"
                style={{ color: 'var(--text-accent)' }}
                onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--bg-accent)' }}
                onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
              >
                View all {enhancements!.assignedToMe.length} tasks →
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function RequestsPageWithSelection({ selectedRequestId, onSelectRequest }: {
  selectedRequestId: string | null
  onSelectRequest: (id: string | null) => void
}) {
  const [searchParams] = useSearchParams()
  const selectedFromUrl = searchParams.get('selected')

  // Si un ?selected= est dans l'URL, l'utiliser comme sélection
  const effectiveSelected = selectedFromUrl ?? selectedRequestId

  return (
    <RequestsPage
      selectedRequestId={effectiveSelected}
      onSelectRequest={(id) => {
        onSelectRequest(id)
        // Clean the URL param when selection changes
        if (selectedFromUrl) {
          window.history.replaceState({}, '', '/requests')
        }
      }}
    />
  )
}

function SelectedRequestDetail({ requestId, onClose }: { requestId: string; onClose: () => void }) {
  const { data: requests } = useRequests()
  const { data: statuses } = useStatuses()
  const { data: priorities } = usePriorities()
  const { data: departments } = useDepartments()
  const { data: profiles } = useProfiles()
  const updateMutation = useUpdateRequest()
  const deleteMutation = useDeleteRequest()

  const request = requests?.find((r) => r.id === requestId)

  if (!request) {
    return (
      <div
        className="flex items-center justify-center h-full text-xs"
        style={{ color: 'var(--text-muted)' }}
      >
        Loading...
      </div>
    )
  }

  return (
    <EditRequestPanel
      request={request}
      statuses={statuses}
      priorities={priorities}
      departments={departments}
      profiles={profiles}
      onUpdate={(id, input) => updateMutation.mutate({ id, input })}
      onDelete={(id) => {
        deleteMutation.mutate(id)
        onClose()
      }}
      onClose={onClose}
    />
  )
}

// ============================================================
// Auth guard — affiche LoginPage si non connecté
// ============================================================

function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen w-screen items-center justify-center"
        style={{ backgroundColor: 'var(--surface-0)' }}
      >
        <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
          <div
            className="w-4 h-4 rounded-full animate-spin"
            style={{
              border: '2px solid var(--border)',
              borderTopColor: 'var(--fill-accent)',
            }}
          />
          Initializing...
        </div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <>{children}</>
}

// ============================================================
// App principale
// ============================================================

const BASE_TITLE = 'OpsHub — Operational Communication Hub'

function AppContent() {
  const [selectedRequestId, setSelectedRequestId] = useState<string | null>(null)
  const { data: unreadCount = 0 } = useUnreadCount()
  const { user, isFreshLogin } = useAuth()
  const { profile } = useCurrentProfile()
  const [showWelcome, setShowWelcome] = useState(false)

  // Show welcome overlay on fresh login (auto-hides via WelcomeOverlay)
  useEffect(() => {
    if (isFreshLogin) {
      setShowWelcome(true)
    }
  }, [isFreshLogin])

  // Sync document title with unread count
  useEffect(() => {
    document.title = unreadCount > 0
      ? `(${unreadCount}) ${BASE_TITLE}`
      : BASE_TITLE
  }, [unreadCount])

  // Favicon badge
  useFaviconBadge(unreadCount)

  // Notifications push navigateur
  useBrowserNotifications()

  // Badge sur l'icône de l'application (barre des tâches / dock)
  useAppBadge(unreadCount)

  // Detail panel pour les requêtes
  const detailPanel = selectedRequestId ? (
    <SelectedRequestDetail
      requestId={selectedRequestId}
      onClose={() => setSelectedRequestId(null)}
    />
  ) : undefined

  const displayName = profile?.full_name ?? profile?.email?.split('@')[0] ?? user?.email?.split('@')[0] ?? 'User'

  return (
    <>
      {/* Welcome overlay on fresh login */}
      {showWelcome && (
        <WelcomeOverlay
          name={displayName}
          onFadeOut={() => setShowWelcome(false)}
        />
      )}
      <AppLayout detailPanel={detailPanel}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/requests"
            element={
              <RequestsPageWithSelection
                selectedRequestId={selectedRequestId}
                onSelectRequest={setSelectedRequestId}
              />
            }
          />
          <Route path="/notifications" element={<NotificationsPage />} />
          <Route path="/team" element={<TeamPage />} />
          <Route path="/profile/:id" element={<ProfilePage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <AuthGuard>
            <AppContent />
          </AuthGuard>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>
  )
}
