import { supabase } from './supabase'
import type {
  Request, RequestInsert, RequestUpdate, RequestFilters,
  Status, Priority, Department, Profile, ProfileUpdate,
  Message, MessageInsert, Attachment, Notification,
} from '../types/requests'

// ============================================================
// Références (statuses, priorities, departments)
// ============================================================

export async function fetchStatuses(): Promise<Status[]> {
  const { data, error } = await supabase
    .from('statuses')
    .select('*')
    .order('position', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchPriorities(): Promise<Priority[]> {
  const { data, error } = await supabase
    .from('priorities')
    .select('*')
    .order('position', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchDepartments(): Promise<Department[]> {
  const { data, error } = await supabase
    .from('departments')
    .select('*')
    .order('name', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, avatar_url, department_id, role')
  if (error) throw error
  return data ?? []
}

// ============================================================
// Requêtes — Liste filtrée
// ============================================================

export async function fetchRequests(filters?: RequestFilters): Promise<Request[]> {
  let query = supabase
    .from('requests')
    .select(`
      *,
      requester:profiles!requests_requester_id_fkey(id, email, full_name, avatar_url, department_id, role),
      assignee:profiles!requests_assignee_id_fkey(id, email, full_name, avatar_url, department_id, role),
      department:departments(*),
      status:statuses(*),
      priority:priorities(*)
    `)
    .order('created_at', { ascending: false })

  // Filtres
  if (filters?.search) {
    query = query.ilike('title', `%${filters.search}%`)
  }
  if (filters?.status_id) {
    query = query.eq('status_id', filters.status_id)
  }
  if (filters?.priority_id) {
    query = query.eq('priority_id', filters.priority_id)
  }
  if (filters?.department_id) {
    query = query.eq('department_id', filters.department_id)
  }
  if (filters?.assignee_id) {
    query = query.eq('assignee_id', filters.assignee_id)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ============================================================
// Requête — Détail d'une demande
// ============================================================

export async function fetchRequestById(id: string): Promise<Request | null> {
  const { data, error } = await supabase
    .from('requests')
    .select(`
      *,
      requester:profiles!requests_requester_id_fkey(id, email, full_name, avatar_url, department_id, role),
      assignee:profiles!requests_assignee_id_fkey(id, email, full_name, avatar_url, department_id, role),
      department:departments(*),
      status:statuses(*),
      priority:priorities(*)
    `)
    .eq('id', id)
    .single()
  if (error) throw error
  return data
}

// ============================================================
// CRUD
// ============================================================

export async function createRequest(input: RequestInsert): Promise<Request> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('requests')
    .insert({
      title: input.title,
      description: input.description ?? null,
      requester_id: user.data.user.id,
      department_id: input.department_id ?? null,
      status_id: input.status_id,
      priority_id: input.priority_id,
      due_date: input.due_date ?? null,
    })
    .select(`
      *,
      requester:profiles!requests_requester_id_fkey(id, email, full_name, avatar_url, department_id, role),
      status:statuses(*),
      priority:priorities(*)
    `)
    .single()

  if (error) throw error
  return data
}

export async function updateRequest(id: string, input: RequestUpdate): Promise<Request> {
  const { data, error } = await supabase
    .from('requests')
    .update({
      ...input,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .select(`
      *,
      requester:profiles!requests_requester_id_fkey(id, email, full_name, avatar_url, department_id, role),
      assignee:profiles!requests_assignee_id_fkey(id, email, full_name, avatar_url, department_id, role),
      department:departments(*),
      status:statuses(*),
      priority:priorities(*)
    `)
    .single()

  if (error) throw error
  return data
}

export async function deleteRequest(id: string): Promise<void> {
  const { error } = await supabase
    .from('requests')
    .delete()
    .eq('id', id)
  if (error) throw error
}

// ============================================================
// Messages — Chat
// ============================================================

export async function fetchMessages(requestId: string): Promise<Message[]> {
  const { data, error } = await supabase
    .from('messages')
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, email, full_name, avatar_url, department_id, role),
      attachments:attachments(*),
      read_by:message_reads(*, user:profiles!message_reads_user_id_fkey(id, email, full_name, avatar_url, department_id, role))
    `)
    .eq('request_id', requestId)
    .order('created_at', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function sendMessage(input: MessageInsert): Promise<Message> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')

  const { data, error } = await supabase
    .from('messages')
    .insert({
      request_id: input.request_id,
      sender_id: user.data.user.id,
      content: input.content,
    })
    .select(`
      *,
      sender:profiles!messages_sender_id_fkey(id, email, full_name, avatar_url, department_id, role)
    `)
    .single()
  if (error) throw error
  return data
}

export async function markMessageAsRead(messageId: string): Promise<void> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) return

  const { error } = await supabase
    .from('message_reads')
    .upsert({
      message_id: messageId,
      user_id: user.data.user.id,
      read_at: new Date().toISOString(),
    }, { onConflict: 'message_id,user_id' })
  if (error && error.code !== '23505') throw error // ignore duplicate
}

// ============================================================
// Fichiers attachés
// ============================================================

export async function fetchAttachments(requestId: string): Promise<Attachment[]> {
  const { data, error } = await supabase
    .from('attachments')
    .select(`
      *,
      uploader:profiles!attachments_uploaded_by_fkey(id, email, full_name, avatar_url, department_id, role)
    `)
    .eq('request_id', requestId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function uploadAttachment(
  requestId: string,
  messageId: string | null,
  file: File
): Promise<Attachment> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')

  // Upload to storage
  const filePath = `${requestId}/${Date.now()}_${file.name}`

  const { error: uploadError } = await supabase.storage
    .from('attachments')
    .upload(filePath, file)
  if (uploadError) throw uploadError

  // Create attachment record
  const { data, error } = await supabase
    .from('attachments')
    .insert({
      message_id: messageId,
      request_id: requestId,
      filename: file.name,
      filesize: file.size,
      filetype: file.type,
      storage_path: filePath,
      uploaded_by: user.data.user.id,
    })
    .select(`*`)
    .single()
  if (error) throw error
  return data
}

export function getFileUrl(storagePath: string): string {
  const { data } = supabase.storage.from('attachments').getPublicUrl(storagePath)
  return data.publicUrl
}

// ============================================================
// Request count (sidebar badge)
// ============================================================

/**
 * Counts open requests (not resolved/closed) for the sidebar badge.
 * Shares the same "open" definition as useDashboardStats.
 * @param excludeStatusIds - IDs of statuses considered "closed" (e.g. resolved, closed)
 */
export async function fetchOpenRequestCount(excludeStatusIds: string[]): Promise<number> {
  let query = supabase
    .from('requests')
    .select('*', { count: 'exact', head: true })

  if (excludeStatusIds.length > 0) {
    query = query.not('status_id', 'in', `(${excludeStatusIds.join(',')})`)
  }

  const { count, error } = await query
  if (error) throw error
  return count ?? 0
}

// ============================================================
// Notifications
// ============================================================

export async function fetchNotifications(): Promise<Notification[]> {
  const { data, error } = await supabase
    .from('notifications')
    .select(`
      *,
      request:requests(*)
    `)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('id', id)
  if (error) throw error
}

export async function markAllNotificationsAsRead(): Promise<void> {
  const user = await supabase.auth.getUser()
  if (!user.data.user) throw new Error('Not authenticated')

  const { error } = await supabase
    .from('notifications')
    .update({ is_read: true })
    .eq('user_id', user.data.user.id)
    .eq('is_read', false)
  if (error) throw error
}

// ============================================================
/// Journal d'activité
// ============================================================

// ============================================================
// Profile — Mise à jour
// ============================================================

export async function updateProfile(
  id: string,
  input: ProfileUpdate
): Promise<Profile> {
  const { data, error } = await supabase
    .from('profiles')
    .update({
      full_name: input.full_name ?? null,
      avatar_url: input.avatar_url ?? null,
    })
    .eq('id', id)
    .select('id, email, full_name, avatar_url, department_id, role')
    .single()
  if (error) throw error
  return data
}

export async function uploadProfileAvatar(
  userId: string,
  file: File
): Promise<string> {
  const ext = file.name.split('.').pop() ?? 'png'
  const filePath = `avatars/${userId}/${Date.now()}.${ext}`

  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(filePath, file, { upsert: true })
  if (uploadError) throw uploadError

  const { data } = supabase.storage.from('avatars').getPublicUrl(filePath)
  return data.publicUrl
}

export async function logActivity(
  requestId: string,
  action: string,
  details?: Record<string, unknown>
) {
  const user = await supabase.auth.getUser()
  if (!user.data.user) return

  await supabase.from('activity_logs').insert({
    request_id: requestId,
    user_id: user.data.user.id,
    action,
    details: details ?? null,
  })
}
