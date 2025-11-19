"""
UmraGO Assistant - Telegram Bot
A comprehensive bot for team task notifications and broadcasting

Features:
- Real-time task notifications
- Comment notifications
- Deadline reminders
- Admin broadcast system
- Multi-group support
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
import asyncio
from dotenv import load_dotenv

from telegram import Update
from telegram.ext import (
    Application,
    CommandHandler,
    ContextTypes,
    MessageHandler,
    filters,
)
from supabase import create_client, Client

# Load environment variables from .env file
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    level=logging.INFO
)
logger = logging.getLogger(__name__)

# Configuration - REPLACE WITH YOUR VALUES
TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', 'YOUR_BOT_TOKEN_HERE')
SUPABASE_URL = os.getenv('SUPABASE_URL', 'YOUR_SUPABASE_URL_HERE')
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', 'YOUR_SUPABASE_ANON_KEY_HERE')
WEB_APP_URL = os.getenv('WEB_APP_URL', 'https://team-planner-task-tracker.vercel.app/')

# Admin emails - only these users can broadcast messages
ADMIN_EMAILS = [
    'arefat@example.com',
    'mekin@example.com', 
    'suad@example.com',
    'ramadan@example.com'
]

# Validate configuration
if TELEGRAM_BOT_TOKEN == 'YOUR_BOT_TOKEN_HERE' or not TELEGRAM_BOT_TOKEN:
    logger.error("❌ ERROR: TELEGRAM_BOT_TOKEN not set!")
    logger.error("Please set TELEGRAM_BOT_TOKEN in your .env file")
    logger.error("Get your token from @BotFather on Telegram")
    sys.exit(1)

if SUPABASE_URL == 'YOUR_SUPABASE_URL_HERE' or not SUPABASE_URL:
    logger.error("❌ ERROR: SUPABASE_URL not set!")
    logger.error("Please set SUPABASE_URL in your .env file")
    sys.exit(1)

if SUPABASE_KEY == 'YOUR_SUPABASE_ANON_KEY_HERE' or not SUPABASE_KEY:
    logger.error("❌ ERROR: SUPABASE_ANON_KEY not set!")
    logger.error("Please set SUPABASE_ANON_KEY in your .env file")
    sys.exit(1)

# Initialize Supabase client (same as frontend - simple initialization)
try:
    # Simple initialization like in frontend supabase.ts
    supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
    logger.info("✅ Supabase client initialized")
except Exception as e:
    logger.error(f"❌ ERROR: Failed to initialize Supabase: {e}")
    logger.error("This is likely a version compatibility issue")
    logger.error("")
    logger.error("Try running: fix-all-deps.bat")
    logger.error("Or manually:")
    logger.error("  pip uninstall supabase httpx -y")
    logger.error("  pip install supabase==2.3.0 httpx==0.27.0")
    sys.exit(1)


class UmraGOBot:
    """Main bot class handling all operations"""
    
    def __init__(self, application: Application):
        self.application = application
        self.active_groups: Dict[str, Dict] = {}
        
    async def start(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user = update.effective_user
        chat = update.effective_chat
        
        welcome_message = (
            "✅ <b>Bot is Working!</b>\n\n"
            "🎉 Welcome to UmraGO Assistant!\n\n"
            "I'm your team's task management assistant. "
            "I'll notify you about:\n\n"
            "✅ New tasks created\n"
            "📝 Task updates\n"
            "💬 New comments\n"
            "✔️ Completed tasks\n"
            "⏰ Upcoming deadlines\n\n"
            "<b>Available Commands:</b>\n"
            "/help - Show available commands\n"
            "/status - Check bot status\n"
            "/broadcast - Send message to all groups (Admins only)\n"
            "/groups - List all connected groups (Admins only)\n\n"
            f"🌐 Visit your planner: {WEB_APP_URL}"
        )
        
        # If this is a group, register it
        if chat.type in ['group', 'supergroup']:
            await self.register_group(chat)
            welcome_message += "\n\n✅ This group is now registered for notifications!"
        
        await update.message.reply_text(welcome_message)
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show help message"""
        help_text = (
            "🤖 UmraGO Assistant Commands:\n\n"
            "📋 General Commands:\n"
            "/start - Initialize bot\n"
            "/help - Show this help message\n"
            "/status - Check bot and group status\n\n"
            "👨‍💼 Admin Commands:\n"
            "/broadcast <message> - Send message to all groups\n"
            "/groups - List all connected groups\n"
            "/stats - View notification statistics\n\n"
            f"🌐 Web App: {WEB_APP_URL}\n\n"
            "💡 Tip: Add me to your team groups to receive automatic task notifications!"
        )
        await update.message.reply_text(help_text)
    
    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Show bot status"""
        chat = update.effective_chat
        
        # Get total groups count
        try:
            response = supabase.table('telegram_groups')\
                .select('*')\
                .eq('is_active', True)\
                .execute()
            
            total_groups = len(response.data)
            
            status_text = (
                "🤖 Bot Status: ✅ Online\n\n"
                f"📊 Connected Groups: {total_groups}\n"
                f"💻 Web App: {WEB_APP_URL}\n"
            )
            
            if chat.type in ['group', 'supergroup']:
                # Check if this group is registered
                group_response = supabase.table('telegram_groups')\
                    .select('*')\
                    .eq('chat_id', str(chat.id))\
                    .execute()
                
                if group_response.data:
                    group = group_response.data[0]
                    status_text += (
                        f"\n✅ This group is registered\n"
                        f"📅 Joined: {group['joined_at'][:10]}\n"
                        f"👥 Members: {group.get('member_count', 'N/A')}"
                    )
                else:
                    status_text += "\n⚠️ This group is not registered yet"
            
            await update.message.reply_text(status_text)
            
        except Exception as e:
            logger.error(f"Error getting status: {e}")
            await update.message.reply_text(
                "❌ Error retrieving status. Please try again later."
            )
    
    async def groups_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """List all connected groups (Admin only)"""
        user = update.effective_user
        
        # Check if user is admin
        # Note: In production, you should verify admin status via Supabase auth
        # For now, we'll allow all authenticated users to view groups
        
        try:
            response = supabase.table('telegram_groups')\
                .select('*')\
                .eq('is_active', True)\
                .order('joined_at', desc=True)\
                .execute()
            
            if not response.data:
                await update.message.reply_text("📭 No groups connected yet.")
                return
            
            groups_text = f"📱 Connected Groups ({len(response.data)}):\n\n"
            
            for idx, group in enumerate(response.data, 1):
                groups_text += (
                    f"{idx}. {group['chat_title']}\n"
                    f"   Type: {group['chat_type']}\n"
                    f"   Joined: {group['joined_at'][:10]}\n\n"
                )
            
            await update.message.reply_text(groups_text)
            
        except Exception as e:
            logger.error(f"Error getting groups: {e}")
            await update.message.reply_text("❌ Error retrieving groups.")
    
    async def broadcast_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Broadcast message to all groups (Admin only)"""
        user = update.effective_user
        
        # Extract message
        if not context.args:
            await update.message.reply_text(
                "❌ Please provide a message to broadcast.\n\n"
                "Usage: /broadcast Your message here"
            )
            return
        
        message_text = ' '.join(context.args)
        
        try:
            # Get all active groups
            response = supabase.table('telegram_groups')\
                .select('*')\
                .eq('is_active', True)\
                .execute()
            
            if not response.data:
                await update.message.reply_text("📭 No groups to broadcast to.")
                return
            
            # Create broadcast record
            broadcast_data = {
                'message_text': message_text,
                'sent_by_email': f'{user.username}@telegram.com',
                'sent_by_name': user.full_name or user.username,
                'total_groups': len(response.data),
                'status': 'sending'
            }
            
            broadcast_record = supabase.table('telegram_broadcasts')\
                .insert(broadcast_data)\
                .execute()
            
            broadcast_id = broadcast_record.data[0]['id']
            
            # Send to all groups
            successful = 0
            failed = 0
            
            broadcast_message = (
                "📢 BROADCAST MESSAGE\n"
                f"From: {user.full_name or user.username}\n\n"
                f"{message_text}"
            )
            
            for group in response.data:
                try:
                    await context.bot.send_message(
                        chat_id=group['chat_id'],
                        text=broadcast_message
                    )
                    successful += 1
                    
                    # Log notification
                    supabase.table('telegram_notifications').insert({
                        'notification_type': 'broadcast',
                        'chat_id': group['chat_id'],
                        'message_text': broadcast_message,
                        'status': 'sent'
                    }).execute()
                    
                except Exception as e:
                    logger.error(f"Failed to send to {group['chat_title']}: {e}")
                    failed += 1
                    
                    # Log failed notification
                    supabase.table('telegram_notifications').insert({
                        'notification_type': 'broadcast',
                        'chat_id': group['chat_id'],
                        'message_text': broadcast_message,
                        'status': 'failed',
                        'error_message': str(e)
                    }).execute()
            
            # Update broadcast record
            supabase.table('telegram_broadcasts')\
                .update({
                    'successful_sends': successful,
                    'failed_sends': failed,
                    'status': 'completed'
                })\
                .eq('id', broadcast_id)\
                .execute()
            
            result_text = (
                f"✅ Broadcast completed!\n\n"
                f"📊 Sent to: {successful}/{len(response.data)} groups\n"
                f"❌ Failed: {failed}"
            )
            
            await update.message.reply_text(result_text)
            
        except Exception as e:
            logger.error(f"Broadcast error: {e}")
            await update.message.reply_text("❌ Broadcast failed. Please try again.")
    
    async def register_group(self, chat):
        """Register a group in the database"""
        try:
            # Check if group already exists
            existing = supabase.table('telegram_groups')\
                .select('*')\
                .eq('chat_id', str(chat.id))\
                .execute()
            
            if existing.data:
                # Update existing group
                supabase.table('telegram_groups')\
                    .update({
                        'chat_title': chat.title,
                        'is_active': True,
                        'updated_at': datetime.utcnow().isoformat()
                    })\
                    .eq('chat_id', str(chat.id))\
                    .execute()
            else:
                # Insert new group
                group_data = {
                    'chat_id': str(chat.id),
                    'chat_title': chat.title,
                    'chat_type': chat.type,
                    'is_active': True
                }
                
                supabase.table('telegram_groups').insert(group_data).execute()
            
            logger.info(f"Registered group: {chat.title} ({chat.id})")
            
        except Exception as e:
            logger.error(f"Error registering group: {e}")
    
    async def handle_new_group(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle bot being added to a new group"""
        chat = update.effective_chat
        
        if chat.type in ['group', 'supergroup']:
            await self.register_group(chat)
            
            welcome_message = (
                "👋 Hello! I'm UmraGO Assistant!\n\n"
                "✅ This group is now connected to your UmraGO Team Planner.\n\n"
                "I'll send notifications for:\n"
                "• New tasks\n"
                "• Task updates\n"
                "• Comments\n"
                "• Completed tasks\n"
                "• Deadline reminders\n\n"
                f"Manage tasks at: {WEB_APP_URL}"
            )
            
            await update.message.reply_text(welcome_message)


# Notification functions (Alternative implementation)
# NOTE: These functions are defined but not currently used.
# The webhook_api.py handles all notifications from the frontend.
# These functions can be used if you want to send notifications directly from the bot.
async def send_task_created_notification(task_data: Dict[str, Any], bot_token: str):
    """Send notification when a new task is created"""
    try:
        bot = Application.builder().token(bot_token).build()
        
        # Get all active groups
        response = supabase.table('telegram_groups')\
            .select('*')\
            .eq('is_active', True)\
            .execute()
        
        message = (
            "🆕 NEW TASK CREATED\n\n"
            f"📋 Title: {task_data['title']}\n"
            f"👤 Assigned to: {task_data['assigned_to']}\n"
            f"📅 Deadline: {task_data['deadline'][:10]}\n"
            f"⚡ Priority: {task_data['priority'].upper()}\n"
            f"✍️ Created by: {task_data['created_by']}\n\n"
            f"👉 View details: {WEB_APP_URL}"
        )
        
        for group in response.data:
            try:
                await bot.bot.send_message(
                    chat_id=group['chat_id'],
                    text=message
                )
                
                # Log notification
                supabase.table('telegram_notifications').insert({
                    'notification_type': 'task_created',
                    'task_id': task_data['id'],
                    'chat_id': group['chat_id'],
                    'message_text': message,
                    'status': 'sent'
                }).execute()
                
            except Exception as e:
                logger.error(f"Failed to send task notification to {group['chat_title']}: {e}")
        
    except Exception as e:
        logger.error(f"Error sending task created notification: {e}")


async def send_comment_notification(comment_data: Dict[str, Any], task_data: Dict[str, Any], bot_token: str):
    """Send notification when a comment is added"""
    try:
        bot = Application.builder().token(bot_token).build()
        
        # Get all active groups
        response = supabase.table('telegram_groups')\
            .select('*')\
            .eq('is_active', True)\
            .execute()
        
        message = (
            "💬 NEW COMMENT\n\n"
            f"📋 Task: {task_data['title']}\n"
            f"👤 From: {comment_data['user_name']}\n"
            f"💭 Comment: {comment_data['comment_text']}\n\n"
            f"👉 View task: {WEB_APP_URL}"
        )
        
        for group in response.data:
            try:
                await bot.bot.send_message(
                    chat_id=group['chat_id'],
                    text=message
                )
                
                # Log notification
                supabase.table('telegram_notifications').insert({
                    'notification_type': 'comment_added',
                    'task_id': task_data['id'],
                    'chat_id': group['chat_id'],
                    'message_text': message,
                    'status': 'sent'
                }).execute()
                
            except Exception as e:
                logger.error(f"Failed to send comment notification: {e}")
        
    except Exception as e:
        logger.error(f"Error sending comment notification: {e}")


async def send_task_completed_notification(task_data: Dict[str, Any], bot_token: str):
    """Send notification when a task is completed"""
    try:
        bot = Application.builder().token(bot_token).build()
        
        # Get all active groups
        response = supabase.table('telegram_groups')\
            .select('*')\
            .eq('is_active', True)\
            .execute()
        
        message = (
            "✅ TASK COMPLETED\n\n"
            f"📋 Task: {task_data['title']}\n"
            f"👤 Completed by: {task_data['assigned_to']}\n"
            f"🎉 Great job!\n\n"
            f"👉 View details: {WEB_APP_URL}"
        )
        
        for group in response.data:
            try:
                await bot.bot.send_message(
                    chat_id=group['chat_id'],
                    text=message
                )
                
                # Log notification
                supabase.table('telegram_notifications').insert({
                    'notification_type': 'task_completed',
                    'task_id': task_data['id'],
                    'chat_id': group['chat_id'],
                    'message_text': message,
                    'status': 'sent'
                }).execute()
                
            except Exception as e:
                logger.error(f"Failed to send completion notification: {e}")
        
    except Exception as e:
        logger.error(f"Error sending task completed notification: {e}")


async def send_deadline_reminders(bot_token: str):
    """Check for upcoming deadlines and send reminders"""
    try:
        bot = Application.builder().token(bot_token).build()
        
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
            return
        
        # Get all active groups
        groups_response = supabase.table('telegram_groups')\
            .select('*')\
            .eq('is_active', True)\
            .execute()
        
        for task in tasks_response.data:
            deadline = datetime.fromisoformat(task['deadline'].replace('Z', '+00:00'))
            hours_left = int((deadline - datetime.utcnow()).total_seconds() / 3600)
            
            message = (
                "⏰ DEADLINE REMINDER\n\n"
                f"📋 Task: {task['title']}\n"
                f"👤 Assigned to: {task['assigned_to']}\n"
                f"⏱️ Due in: {hours_left} hours\n"
                f"📅 Deadline: {task['deadline'][:10]}\n\n"
                f"👉 View task: {WEB_APP_URL}"
            )
            
            for group in groups_response.data:
                try:
                    await bot.bot.send_message(
                        chat_id=group['chat_id'],
                        text=message
                    )
                    
                    # Log notification
                    supabase.table('telegram_notifications').insert({
                        'notification_type': 'deadline_reminder',
                        'task_id': task['id'],
                        'chat_id': group['chat_id'],
                        'message_text': message,
                        'status': 'sent'
                    }).execute()
                    
                except Exception as e:
                    logger.error(f"Failed to send deadline reminder: {e}")
        
    except Exception as e:
        logger.error(f"Error sending deadline reminders: {e}")


def main():
    """Main function to run the bot"""
    
    logger.info("=" * 50)
    logger.info("🤖 UmraGO Assistant Bot")
    logger.info("=" * 50)
    logger.info(f"📋 Bot Token: {TELEGRAM_BOT_TOKEN[:10]}..." if len(TELEGRAM_BOT_TOKEN) > 10 else "📋 Bot Token: Not set")
    logger.info(f"🌐 Supabase URL: {SUPABASE_URL}")
    logger.info(f"🌍 Web App URL: {WEB_APP_URL}")
    logger.info("=" * 50)
    
    try:
        # Create application with proper configuration
        application = (
            Application.builder()
            .token(TELEGRAM_BOT_TOKEN)
            .build()
        )
        logger.info("✅ Telegram bot application created")
        
        # Initialize bot
        bot = UmraGOBot(application)
        
        # Register handlers
        application.add_handler(CommandHandler("start", bot.start))
        application.add_handler(CommandHandler("help", bot.help_command))
        application.add_handler(CommandHandler("status", bot.status_command))
        application.add_handler(CommandHandler("groups", bot.groups_command))
        application.add_handler(CommandHandler("broadcast", bot.broadcast_command))
        
        # Handle new group membership
        application.add_handler(
            MessageHandler(
                filters.StatusUpdate.NEW_CHAT_MEMBERS,
                bot.handle_new_group
            )
        )
        
        logger.info("✅ All handlers registered")
        logger.info("🚀 Starting bot...")
        logger.info("📱 Send /start to your bot in Telegram to test!")
        logger.info("=" * 50)
        
        # Start the bot
        try:
            application.run_polling(
                allowed_updates=Update.ALL_TYPES,
                drop_pending_updates=True,
                close_loop=False
            )
        except KeyboardInterrupt:
            logger.info("Bot stopped by user")
        except Exception as e:
            logger.error(f"Error during polling: {e}")
            raise
        
    except Exception as e:
        logger.error(f"❌ ERROR: Failed to start bot: {e}")
        logger.error("Please check your TELEGRAM_BOT_TOKEN is correct")
        sys.exit(1)


if __name__ == '__main__':
    main()
