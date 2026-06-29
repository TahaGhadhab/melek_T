import { useState, useCallback } from 'react'
import { Plus } from 'lucide-react'
import RequestFilters from '../components/requests/RequestFilters'
import RequestCard from '../components/requests/RequestCard'
import CreateRequestModal from '../components/requests/CreateRequestModal'
import {
  useRequests,
  useStatuses,
  usePriorities,
  useDepartments,
  useCreateRequest,
} from '../hooks/useRequests'
import type { RequestFilters as Filters, RequestInsert } from '../types/requests'

interface RequestsPageProps {
  onSelectRequest?: (requestId: string | null) => void
  selectedRequestId?: string | null
}

export default function RequestsPage({ onSelectRequest, selectedRequestId }: RequestsPageProps) {
  const [filters, setFilters] = useState<Filters>({})
  const [showCreateModal, setShowCreateModal] = useState(false)

  // Queries
  const { data: requests, isLoading, error } = useRequests(filters)
  const { data: statuses } = useStatuses()
  const { data: priorities } = usePriorities()
  const { data: departments } = useDepartments()

  // Mutation
  const createMutation = useCreateRequest()

  // Handlers
  const handleCreate = useCallback(
    async (data: RequestInsert) => {
      const result = await createMutation.mutateAsync(data)
      if (result && onSelectRequest) {
        onSelectRequest(result.id)
      }
    },
    [createMutation, onSelectRequest]
  )

  return (
    <>
      <div className="flex flex-col gap-4 h-full">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <div
              className="text-[11px] font-medium uppercase tracking-wider mb-1"
              style={{ color: 'var(--text-muted)' }}
            >
              Requests
            </div>
            <h1
              className="text-xl font-medium"
              style={{ color: 'var(--text-primary)' }}
            >
              All Requests
              {requests && (
                <span className="text-sm font-normal ml-2" style={{ color: 'var(--text-muted)' }}>
                  ({requests.length})
                </span>
              )}
            </h1>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-1.5 text-xs font-medium rounded-sm px-3 py-2 cursor-pointer transition-all"
            style={{
              backgroundColor: 'var(--fill-accent)',
              color: '#fff',
              transitionDuration: 'var(--duration-fast)',
              transitionTimingFunction: 'var(--ease-out-expo)',
            }}
          >
            <Plus size={14} />
            New Request
          </button>
        </div>

        {/* Filters */}
        <RequestFilters
          filters={filters}
          onChange={setFilters}
          statuses={statuses}
          priorities={priorities}
          departments={departments}
        />

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-2 min-h-0">
          {/* Loading state */}
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
                Loading requests...
              </div>
            </div>
          )}

          {/* Error state */}
          {error && (
            <div
              className="flex flex-col items-center justify-center py-12 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <p style={{ color: '#A32D2D' }} className="mb-1">
                Failed to load requests
              </p>
              <p>
                {error instanceof Error ? error.message : 'Check your Supabase connection in .env'}
              </p>
            </div>
          )}

          {/* Empty state */}
          {!isLoading && !error && requests?.length === 0 && (
            <div
              className="flex flex-col items-center justify-center py-16 text-xs"
              style={{ color: 'var(--text-muted)' }}
            >
              <div
                className="flex items-center justify-center rounded-full mb-4"
                style={{ width: 48, height: 48, backgroundColor: 'var(--surface-2)' }}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                  <polyline points="14 2 14 8 20 8" />
                </svg>
              </div>
              <span className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                No requests found
              </span>
              <span style={{ textAlign: 'center', lineHeight: 1.4 }}>
                {filters.search || filters.status_id || filters.priority_id || filters.department_id
                  ? 'Try adjusting your filters'
                  : 'Create your first request to get started'}
              </span>
            </div>
          )}

          {/* Request list */}
          {requests?.map((req) => (
            <RequestCard
              key={req.id}
              request={req}
              isSelected={req.id === selectedRequestId}
              onClick={() => onSelectRequest?.(req.id === selectedRequestId ? null : req.id)}
            />
          ))}
        </div>

        {/* Footer with count */}
        {requests && requests.length > 0 && (
          <div
            className="text-[10px] pt-2 border-t shrink-0"
            style={{ borderColor: 'var(--border)', color: 'var(--text-muted)' }}
          >
            Showing {requests.length} request{requests.length !== 1 ? 's' : ''}
          </div>
        )}
      </div>

      {/* Create modal */}
      <CreateRequestModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        statuses={statuses}
        priorities={priorities}
        departments={departments}
      />
    </>
  )
}
