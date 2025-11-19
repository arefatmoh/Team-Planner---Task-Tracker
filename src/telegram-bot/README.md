# UmraGO Telegram Bot 🤖

A comprehensive Telegram bot for the UmraGO Team Planner that sends real-time notifications and enables admin broadcasting to all connected groups.

## Features ✨

### 1. **Automatic Notifications**
- 🆕 New task created
- 🔄 Task updated (status, priority, assignee changes)
- ✅ Task completed
- 💬 New comment added
- ⏰ Deadline reminders (24 hours before due)

### 2. **Admin Broadcasting**
- Send messages to all groups where the bot is a member
- Track broadcast delivery status
- View broadcast history

### 3. **Multi-Group Support**
- Works in multiple Telegram groups simultaneously
- Automatically registers new groups
- Tracks group activity and statistics

### 4. **Bot Commands**
- `/start` - Initialize bot and register group
- `/help` - Show available commands
- `/status` - Check bot and group status
- `/groups` - List all connected groups (Admin)
- `/broadcast <message>` - Send message to all groups (Admin)
- `/stats` - View notification statistics (Admin)

## Architecture 🏗️

```
┌─────────────────┐
│  Web App        │
│  (Frontend)     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│  Supabase       │◄────►│  Webhook API     │
│  (Database)     │      │  (Flask)         │
└─────────────────┘      └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Telegram Bot    │
                         │  (Python)        │
                         └────────┬─────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │  Telegram        │
                         │  Groups          │
                         └──────────────────┘
```

## Setup Instructions 🚀

### Step 1: Create Your Telegram Bot

1. Open Telegram and search for `@BotFather`
2. Send `/newbot` command
3. Follow the prompts:
   - Bot name: `UmraGO Assistant`
   - Bot username: `umrago_assistant_bot` (or any available name)
4. Copy the bot token (looks like: `123456789:ABCdefGHIjklMNOpqrsTUVwxyz`)
5. Save this token securely

### Step 2: Configure Bot Settings

Send these commands to @BotFather:

```
/setdescription
# Select your bot, then paste:
Real-time task notifications for UmraGO Team Planner. Get notified about new tasks, updates, comments, and deadlines.

/setabouttext
# Select your bot, then paste:
UmraGO Assistant helps your team stay updated with task notifications and enables admin broadcasting.

/setcommands
# Select your bot, then paste:
start - Initialize bot
help - Show available commands
status - Check bot status
groups - List connected groups
broadcast - Send message to all groups
stats - View statistics
```

### Step 3: Set Up Supabase Database

1. Go to your Supabase project dashboard
2. Navigate to SQL Editor
3. Run the SQL script from `/telegram-bot-schema.sql`
4. Verify tables are created:
   - `telegram_groups`
   - `telegram_notifications`
   - `telegram_broadcasts`

### Step 4: Deploy Webhook API

#### Option A: Deploy to Railway.app (Recommended)

1. Create account at [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables:
   ```
   TELEGRAM_BOT_TOKEN=your_bot_token
   SUPABASE_URL=your_supabase_url
   SUPABASE_ANON_KEY=your_supabase_key
   WEBHOOK_SECRET=generate_random_string
   PORT=5000
   ```
5. Deploy and note the URL (e.g., `https://your-app.railway.app`)

#### Option B: Deploy to Render.com

1. Create account at [render.com](https://render.com)
2. New Web Service → Connect repository
3. Configure:
   - Build Command: `pip install -r telegram-bot/requirements.txt`
   - Start Command: `python telegram-bot/webhook_api.py`
4. Add environment variables (same as above)
5. Deploy and note the URL

#### Option C: Deploy to Your Own Server

```bash
# Install Python 3.9+
sudo apt update
sudo apt install python3 python3-pip

# Clone your repository
git clone your-repo-url
cd your-repo/telegram-bot

# Install dependencies
pip3 install -r requirements.txt

# Create .env file
cp .env.example .env
nano .env  # Fill in your values

# Run the API (use PM2 or systemd for production)
python3 webhook_api.py
```

### Step 5: Run the Telegram Bot

#### Option A: Run on Same Server as Webhook API

```bash
# In a new terminal/screen session
cd telegram-bot
python3 umrago_bot.py
```

#### Option B: Run on Separate Server

```bash
# On any server with Python
git clone your-repo-url
cd telegram-bot
pip3 install -r requirements.txt

# Configure .env
cp .env.example .env
nano .env

# Run the bot
python3 umrago_bot.py
```

#### Option C: Run with Docker

```dockerfile
# Create Dockerfile in telegram-bot folder
FROM python:3.9-slim

WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt

COPY . .

CMD ["python", "umrago_bot.py"]
```

```bash
# Build and run
docker build -t umrago-bot .
docker run -d --env-file .env umrago-bot
```

### Step 6: Add Bot to Your Telegram Groups

1. In Telegram, create your team group(s) if you haven't already
2. Add the bot to each group:
   - Click group name → Add Members
   - Search for your bot username
   - Add the bot
3. The bot will send a welcome message
4. Verify registration with `/status` command

### Step 7: Integrate with Your Web App

You have two options for triggering notifications:

#### Option A: Call Webhook API from Frontend (Simple)

Add this helper function to your web app:

```typescript
// In your frontend code (e.g., add-task-page.tsx)
const WEBHOOK_API_URL = 'https://your-webhook-api.railway.app'
const WEBHOOK_SECRET = 'your_webhook_secret'

async function sendTelegramNotification(type: string, data: any) {
  try {
    await fetch(`${WEBHOOK_API_URL}/webhook/${type}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Webhook-Secret': WEBHOOK_SECRET
      },
      body: JSON.stringify({ record: data })
    })
  } catch (error) {
    console.error('Failed to send Telegram notification:', error)
  }
}

// Call after creating a task
await sendTelegramNotification('task-created', newTask)

// Call after adding a comment
await sendTelegramNotification('comment-added', newComment)

// Call when task is completed
await sendTelegramNotification('task-completed', updatedTask)
```

#### Option B: Use Supabase Database Webhooks (Advanced)

1. Go to Supabase Dashboard → Database → Webhooks
2. Create webhooks for each event:

**Task Created:**
- Table: `tasks`
- Events: `INSERT`
- Webhook URL: `https://your-api.railway.app/webhook/task-created`
- Headers: `X-Webhook-Secret: your_secret`

**Task Updated:**
- Table: `tasks`
- Events: `UPDATE`
- Webhook URL: `https://your-api.railway.app/webhook/task-updated`
- Headers: `X-Webhook-Secret: your_secret`

**Comment Added:**
- Table: `comments`
- Events: `INSERT`
- Webhook URL: `https://your-api.railway.app/webhook/comment-added`
- Headers: `X-Webhook-Secret: your_secret`

### Step 8: Set Up Deadline Reminders (Optional)

You can set up a cron job to check for upcoming deadlines:

#### Using Cron (Linux/Mac)

```bash
# Edit crontab
crontab -e

# Add this line to check every 6 hours
0 */6 * * * curl -X POST -H "X-Webhook-Secret: your_secret" https://your-api.railway.app/webhook/deadline-reminder
```

#### Using Supabase Edge Functions

Create a scheduled function that calls the deadline reminder endpoint every 6 hours.

## Usage Guide 📖

### For Team Members

1. **Receive Notifications**
   - Simply be in a group where the bot is added
   - You'll automatically get notifications for all task activities

2. **Check Status**
   - Send `/status` in the group to see bot status
   - See how many groups are connected

### For Admins

1. **Broadcast Messages**
   
   In the Telegram group:
   ```
   /broadcast Important team meeting tomorrow at 3 PM!
   ```
   
   Or via the web app (future feature):
   - Go to Admin Panel
   - Enter broadcast message
   - Click Send
   - Message goes to all groups

2. **View Connected Groups**
   ```
   /groups
   ```
   Shows list of all groups where bot is active

3. **Check Statistics**
   ```
   /stats
   ```
   View notification delivery statistics

## Notification Examples 📱

### New Task Created
```
🆕 NEW TASK CREATED

📋 Title: Design launch page
👤 Assigned to: Suad
📅 Deadline: 2025-11-25
⚡ Priority: HIGH
✍️ Created by: Arefat

👉 View details: [link]
```

### New Comment
```
💬 NEW COMMENT

📋 Task: Design launch page
👤 From: Mekin
💭 Comment: Looks great! Can we add more Islamic patterns?

👉 View task: [link]
```

### Task Completed
```
✅ TASK COMPLETED

📋 Task: Design launch page
👤 Completed by: Suad
🎉 Great job!

👉 View details: [link]
```

### Deadline Reminder
```
⏰ DEADLINE REMINDER

📋 Task: Prepare presentation
👤 Assigned to: Ramadan
⏱️ Due in: 18 hours
📅 Deadline: 2025-11-26

👉 View task: [link]
```

### Broadcast Message
```
📢 BROADCAST MESSAGE
From: Arefat

Team meeting in 30 minutes! Please join the call.
```

## Troubleshooting 🔧

### Bot Not Responding

1. Check if bot is running:
   ```bash
   # On server
   ps aux | grep umrago_bot.py
   ```

2. Check logs:
   ```bash
   tail -f bot.log
   ```

3. Restart bot:
   ```bash
   pkill -f umrago_bot.py
   python3 umrago_bot.py &
   ```

### Notifications Not Sending

1. Check webhook API is running:
   ```bash
   curl https://your-api.railway.app/health
   ```

2. Verify webhook secret matches in both places

3. Check Supabase webhook logs

4. Test manually:
   ```bash
   curl -X POST \
     -H "Content-Type: application/json" \
     -H "X-Webhook-Secret: your_secret" \
     -d '{"record": {"id": "test", "title": "Test Task", "assigned_to": "Test User", "deadline": "2025-11-30", "priority": "medium", "created_by": "Admin"}}' \
     https://your-api.railway.app/webhook/task-created
   ```

### Bot Kicked from Group

- Re-add the bot to the group
- It will automatically re-register
- Previous notifications will still be in the database

## Security Best Practices 🔒

1. **Never commit secrets to Git**
   - Use environment variables
   - Keep .env in .gitignore

2. **Use strong webhook secrets**
   - Generate random string: `openssl rand -hex 32`

3. **Restrict bot admin commands**
   - Only allow specific user IDs to use `/broadcast`
   - Verify user emails against ADMIN_EMAILS list

4. **Monitor bot activity**
   - Check logs regularly
   - Set up alerts for failed notifications

5. **Keep dependencies updated**
   ```bash
   pip install --upgrade -r requirements.txt
   ```

## Database Schema 💾

### telegram_groups
- Stores information about groups where bot is a member
- Tracks join date, member count, activity

### telegram_notifications
- Logs all sent notifications
- Tracks delivery status
- Links to tasks for analytics

### telegram_broadcasts
- Records all broadcast messages
- Tracks success/failure rates
- Audit trail for admin messages

## API Endpoints 🌐

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/health` | GET | Health check |
| `/webhook/task-created` | POST | New task notification |
| `/webhook/task-updated` | POST | Task update notification |
| `/webhook/task-completed` | POST | Task completion notification |
| `/webhook/comment-added` | POST | New comment notification |
| `/webhook/deadline-reminder` | POST | Check and send deadline reminders |
| `/webhook/broadcast` | POST | Send broadcast message |

## Advanced Features (Future Enhancements) 🚀

- [ ] Inline keyboard buttons for quick actions
- [ ] Personal DM notifications for assigned tasks
- [ ] Task creation via Telegram commands
- [ ] Voice message transcription for comments
- [ ] Daily/weekly digest summaries
- [ ] Integration with calendar apps
- [ ] Analytics dashboard in bot
- [ ] Multi-language support

## Support & Contact 💬

For issues or questions:
1. Check this README
2. Review bot logs
3. Test with `/status` command
4. Contact team admin

## License

Private - UmraGO Team Use Only

---

Built with ❤️ for the UmraGO Team
