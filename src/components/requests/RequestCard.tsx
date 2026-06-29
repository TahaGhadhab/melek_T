import type { Request } from '../../types/requests'

// Couleurs pour les badges
const priorityStyles: Record<string, { bg: string; text: string }> = {
  urgent: { bg: '#FCEBEB', text: '#791F1F' },
  high: { bg: '#FAEEDA', text: '#633806' },
  medium: { bg: '#E6F1FB', text: '#0C447C' },
  low: { bg: '#EAF3DE', text: '#27500A' },
}

const statusColors: Record<string, { bg: string; text: string }> = {
  new: { bg: '#EEEDFE', text: '#3C3489' },
  in_progress: { bg: '#E1F5EE', text: '#085041' },
  waiting: { bg: '#FAEEDA', text: '#633806' },
  blocked: { bg: '#FCEBEB', text: '#791F1F' },
  resolved: { bg: '#EAF3DE', text: '#27500A' },
  closed: { bg: '#D3D1C7', text: '#2C2C2A' },
}

// Couleurs d'avatar par département
const avatarColors = [
  { bg: '#B5D4F4', text: '#0C447C' },
  { bg: '#9FE1CB', text: '#085041' },
  { bg: '#FAC775', text: '#633806' },
  { bg: '#F5C4B3', text: '#712B13' },
  { bg: '#C9B8E8', text: '#3C3489' },
]

function getAvatarColor(name: string | null | undefined) {
  let hash = 0
  const str = name ?? '?'
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return avatarColors[Math.abs(hash) % avatarColors.length]
}

function getInitials(name: string | null | undefined): string {
  if (!name) return '?'
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)
}

function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })
}

interface RequestCardProps {
  request: Request
  isSelected?: boolean
  onClick?: () => void
}

export default function RequestCard({ request, isSelected, onClick }: RequestCardProps) {
  const pSlug = request.priority?.slug ?? 'medium'
  const sSlug = request.status?.slug ?? 'new'
  const pStyle = priorityStyles[pSlug] ?? priorityStyles.medium
  const sStyle = statusColors[sSlug] ?? statusColors.new
  const avatar = getAvatarColor(request.requester?.full_name)
  const initials = getInitials(request.requester?.full_name)

  return (
    <div
      onClick={onClick}
      className="rounded-card p-3 cursor-pointer transition-all"
      style={{
        backgroundColor: isSelected ? 'var(--bg-accent)' : 'var(--surface-2)',
        border: isSelected
          ? '0.5px solid var(--border-accent)'
          : '0.5px solid var(--border)',
        transitionDuration: 'var(--duration-fast)',
        transitionTimingFunction: 'var(--ease-out-expo)',
      }}
    >
      {/* Header with title + badges */}
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <span
          className="text-[13px] font-medium leading-snug"
          style={{ color: 'var(--text-primary)' }}
        >
          {request.title}
        </span>
        <div className="flex items-center gap-1.5 shrink-0 mt-0.5">
          <span
            className="text-[10px] font-medium px-[7px] py-[2px] rounded-sm"
            style={{ backgroundColor: pStyle.bg, color: pStyle.text }}
          >
            {request.priority?.name ?? 'Medium'}
          </span>
          <span
            className="text-[10px] font-medium px-[7px] py-[2px] rounded-sm"
            style={{ backgroundColor: sStyle.bg, color: sStyle.text }}
          >
            {request.status?.name ?? 'New'}
          </span>
        </div>
      </div>

      {/* Description preview */}
      {request.description && (
        <div
          className="text-[11px] mb-1.5 line-clamp-2"
          style={{ color: 'var(--text-muted)' }}
        >
          {request.description}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center gap-2 mt-2">
        <div
          className="flex items-center justify-center rounded-full text-[9px] font-medium shrink-0"
          style={{
            width: 20,
            height: 20,
            backgroundColor: avatar.bg,
            color: avatar.text,
          }}
          title={request.requester?.full_name ?? 'Unknown'}
        >
          {initials}
        </div>
        <span className="text-[10px] truncate" style={{ color: 'var(--text-muted)' }}>
          {request.department?.name ?? 'No department'}
        </span>
        <div className="flex-1" />
        <div className="flex items-center gap-3">
          {request.due_date && (
            <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
              Due {formatDate(request.due_date)}
            </span>
          )}
          <span className="text-[10px]" style={{ color: 'var(--text-muted)' }}>
            {formatDate(request.created_at)}
          </span>
        </div>
      </div>
    </div>
  )
}

export { getInitials, getAvatarColor, formatDate, priorityStyles, statusColors }
