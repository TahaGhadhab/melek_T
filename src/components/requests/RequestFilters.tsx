import { Search, X, SlidersHorizontal } from 'lucide-react'
import type { Status, Priority, Department } from '../../types/requests'
import type { RequestFilters as Filters } from '../../types/requests'

interface RequestFiltersProps {
  filters: Filters
  onChange: (filters: Filters) => void
  statuses: Status[] | undefined
  priorities: Priority[] | undefined
  departments: Department[] | undefined
}

export default function RequestFilters({
  filters,
  onChange,
  statuses,
  priorities,
  departments,
}: RequestFiltersProps) {
  const hasActiveFilters = filters.status_id || filters.priority_id || filters.department_id || filters.search

  const clearFilters = () => {
    onChange({})
  }

  return (
    <div
      className="flex items-center gap-2 p-3 rounded-card"
      style={{
        backgroundColor: 'var(--surface-2)',
        border: '0.5px solid var(--border)',
      }}
    >
      {/* Search */}
      <div
        className="flex items-center gap-2 flex-1 rounded-sm px-2.5 py-[7px] text-xs"
        style={{
          backgroundColor: 'var(--surface-0)',
          border: '0.5px solid var(--border)',
          color: 'var(--text-muted)',
        }}
      >
        <Search size={14} style={{ color: 'var(--text-muted)' }} />
        <input
          type="text"
          placeholder="Search by title..."
          value={filters.search ?? ''}
          onChange={(e) => onChange({ ...filters, search: e.target.value || undefined })}
          className="flex-1 bg-transparent border-none outline-none text-xs"
          style={{ color: 'var(--text-primary)' }}
        />
        {filters.search && (
          <button
            onClick={() => onChange({ ...filters, search: undefined })}
            className="cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {/* Status filter */}
      <select
        value={filters.status_id ?? ''}
        onChange={(e) => onChange({ ...filters, status_id: e.target.value || undefined })}
        className="text-xs rounded-sm px-2.5 py-[7px] cursor-pointer outline-none"
        style={{
          backgroundColor: 'var(--surface-0)',
          border: '0.5px solid var(--border)',
          color: filters.status_id ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <option value="">All statuses</option>
        {statuses?.map((s) => (
          <option key={s.id} value={s.id}>
            {s.name}
          </option>
        ))}
      </select>

      {/* Priority filter */}
      <select
        value={filters.priority_id ?? ''}
        onChange={(e) => onChange({ ...filters, priority_id: e.target.value || undefined })}
        className="text-xs rounded-sm px-2.5 py-[7px] cursor-pointer outline-none"
        style={{
          backgroundColor: 'var(--surface-0)',
          border: '0.5px solid var(--border)',
          color: filters.priority_id ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <option value="">All priorities</option>
        {priorities?.map((p) => (
          <option key={p.id} value={p.id}>
            {p.name}
          </option>
        ))}
      </select>

      {/* Department filter */}
      <select
        value={filters.department_id ?? ''}
        onChange={(e) => onChange({ ...filters, department_id: e.target.value || undefined })}
        className="text-xs rounded-sm px-2.5 py-[7px] cursor-pointer outline-none"
        style={{
          backgroundColor: 'var(--surface-0)',
          border: '0.5px solid var(--border)',
          color: filters.department_id ? 'var(--text-primary)' : 'var(--text-muted)',
        }}
      >
        <option value="">All departments</option>
        {departments?.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      {/* Clear filters */}
      {hasActiveFilters && (
        <button
          onClick={clearFilters}
          className="flex items-center gap-1.5 text-xs font-medium rounded-sm px-2.5 py-[7px] cursor-pointer transition-all"
          style={{
            color: 'var(--text-muted)',
            transitionDuration: 'var(--duration-fast)',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 6%, transparent)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent'
          }}
        >
          <X size={14} />
          Clear
        </button>
      )}

      <SlidersHorizontal size={14} style={{ color: 'var(--text-muted)' }} />
    </div>
  )
}
