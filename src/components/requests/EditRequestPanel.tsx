import { useState, useEffect } from 'react'
import {
  X,
  Calendar,
  User,
  Building2,
  Trash2,
  Clock,
  Info,
  MessageSquare,
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import type {
  Request,
  Status,
  Priority,
  Department,
  Profile,
  RequestUpdate,
} from '../../types/requests'
import { formatDate, priorityStyles, statusColors } from './RequestCard'
import ChatThread from './ChatThread'

interface EditRequestPanelProps {
  request: Request
  statuses: Status[] | undefined
  priorities: Priority[] | undefined
  departments: Department[] | undefined
  profiles: Profile[] | undefined
  onUpdate: (id: string, input: RequestUpdate) => void
  onDelete: (id: string) => void
  onClose: () => void
}

type Tab = 'details' | 'discussion'

export default function EditRequestPanel({
  request,
  statuses,
  priorities,
  profiles,
  onUpdate,
  onDelete,
  onClose,
}: EditRequestPanelProps) {
  const [activeTab, setActiveTab] = useState<Tab>('discussion')
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [currentUserId, setCurrentUserId] = useState<string | undefined>()
  const pSlug = request.priority?.slug ?? 'medium'
  const sSlug = request.status?.slug ?? 'new'
  const pStyle = priorityStyles[pSlug] ?? priorityStyles.medium
  const sStyle = statusColors[sSlug] ?? statusColors.new

  // Récupérer l'ID de l'utilisateur connecté
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) setCurrentUserId(data.user.id)
    })
  }, [])

  const handleStatusChange = (statusId: string) => {
    onUpdate(request.id, { status_id: statusId })
  }

  const handlePriorityChange = (priorityId: string) => {
    onUpdate(request.id, { priority_id: priorityId })
  }

  const handleAssigneeChange = (assigneeId: string) => {
    onUpdate(request.id, { assignee_id: assigneeId || null })
  }

  const tabs: { id: Tab; label: string; icon: typeof Info }[] = [
    { id: 'discussion', label: 'Discussion', icon: MessageSquare },
    { id: 'details', label: 'Details', icon: Info },
  ]

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="flex items-center justify-between px-xl py-3 border-b shrink-0"
        style={{ borderColor: 'var(--border)' }}
      >
        <span
          className="text-[11px] font-medium uppercase tracking-wider"
          style={{ color: 'var(--text-muted)' }}
        >
          {activeTab === 'discussion' ? 'Discussion' : 'Request Details'}
        </span>
        <button
          onClick={onClose}
          className="flex items-center justify-center rounded-sm cursor-pointer transition-all"
          style={{ width: 24, height: 24, color: 'var(--text-muted)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 6%, transparent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
        >
          <X size={14} />
        </button>
      </div>

      {/* Tabs */}
      <div
        className="flex border-b shrink-0 px-xl"
        style={{ borderColor: 'var(--border)' }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2.5 cursor-pointer transition-all border-b-2"
              style={{
                color: isActive ? 'var(--text-accent)' : 'var(--text-muted)',
                borderBottomColor: isActive ? 'var(--fill-accent)' : 'transparent',
                marginBottom: -0.5,
                transitionDuration: 'var(--duration-fast)',
              }}
            >
              <tab.icon size={13} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Content */}
      {activeTab === 'details' ? (
        <div className="flex-1 overflow-y-auto" style={{ padding: 'var(--gap-xl)' }}>
          {/* Title + badges */}
          <div className="mb-4">
            <h2
              className="text-base font-medium mb-2 leading-snug"
              style={{ color: 'var(--text-primary)' }}
            >
              {request.title}
            </h2>
            <div className="flex items-center gap-2">
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

          {/* Description */}
          {request.description && (
            <div className="mb-5">
              <div
                className="text-[11px] font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Description
              </div>
              <p
                className="text-xs leading-relaxed"
                style={{ color: 'var(--text-primary)' }}
              >
                {request.description}
              </p>
            </div>
          )}

          {/* Editable fields */}
          <div className="space-y-3">
            <div>
              <label
                className="block text-[11px] font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Status
              </label>
              <select
                value={request.status_id}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="w-full text-xs rounded-sm px-3 py-2 outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-0)',
                  border: '0.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {statuses?.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-[11px] font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Priority
              </label>
              <select
                value={request.priority_id}
                onChange={(e) => handlePriorityChange(e.target.value)}
                className="w-full text-xs rounded-sm px-3 py-2 outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-0)',
                  border: '0.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                {priorities?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label
                className="block text-[11px] font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Assignee
              </label>
              <select
                value={request.assignee_id ?? ''}
                onChange={(e) => handleAssigneeChange(e.target.value)}
                className="w-full text-xs rounded-sm px-3 py-2 outline-none cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-0)',
                  border: '0.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              >
                <option value="">Unassigned</option>
                {profiles?.map((p) => (
                  <option key={p.id} value={p.id}>{p.full_name ?? p.email}</option>
                ))}
              </select>
            </div>

            {request.due_date && (
              <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
                <Calendar size={12} />
                Due {formatDate(request.due_date)}
              </div>
            )}
          </div>

          {/* Meta info */}
          <div className="mt-6 pt-4 border-t space-y-2" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <User size={12} />
              <span>Created by </span>
              <span className="font-medium" style={{ color: 'var(--text-secondary)' }}>
                {request.requester?.full_name ?? 'Unknown'}
              </span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Building2 size={12} />
              <span>{request.department?.name ?? 'No department'}</span>
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <Clock size={12} />
              <span>{new Date(request.created_at).toLocaleDateString('fr-FR', {
                day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
              })}</span>
            </div>
          </div>
        </div>
      ) : (
        /* Discussion tab — Chat */
        <ChatThread requestId={request.id} currentUserId={currentUserId} />
      )}

      {/* Footer actions (visible uniquement dans details) */}
      {activeTab === 'details' && (
        <div
          className="flex items-center gap-2 px-xl py-3 border-t shrink-0"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="flex-1" />
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="flex items-center gap-1.5 text-xs font-medium rounded-sm px-3 py-2 cursor-pointer transition-all"
              style={{
                color: '#A32D2D',
                backgroundColor: 'var(--bg-danger)',
                transitionDuration: 'var(--duration-fast)',
              }}
            >
              <Trash2 size={14} />
              Delete
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <span className="text-[10px]" style={{ color: '#A32D2D' }}>Confirm?</span>
              <button
                onClick={() => { onDelete(request.id); onClose() }}
                className="text-[10px] font-medium rounded-sm px-2.5 py-1.5 cursor-pointer"
                style={{ backgroundColor: '#A32D2D', color: '#fff' }}
              >
                Yes, delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-[10px] font-medium rounded-sm px-2.5 py-1.5 cursor-pointer"
                style={{
                  backgroundColor: 'var(--surface-0)',
                  border: '0.5px solid var(--border)',
                  color: 'var(--text-secondary)',
                }}
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
