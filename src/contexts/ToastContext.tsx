import { createContext, useContext, useState, useCallback, type ReactNode } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

// ============================================================
// Types
// ============================================================

type ToastType = 'success' | 'error' | 'info'

interface Toast {
  id: string
  message: string
  type: ToastType
}

interface ToastContextType {
  showToast: (message: string, type?: ToastType) => void
}

// ============================================================
// Configuration
// ============================================================

const TOAST_DURATION = 3500

const typeStyles: Record<ToastType, { icon: typeof CheckCircle; bgColor: string; textColor: string; borderColor: string }> = {
  success: {
    icon: CheckCircle,
    bgColor: 'var(--bg-success)',
    textColor: '#27500A',
    borderColor: '#639922',
  },
  error: {
    icon: XCircle,
    bgColor: 'var(--bg-danger)',
    textColor: '#A32D2D',
    borderColor: '#E24B4A',
  },
  info: {
    icon: CheckCircle,
    bgColor: 'var(--bg-accent)',
    textColor: 'var(--text-accent)',
    borderColor: 'var(--border-accent)',
  },
}

// ============================================================
// Contexte
// ============================================================

const ToastContext = createContext<ToastContextType | undefined>(undefined)

let toastCounter = 0

// ============================================================
// Provider
// ============================================================

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${++toastCounter}`
    setToasts((prev) => [...prev, { id, message, type }])

    setTimeout(() => removeToast(id), TOAST_DURATION)
  }, [removeToast])

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}

      {/* Toast container */}
      <div
        className="fixed bottom-4 right-4 flex flex-col gap-2 z-50 pointer-events-none"
        style={{ maxWidth: 360 }}
      >
        {toasts.map((toast) => {
          const styles = typeStyles[toast.type]
          const Icon = styles.icon

          return (
            <div
              key={toast.id}
              className="flex items-start gap-2 px-3 py-2.5 rounded-sm shadow-sm pointer-events-auto animate-in"
              style={{
                backgroundColor: styles.bgColor,
                border: `0.5px solid ${styles.borderColor}`,
                animation: 'toastSlideIn 250ms cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <Icon size={14} style={{ color: styles.textColor, flexShrink: 0, marginTop: 1 }} />
              <span className="text-[11px] font-medium flex-1" style={{ color: styles.textColor }}>
                {toast.message}
              </span>
              <button
                onClick={() => removeToast(toast.id)}
                className="cursor-pointer shrink-0"
                style={{ color: styles.textColor, opacity: 0.6 }}
              >
                <X size={12} />
              </button>
            </div>
          )
        })}
      </div>

      {/* Animation keyframes */}
      <style>{`
        @keyframes toastSlideIn {
          from {
            opacity: 0;
            transform: translateX(20px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
      `}</style>
    </ToastContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useToast() {
  const context = useContext(ToastContext)
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return context
}
