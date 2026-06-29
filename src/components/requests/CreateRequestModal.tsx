import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { X, Plus } from 'lucide-react'
import type { Status, Priority, Department } from '../../types/requests'

// Schéma de validation Zod
const requestSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters').max(200, 'Title too long'),
  description: z.string().max(2000, 'Description too long').optional(),
  department_id: z.string().optional(),
  status_id: z.string().min(1, 'Status is required'),
  priority_id: z.string().min(1, 'Priority is required'),
  due_date: z.string().optional(),
})

type RequestFormData = z.infer<typeof requestSchema>

interface CreateRequestModalProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: RequestFormData) => Promise<void>
  statuses: Status[] | undefined
  priorities: Priority[] | undefined
  departments: Department[] | undefined
}

export default function CreateRequestModal({
  isOpen,
  onClose,
  onSubmit,
  statuses,
  priorities,
  departments,
}: CreateRequestModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<RequestFormData>({
    resolver: zodResolver(requestSchema),
    defaultValues: {
      status_id: statuses?.[0]?.id ?? '',
      priority_id: priorities?.[1]?.id ?? '',
    },
  })

  // Réinitialiser le formulaire quand le modal s'ouvre
  useEffect(() => {
    if (isOpen) {
      reset({
        title: '',
        description: '',
        department_id: '',
        status_id: statuses?.[0]?.id ?? '',
        priority_id: priorities?.[1]?.id ?? '',
        due_date: '',
      })
    }
  }, [isOpen, reset, statuses, priorities])

  if (!isOpen) return null

  const doSubmit = async (data: RequestFormData) => {
    setIsSubmitting(true)
    try {
      await onSubmit(data)
      onClose()
    } catch (err) {
      console.error('Failed to create request:', err)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 z-50"
        style={{ backgroundColor: 'rgba(0,0,0,0.4)' }}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <div
          className="w-full max-w-lg rounded-card overflow-hidden shadow-xl"
          style={{
            backgroundColor: 'var(--surface-1)',
            border: '0.5px solid var(--border)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-xl py-3 border-b"
            style={{ borderColor: 'var(--border)' }}
          >
            <div>
              <h2
                className="text-sm font-medium"
                style={{ color: 'var(--text-primary)' }}
              >
                New Request
              </h2>
              <p
                className="text-[11px] mt-0.5"
                style={{ color: 'var(--text-muted)' }}
              >
                Create a new support or service request
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center rounded-sm cursor-pointer transition-all"
              style={{
                width: 28,
                height: 28,
                color: 'var(--text-muted)',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit(doSubmit)} className="p-xl space-y-4">
            {/* Title */}
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Title <span style={{ color: '#A32D2D' }}>*</span>
              </label>
              <input
                {...register('title')}
                placeholder="e.g. VPN access for Lyon office"
                className="w-full text-xs rounded-sm px-3 py-2 outline-none"
                style={{
                  backgroundColor: 'var(--surface-0)',
                  border: errors.title ? '0.5px solid #E24B4A' : '0.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
              {errors.title && (
                <p className="text-[10px] mt-1" style={{ color: '#A32D2D' }}>
                  {errors.title.message}
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label
                className="block text-xs font-medium mb-1"
                style={{ color: 'var(--text-secondary)' }}
              >
                Description
              </label>
              <textarea
                {...register('description')}
                rows={3}
                placeholder="Describe the request, context, and any relevant details..."
                className="w-full text-xs rounded-sm px-3 py-2 outline-none resize-none"
                style={{
                  backgroundColor: 'var(--surface-0)',
                  border: '0.5px solid var(--border)',
                  color: 'var(--text-primary)',
                }}
              />
            </div>

            {/* Row: Department + Due date */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Department
                </label>
                <select
                  {...register('department_id')}
                  className="w-full text-xs rounded-sm px-3 py-2 outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface-0)',
                    border: '0.5px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  <option value="">Select department</option>
                  {departments?.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Due date
                </label>
                <input
                  type="date"
                  {...register('due_date')}
                  className="w-full text-xs rounded-sm px-3 py-2 outline-none"
                  style={{
                    backgroundColor: 'var(--surface-0)',
                    border: '0.5px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>

            {/* Row: Priority + Status */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Priority <span style={{ color: '#A32D2D' }}>*</span>
                </label>
                <select
                  {...register('priority_id')}
                  className="w-full text-xs rounded-sm px-3 py-2 outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface-0)',
                    border: '0.5px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {priorities?.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  className="block text-xs font-medium mb-1"
                  style={{ color: 'var(--text-secondary)' }}
                >
                  Status <span style={{ color: '#A32D2D' }}>*</span>
                </label>
                <select
                  {...register('status_id')}
                  className="w-full text-xs rounded-sm px-3 py-2 outline-none cursor-pointer"
                  style={{
                    backgroundColor: 'var(--surface-0)',
                    border: '0.5px solid var(--border)',
                    color: 'var(--text-primary)',
                  }}
                >
                  {statuses?.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="text-xs font-medium rounded-sm px-3 py-2 cursor-pointer transition-all"
                style={{
                  color: 'var(--text-secondary)',
                  transitionDuration: 'var(--duration-fast)',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 text-xs font-medium rounded-sm px-4 py-2 cursor-pointer transition-all disabled:opacity-50"
                style={{
                  backgroundColor: 'var(--fill-accent)',
                  color: '#fff',
                  transitionDuration: 'var(--duration-fast)',
                }}
              >
                <Plus size={14} />
                {isSubmitting ? 'Creating...' : 'Create Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
