import { type ReactNode } from 'react'
import Sidebar from './Sidebar'
import Topbar from './Topbar'

interface AppLayoutProps {
  children: ReactNode
  /** Optionnel : remplace la colonne de droite (détail) */
  detailPanel?: ReactNode
  /** Si true, masque le panneau de détail */
  hideDetail?: boolean
}

export default function AppLayout({ children, detailPanel, hideDetail }: AppLayoutProps) {
  return (
    <div className="flex h-screen w-screen overflow-hidden" style={{ backgroundColor: 'var(--surface-0)' }}>
      {/* Sidebar — 240px fixe */}
      <Sidebar />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0">
        {/* Topbar — 52px fixe */}
        <Topbar />

        {/* Content area — 3 colonnes */}
        <div className="flex flex-1 min-h-0">
          {/* Liste principale — flex: 1 */}
          <main
            className="flex-1 overflow-y-auto min-w-0"
            style={{
              padding: 'var(--pad-xl)',
              backgroundColor: 'var(--surface-0)',
            }}
          >
            {children}
          </main>

          {/* Panneau de détail — 420px fixe (optionnel) */}
          {!hideDetail && (
            <aside
              className="overflow-y-auto shrink-0 border-l"
              style={{
                width: 'var(--detail-panel-width)',
                borderColor: 'var(--border)',
                backgroundColor: 'var(--surface-1)',
              }}
            >
              {detailPanel || (
                <div
                  className="flex flex-col items-center justify-center h-full text-xs"
                  style={{ color: 'var(--text-muted)', padding: 'var(--pad-xl)' }}
                >
                  <div
                    className="flex items-center justify-center rounded-full mb-4"
                    style={{
                      width: 48,
                      height: 48,
                      backgroundColor: 'var(--surface-2)',
                    }}
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="12" y1="18" x2="12" y2="12" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                    </svg>
                  </div>
                  <span className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
                    Select a request
                  </span>
                  <span style={{ textAlign: 'center', lineHeight: 1.4 }}>
                    Choose a request from the list to view its details and discussion
                  </span>
                </div>
              )}
            </aside>
          )}
        </div>
      </div>
    </div>
  )
}
