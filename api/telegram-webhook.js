/**
 * Vercel Serverless Function for Telegram Webhook API
 * This handles Telegram notifications for the UmraGO Team Planner
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration from environment variables
const TELEGRAM_BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const SUPABASE_URL = process.env.SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_ANON_KEY || '';
const WEB_APP_URL = process.env.WEB_APP_URL || 'https://team-planner-task-tracker.vercel.app/';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || '';

// Initialize Supabase client
const supabase = SUPABASE_URL && SUPABASE_KEY 
  ? createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

/**
 * Send a message via Telegram Bot API
 */
async function sendTelegramMessage(chatId, message) {
  try {
    const url = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'HTML',
        disable_web_page_preview: true,
      }),
    });
    
    return await response.json();
  } catch (error) {
    console.error('Error sending Telegram message:', error);
    return null;
  }
}

/**
 * Get all active Telegram groups
 */
async function getActiveGroups() {
  try {
    if (!supabase) return [];
    
    const { data, error } = await supabase
      .from('telegram_groups')
      .select('*')
      .eq('is_active', true);
    
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting active groups:', error);
    return [];
  }
}

/**
 * Log notification to database
 */
async function logNotification(notificationType, taskId, chatId, message, status = 'sent', error = null) {
  try {
    if (!supabase) return;
    
    const data = {
      notification_type: notificationType,
      task_id: taskId,
      chat_id: chatId,
      message_text: message,
      status: status,
    };
    
    if (error) {
      data.error_message = error;
    }
    
    await supabase.from('telegram_notifications').insert(data);
  } catch (error) {
    console.error('Error logging notification:', error);
  }
}

/**
 * Handle task created webhook
 */
async function handleTaskCreated(data) {
  const task = data.record;
  
  if (!task) {
    return { error: 'No task data provided' };
  }
  
  const message = (
    `🆕 <b>NEW TASK CREATED</b>\n\n` +
    `📋 <b>Title:</b> ${task.title}\n` +
    `👤 <b>Assigned to:</b> ${task.assigned_to}\n` +
    `📅 <b>Deadline:</b> ${task.deadline.substring(0, 10)}\n` +
    `⚡ <b>Priority:</b> ${task.priority.toUpperCase()}\n` +
    `✍️ <b>Created by:</b> ${task.created_by}\n\n` +
    `👉 <a href="${WEB_APP_URL}">View Task Details</a>`
  );
  
  const groups = await getActiveGroups();
  let sentCount = 0;
  let failedCount = 0;
  
  for (const group of groups) {
    const result = await sendTelegramMessage(group.chat_id, message);
    
    if (result && result.ok) {
      sentCount++;
      await logNotification('task_created', task.id, group.chat_id, message, 'sent');
    } else {
      failedCount++;
      const errorMsg = result?.description || 'Unknown error';
      await logNotification('task_created', task.id, group.chat_id, message, 'failed', errorMsg);
    }
  }
  
  return {
    success: true,
    sent_to: sentCount,
    failed: failedCount,
    total_groups: groups.length,
  };
}

/**
 * Handle task updated webhook
 */
async function handleTaskUpdated(data) {
  const task = data.record;
  const oldTask = data.old_record;
  
  if (!task) {
    return { error: 'No task data provided' };
  }
  
  const changes = [];
  if (oldTask) {
    if (task.status !== oldTask.status) {
      changes.push(`Status: ${oldTask.status} → ${task.status}`);
    }
    if (task.priority !== oldTask.priority) {
      changes.push(`Priority: ${oldTask.priority} → ${task.priority}`);
    }
  }
  
  if (changes.length === 0) {
    return { success: true, message: 'No significant changes' };
  }
  
  const message = (
    `🔄 <b>TASK UPDATED</b>\n\n` +
    `📋 <b>Task:</b> ${task.title}\n\n` +
    `<b>Changes:</b>\n${changes.map(c => `• ${c}`).join('\n')}\n\n` +
    `👉 <a href="${WEB_APP_URL}">View Task Details</a>`
  );
  
  const groups = await getActiveGroups();
  let sentCount = 0;
  
  for (const group of groups) {
    const result = await sendTelegramMessage(group.chat_id, message);
    if (result && result.ok) {
      sentCount++;
      await logNotification('task_updated', task.id, group.chat_id, message, 'sent');
    }
  }
  
  return { success: true, sent_to: sentCount };
}

/**
 * Handle task completed webhook
 */
async function handleTaskCompleted(data) {
  const task = data.record;
  
  if (!task || task.status !== 'completed') {
    return { error: 'Invalid task data' };
  }
  
  const message = (
    `✅ <b>TASK COMPLETED</b>\n\n` +
    `📋 <b>Task:</b> ${task.title}\n` +
    `👤 <b>Completed by:</b> ${task.assigned_to}\n` +
    `🎉 Great job!\n\n` +
    `👉 <a href="${WEB_APP_URL}">View Details</a>`
  );
  
  const groups = await getActiveGroups();
  let sentCount = 0;
  
  for (const group of groups) {
    const result = await sendTelegramMessage(group.chat_id, message);
    if (result && result.ok) {
      sentCount++;
      await logNotification('task_completed', task.id, group.chat_id, message, 'sent');
    }
  }
  
  return { success: true, sent_to: sentCount };
}

/**
 * Handle comment added webhook
 */
async function handleCommentAdded(data) {
  const comment = data.record;
  
  if (!comment) {
    return { error: 'No comment data provided' };
  }
  
  try {
    const { data: taskData, error } = await supabase
      .from('tasks')
      .select('*')
      .eq('id', comment.task_id)
      .single();
    
    if (error || !taskData) {
      return { error: 'Task not found' };
    }
    
    const message = (
      `💬 <b>NEW COMMENT</b>\n\n` +
      `📋 <b>Task:</b> ${taskData.title}\n` +
      `👤 <b>From:</b> ${comment.user_name}\n` +
      `💭 <b>Comment:</b> ${comment.comment_text}\n\n` +
      `👉 <a href="${WEB_APP_URL}">View Task</a>`
    );
    
    const groups = await getActiveGroups();
    let sentCount = 0;
    
    for (const group of groups) {
      const result = await sendTelegramMessage(group.chat_id, message);
      if (result && result.ok) {
        sentCount++;
        await logNotification('comment_added', taskData.id, group.chat_id, message, 'sent');
      }
    }
    
    return { success: true, sent_to: sentCount };
  } catch (error) {
    console.error('Error fetching task:', error);
    return { error: 'Failed to fetch task details' };
  }
}

/**
 * Main handler for Vercel serverless function
 */
module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret');
  
  // Handle OPTIONS (CORS preflight)
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  // Handle GET (health check)
  if (req.method === 'GET') {
    if (req.url === '/api/telegram-webhook/health' || req.url === '/api/telegram-webhook') {
      return res.status(200).json({
        status: 'ok',
        service: 'UmraGO Telegram Webhook API',
      });
    }
    return res.status(404).json({ error: 'Not found' });
  }
  
  // Handle POST
  if (req.method === 'POST') {
    try {
      // Verify webhook secret
      const secret = req.headers['x-webhook-secret'];
      if (secret !== WEBHOOK_SECRET) {
        return res.status(401).json({ error: 'Unauthorized' });
      }
      
      const url = req.url;
      let result;
      
      // Route to appropriate handler
      if (url.includes('/task-created')) {
        result = await handleTaskCreated(req.body);
      } else if (url.includes('/task-updated')) {
        result = await handleTaskUpdated(req.body);
      } else if (url.includes('/task-completed')) {
        result = await handleTaskCompleted(req.body);
      } else if (url.includes('/comment-added')) {
        result = await handleCommentAdded(req.body);
      } else {
        return res.status(404).json({ error: 'Endpoint not found' });
      }
      
      return res.status(200).json(result);
    } catch (error) {
      console.error('Error handling request:', error);
      return res.status(500).json({ error: error.message });
    }
  }
  
  return res.status(405).json({ error: 'Method not allowed' });
};

