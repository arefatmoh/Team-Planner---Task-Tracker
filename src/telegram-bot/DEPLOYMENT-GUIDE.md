# UmraGO Telegram Bot - Complete Deployment Guide 🚀

This guide will walk you through deploying the complete Telegram bot system from start to finish.

## Overview

You'll be deploying:
1. **Supabase Database** - Updated schema with bot tables
2. **Telegram Bot** - Python bot running 24/7
3. **Webhook API** - Flask API for handling notifications
4. **Frontend Integration** - Connecting your web app to send notifications

---

## Step 1: Update Supabase Database Schema

### 1.1 Run SQL Scripts

1. Log into your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **SQL Editor**
4. Create a new query and run `/telegram-bot-schema.sql`
5. Then run `/supabase-schema.sql` (if not done already)

### 1.2 Verify Tables Created

Check that these tables exist:
- ✅ `telegram_groups`
- ✅ `telegram_notifications`
- ✅ `telegram_broadcasts`
- ✅ `settings`
- ✅ `user_preferences`

### 1.3 Verify RLS Policies

Go to **Authentication → Policies** and verify delete policies exist for `tasks` and `comments` tables.

---

## Step 2: Create Your Telegram Bot

### 2.1 Talk to BotFather

1. Open Telegram and search for `@BotFather`
2. Send `/newbot`
3. Enter bot name: `UmraGO Assistant`
4. Enter username: `umrago_assistant_bot` (or any available name)
5. **Save the bot token** - looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`

### 2.2 Configure Bot Settings

Send these commands to @BotFather:

```
/setdescription
```
Select your bot, then paste:
```
Real-time task notifications for UmraGO Team Planner. Get notified about new tasks, updates, comments, and deadlines.
```

```
/setabouttext
```
Select your bot, then paste:
```
UmraGO Assistant helps your team stay updated with task notifications and enables admin broadcasting.
```

```
/setcommands
```
Select your bot, then paste:
```
start - Initialize bot and register group
help - Show available commands
status - Check bot and group status
groups - List all connected groups
broadcast - Send message to all groups
```

### 2.3 Enable Group Privacy (Important!)

```
/setprivacy
```
Select your bot, then choose **Disable** so the bot can read group messages.

---

## Step 3: Deploy Webhook API

We'll use **Railway.app** (recommended) or **Render.com**

### Option A: Railway.app (Recommended)

#### 3.1 Prepare Your Repository

1. Make sure all your code is pushed to GitHub/GitLab
2. Ensure `telegram-bot/` folder is in your repo

#### 3.2 Deploy to Railway

1. Go to [railway.app](https://railway.app)
2. Click **New Project** → **Deploy from GitHub repo**
3. Select your repository
4. Railway will auto-detect Python

#### 3.3 Configure Build Settings

1. In your Railway project settings:
   - **Root Directory**: `telegram-bot`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python webhook_api.py`

#### 3.4 Add Environment Variables

Go to **Variables** tab and add:

```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WEBHOOK_SECRET=generate-a-random-secret-here
PORT=5000
```

**To generate WEBHOOK_SECRET**, run in terminal:
```bash
openssl rand -hex 32
```

#### 3.5 Deploy

1. Click **Deploy**
2. Wait for deployment to complete
3. Note your Railway URL: `https://your-app.railway.app`

#### 3.6 Test Webhook API

```bash
curl https://your-app.railway.app/health
```

Should return:
```json
{
  "status": "ok",
  "timestamp": "2025-11-19T...",
  "service": "UmraGO Telegram Webhook API"
}
```

### Option B: Render.com

1. Go to [render.com](https://render.com)
2. Click **New** → **Web Service**
3. Connect your repository
4. Configure:
   - **Name**: umrago-webhook-api
   - **Root Directory**: `telegram-bot`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `python webhook_api.py`
5. Add same environment variables as Railway
6. Click **Create Web Service**
7. Note your Render URL: `https://umrago-webhook-api.onrender.com`

---

## Step 4: Run Telegram Bot

You have several options for running the bot:

### Option A: Run on Railway (Same as Webhook API)

#### 4.1 Create Second Railway Service

1. In Railway, click **New** in your project
2. Select **Empty Service**
3. Name it `telegram-bot`

#### 4.2 Configure

- **Root Directory**: `telegram-bot`
- **Build Command**: `pip install -r requirements.txt`
- **Start Command**: `python umrago_bot.py`

#### 4.3 Add Environment Variables

Same as webhook API:
```env
TELEGRAM_BOT_TOKEN=your_bot_token
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_key
```

#### 4.4 Deploy

The bot will now run 24/7 on Railway!

### Option B: Run on Your Own Server

#### 4.1 Server Requirements

- Ubuntu/Debian Linux
- Python 3.9+
- SSH access

#### 4.2 Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Python and pip
sudo apt install python3 python3-pip python3-venv git -y

# Clone your repository
cd ~
git clone your-repo-url
cd your-repo/telegram-bot
```

#### 4.3 Setup Environment

```bash
# Create virtual environment
python3 -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp .env.example .env
nano .env
```

Fill in your values:
```env
TELEGRAM_BOT_TOKEN=your_bot_token_here
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_supabase_anon_key_here
```

#### 4.4 Test Bot

```bash
python umrago_bot.py
```

You should see:
```
🤖 UmraGO Assistant Bot is starting...
```

Press `Ctrl+C` to stop.

#### 4.5 Run Bot Permanently with PM2

```bash
# Install PM2
sudo npm install -g pm2

# Create PM2 ecosystem file
nano ecosystem.config.js
```

Paste:
```javascript
module.exports = {
  apps: [{
    name: 'umrago-bot',
    script: 'venv/bin/python',
    args: 'umrago_bot.py',
    cwd: '/home/your-user/your-repo/telegram-bot',
    env: {
      TELEGRAM_BOT_TOKEN: 'your_token_here',
      SUPABASE_URL: 'your_url_here',
      SUPABASE_ANON_KEY: 'your_key_here'
    }
  }]
}
```

```bash
# Start bot with PM2
pm2 start ecosystem.config.js

# Make it start on system boot
pm2 save
pm2 startup

# Check status
pm2 status
pm2 logs umrago-bot
```

### Option C: Run with Docker

```bash
# In telegram-bot folder
docker build -t umrago-bot .

# Run
docker run -d \
  --name umrago-bot \
  -e TELEGRAM_BOT_TOKEN=your_token \
  -e SUPABASE_URL=your_url \
  -e SUPABASE_ANON_KEY=your_key \
  --restart unless-stopped \
  umrago-bot

# Check logs
docker logs -f umrago-bot
```

---

## Step 5: Add Bot to Telegram Groups

### 5.1 Create/Use Existing Group

1. In Telegram, create your team group or use an existing one
2. Make sure the group is created (not just a chat)

### 5.2 Add Bot to Group

1. Click group name → **Add Members**
2. Search for `@umrago_assistant_bot` (or your bot username)
3. Add the bot
4. The bot will send a welcome message

### 5.3 Grant Admin Rights (Optional but Recommended)

1. Click group name → **Administrators**
2. Add your bot
3. Grant permissions:
   - ✅ Send Messages
   - ✅ Delete Messages (optional)

### 5.4 Test Bot

In the group, send:
```
/start
```

Bot should respond with welcome message.

Send:
```
/status
```

Should show group is registered.

---

## Step 6: Integrate with Web App

### 6.1 Add Environment Variables to Vercel

1. Go to your Vercel project settings
2. Navigate to **Environment Variables**
3. Add:

```
NEXT_PUBLIC_WEBHOOK_API_URL=https://your-app.railway.app
NEXT_PUBLIC_WEBHOOK_SECRET=your-webhook-secret
NEXT_PUBLIC_TELEGRAM_NOTIFICATIONS_ENABLED=true
```

### 6.2 Redeploy Frontend

```bash
# If you have automatic deployments, just push:
git add .
git commit -m "Add Telegram integration"
git push

# Or manually redeploy in Vercel dashboard
```

### 6.3 Test Integration

1. Open your web app: `https://team-planner-task-tracker.vercel.app/`
2. Create a new task
3. Check your Telegram group - you should see a notification!

---

## Step 7: Test Everything

### 7.1 Test Task Creation Notification

1. In web app, click **+** button
2. Create a task with:
   - Title: "Test Task"
   - Assigned to: Any team member
   - Deadline: Tomorrow
   - Priority: High
3. Click **Create Task**
4. **Check Telegram** - should see notification:

```
🆕 NEW TASK CREATED

📋 Title: Test Task
👤 Assigned to: [Member Name]
📅 Deadline: 2025-11-20
⚡ Priority: HIGH
✍️ Created by: [Your Name]

👉 View details: [link]
```

### 7.2 Test Comment Notification

1. Open the test task
2. Add a comment: "This is a test comment"
3. **Check Telegram** - should see:

```
💬 NEW COMMENT

📋 Task: Test Task
👤 From: [Your Name]
💭 Comment: This is a test comment

👉 View task: [link]
```

### 7.3 Test Task Completion

1. Mark the task as completed
2. **Check Telegram** - should see:

```
✅ TASK COMPLETED

📋 Task: Test Task
👤 Completed by: [Member Name]
🎉 Great job!

👉 View details: [link]
```

### 7.4 Test Broadcasting

In Telegram group, send:
```
/broadcast Team meeting in 30 minutes!
```

All groups with the bot should receive:
```
📢 BROADCAST MESSAGE
From: [Your Name]

Team meeting in 30 minutes!
```

---

## Step 8: Setup Deadline Reminders (Optional)

### Option A: Cron Job (Linux Server)

```bash
# Edit crontab
crontab -e

# Add this line (runs every 6 hours)
0 */6 * * * curl -X POST -H "X-Webhook-Secret: your_secret" https://your-app.railway.app/webhook/deadline-reminder
```

### Option B: GitHub Actions

Create `.github/workflows/deadline-reminders.yml`:

```yaml
name: Deadline Reminders

on:
  schedule:
    # Run every 6 hours
    - cron: '0 */6 * * *'
  workflow_dispatch:

jobs:
  send-reminders:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger Deadline Reminders
        run: |
          curl -X POST \
            -H "X-Webhook-Secret: ${{ secrets.WEBHOOK_SECRET }}" \
            https://your-app.railway.app/webhook/deadline-reminder
```

Add `WEBHOOK_SECRET` to your GitHub repository secrets.

### Option C: Vercel Cron (Recommended if using Vercel)

Create `pages/api/cron/deadline-reminders.ts`:

```typescript
import type { NextApiRequest, NextApiResponse } from 'next'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Verify this is a Vercel Cron request
  if (req.headers.authorization !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'Unauthorized' })
  }

  try {
    const response = await fetch(`${process.env.NEXT_PUBLIC_WEBHOOK_API_URL}/webhook/deadline-reminder`, {
      method: 'POST',
      headers: {
        'X-Webhook-Secret': process.env.NEXT_PUBLIC_WEBHOOK_SECRET || ''
      }
    })

    const data = await response.json()
    res.status(200).json(data)
  } catch (error) {
    res.status(500).json({ error: 'Failed to send reminders' })
  }
}
```

Add to `vercel.json`:
```json
{
  "crons": [{
    "path": "/api/cron/deadline-reminders",
    "schedule": "0 */6 * * *"
  }]
}
```

---

## Troubleshooting

### Bot Not Receiving Messages in Group

**Problem**: Bot doesn't respond to commands
**Solution**:
1. Make sure bot is added to group
2. Check bot privacy settings with @BotFather (`/setprivacy` → Disable)
3. Verify bot is running: `pm2 status` or check Railway logs

### Notifications Not Sending

**Problem**: No Telegram messages when creating tasks
**Solution**:
1. Check webhook API is running: `curl https://your-app.railway.app/health`
2. Verify environment variables in Vercel
3. Check browser console for errors
4. Test manually:
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -H "X-Webhook-Secret: your_secret" \
  -d '{"record": {"id": "test", "title": "Test Task", "assigned_to": "Test User", "deadline": "2025-11-30", "priority": "medium", "created_by": "Admin"}}' \
  https://your-app.railway.app/webhook/task-created
```

### Delete Not Working

**Problem**: Tasks show "deleted successfully" but still appear
**Solution**:
1. Run the updated SQL schema: `/supabase-schema.sql` (includes RLS policies)
2. Verify RLS policies in Supabase Dashboard
3. Check browser console for errors

### Webhook API Crashes

**Problem**: Railway app keeps restarting
**Solution**:
1. Check logs: Railway Dashboard → Deployments → Logs
2. Verify all environment variables are set
3. Check Python version (should be 3.9+)
4. Test locally first

---

## Monitoring & Maintenance

### Check Bot Status

```bash
# SSH into server
pm2 status

# View logs
pm2 logs umrago-bot --lines 100

# Restart if needed
pm2 restart umrago-bot
```

### Check Webhook API

```bash
# Test health
curl https://your-app.railway.app/health

# Check Railway logs
# Go to Railway Dashboard → Your App → Deployments → View Logs
```

### View Notification History

```sql
-- In Supabase SQL Editor
SELECT * FROM telegram_notifications
ORDER BY sent_at DESC
LIMIT 50;

-- View broadcasts
SELECT * FROM telegram_broadcasts
ORDER BY created_at DESC;

-- View connected groups
SELECT * FROM telegram_groups
WHERE is_active = true;
```

---

## Security Checklist

- ✅ Never commit `.env` files to Git
- ✅ Use strong `WEBHOOK_SECRET` (32+ characters, random)
- ✅ Keep bot token private
- ✅ Restrict broadcast commands to admins only
- ✅ Enable HTTPS for webhook API
- ✅ Regularly update dependencies: `pip install --upgrade -r requirements.txt`
- ✅ Monitor bot logs for suspicious activity
- ✅ Keep Supabase anon key and URL private (but they can be public-facing)

---

## Next Steps

Once everything is working:

1. **Add more team groups**: Repeat Step 5 for each team group
2. **Customize notifications**: Edit messages in `webhook_api.py`
3. **Add more bot commands**: Extend `umrago_bot.py`
4. **Setup analytics**: Query `telegram_notifications` table for insights
5. **Create admin dashboard**: Build a web interface for managing broadcasts

---

## Support

For issues:
1. Check this guide
2. Review logs (PM2, Railway, or Docker)
3. Test each component separately
4. Check Supabase database tables
5. Verify all environment variables

---

**Congratulations! 🎉**

Your UmraGO Telegram Bot is now fully deployed and integrated with your team planner!

Your team will now receive real-time notifications for all task activities directly in Telegram.

---

*Last updated: November 19, 2025*
