# UmraGO Telegram Bot - Quick Reference 📋

## Bot Commands

| Command | Description | Who Can Use |
|---------|-------------|-------------|
| `/start` | Initialize bot, register group | Everyone |
| `/help` | Show help message | Everyone |
| `/status` | Check bot and group status | Everyone |
| `/groups` | List all connected groups | Admins |
| `/broadcast <message>` | Send to all groups | Admins |

## Environment Variables

### Required for Webhook API
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOi...
WEBHOOK_SECRET=random_32_char_string
PORT=5000
```

### Required for Frontend (Vercel)
```env
NEXT_PUBLIC_WEBHOOK_API_URL=https://your-api.railway.app
NEXT_PUBLIC_WEBHOOK_SECRET=same_as_above
NEXT_PUBLIC_TELEGRAM_NOTIFICATIONS_ENABLED=true
```

## API Endpoints

### Health Check
```bash
GET https://your-api.railway.app/health
```

### Task Created
```bash
POST https://your-api.railway.app/webhook/task-created
Headers: X-Webhook-Secret: your_secret
Body: {"record": {task_object}}
```

### Comment Added
```bash
POST https://your-api.railway.app/webhook/comment-added
Headers: X-Webhook-Secret: your_secret
Body: {"record": {comment_object}}
```

### Task Completed
```bash
POST https://your-api.railway.app/webhook/task-completed
Headers: X-Webhook-Secret: your_secret
Body: {"record": {task_object}}
```

### Broadcast Message
```bash
POST https://your-api.railway.app/webhook/broadcast
Headers: X-Webhook-Secret: your_secret
Body: {"message": "text", "sender_name": "name", "sender_email": "email"}
```

### Deadline Reminders
```bash
POST https://your-api.railway.app/webhook/deadline-reminder
Headers: X-Webhook-Secret: your_secret
```

## Common Tasks

### Start Bot (Server)
```bash
cd telegram-bot
source venv/bin/activate
python umrago_bot.py
```

### Start Bot (PM2)
```bash
pm2 start ecosystem.config.js
pm2 status
pm2 logs umrago-bot
```

### Stop Bot
```bash
pm2 stop umrago-bot
```

### Restart Bot
```bash
pm2 restart umrago-bot
```

### Update Bot Code
```bash
cd telegram-bot
git pull
pm2 restart umrago-bot
```

### View Logs
```bash
# PM2
pm2 logs umrago-bot --lines 100

# Railway
# Go to Dashboard → Deployments → Logs

# Docker
docker logs -f umrago-bot
```

## Database Queries

### View All Active Groups
```sql
SELECT chat_id, chat_title, joined_at, member_count 
FROM telegram_groups 
WHERE is_active = true
ORDER BY joined_at DESC;
```

### View Recent Notifications
```sql
SELECT notification_type, chat_id, sent_at, status
FROM telegram_notifications
ORDER BY sent_at DESC
LIMIT 50;
```

### View Broadcast History
```sql
SELECT message_text, sent_by_name, total_groups, successful_sends, created_at
FROM telegram_broadcasts
ORDER BY created_at DESC;
```

### Count Notifications by Type
```sql
SELECT notification_type, COUNT(*) as count
FROM telegram_notifications
GROUP BY notification_type
ORDER BY count DESC;
```

## Notification Message Formats

### Task Created
```
🆕 NEW TASK CREATED

📋 Title: {title}
👤 Assigned to: {assigned_to}
📅 Deadline: {deadline}
⚡ Priority: {priority}
✍️ Created by: {created_by}

👉 View details: {url}
```

### Comment Added
```
💬 NEW COMMENT

📋 Task: {task_title}
👤 From: {user_name}
💭 Comment: {comment_text}

👉 View task: {url}
```

### Task Completed
```
✅ TASK COMPLETED

📋 Task: {title}
👤 Completed by: {assigned_to}
🎉 Great job!

👉 View details: {url}
```

### Deadline Reminder
```
⏰ DEADLINE REMINDER

📋 Task: {title}
👤 Assigned to: {assigned_to}
⏱️ Due in: {hours} hours
📅 Deadline: {deadline}

👉 View task: {url}
```

### Broadcast
```
📢 BROADCAST MESSAGE
From: {sender_name}

{message_text}
```

## Testing Commands

### Test Task Creation
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret" \
  -d '{
    "record": {
      "id": "test-123",
      "title": "Test Task",
      "assigned_to": "John Doe",
      "deadline": "2025-11-30",
      "priority": "high",
      "created_by": "Admin"
    }
  }' \
  https://your-api.railway.app/webhook/task-created
```

### Test Comment
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret" \
  -d '{
    "record": {
      "id": "comment-123",
      "task_id": "task-456",
      "user_name": "Jane Doe",
      "comment_text": "This is a test comment"
    }
  }' \
  https://your-api.railway.app/webhook/comment-added
```

### Test Broadcast
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret" \
  -d '{
    "message": "This is a test broadcast",
    "sender_name": "Admin",
    "sender_email": "admin@example.com"
  }' \
  https://your-api.railway.app/webhook/broadcast
```

## Troubleshooting Quick Fixes

### Bot Not Responding
```bash
# Check if bot is running
pm2 status

# View recent logs
pm2 logs umrago-bot --lines 50

# Restart bot
pm2 restart umrago-bot
```

### Notifications Not Sending
```bash
# Test webhook API
curl https://your-api.railway.app/health

# Check environment variables
pm2 env 0

# View Railway logs (in browser)
# Dashboard → Your Service → Deployments → Logs
```

### Database Issues
```sql
-- Check if bot tables exist
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name LIKE 'telegram%';

-- Check RLS policies
SELECT schemaname, tablename, policyname 
FROM pg_policies 
WHERE tablename IN ('tasks', 'comments');
```

## File Locations

```
/telegram-bot/
├── umrago_bot.py              # Main bot code
├── webhook_api.py             # Flask webhook API
├── requirements.txt           # Python dependencies
├── .env.example              # Environment template
├── README.md                 # Full documentation
├── DEPLOYMENT-GUIDE.md       # Step-by-step deployment
└── QUICK-REFERENCE.md        # This file

/lib/
└── telegram-notifications.ts  # Frontend integration

SQL Schema Files:
├── /telegram-bot-schema.sql   # Bot database tables
└── /supabase-schema.sql       # Main app schema + RLS fixes
```

## Important URLs

- **BotFather**: https://t.me/BotFather
- **Railway Dashboard**: https://railway.app/dashboard
- **Supabase Dashboard**: https://supabase.com/dashboard
- **Vercel Dashboard**: https://vercel.com/dashboard

## Support Checklist

When asking for help, provide:
- [ ] Bot logs (`pm2 logs umrago-bot`)
- [ ] Webhook API logs (Railway dashboard)
- [ ] Environment variables (without secrets)
- [ ] Error messages from browser console
- [ ] Which step in deployment you're on
- [ ] What you expected vs what happened

---

**Quick Start After Deployment:**

1. ✅ Add bot to Telegram group: `/start`
2. ✅ Test status: `/status`
3. ✅ Create test task in web app
4. ✅ Check Telegram for notification
5. ✅ Add comment and verify notification
6. ✅ Test broadcast: `/broadcast Test message`

---

*Keep this file handy for daily operations!*
