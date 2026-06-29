import { useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { NotificationType } from '../types/requests'

const NOTIFICATION_ICON = '/vite.svg'

interface RealtimeNotification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string | null
  request_id: string | null
  is_read: boolean
  created_at: string
}

// ============================================================
// Configuration des types — emoji + label + priorité implicite
// ============================================================

const typeConfig: Record<NotificationType, { emoji: string; label: string }> = {
  new_request:     { emoji: '🆕', label: 'New request' },
  status_change:   { emoji: '📝', label: 'Status update' },
  new_message:     { emoji: '💬', label: 'New message' },
  new_attachment:  { emoji: '📎', label: 'New attachment' },
  urgent_request:  { emoji: '🚨', label: 'URGENT' },
  assignment:      { emoji: '👤', label: 'Assignment' },
  due_date_reminder: { emoji: '⏰', label: 'Due date reminder' },
}

/**
 * Formater le corps de la notification selon le type.
 */
function formatBody(notif: RealtimeNotification): string {
  const config = typeConfig[notif.type]
  const prefix = config ? `${config.emoji} ${config.label}` : '🔔 Notification'
  const lines = [prefix]

  if (notif.title) {
    lines.push(notif.title)
  }

  if (notif.content) {
    // Tronquer le contenu à 120 caractères max
    const shortContent =
      notif.content.length > 120
        ? notif.content.slice(0, 117) + '...'
        : notif.content
    lines.push(shortContent)
  }

  if (notif.request_id) {
    lines.push('')
    lines.push('Click to view details →')
  }

  return lines.join('\n')
}

/**
 * Hook qui demande la permission d'afficher des notifications push navigateur,
 * puis s'abonne aux nouvelles notifications Supabase via Realtime.
 * Affiche un message enrichi : type, titre, contenu, lien direct vers la demande.
 */
export function useBrowserNotifications() {
  const permissionRef = useRef<NotificationPermission | null>(null)
  const lastNotifiedRef = useRef<Set<string>>(new Set())

  // Demander la permission au premier appel
  useEffect(() => {
    if (!('Notification' in window)) {
      console.warn('[OpsHub] Notification API not supported in this browser')
      return
    }

    if (Notification.permission === 'granted') {
      permissionRef.current = 'granted'
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission().then((perm) => {
        permissionRef.current = perm
      })
    }
  }, [])

  // S'abonner aux nouvelles notifications via Realtime
  useEffect(() => {
    const channel = supabase
      .channel('browser-notifications')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        (payload) => {
          // Ne montrer que si la page n'est pas active
          if (!document.hidden) return
          if (permissionRef.current !== 'granted') return
          if (!('Notification' in window)) return

          const notif = payload.new as RealtimeNotification
          if (!notif?.title) return

          // Éviter les doublons
          if (lastNotifiedRef.current.has(notif.id)) return
          lastNotifiedRef.current.add(notif.id)
          setTimeout(() => lastNotifiedRef.current.delete(notif.id), 30_000)

          try {
            const notifInstance = new Notification('OpsHub', {
              body: formatBody(notif),
              tag: notif.request_id ?? notif.id,
              icon: NOTIFICATION_ICON,
              data: { requestId: notif.request_id, id: notif.id },
            })

            // Clic sur la notification → naviguer vers la demande
            notifInstance.onclick = () => {
              window.focus()
              if (notif.request_id) {
                window.location.href = `/requests?selected=${notif.request_id}`
              }
              notifInstance.close()
            }
          } catch {
            // Navigateur peut bloquer les notifications
          }
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])
}
