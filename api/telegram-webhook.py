"""
Vercel Serverless Function for Telegram Webhook API
This handles Telegram notifications for the UmraGO Team Planner

Deploy this to Vercel as serverless functions
"""

import os
import json
from http.server import BaseHTTPRequestHandler
from supabase import create_client, Client
import requests
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Configuration from environment variables
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '')
SUPABASE_URL = os.getenv('SUPABASE_URL', '')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', '')
WEB_APP_URL = os.getenv('WEB_APP_URL', 'https://team-planner-task-tracker.vercel.app/')
WEBHOOK_SECRET = os.getenv('WEBHOOK_SECRET', '')

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY) if SUPABASE_URL and SUPABASE_KEY else None


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
        
        response = requests.post(url, json=payload, timeout=10)
        return response.json()
        
    except Exception as e:
        logger.error(f"Error sending Telegram message: {e}")
        return None


def get_active_groups():
    """Get all active Telegram groups"""
    try:
        if not supabase:
            return []
            
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
        if not supabase:
            return
            
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


class handler(BaseHTTPRequestHandler):
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, X-Webhook-Secret')
        self.end_headers()
    
    def do_GET(self):
        """Health check endpoint"""
        if self.path == '/api/telegram-webhook/health':
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({
                'status': 'ok',
                'service': 'UmraGO Telegram Webhook API'
            }).encode())
        else:
            self.send_response(404)
            self.end_headers()
    
    def do_POST(self):
        """Handle webhook requests"""
        # Set CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Content-Type', 'application/json')
        
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode('utf-8'))
            
            # Verify webhook secret
            secret = self.headers.get('X-Webhook-Secret', '')
            if secret != WEBHOOK_SECRET:
                self.send_response(401)
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Unauthorized'}).encode())
                return
            
            # Route to appropriate handler based on path
            if '/task-created' in self.path:
                result = self.handle_task_created(data)
            elif '/task-updated' in self.path:
                result = self.handle_task_updated(data)
            elif '/task-completed' in self.path:
                result = self.handle_task_completed(data)
            elif '/comment-added' in self.path:
                result = self.handle_comment_added(data)
            elif '/broadcast' in self.path:
                result = self.handle_broadcast(data)
            elif '/deadline-reminder' in self.path:
                result = self.handle_deadline_reminder(data)
            else:
                self.send_response(404)
                self.end_headers()
                self.wfile.write(json.dumps({'error': 'Endpoint not found'}).encode())
                return
            
            # Send response
            self.send_response(200)
            self.end_headers()
            self.wfile.write(json.dumps(result).encode())
            
        except Exception as e:
            logger.error(f"Error handling request: {e}")
            self.send_response(500)
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def handle_task_created(self, data):
        """Handle task creation webhook"""
        task = data.get('record')
        
        if not task:
            return {'error': 'No task data provided'}
        
        message = (
            "🆕 <b>NEW TASK CREATED</b>\n\n"
            f"📋 <b>Title:</b> {task['title']}\n"
            f"👤 <b>Assigned to:</b> {task['assigned_to']}\n"
            f"📅 <b>Deadline:</b> {task['deadline'][:10]}\n"
            f"⚡ <b>Priority:</b> {task['priority'].upper()}\n"
            f"✍️ <b>Created by:</b> {task['created_by']}\n\n"
            f"👉 <a href='{WEB_APP_URL}'>View Task Details</a>"
        )
        
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
        
        return {
            'success': True,
            'sent_to': sent_count,
            'failed': failed_count,
            'total_groups': len(groups)
        }
    
    def handle_task_updated(self, data):
        """Handle task update webhook"""
        task = data.get('record')
        old_task = data.get('old_record')
        
        if not task:
            return {'error': 'No task data provided'}
        
        changes = []
        if old_task:
            if task.get('status') != old_task.get('status'):
                changes.append(f"Status: {old_task.get('status')} → {task.get('status')}")
            if task.get('priority') != old_task.get('priority'):
                changes.append(f"Priority: {old_task.get('priority')} → {task.get('priority')}")
        
        if not changes:
            return {'success': True, 'message': 'No significant changes'}
        
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
        
        return {'success': True, 'sent_to': sent_count}
    
    def handle_task_completed(self, data):
        """Handle task completion webhook"""
        task = data.get('record')
        
        if not task or task.get('status') != 'completed':
            return {'error': 'Invalid task data'}
        
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
        
        return {'success': True, 'sent_to': sent_count}
    
    def handle_comment_added(self, data):
        """Handle new comment webhook"""
        comment = data.get('record')
        
        if not comment:
            return {'error': 'No comment data provided'}
        
        try:
            task_response = supabase.table('tasks')\
                .select('*')\
                .eq('id', comment['task_id'])\
                .single()\
                .execute()
            
            if not task_response.data:
                return {'error': 'Task not found'}
            
            task = task_response.data
        except Exception as e:
            logger.error(f"Error fetching task: {e}")
            return {'error': 'Failed to fetch task details'}
        
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
        
        return {'success': True, 'sent_to': sent_count}
    
    def handle_broadcast(self, data):
        """Handle broadcast message requests"""
        message_text = data.get('message')
        sender_name = data.get('sender_name', 'Admin')
        sender_email = data.get('sender_email', '')
        
        if not message_text:
            return {'error': 'No message provided'}
        
        message = (
            f"📢 <b>BROADCAST MESSAGE</b>\n"
            f"From: {sender_name}\n\n"
            f"{message_text}"
        )
        
        groups = get_active_groups()
        sent_count = 0
        failed_count = 0
        
        for group in groups:
            result = send_telegram_message(group['chat_id'], message)
            
            if result and result.get('ok'):
                sent_count += 1
                log_notification('broadcast', None, group['chat_id'], message, 'sent')
            else:
                failed_count += 1
                error_msg = result.get('description') if result else 'Unknown error'
                log_notification('broadcast', None, group['chat_id'], message, 'failed', error_msg)
        
        return {
            'success': True,
            'sent_to': sent_count,
            'failed': failed_count,
            'total_groups': len(groups)
        }
    
    def handle_deadline_reminder(self, data):
        """Send deadline reminders for tasks due soon"""
        from datetime import datetime, timedelta
        
        try:
            tomorrow = (datetime.utcnow() + timedelta(days=1)).isoformat()
            today = datetime.utcnow().isoformat()
            
            tasks_response = supabase.table('tasks')\
                .select('*')\
                .gte('deadline', today)\
                .lte('deadline', tomorrow)\
                .neq('status', 'completed')\
                .execute()
            
            if not tasks_response.data:
                return {'success': True, 'message': 'No upcoming deadlines'}
            
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
            
            return {
                'success': True,
                'tasks_checked': len(tasks_response.data),
                'notifications_sent': total_sent
            }
        except Exception as e:
            logger.error(f"Error in deadline reminder: {e}")
            return {'error': str(e)}

