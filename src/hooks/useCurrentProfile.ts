import { useMemo } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useProfiles } from './useRequests'
import type { Profile } from '../types/requests'

/**
 * Hook qui renvoie le profil complet (email, full_name, avatar_url, department_id, role)
 * de l'utilisateur connecté en croisant l'ID Auth avec la table `profiles`.
 */
export function useCurrentProfile(): {
  profile: Profile | undefined
  isLoading: boolean
} {
  const { user } = useAuth()
  const { data: profiles, isLoading } = useProfiles()

  const profile = useMemo(() => {
    if (!user || !profiles) return undefined
    return profiles.find((p) => p.id === user.id)
  }, [user, profiles])

  return { profile, isLoading }
}
