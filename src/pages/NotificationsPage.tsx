import { useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Bell,
  MessageSquare,
  AlertTriangle,
  CheckCheck,
  Ticket,
  Paperclip,
  UserPlus,
  CalendarClock,
  ArrowRight,
  Check,
} from 'lucide-react'
import {
  useNotifications,
  useMarkNotificationAsRead,
  useMarkAllAsRead,
} from '../hooks/useRequests'
import type { Notification, NotificationType } from '../types/requests'

// ============================================================
// Configuration des types de notifications
// ============================================================

interface NotificationConfig {
  icon: typeof Bell
  color: string
  bgColor: string
}

const notificationConfig: Record<NotificationType, NotificationConfig> = {
  new_request: {
    icon: Ticket,
    color: '#185FA5',
    bgColor: 'var(--bg-accent)',
  },
  status_change: {
    icon: ArrowRight,
    color: '#EF9F27',
    bgColor: 'var(--bg-warning)',
  },
  new_message: {
    icon: MessageSquare,
    color: '#378ADD',
    bgColor: 'var(--bg-accent)',
  },
  new_attachment: {
    icon: Paperclip,
    color: '#888780',
    bgColor: 'var(--surface-2)',
  },
  urgent_request: {
    icon: AlertTriangle,
    color: '#E24B4A',
    bgColor: 'var(--bg-danger)',
  },
  assignment: {
    icon: UserPlus,
    color: '#0F6E56',
    bgColor: 'var(--bg-success)',
  },
  due_date_reminder: {
    icon: CalendarClock,
    color: '#EF9F27',
    bgColor: 'var(--bg-warning)',
  },
}

// ============================================================
// Helpers
// ============================================================

function formatTimeAgo(dateStr: string): string {
  const now = Date.now()
  const date = new Date(dateStr).getTime()
  const diffMs = now - date
  const diffMinutes = Math.floor(diffMs / 60000)
  const diffHours = Math.floor(diffMs / 3600000)
  const diffDays = Math.floor(diffMs / 86400000)

  if (diffMinutes < 1) return 'Just now'
  if (diffMinutes < 60) return `${diffMinutes}m ago`
  if (diffHours < 24) return `${diffHours}h ago`
  if (diffDays < 7) return `${diffDays}d ago`
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function getGroupLabel(dateStr: string): string {
  const now = new Date()
  const date = new Date(dateStr)
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const yesterday = new Date(today.getTime() - 86400000)
  const dateStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())

  if (dateStart.getTime() === today.getTime()) return 'Today'
  if (dateStart.getTime() === yesterday.getTime()) return 'Yesterday'

  const oneWeekAgo = new Date(today.getTime() - 6 * 86400000)
  if (dateStart >= oneWeekAgo) return 'This week'

  const oneMonthAgo = new Date(today.getTime() - 29 * 86400000)
  if (dateStart >= oneMonthAgo) return 'This month'

  return 'Older'
}

// ============================================================
// NotificationItem
// ============================================================

function NotificationItem({
  notification,
  onMarkRead,
  onClick,
}: {
  notification: Notification
  onMarkRead: (id: string) => void
  onClick: (n: Notification) => void
}) {
  const config = notificationConfig[notification.type] ?? notificationConfig.new_request
  const Icon = config.icon

  return (
    <div
      className="group relative flex items-start gap-3 px-3 py-2.5 rounded-sm cursor-pointer transition-all"
      style={{
        backgroundColor: notification.is_read ? 'transparent' : 'var(--bg-accent)',
        transitionDuration: 'var(--duration-fast)',
        transitionTimingFunction: 'var(--ease-out-expo)',
      }}
      onClick={() => onClick(notification)}
      onMouseEnter={(e) => {
        e.currentTarget.style.backgroundColor = notification.is_read
          ? 'color-mix(in srgb, var(--text-primary) 3%, transparent)'
          : 'color-mix(in srgb, var(--fill-accent) 6%, var(--bg-accent))'
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.backgroundColor = notification.is_read
          ? 'transparent'
          : 'var(--bg-accent)'
      }}
    >
      {/* Icon */}
      <div
        className="flex items-center justify-center rounded-full shrink-0 mt-0.5"
        style={{ width: 28, height: 28, backgroundColor: config.bgColor }}
      >
        <Icon size={13} style={{ color: config.color }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div
          className="text-xs font-medium truncate"
          style={{
            color: 'var(--text-primary)',
            fontWeight: notification.is_read ? 400 : 500,
          }}
        >
          {notification.title}
        </div>
        {notification.content && (
          <div
            className="text-[11px] mt-0.5 line-clamp-2"
            style={{ color: 'var(--text-secondary)' }}
          >
            {notification.content}
          </div>
        )}
        <div
          className="text-[10px] mt-1 flex items-center gap-1.5"
          style={{ color: 'var(--text-muted)' }}
        >
          {formatTimeAgo(notification.created_at)}
          {!notification.is_read && (
            <span
              className="w-1.5 h-1.5 rounded-full inline-block"
              style={{ backgroundColor: 'var(--fill-accent)' }}
            />
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-0.5 shrink-0">
        {notification.request_id && (
          <div
            className="text-[9px] font-medium px-1.5 py-0.5 rounded-sm opacity-0 group-hover:opacity-100 transition-all"
            style={{
              color: 'var(--text-accent)',
              backgroundColor: 'var(--bg-accent)',
              transitionDuration: 'var(--duration-fast)',
              transitionTimingFunction: 'var(--ease-out-expo)',
            }}
          >
            View
          </div>
        )}
        {!notification.is_read && (
          <button
            className="flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
            style={{
              width: 24,
              height: 24,
              transitionDuration: 'var(--duration-fast)',
              transitionTimingFunction: 'var(--ease-out-expo)',
            }}
            onClick={(e) => {
              e.stopPropagation()
              onMarkRead(notification.id)
            }}
            title="Mark as read"
          >
            <Check size={13} style={{ color: 'var(--text-muted)' }} />
          </button>
        )}
      </div>
    </div>
  )
}

// ============================================================
// NotificationsPage
// ============================================================

export default function NotificationsPage() {
  const navigate = useNavigate()
  const { data: notifications, isLoading, error } = useNotifications()
  const markReadMutation = useMarkNotificationAsRead()
  const markAllMutation = useMarkAllAsRead()

  const handleMarkRead = useCallback(
    (id: string) => {
      markReadMutation.mutate(id)
    },
    [markReadMutation]
  )

  const handleMarkAllAsRead = useCallback(() => {
    markAllMutation.mutate()
  }, [markAllMutation])

  const handleClick = useCallback(
    (notification: Notification) => {
      if (!notification.is_read) {
        handleMarkRead(notification.id)
      }
      if (notification.request_id) {
        navigate(`/requests?selected=${notification.request_id}`)
      }
    },
    [handleMarkRead, navigate]
  )

  // Grouper par date
  const grouped = useMemo(() => {
    if (!notifications) return []
    const groups: Record<string, Notification[]> = {}
    for (const n of notifications) {
      const label = getGroupLabel(n.created_at)
      if (!groups[label]) groups[label] = []
      groups[label].push(n)
    }
    // Ordre des groupes
    const order = ['Today', 'Yesterday', 'This week', 'This month', 'Older']
    return order
      .filter((g) => groups[g])
      .map((g) => ({ label: g, notifications: groups[g] }))
  }, [notifications])

  const unreadCount = useMemo(
    () => notifications?.filter((n) => !n.is_read).length ?? 0,
    [notifications]
  )

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div
            className="text-[11px] font-medium uppercase tracking-wider mb-1"
            style={{ color: 'var(--text-muted)' }}
          >
            Notifications
          </div>
          <h1
            className="text-xl font-medium flex items-center gap-2"
            style={{ color: 'var(--text-primary)' }}
          >
            Activity
            {unreadCount > 0 && (
              <span
                className="text-[10px] font-medium px-1.5 py-0.5 rounded-sm"
                style={{
                  backgroundColor: 'var(--fill-accent)',
                  color: '#fff',
                }}
              >
                {unreadCount} new
              </span>
            )}
          </h1>
        </div>

        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllAsRead}
            className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-sm cursor-pointer transition-all"
            style={{
              color: 'var(--text-accent)',
              transitionDuration: 'var(--duration-fast)',
              transitionTimingFunction: 'var(--ease-out-expo)',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'var(--bg-accent)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'transparent'
            }}
          >
            <CheckCheck size={13} />
            Mark all as read
          </button>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto min-h-0 space-y-4">
        {/* Loading */}
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
              Loading notifications...
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div
            className="flex flex-col items-center justify-center py-12 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <p style={{ color: '#A32D2D' }} className="mb-1">
              Failed to load notifications
            </p>
            <p>{error instanceof Error ? error.message : 'Check your Supabase connection'}</p>
          </div>
        )}

        {/* Empty */}
        {!isLoading && !error && notifications?.length === 0 && (
          <div
            className="flex flex-col items-center justify-center py-16 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <div
              className="flex items-center justify-center rounded-full mb-4"
              style={{ width: 48, height: 48, backgroundColor: 'var(--surface-2)' }}
            >
              <Bell size={20} style={{ color: 'var(--text-muted)' }} />
            </div>
            <span className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              No notifications yet
            </span>
            <span style={{ textAlign: 'center', lineHeight: 1.4, maxWidth: 220 }}>
              You'll see updates here when someone assigns you a request, replies to your ticket, or changes a status
            </span>
          </div>
        )}

        {/* Grouped list */}
        {!isLoading &&
          grouped.map((group) => (
            <div key={group.label}>
              <div
                className="text-[10px] font-semibold uppercase tracking-wider px-3 mb-1"
                style={{ color: 'var(--text-muted)' }}
              >
                {group.label}
              </div>
              <div className="space-y-0.5">
                {group.notifications.map((n) => (
                  <NotificationItem
                    key={n.id}
                    notification={n}
                    onMarkRead={handleMarkRead}
                    onClick={handleClick}
                  />
                ))}
              </div>
            </div>
          ))}
      </div>

      {/* Footer */}
      {notifications && notifications.length > 0 && (
        <div
          className="text-[10px] pt-2 mt-4 border-t shrink-0"
          style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
        >
          {notifications.length} notification{notifications.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  )
}
