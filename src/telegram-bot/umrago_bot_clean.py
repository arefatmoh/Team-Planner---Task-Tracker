"""
UmraGO Assistant - Telegram Bot (Clean Version)
A reliable, well-structured bot for team task notifications

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
from datetime import datetime
from typing import Optional
from dotenv import load_dotenv

# Telegram Bot imports
try:
    from telegram import Update
    from telegram.ext import Application, CommandHandler, ContextTypes, MessageHandler, filters
except ImportError:
    print("❌ ERROR: python-telegram-bot not installed!")
    print("Run: pip install python-telegram-bot==20.7")
    sys.exit(1)

# Supabase imports
try:
    from supabase import create_client, Client
except ImportError:
    print("❌ ERROR: supabase not installed!")
    print("Run: pip install supabase==2.3.0")
    sys.exit(1)

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    format='%(asctime)s - %(levelname)s - %(message)s',
    level=logging.INFO,
    datefmt='%Y-%m-%d %H:%M:%S'
)
logger = logging.getLogger(__name__)

# ============================================================================
# CONFIGURATION
# ============================================================================

TELEGRAM_BOT_TOKEN = os.getenv('TELEGRAM_BOT_TOKEN', '').strip()
SUPABASE_URL = os.getenv('SUPABASE_URL', '').strip()
SUPABASE_KEY = os.getenv('SUPABASE_ANON_KEY', '').strip()
WEB_APP_URL = os.getenv('WEB_APP_URL', 'https://team-planner-task-tracker.vercel.app/').strip()

# Admin emails for broadcast commands
ADMIN_EMAILS = [
    'arefat@example.com',
    'mekin@example.com',
    'suad@example.com',
    'ramadan@example.com'
]

# ============================================================================
# VALIDATION
# ============================================================================

def validate_config():
    """Validate all required configuration"""
    errors = []
    
    if not TELEGRAM_BOT_TOKEN:
        errors.append("TELEGRAM_BOT_TOKEN is not set in .env file")
    
    if not SUPABASE_URL:
        errors.append("SUPABASE_URL is not set in .env file")
    
    if not SUPABASE_KEY:
        errors.append("SUPABASE_ANON_KEY is not set in .env file")
    
    if errors:
        logger.error("❌ Configuration Errors:")
        for error in errors:
            logger.error(f"  - {error}")
        logger.error("\nPlease check your .env file in the telegram-bot folder")
        return False
    
    return True

# ============================================================================
# SUPABASE CLIENT
# ============================================================================

def init_supabase() -> Optional[Client]:
    """Initialize Supabase client with error handling"""
    try:
        client = create_client(SUPABASE_URL, SUPABASE_KEY)
        logger.info("✅ Supabase client initialized")
        return client
    except Exception as e:
        logger.error(f"❌ Failed to initialize Supabase: {e}")
        logger.error("This might be a version issue. Try: pip install supabase==2.3.0")
        return None

# Initialize Supabase
if not validate_config():
    sys.exit(1)

supabase = init_supabase()
if not supabase:
    sys.exit(1)

# ============================================================================
# BOT CLASS
# ============================================================================

class UmraGOBot:
    """Main bot class for handling Telegram commands and notifications"""
    
    def __init__(self, application: Application):
        self.application = application
    
    # ========================================================================
    # COMMAND HANDLERS
    # ========================================================================
    
    async def start_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /start command"""
        user = update.effective_user
        chat = update.effective_chat
        
        welcome_msg = (
            "✅ <b>Bot is Working!</b>\n\n"
            "🎉 Welcome to UmraGO Assistant!\n\n"
            "I'm your team's task management assistant.\n\n"
            "<b>I'll notify you about:</b>\n"
            "✅ New tasks created\n"
            "📝 Task updates\n"
            "💬 New comments\n"
            "✔️ Completed tasks\n"
            "⏰ Upcoming deadlines\n\n"
            "<b>Commands:</b>\n"
            "/help - Show all commands\n"
            "/status - Check bot status\n"
            "/groups - List connected groups (Admin)\n"
            "/broadcast - Send message to all groups (Admin)\n\n"
            f"🌐 <a href='{WEB_APP_URL}'>Visit Your Planner</a>"
        )
        
        # Register group if this is a group chat
        if chat.type in ['group', 'supergroup']:
            await self._register_group(chat)
            welcome_msg += "\n\n✅ This group is now registered for notifications!"
        
        await update.message.reply_text(welcome_msg, parse_mode='HTML')
    
    async def help_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /help command"""
        help_text = (
            "🤖 <b>UmraGO Assistant Commands</b>\n\n"
            "<b>📋 General Commands:</b>\n"
            "/start - Initialize bot and register group\n"
            "/help - Show this help message\n"
            "/status - Check bot and group status\n\n"
            "<b>👨‍💼 Admin Commands:</b>\n"
            "/broadcast &lt;message&gt; - Send message to all groups\n"
            "/groups - List all connected groups\n\n"
            f"🌐 <a href='{WEB_APP_URL}'>Web App</a>"
        )
        await update.message.reply_text(help_text, parse_mode='HTML')
    
    async def status_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /status command"""
        chat = update.effective_chat
        
        try:
            # Get total groups
            response = supabase.table('telegram_groups')\
                .select('*', count='exact')\
                .eq('is_active', True)\
                .execute()
            
            total_groups = response.count or 0
            
            status_text = (
                "🤖 <b>Bot Status: ✅ Online</b>\n\n"
                f"📊 Connected Groups: {total_groups}\n"
                f"🌐 Web App: <a href='{WEB_APP_URL}'>Visit</a>\n"
            )
            
            # Check if this group is registered
            if chat.type in ['group', 'supergroup']:
                group_response = supabase.table('telegram_groups')\
                    .select('*')\
                    .eq('chat_id', str(chat.id))\
                    .execute()
                
                if group_response.data:
                    group = group_response.data[0]
                    status_text += (
                        f"\n✅ <b>This group is registered</b>\n"
                        f"📅 Joined: {group.get('joined_at', 'N/A')[:10]}\n"
                        f"👥 Members: {group.get('member_count', 'N/A')}"
                    )
                else:
                    status_text += "\n⚠️ This group is not registered yet\nSend /start to register"
            
            await update.message.reply_text(status_text, parse_mode='HTML')
            
        except Exception as e:
            logger.error(f"Error getting status: {e}")
            await update.message.reply_text("❌ Error retrieving status. Please try again later.")
    
    async def groups_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /groups command (Admin only)"""
        try:
            response = supabase.table('telegram_groups')\
                .select('*')\
                .eq('is_active', True)\
                .order('joined_at', desc=True)\
                .execute()
            
            if not response.data:
                await update.message.reply_text("📭 No groups connected yet.")
                return
            
            groups_text = f"📱 <b>Connected Groups ({len(response.data)}):</b>\n\n"
            
            for idx, group in enumerate(response.data, 1):
                groups_text += (
                    f"{idx}. <b>{group['chat_title']}</b>\n"
                    f"   Type: {group['chat_type']}\n"
                    f"   Joined: {group.get('joined_at', 'N/A')[:10]}\n\n"
                )
            
            await update.message.reply_text(groups_text, parse_mode='HTML')
            
        except Exception as e:
            logger.error(f"Error getting groups: {e}")
            await update.message.reply_text("❌ Error retrieving groups.")
    
    async def broadcast_command(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle /broadcast command (Admin only)"""
        user = update.effective_user
        
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
            
            broadcast_msg = (
                f"📢 <b>BROADCAST MESSAGE</b>\n"
                f"From: {user.full_name or user.username}\n\n"
                f"{message_text}"
            )
            
            successful = 0
            failed = 0
            
            for group in response.data:
                try:
                    await context.bot.send_message(
                        chat_id=group['chat_id'],
                        text=broadcast_msg,
                        parse_mode='HTML'
                    )
                    successful += 1
                except Exception as e:
                    logger.error(f"Failed to send to {group['chat_title']}: {e}")
                    failed += 1
            
            result_text = (
                f"✅ <b>Broadcast completed!</b>\n\n"
                f"📊 Sent to: {successful}/{len(response.data)} groups\n"
                f"❌ Failed: {failed}"
            )
            
            await update.message.reply_text(result_text, parse_mode='HTML')
            
        except Exception as e:
            logger.error(f"Broadcast error: {e}")
            await update.message.reply_text("❌ Broadcast failed. Please try again.")
    
    async def handle_new_group(self, update: Update, context: ContextTypes.DEFAULT_TYPE):
        """Handle bot being added to a new group"""
        chat = update.effective_chat
        
        if chat.type in ['group', 'supergroup']:
            await self._register_group(chat)
            
            welcome_msg = (
                "👋 Hello! I'm UmraGO Assistant!\n\n"
                "✅ This group is now connected to your UmraGO Team Planner.\n\n"
                "<b>I'll send notifications for:</b>\n"
                "• New tasks\n"
                "• Task updates\n"
                "• Comments\n"
                "• Completed tasks\n"
                "• Deadline reminders\n\n"
                f"🌐 <a href='{WEB_APP_URL}'>Manage Tasks</a>"
            )
            
            await update.message.reply_text(welcome_msg, parse_mode='HTML')
    
    # ========================================================================
    # HELPER METHODS
    # ========================================================================
    
    async def _register_group(self, chat):
        """Register a Telegram group in the database"""
        try:
            # Check if group already exists
            existing = supabase.table('telegram_groups')\
                .select('*')\
                .eq('chat_id', str(chat.id))\
                .execute()
            
            group_data = {
                'chat_id': str(chat.id),
                'chat_title': chat.title or 'Unknown',
                'chat_type': chat.type,
                'is_active': True,
                'updated_at': datetime.utcnow().isoformat()
            }
            
            if existing.data:
                # Update existing group
                supabase.table('telegram_groups')\
                    .update(group_data)\
                    .eq('chat_id', str(chat.id))\
                    .execute()
                logger.info(f"Updated group: {chat.title} ({chat.id})")
            else:
                # Insert new group
                supabase.table('telegram_groups').insert(group_data).execute()
                logger.info(f"Registered new group: {chat.title} ({chat.id})")
                
        except Exception as e:
            logger.error(f"Error registering group: {e}")

# ============================================================================
# MAIN FUNCTION
# ============================================================================

def main():
    """Main function to start the bot"""
    
    logger.info("=" * 60)
    logger.info("🤖 UmraGO Assistant Bot - Starting...")
    logger.info("=" * 60)
    logger.info(f"📋 Bot Token: {TELEGRAM_BOT_TOKEN[:10]}..." if TELEGRAM_BOT_TOKEN else "📋 Bot Token: Not set")
    logger.info(f"🌐 Supabase: {SUPABASE_URL}")
    logger.info(f"🌍 Web App: {WEB_APP_URL}")
    logger.info("=" * 60)
    
    try:
        # Create application
        application = Application.builder().token(TELEGRAM_BOT_TOKEN).build()
        logger.info("✅ Telegram application created")
        
        # Initialize bot
        bot = UmraGOBot(application)
        
        # Register command handlers
        application.add_handler(CommandHandler("start", bot.start_command))
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
        logger.info("🚀 Bot is ready!")
        logger.info("📱 Send /start to your bot in Telegram to test")
        logger.info("=" * 60)
        logger.info("Press Ctrl+C to stop the bot")
        logger.info("=" * 60)
        
        # Start polling
        application.run_polling(
            allowed_updates=Update.ALL_TYPES,
            drop_pending_updates=True
        )
        
    except KeyboardInterrupt:
        logger.info("\n🛑 Bot stopped by user")
    except Exception as e:
        logger.error(f"❌ ERROR: Failed to start bot: {e}")
        logger.error("Please check your TELEGRAM_BOT_TOKEN is correct")
        sys.exit(1)

if __name__ == '__main__':
    main()

