// Telegram Bot Notifications for UmraGO Launching

// Get config from environment variables (set these in Vercel)
const TELEGRAM_BOT_TOKEN = import.meta.env?.VITE_TELEGRAM_BOT_TOKEN || ''
const TELEGRAM_CHAT_ID = import.meta.env?.VITE_TELEGRAM_CHAT_ID || ''

// Log configuration status on load
console.log('🤖 Telegram Bot Configuration Status:')
console.log('  - Bot Token:', TELEGRAM_BOT_TOKEN ? `✅ Found (${TELEGRAM_BOT_TOKEN.substring(0, 10)}...)` : '❌ Not configured')
console.log('  - Chat ID:', TELEGRAM_CHAT_ID ? `✅ Found (${TELEGRAM_CHAT_ID})` : '❌ Not configured')

// Check if Telegram is enabled (both token and chat ID must be set)
const isTelegramEnabled = () => {
  return Boolean(TELEGRAM_BOT_TOKEN && TELEGRAM_CHAT_ID)
}

// Send a message to Telegram
const sendTelegramMessage = async (message: string) => {
  if (!isTelegramEnabled()) {
    console.log('⚠️ Telegram notification skipped: Not configured')
    console.log('   To enable: Add VITE_TELEGRAM_BOT_TOKEN and VITE_TELEGRAM_CHAT_ID in Vercel')
    return false
  }

  console.log('📤 Sending Telegram notification...')
  console.log('   Message preview:', message.substring(0, 50) + '...')

  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: TELEGRAM_CHAT_ID,
        text: message,
        parse_mode: 'HTML',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('❌ Telegram API error:')
      console.error('   Status:', response.status)
      console.error('   Response:', errorText)
      return false
    }

    console.log('✅ Telegram notification sent successfully!')
    return true
  } catch (error) {
    console.error('❌ Failed to send Telegram message:')
    console.error('   Error:', error)
    return false
  }
}

// Notify when a new task is created
export const notifyTaskCreated = async (tasksData: Array<{
  title: string
  assigned_to: string
  deadline: string
  priority: string
  created_by: string
}> | {
  title: string
  assigned_to: string
  deadline: string
  priority: string
  created_by: string
}) => {
  console.log('🔔 notifyTaskCreated called')
  
  // Handle both single task and array of tasks
  const tasks = Array.isArray(tasksData) ? tasksData : [tasksData]
  
  console.log(`   Notifying for ${tasks.length} task(s)`)
  
  // Send notification for each task
  for (const task of tasks) {
    console.log(`   Processing task: "${task.title}"`)
    const message = `
🆕 <b>New Task Created</b>

📋 <b>Title:</b> ${task.title}
👤 <b>Assigned to:</b> ${task.assigned_to || 'Unassigned'}
📅 <b>Deadline:</b> ${task.deadline || 'No deadline'}
⚡ <b>Priority:</b> ${task.priority}
✍️ <b>Created by:</b> ${task.created_by}

#UmraGO #NewTask
    `.trim()

    await sendTelegramMessage(message)
  }
  
  return true
}

// Notify when a task status changes
export const notifyTaskStatusChanged = async (taskData: {
  title: string
  oldStatus: string
  newStatus: string
  changedBy: string
}) => {
  console.log('🔔 notifyTaskStatusChanged called')
  console.log(`   Task: "${taskData.title}" (${taskData.oldStatus} → ${taskData.newStatus})`)
  
  const message = `
🔄 <b>Task Status Updated</b>

📋 <b>Task:</b> ${taskData.title}
📊 <b>Status:</b> ${taskData.oldStatus} → ${taskData.newStatus}
👤 <b>Changed by:</b> ${taskData.changedBy}

#UmraGO #StatusUpdate
  `.trim()

  return sendTelegramMessage(message)
}

// Notify when a task is completed
export const notifyTaskCompleted = async (taskData: {
  title: string
  completedBy: string
}) => {
  console.log('🔔 notifyTaskCompleted called')
  console.log(`   Task: "${taskData.title}" by ${taskData.completedBy}`)
  
  const message = `
✅ <b>Task Completed!</b>

📋 <b>Task:</b> ${taskData.title}
👤 <b>Completed by:</b> ${taskData.completedBy}

#UmraGO #TaskCompleted
  `.trim()

  return sendTelegramMessage(message)
}

// Notify when a new comment is added
export const notifyNewComment = async (commentData: {
  taskTitle: string
  commentText: string
  userName: string
}) => {
  console.log('🔔 notifyNewComment called')
  console.log(`   Task: "${commentData.taskTitle}" by ${commentData.userName}`)
  
  const message = `
💬 <b>New Comment</b>

📋 <b>Task:</b> ${commentData.taskTitle}
👤 <b>From:</b> ${commentData.userName}
💭 <b>Comment:</b> ${commentData.commentText}

#UmraGO #NewComment
  `.trim()

  return sendTelegramMessage(message)
}

// Notify when a task is assigned
export const notifyTaskAssigned = async (taskData: {
  title: string
  assignedTo: string
  assignedBy: string
}) => {
  console.log('🔔 notifyTaskAssigned called')
  console.log(`   Task: "${taskData.title}" assigned to ${taskData.assignedTo}`)
  
  const message = `
👥 <b>Task Assigned</b>

📋 <b>Task:</b> ${taskData.title}
👤 <b>Assigned to:</b> ${taskData.assignedTo}
✍️ <b>By:</b> ${taskData.assignedBy}

#UmraGO #TaskAssigned
  `.trim()

  return sendTelegramMessage(message)
}