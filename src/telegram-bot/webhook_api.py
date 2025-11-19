"""
Webhook API for UmraGO Telegram Bot
This Flask API receives webhook calls from Supabase and triggers Telegram notifications

Usage:
1. Deploy this API to a server (e.g., Railway, Render, Heroku, or your own server)
2. Set up Supabase webhooks to call these endpoints when data changes
3. Or call these endpoints from your frontend after creating/updating tasks
"""

import os
import asyncio
from flask import Flask, request, jsonify
from flask_cors import CORS
from supabase import create_client, Client
from datetime import datetime
import logging
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize Flask app
app = Flask(__name__)
CORS(app)

# Configuration
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'YOUR_SUPABASE_URL_HERE')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', 'YOUR_SUPABASE_ANON_KEY_HERE')
WEB_APP_URL = 'https://team-planner-task-tracker.vercel.app/'
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', 'your-secret-key-here')

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)


def send_telegram_message(chat_id: str, message: str):
    """Send a message via Telegram Bot API"""
    try:
        url = f"https://api.telegram.org/bot{TELEGRAM_BOT_TOKEN}/sendMessage"
        payload = {
            'chat_id': chat_id,
            'text': message,
            'parse_mode': 'HTML',
            'disable_web_page_preview': True
        }
        
        response = requests.post(url, json=payload)
        return response.json()
        
    except Exception as e:
        logger.error(f"Error sending Telegram message: {e}")
        return None


def get_active_groups():
    """Get all active Telegram groups"""
    try:
        response = supabase.table('telegram_groups')\
            .select('*')\
            .eq('is_active', True)\
            .execute()
        
        return response.data
        
    except Exception as e:
        logger.error(f"Error getting active groups: {e}")
        return []


def log_notification(notification_type: str, task_id: str, chat_id: str, message: str, status: str = 'sent', error: str = None):
    """Log notification to database"""
    try:
        data = {
            'notification_type': notification_type,
            'task_id': task_id,
            'chat_id': chat_id,
            'message_text': message,
            'status': status
        }
        
        if error:
            data['error_message'] = error
        
        supabase.table('telegram_notifications').insert(data).execute()
        
    except Exception as e:
        logger.error(f"Error logging notification: {e}")


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'timestamp': datetime.utcnow().isoformat(),
        'service': 'UmraGO Telegram Webhook API'
    })


@app.route('/webhook/task-created', methods=['POST'])
def task_created_webhook():
    """Handle task creation webhook"""
    try:
        # Verify webhook secret
        secret = request.headers.get('X-Webhook-Secret')
        if secret != WEBHOOK_SECRET:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        task = data.get('record')  # Supabase sends new record in 'record' field
        
        if not task:
            return jsonify({'error': 'No task data provided'}), 400
        
        # Format message
        message = (
            "🆕 <b>NEW TASK CREATED</b>\n\n"
            f"📋 <b>Title:</b> {task['title']}\n"
            f"👤 <b>Assigned to:</b> {task['assigned_to']}\n"
            f"📅 <b>Deadline:</b> {task['deadline'][:10]}\n"
            f"⚡ <b>Priority:</b> {task['priority'].upper()}\n"
            f"✍️ <b>Created by:</b> {task['created_by']}\n\n"
            f"👉 <a href='{WEB_APP_URL}'>View Task Details</a>"
        )
        
        # Send to all active groups
        groups = get_active_groups()
        sent_count = 0
        failed_count = 0
        
        for group in groups:
            result = send_telegram_message(group['chat_id'], message)
            
            if result and result.get('ok'):
                sent_count += 1
                log_notification('task_created', task['id'], group['chat_id'], message, 'sent')
            else:
                failed_count += 1
                error_msg = result.get('description') if result else 'Unknown error'
                log_notification('task_created', task['id'], group['chat_id'], message, 'failed', error_msg)
        
        return jsonify({
            'success': True,
            'sent_to': sent_count,
            'failed': failed_count,
            'total_groups': len(groups)
        })
        
    except Exception as e:
        logger.error(f"Error in task-created webhook: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/webhook/task-updated', methods=['POST'])
def task_updated_webhook():
    """Handle task update webhook"""
    try:
        secret = request.headers.get('X-Webhook-Secret')
        if secret != WEBHOOK_SECRET:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        task = data.get('record')
        old_task = data.get('old_record')
        
        if not task:
            return jsonify({'error': 'No task data provided'}), 400
        
        # Determine what changed
        changes = []
        if old_task:
            if task.get('status') != old_task.get('status'):
                changes.append(f"Status: {old_task.get('status')} → {task.get('status')}")
            if task.get('priority') != old_task.get('priority'):
                changes.append(f"Priority: {old_task.get('priority')} → {task.get('priority')}")
            if task.get('assigned_to') != old_task.get('assigned_to'):
                changes.append(f"Assigned to: {task.get('assigned_to')}")
        
        if not changes:
            return jsonify({'success': True, 'message': 'No significant changes'}), 200
        
        message = (
            "🔄 <b>TASK UPDATED</b>\n\n"
            f"📋 <b>Task:</b> {task['title']}\n\n"
            f"<b>Changes:</b>\n" + "\n".join([f"• {c}" for c in changes]) + "\n\n"
            f"👉 <a href='{WEB_APP_URL}'>View Task Details</a>"
        )
        
        groups = get_active_groups()
        sent_count = 0
        
        for group in groups:
            result = send_telegram_message(group['chat_id'], message)
            if result and result.get('ok'):
                sent_count += 1
                log_notification('task_updated', task['id'], group['chat_id'], message, 'sent')
        
        return jsonify({'success': True, 'sent_to': sent_count})
        
    except Exception as e:
        logger.error(f"Error in task-updated webhook: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/webhook/task-completed', methods=['POST'])
def task_completed_webhook():
    """Handle task completion webhook"""
    try:
        secret = request.headers.get('X-Webhook-Secret')
        if secret != WEBHOOK_SECRET:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        task = data.get('record')
        
        if not task or task.get('status') != 'completed':
            return jsonify({'error': 'Invalid task data'}), 400
        
        message = (
            "✅ <b>TASK COMPLETED</b>\n\n"
            f"📋 <b>Task:</b> {task['title']}\n"
            f"👤 <b>Completed by:</b> {task['assigned_to']}\n"
            f"🎉 Great job!\n\n"
            f"👉 <a href='{WEB_APP_URL}'>View Details</a>"
        )
        
        groups = get_active_groups()
        sent_count = 0
        
        for group in groups:
            result = send_telegram_message(group['chat_id'], message)
            if result and result.get('ok'):
                sent_count += 1
                log_notification('task_completed', task['id'], group['chat_id'], message, 'sent')
        
        return jsonify({'success': True, 'sent_to': sent_count})
        
    except Exception as e:
        logger.error(f"Error in task-completed webhook: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/webhook/comment-added', methods=['POST'])
def comment_added_webhook():
    """Handle new comment webhook"""
    try:
        secret = request.headers.get('X-Webhook-Secret')
        if secret != WEBHOOK_SECRET:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        comment = data.get('record')
        
        if not comment:
            return jsonify({'error': 'No comment data provided'}), 400
        
        # Get task details
        try:
            task_response = supabase.table('tasks')\
                .select('*')\
                .eq('id', comment['task_id'])\
                .single()\
                .execute()
            
            if not task_response.data:
                return jsonify({'error': 'Task not found'}), 404
            
            task = task_response.data
        except Exception as e:
            logger.error(f"Error fetching task for comment: {e}")
            return jsonify({'error': 'Failed to fetch task details'}), 500
        
        message = (
            "💬 <b>NEW COMMENT</b>\n\n"
            f"📋 <b>Task:</b> {task['title']}\n"
            f"👤 <b>From:</b> {comment['user_name']}\n"
            f"💭 <b>Comment:</b> {comment['comment_text']}\n\n"
            f"👉 <a href='{WEB_APP_URL}'>View Task</a>"
        )
        
        groups = get_active_groups()
        sent_count = 0
        
        for group in groups:
            result = send_telegram_message(group['chat_id'], message)
            if result and result.get('ok'):
                sent_count += 1
                log_notification('comment_added', task['id'], group['chat_id'], message, 'sent')
        
        return jsonify({'success': True, 'sent_to': sent_count})
        
    except Exception as e:
        logger.error(f"Error in comment-added webhook: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/webhook/broadcast', methods=['POST'])
def broadcast_webhook():
    """Handle broadcast message requests"""
    try:
        secret = request.headers.get('X-Webhook-Secret')
        if secret != WEBHOOK_SECRET:
            return jsonify({'error': 'Unauthorized'}), 401
        
        data = request.json
        message_text = data.get('message')
        sender_name = data.get('sender_name', 'Admin')
        sender_email = data.get('sender_email', '')
        
        if not message_text:
            return jsonify({'error': 'No message provided'}), 400
        
        message = (
            f"📢 <b>BROADCAST MESSAGE</b>\n"
            f"From: {sender_name}\n\n"
            f"{message_text}"
        )
        
        groups = get_active_groups()
        sent_count = 0
        failed_count = 0
        
        # Create broadcast record
        broadcast_data = {
            'message_text': message_text,
            'sent_by_email': sender_email,
            'sent_by_name': sender_name,
            'total_groups': len(groups),
            'status': 'sending'
        }
        
        broadcast_record = supabase.table('telegram_broadcasts')\
            .insert(broadcast_data)\
            .execute()
        
        broadcast_id = broadcast_record.data[0]['id']
        
        for group in groups:
            result = send_telegram_message(group['chat_id'], message)
            
            if result and result.get('ok'):
                sent_count += 1
                log_notification('broadcast', None, group['chat_id'], message, 'sent')
            else:
                failed_count += 1
                error_msg = result.get('description') if result else 'Unknown error'
                log_notification('broadcast', None, group['chat_id'], message, 'failed', error_msg)
        
        # Update broadcast record
        supabase.table('telegram_broadcasts')\
            .update({
                'successful_sends': sent_count,
                'failed_sends': failed_count,
                'status': 'completed'
            })\
            .eq('id', broadcast_id)\
            .execute()
        
        return jsonify({
            'success': True,
            'sent_to': sent_count,
            'failed': failed_count,
            'total_groups': len(groups)
        })
        
    except Exception as e:
        logger.error(f"Error in broadcast webhook: {e}")
        return jsonify({'error': str(e)}), 500


@app.route('/webhook/deadline-reminder', methods=['POST'])
def deadline_reminder_webhook():
    """Send deadline reminders for tasks due soon"""
    try:
        secret = request.headers.get('X-Webhook-Secret')
        if secret != WEBHOOK_SECRET:
            return jsonify({'error': 'Unauthorized'}), 401
        
        from datetime import datetime, timedelta
        
        # Get tasks with deadlines in the next 24 hours
        tomorrow = (datetime.utcnow() + timedelta(days=1)).isoformat()
        today = datetime.utcnow().isoformat()
        
        tasks_response = supabase.table('tasks')\
            .select('*')\
            .gte('deadline', today)\
            .lte('deadline', tomorrow)\
            .neq('status', 'completed')\
            .execute()
        
        if not tasks_response.data:
            return jsonify({'success': True, 'message': 'No upcoming deadlines'})
        
        groups = get_active_groups()
        total_sent = 0
        
        for task in tasks_response.data:
            deadline = datetime.fromisoformat(task['deadline'].replace('Z', '+00:00'))
            hours_left = int((deadline - datetime.utcnow()).total_seconds() / 3600)
            
            message = (
                "⏰ <b>DEADLINE REMINDER</b>\n\n"
                f"📋 <b>Task:</b> {task['title']}\n"
                f"👤 <b>Assigned to:</b> {task['assigned_to']}\n"
                f"⏱️ <b>Due in:</b> {hours_left} hours\n"
                f"📅 <b>Deadline:</b> {task['deadline'][:10]}\n\n"
                f"👉 <a href='{WEB_APP_URL}'>View Task</a>"
            )
            
            for group in groups:
                result = send_telegram_message(group['chat_id'], message)
                if result and result.get('ok'):
                    total_sent += 1
                    log_notification('deadline_reminder', task['id'], group['chat_id'], message, 'sent')
        
        return jsonify({
            'success': True,
            'tasks_checked': len(tasks_response.data),
            'notifications_sent': total_sent
        })
        
    except Exception as e:
        logger.error(f"Error in deadline-reminder webhook: {e}")
        return jsonify({'error': str(e)}), 500


if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False)
