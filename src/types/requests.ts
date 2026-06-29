// ============================================================
// Types pour le module Requests
// ============================================================

export interface Department {
  id: string
  name: string
  slug: string
  description: string | null
}

export interface Status {
  id: string
  name: string
  slug: string
  color: string
  position: number
}

export interface Priority {
  id: string
  name: string
  slug: string
  color: string
  position: number
}

export interface Profile {
  id: string
  email: string
  full_name: string | null
  avatar_url: string | null
  department_id: string | null
  role: 'admin' | 'agent' | 'user'
}

export interface Request {
  id: string
  title: string
  description: string | null
  requester_id: string
  assignee_id: string | null
  department_id: string | null
  status_id: string
  priority_id: string
  due_date: string | null
  created_at: string
  updated_at: string
  // Relations (peuplées par Supabase)
  requester?: Profile
  assignee?: Profile | null
  department?: Department | null
  status?: Status
  priority?: Priority
  message_count?: number
}

export interface RequestInsert {
  title: string
  description?: string | null
  department_id?: string | null
  status_id: string
  priority_id: string
  due_date?: string | null
}

export interface RequestUpdate {
  title?: string
  description?: string | null
  assignee_id?: string | null
  department_id?: string | null
  status_id?: string
  priority_id?: string
  due_date?: string | null
}

export interface ProfileUpdate {
  full_name?: string | null
  avatar_url?: string | null
}

export interface RequestFilters {
  search?: string
  status_id?: string
  priority_id?: string
  department_id?: string
  assignee_id?: string
  date_from?: string
  date_to?: string
}

// ============================================================
// Types pour les notifications
// ============================================================

export type NotificationType =
  | 'new_request'
  | 'status_change'
  | 'new_message'
  | 'new_attachment'
  | 'urgent_request'
  | 'assignment'
  | 'due_date_reminder'

export interface Notification {
  id: string
  user_id: string
  type: NotificationType
  title: string
  content: string | null
  request_id: string | null
  is_read: boolean
  created_at: string
  request?: Request
}

// ============================================================
// Types pour le chat
// ============================================================

export interface Message {
  id: string
  request_id: string
  sender_id: string
  content: string
  created_at: string
  updated_at: string
  sender?: Profile
  attachments?: Attachment[]
  read_by?: MessageRead[]
}

export interface MessageInsert {
  request_id: string
  content: string
}

export interface Attachment {
  id: string
  message_id: string | null
  request_id: string | null
  filename: string
  filesize: number
  filetype: string
  storage_path: string
  uploaded_by: string
  created_at: string
  uploader?: Profile
}

export interface MessageRead {
  id: string
  message_id: string
  user_id: string
  read_at: string
  user?: Profile
}
