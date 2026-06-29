import { useMemo } from 'react'
import { useRequests } from './useRequests'

export interface DashboardKPI {
  label: string
  value: number
  delta: string
  up: boolean
  urgent?: boolean
  color: string
  bgColor: string
  borderColor?: string
}

/**
 * Hook qui calcule les KPI du Dashboard à partir des données Supabase,
 * avec comparaison avec la période précédente pour les deltas.
 */
export function useDashboardStats() {
  const { data: requests, isLoading, error } = useRequests()

  const kpis = useMemo((): DashboardKPI[] => {
    if (!requests) return []

    const now = new Date()
    const today = now.toISOString().split('T')[0]

    // Résolu/Fermé
    const isClosed = (r: { status?: { slug?: string } }) =>
      r.status?.slug === 'resolved' || r.status?.slug === 'closed'

    // Ouvert (pas résolu/fermé)
    const open = requests.filter((r) => !isClosed(r))

    // Urgent (priorité Urgent + pas résolu/fermé)
    const urgent = open.filter((r) => r.priority?.slug === 'urgent')

    // Dû aujourd'hui ou en retard (due_date <= today + pas résolu/fermé)
    const dueToday = open.filter(
      (r) => r.due_date && r.due_date <= today
    )

    // Résolu cette semaine
    const weekAgo = new Date(now.getTime() - 7 * 86400000).toISOString()
    const resolvedThisWeek = requests.filter(
      (r) => isClosed(r) && r.updated_at >= weekAgo
    )

    // Comparaison avec la période précédente (pour les deltas)
    // Période actuelle: dernière semaine
    // Période précédente: semaine d'avant
    const prevEnd = now.getTime() - 7 * 86400000
    const prevStart = prevEnd - 7 * 86400000

    const prevOpen = requests.filter(
      (r) =>
        !isClosed(r) &&
        new Date(r.created_at).getTime() >= prevStart &&
        new Date(r.created_at).getTime() < prevEnd
    ).length

    const prevUrgent = requests.filter(
      (r) =>
        !isClosed(r) &&
        r.priority?.slug === 'urgent' &&
        new Date(r.created_at).getTime() >= prevStart &&
        new Date(r.created_at).getTime() < prevEnd
    ).length

    const prevDueToday = requests.filter(
      (r) =>
        !isClosed(r) &&
        r.due_date &&
        r.due_date <= today &&
        new Date(r.created_at).getTime() >= prevStart &&
        new Date(r.created_at).getTime() < prevEnd
    ).length

    const prevResolved = requests.filter(
      (r) =>
        isClosed(r) &&
        new Date(r.updated_at).getTime() >= prevStart &&
        new Date(r.updated_at).getTime() < prevEnd
    ).length

    const calcDelta = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? '+∞' : '—'
      const diff = current - previous
      const sign = diff >= 0 ? '+' : ''
      return `${sign}${diff}`
    }

    const isUp = (current: number, previous: number, inverse = false) => {
      if (previous === 0) return current > 0
      return inverse ? current < previous : current >= previous
    }

    return [
      {
        label: 'Open',
        value: open.length,
        delta: calcDelta(open.length, prevOpen),
        up: isUp(open.length, prevOpen),
        color: 'var(--text-primary)',
        bgColor: 'var(--surface-2)',
      },
      {
        label: 'Urgent',
        value: urgent.length,
        delta: calcDelta(urgent.length, prevUrgent),
        up: isUp(urgent.length, prevUrgent),
        urgent: true,
        color: '#A32D2D',
        bgColor: 'var(--surface-2)',
        borderColor: '#F09595',
      },
      {
        label: 'Due today',
        value: dueToday.length,
        delta: calcDelta(dueToday.length, prevDueToday),
        up: isUp(dueToday.length, prevDueToday, true),
        color: 'var(--text-primary)',
        bgColor: 'var(--surface-2)',
      },
      {
        label: 'Resolved',
        value: resolvedThisWeek.length,
        delta: calcDelta(resolvedThisWeek.length, prevResolved),
        up: isUp(resolvedThisWeek.length, prevResolved),
        color: 'var(--text-primary)',
        bgColor: 'var(--surface-2)',
      },
    ]
  }, [requests])

  return { kpis, isLoading, error }
}


