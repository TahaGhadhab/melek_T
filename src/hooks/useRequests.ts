import { useEffect, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import {
  fetchRequests,
  fetchRequestById,
  fetchStatuses,
  fetchPriorities,
  fetchDepartments,
  fetchProfiles,
  createRequest,
  updateRequest,
  deleteRequest,
  fetchMessages,
  sendMessage,
  markMessageAsRead,
  fetchAttachments,
  uploadAttachment,
  uploadProfileAvatar,
  updateProfile,
  logActivity,
  fetchNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  fetchOpenRequestCount,
} from '../lib/requests'
import type { RequestFilters, RequestInsert, RequestUpdate, ProfileUpdate, MessageInsert } from '../types/requests'

// ============================================================
// Clés de cache
// ============================================================

export const queryKeys = {
  requests: ['requests'] as const,
  request: (id: string) => ['requests', id] as const,
  statuses: ['statuses'] as const,
  priorities: ['priorities'] as const,
  departments: ['departments'] as const,
  profiles: ['profiles'] as const,
  messages: (requestId: string) => ['messages', requestId] as const,
  attachments: (requestId: string) => ['attachments', requestId] as const,
  notifications: ['notifications'] as const,
  unreadNotifications: ['notifications', 'unread'] as const,
  requestCount: ['requests', 'count'] as const,
}

// ============================================================
// Hooks — Références
// ============================================================

export function useStatuses() {
  return useQuery({
    queryKey: queryKeys.statuses,
    queryFn: fetchStatuses,
    staleTime: 1000 * 60 * 10, // 10 minutes — les statuts changent rarement
  })
}

export function usePriorities() {
  return useQuery({
    queryKey: queryKeys.priorities,
    queryFn: fetchPriorities,
    staleTime: 1000 * 60 * 10,
  })
}

export function useDepartments() {
  return useQuery({
    queryKey: queryKeys.departments,
    queryFn: fetchDepartments,
    staleTime: 1000 * 60 * 10,
  })
}

export function useProfiles() {
  return useQuery({
    queryKey: queryKeys.profiles,
    queryFn: fetchProfiles,
    staleTime: 1000 * 60 * 5,
  })
}

// ============================================================
// Hooks — Requêtes
// ============================================================

export function useRequests(filters?: RequestFilters) {
  return useQuery({
    queryKey: [...queryKeys.requests, filters],
    queryFn: () => fetchRequests(filters),
  })
}

export function useRequest(id: string | undefined) {
  return useQuery({
    queryKey: queryKeys.request(id!),
    queryFn: () => fetchRequestById(id!),
    enabled: !!id,
  })
}

// ============================================================
// Mutations
// ============================================================

export function useCreateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: RequestInsert) => createRequest(input),
    onSuccess: async (data) => {
      await logActivity(data.id, 'created', { title: data.title })
      queryClient.invalidateQueries({ queryKey: queryKeys.requests })
      queryClient.invalidateQueries({ queryKey: queryKeys.requestCount })
    },
  })
}

export function useUpdateRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: RequestUpdate }) =>
      updateRequest(id, input),
    onSuccess: async (data) => {
      const changes: string[] = []
      for (const [key, value] of Object.entries(data)) {
        if (value !== undefined && ['status_id', 'priority_id', 'assignee_id', 'title'].includes(key)) {
          changes.push(`${key}: ${value}`)
        }
      }
      await logActivity(data.id, 'updated', { changes })
      queryClient.invalidateQueries({ queryKey: queryKeys.requests })
      queryClient.invalidateQueries({ queryKey: queryKeys.request(data.id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.requestCount })
    },
  })
}

export function useDeleteRequest() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => deleteRequest(id),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.requests })
      queryClient.removeQueries({ queryKey: queryKeys.request(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.requestCount })
    },
  })
}

// ============================================================
// Hooks — Messages
// ============================================================

export function useMessages(requestId: string | undefined) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.messages(requestId ?? ''),
    queryFn: () => fetchMessages(requestId!),
    enabled: !!requestId,
  })

  // Abonnement Realtime pour les nouveaux messages
  useEffect(() => {
    if (!requestId) return

    const channel = supabase
      .channel(`messages:${requestId}`)
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `request_id=eq.${requestId}`,
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.messages(requestId) })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [requestId, queryClient])

  return query
}

export function useSendMessage() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: MessageInsert) => sendMessage(input),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.messages(data.request_id) })
    },
  })
}

export function useMarkAsRead() {
  return useMutation({
    mutationFn: (messageId: string) => markMessageAsRead(messageId),
  })
}

export function useAttachments(requestId: string | undefined) {
  return useQuery({
    queryKey: queryKeys.attachments(requestId ?? ''),
    queryFn: () => fetchAttachments(requestId!),
    enabled: !!requestId,
  })
}

// ============================================================
// Hooks — Profil
// ============================================================

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, input }: { id: string; input: ProfileUpdate }) =>
      updateProfile(id, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.profiles })
    },
  })
}

export function useUploadProfileAvatar() {
  return useMutation({
    mutationFn: ({ userId, file }: { userId: string; file: File }) =>
      uploadProfileAvatar(userId, file),
  })
}

export function useUploadAttachment() {
  return useMutation({
    mutationFn: ({
      requestId, messageId, file,
    }: {
      requestId: string
      messageId: string | null
      file: File
    }) => uploadAttachment(requestId, messageId, file),
  })
}

// ============================================================
// Hooks — Request count (sidebar badge)
// ============================================================

export function useRequestCount() {
  const queryClient = useQueryClient()
  const { data: statuses } = useStatuses()

  // Resolve 'resolved'/'closed' status IDs from the cached statuses
  const closedStatusIds = useMemo(() => {
    const closedSlugs = ['resolved', 'closed']
    return statuses
      ?.filter((s) => closedSlugs.includes(s.slug))
      .map((s) => s.id) ?? []
  }, [statuses])

  const query = useQuery({
    queryKey: queryKeys.requestCount,
    queryFn: () => fetchOpenRequestCount(closedStatusIds),
    enabled: !!statuses, // wait for statuses to load first
    refetchInterval: 30_000,
  })

  // Abonnement Realtime pour les mutations sur requests
  useEffect(() => {
    const channel = supabase
      .channel('sidebar-request-count')
      .on('postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'requests',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.requestCount })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

// ============================================================
// Hooks — Notifications
// ============================================================

export function useNotifications() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: queryKeys.notifications,
    queryFn: fetchNotifications,
    refetchInterval: 30_000, // toutes les 30s
  })

  // Abonnement Realtime pour les nouvelles notifications
  useEffect(() => {
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
        }
      )
      .on('postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'notifications',
        },
        () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [queryClient])

  return query
}

export function useUnreadCount() {
  return useQuery({
    queryKey: queryKeys.unreadNotifications,
    queryFn: async () => {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('is_read', false)
      if (error) throw error
      return count ?? 0
    },
    refetchInterval: 30_000,
  })
}

export function useMarkNotificationAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => markNotificationAsRead(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications })
    },
  })
}

export function useMarkAllAsRead() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () => markAllNotificationsAsRead(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications })
      queryClient.invalidateQueries({ queryKey: queryKeys.unreadNotifications })
    },
  })
}
