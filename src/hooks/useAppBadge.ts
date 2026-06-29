import { useEffect } from 'react'

const isBadgingSupported =
  typeof navigator !== 'undefined' &&
  'setAppBadge' in navigator &&
  typeof navigator.setAppBadge === 'function'

const nav = navigator as Navigator & {
  setAppBadge?: (count?: number) => Promise<void>
  clearAppBadge?: () => Promise<void>
}

/**
 * Hook qui utilise l'API Badging (navigator.setAppBadge / clearAppBadge)
 * pour afficher un badge avec le nombre de notifications non lues
 * sur l'icône de l'application dans la barre des tâches / dock.
 *
 * Supporté par Chrome/Edge 81+ sur desktop et Android.
 * Silencieusement ignoré sur les navigateurs non supportés.
 */
export function useAppBadge(count: number) {
  useEffect(() => {
    if (!isBadgingSupported) return

    if (count > 0) {
      nav.setAppBadge?.(count).catch(() =>
        console.warn('[OpsHub] Failed to set app badge')
      )
    } else {
      nav.clearAppBadge?.().catch(() =>
        console.warn('[OpsHub] Failed to clear app badge')
      )
    }
  }, [count])
}
