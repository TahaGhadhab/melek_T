import { useState, useEffect, useRef } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Send,
  Paperclip,
  FileText,
  Image,
  CheckCheck,
  Check,
  X,
} from 'lucide-react'
import {
  useMessages,
  useSendMessage,
  useMarkAsRead,
  useUploadAttachment,
} from '../../hooks/useRequests'
import type { Message } from '../../types/requests'
import { getInitials, getAvatarColor } from './RequestCard'

// Schéma de validation du message
const messageSchema = z.object({
  content: z.string().min(1, 'Message cannot be empty').max(5000, 'Message too long'),
})

type MessageFormData = z.infer<typeof messageSchema>

interface ChatThreadProps {
  requestId: string
  currentUserId?: string
}

function formatMessageTime(dateStr: string): string {
  const d = new Date(dateStr)
  return d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })
}

function formatMessageDate(dateStr: string): string {
  const d = new Date(dateStr)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'

  return d.toLocaleDateString('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: d.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
  })
}

function MessageBubble({ message, isMine }: { message: Message; isMine: boolean }) {
  const avatar = getAvatarColor(message.sender?.full_name)
  const initials = getInitials(message.sender?.full_name)
  const hasReadReceipt = message.read_by && message.read_by.length > 0

  return (
    <div
      className={`flex gap-2 mb-3 ${isMine ? 'flex-row-reverse' : ''}`}
    >
      {/* Avatar */}
      <div
        className="flex items-center justify-center rounded-full text-[9px] font-medium shrink-0 mt-1"
        style={{
          width: 24,
          height: 24,
          backgroundColor: avatar.bg,
          color: avatar.text,
        }}
        title={message.sender?.full_name ?? 'Unknown'}
      >
        {initials}
      </div>

      {/* Bubble */}
      <div className={`max-w-[85%] ${isMine ? 'items-end' : 'items-start'} flex flex-col`}>
        {/* Author name */}
        <div
          className="text-[10px] font-medium mb-0.5 px-1"
          style={{ color: isMine ? 'var(--text-accent)' : 'var(--text-secondary)' }}
        >
          {message.sender?.full_name ?? 'Unknown'}
        </div>

        {/* Message content */}
        <div
          className="rounded-card px-3 py-2 text-xs leading-relaxed"
          style={{
            backgroundColor: isMine ? 'var(--bg-accent)' : 'var(--surface-0)',
            border: isMine ? '0.5px solid var(--border-accent)' : '0.5px solid var(--border)',
            color: 'var(--text-primary)',
          }}
        >
          {message.content}
        </div>

        {/* Footer: time + read status */}
        <div className="flex items-center gap-1.5 mt-0.5 px-1">
          <span className="text-[9px]" style={{ color: 'var(--text-muted)' }}>
            {formatMessageTime(message.created_at)}
          </span>
          {isMine && (
            <span style={{ color: hasReadReceipt ? 'var(--fill-accent)' : 'var(--text-muted)' }}>
              {hasReadReceipt ? <CheckCheck size={11} /> : <Check size={11} />}
            </span>
          )}
        </div>

        {/* Read receipts */}
        {hasReadReceipt && isMine && (
          <div className="flex gap-0.5 mt-0.5 px-1">
            {message.read_by?.slice(0, 3).map((r) => (
              <div
                key={r.id}
                className="flex items-center justify-center rounded-full text-[7px] font-medium"
                style={{
                  width: 14,
                  height: 14,
                  backgroundColor: getAvatarColor(r.user?.full_name).bg,
                  color: getAvatarColor(r.user?.full_name).text,
                  border: '1px solid var(--surface-1)',
                }}
                title={r.user?.full_name ?? 'Read'}
              >
                {getInitials(r.user?.full_name)}
              </div>
            ))}
            {message.read_by && message.read_by.length > 3 && (
              <span className="text-[8px]" style={{ color: 'var(--text-muted)' }}>
                +{message.read_by.length - 3}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function DateSeparator({ date }: { date: string }) {
  return (
    <div className="flex items-center gap-3 my-4">
      <div className="flex-1" style={{ borderTop: '0.5px solid var(--border)' }} />
      <span className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
        {date}
      </span>
      <div className="flex-1" style={{ borderTop: '0.5px solid var(--border)' }} />
    </div>
  )
}

function FilePreview({ file }: { file: File }) {
  const isImage = file.type.startsWith('image/')
  const sizeKB = Math.round(file.size / 1024)

  return (
    <div
      className="flex items-center gap-2 rounded-sm px-2 py-1.5 text-xs"
      style={{
        backgroundColor: 'var(--surface-0)',
        border: '0.5px solid var(--border)',
      }}
    >
      {isImage ? (
        <Image size={14} style={{ color: 'var(--text-muted)' }} />
      ) : (
        <FileText size={14} style={{ color: 'var(--text-muted)' }} />
      )}
      <span className="truncate flex-1" style={{ color: 'var(--text-secondary)' }}>
        {file.name}
      </span>
      <span className="shrink-0" style={{ color: 'var(--text-muted)' }}>
        {sizeKB} KB
      </span>
    </div>
  )
}export default function ChatThread({ requestId, currentUserId }: ChatThreadProps) {


  const { data: messages, isLoading } = useMessages(requestId)
  const sendMutation = useSendMessage()
  const markAsRead = useMarkAsRead()
  const uploadMutation = useUploadAttachment()

  const [files, setFiles] = useState<File[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<MessageFormData>({
    resolver: zodResolver(messageSchema),
  })

  const content = watch('content')

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Mark messages as read when they appear in view
  useEffect(() => {
    if (!messages || !currentUserId) return
    const unread = messages.filter(
      (m) => m.sender_id !== currentUserId &&
        !m.read_by?.some((r) => r.user_id === currentUserId)
    )
    unread.forEach((m) => markAsRead.mutate(m.id))
  }, [messages, currentUserId, markAsRead])

  const onSubmit = async (data: MessageFormData) => {
    try {
      const result = await sendMutation.mutateAsync({
        request_id: requestId,
        content: data.content,
      })

      // Upload files if any
      if (files.length > 0 && result) {
        for (const file of files) {
          await uploadMutation.mutateAsync({
            requestId,
            messageId: result.id,
            file,
          })
        }
        setFiles([])
      }

      reset()
    } catch (err) {
      console.error('Failed to send message:', err)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => setIsDragging(false)

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)])
    }
  }

  // Grouper les messages par date
  const groupedMessages = messages?.reduce<Record<string, Message[]>>((acc, msg) => {
    const dateKey = new Date(msg.created_at).toDateString()
    if (!acc[dateKey]) acc[dateKey] = []
    acc[dateKey].push(msg)
    return acc
  }, {})

  return (
    <div className="flex flex-col h-full">
      {/* Messages list */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-xl py-3"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isLoading && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--text-muted)' }}>
              <div
                className="w-3 h-3 rounded-full animate-spin"
                style={{ border: '2px solid var(--border)', borderTopColor: 'var(--fill-accent)' }}
              />
              Loading messages...
            </div>
          </div>
        )}

        {!isLoading && (!messages || messages.length === 0) && (
          <div
            className="flex flex-col items-center justify-center py-12 text-xs"
            style={{ color: 'var(--text-muted)' }}
          >
            <div
              className="flex items-center justify-center rounded-full mb-3"
              style={{ width: 40, height: 40, backgroundColor: 'var(--surface-2)' }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <span className="font-medium mb-1" style={{ color: 'var(--text-secondary)' }}>
              No messages yet
            </span>
            <span style={{ textAlign: 'center', lineHeight: 1.4 }}>
              Start the conversation by sending a message below
            </span>
          </div>
        )}

        {/* Grouped messages by date */}
        {groupedMessages &&
          Object.entries(groupedMessages).map(([dateKey, msgs]) => (
            <div key={dateKey}>
              <DateSeparator date={formatMessageDate(msgs[0].created_at)} />
              {msgs.map((msg) => (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  isMine={msg.sender_id === currentUserId}
                />
              ))}
            </div>
          ))}

        {/* Drag overlay */}
        {isDragging && (
          <div
            className="absolute inset-0 flex items-center justify-center z-10 rounded-card"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--fill-accent) 10%, transparent)',
              border: '2px dashed var(--fill-accent)',
            }}
          >
            <span className="text-sm font-medium" style={{ color: 'var(--fill-accent)' }}>
              Drop files here
            </span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* File previews */}
      {files.length > 0 && (
        <div
          className="flex flex-col gap-1.5 px-xl py-2 border-t"
          style={{ borderColor: 'var(--border)' }}
        >
          <div className="text-[10px] font-medium" style={{ color: 'var(--text-muted)' }}>
            Attachments ({files.length})
          </div>
          {files.map((file, i) => (
            <div key={i} className="flex items-center gap-1">
              <FilePreview file={file} />
              <button
                onClick={() => removeFile(i)}
                className="flex items-center justify-center rounded-sm cursor-pointer shrink-0"
                style={{ width: 20, height: 20, color: 'var(--text-muted)' }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input area */}
      <form
        onSubmit={handleSubmit(onSubmit)}
        className="flex items-end gap-2 px-xl py-3 border-t"
        style={{ borderColor: 'var(--border)' }}
      >
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          className="hidden"
          multiple
          accept=".pdf,.doc,.docx,.xls,.xlsx,.png,.jpg,.jpeg,.gif,.zip,.txt"
        />

        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="flex items-center justify-center rounded-sm cursor-pointer transition-all shrink-0"
          style={{
            width: 32,
            height: 32,
            color: content || files.length > 0 ? 'var(--fill-accent)' : 'var(--text-muted)',
            transitionDuration: 'var(--duration-fast)',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 4%, transparent)' }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'transparent' }}
          title="Attach file"
        >
          <Paperclip size={16} />
        </button>

        <div className="flex-1 relative">
          <textarea
            {...register('content')}
            placeholder="Type a message..."
            rows={1}
            className="w-full text-xs rounded-sm px-3 py-2 outline-none resize-none"
            style={{
              backgroundColor: 'var(--surface-0)',
              border: errors.content ? '0.5px solid #E24B4A' : '0.5px solid var(--border)',
              color: 'var(--text-primary)',
              maxHeight: 120,
            }}
            onInput={(e) => {
              const el = e.currentTarget
              el.style.height = 'auto'
              el.style.height = Math.min(el.scrollHeight, 120) + 'px'
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                handleSubmit(onSubmit)()
              }
            }}
          />
        </div>

        <button
          type="submit"
          disabled={!content?.trim() && files.length === 0}
          className="flex items-center justify-center rounded-sm cursor-pointer transition-all disabled:opacity-40 shrink-0"
          style={{
            width: 32,
            height: 32,
            backgroundColor: content?.trim() ? 'var(--fill-accent)' : 'transparent',
            color: content?.trim() ? '#fff' : 'var(--text-muted)',
            transitionDuration: 'var(--duration-fast)',
          }}
          onMouseEnter={(e) => {
            if (!content?.trim()) {
              e.currentTarget.style.backgroundColor = 'color-mix(in srgb, var(--text-primary) 4%, transparent)'
            }
          }}
          onMouseLeave={(e) => {
            if (!content?.trim()) {
              e.currentTarget.style.backgroundColor = 'transparent'
            }
          }}
        >
          <Send size={14} />
        </button>
      </form>
    </div>
  )
}

export { MessageBubble, formatMessageTime, formatMessageDate }
