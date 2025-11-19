/**
 * Telegram Notification Helper
 * 
 * This module provides functions to send notifications to the Telegram bot
 * via the webhook API when tasks are created, updated, or commented on.
 */

// Configuration - Update these with your actual values
// If VITE_WEBHOOK_API_URL is not set, use current origin (for Vercel deployment)
const WEBHOOK_API_URL = import.meta.env?.VITE_WEBHOOK_API_URL || (typeof window !== 'undefined' ? window.location.origin : 'https://your-webhook-api.railway.app')
const WEBHOOK_SECRET = import.meta.env?.VITE_WEBHOOK_SECRET || 'your-webhook-secret'

// Enable/disable notifications (can be toggled via environment variable)
const NOTIFICATIONS_ENABLED = import.meta.env?.VITE_TELEGRAM_NOTIFICATIONS_ENABLED !== 'false'

interface TaskData {
  id: string
  title: string
  description: string
  assigned_to: string
  assigned_to_email: string
  deadline: string
  priority: 'low' | 'medium' | 'high'
  status: 'pending' | 'in-progress' | 'completed'
  created_by: string
  created_by_email: string
  created_at: string
}

interface CommentData {
  id: string
  task_id: string
  user_name: string
  user_email: string
  comment_text: string
  created_at: string
}

interface BroadcastData {
  message: string
  sender_name: string
  sender_email: string
}

/**
 * Send a notification to the Telegram webhook API
 */
async function sendNotification(endpoint: string, data: any): Promise<boolean> {
  if (!NOTIFICATIONS_ENABLED) {
    console.log('Telegram notifications are disabled')
    return false
  }

  try {
    // Construct API URL
    // If WEBHOOK_API_URL is set and different from current origin, use external API
    // Otherwise, use relative path for Vercel serverless functions
    const isExternalApi = WEBHOOK_API_URL && 
      typeof window !== 'undefined' && 
      WEBHOOK_API_URL !== window.location.origin &&
      !WEBHOOK_API_URL.startsWith('/')
    
    const apiPath = isExternalApi
      ? `${WEBHOOK_API_URL}/webhook/${endpoint}`
      : `/api/telegram-webhook/${endpoint}`
    
    const response = await fetch(apiPath, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': WEBHOOK_SECRET,
      },
      body: JSON.stringify(data),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('Telegram notification failed:', error)
      return false
    }

    const result = await response.json()
    console.log('Telegram notification sent:', result)
    return true
  } catch (error) {
    console.error('Error sending Telegram notification:', error)
    return false
  }
}

/**
 * Notify about a newly created task
 */
export async function notifyTaskCreated(task: TaskData): Promise<boolean> {
  return sendNotification('task-created', { record: task })
}

/**
 * Notify about a task update
 */
export async function notifyTaskUpdated(
  task: TaskData,
  oldTask?: Partial<TaskData>
): Promise<boolean> {
  return sendNotification('task-updated', {
    record: task,
    old_record: oldTask,
  })
}

/**
 * Notify about a task completion
 */
export async function notifyTaskCompleted(task: TaskData): Promise<boolean> {
  if (task.status !== 'completed') {
    console.warn('Task is not marked as completed')
    return false
  }
  return sendNotification('task-completed', { record: task })
}

/**
 * Notify about a new comment
 */
export async function notifyCommentAdded(comment: CommentData): Promise<boolean> {
  return sendNotification('comment-added', { record: comment })
}

/**
 * Send a broadcast message to all groups
 */
export async function sendBroadcast(data: BroadcastData): Promise<boolean> {
  return sendNotification('broadcast', data)
}

/**
 * Check the health of the webhook API
 */
export async function checkWebhookHealth(): Promise<boolean> {
  if (!NOTIFICATIONS_ENABLED) {
    return false
  }

  try {
    // Construct health check URL (same logic as sendNotification)
    const isExternalApi = WEBHOOK_API_URL && 
      typeof window !== 'undefined' && 
      WEBHOOK_API_URL !== window.location.origin &&
      !WEBHOOK_API_URL.startsWith('/')
    
    const healthPath = isExternalApi
      ? `${WEBHOOK_API_URL}/health`
      : `/api/telegram-webhook/health`
    
    const response = await fetch(healthPath)
    return response.ok
  } catch (error) {
    console.error('Webhook API health check failed:', error)
    return false
  }
}

/**
 * Utility to check if Telegram notifications are configured
 */
export function isTelegramConfigured(): boolean {
  return (
    NOTIFICATIONS_ENABLED &&
    WEBHOOK_API_URL !== 'https://your-webhook-api.railway.app' &&
    WEBHOOK_SECRET !== 'your-webhook-secret' &&
    WEBHOOK_SECRET !== ''
  )
}