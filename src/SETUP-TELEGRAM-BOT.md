# 🚀 UmraGO Telegram Bot - Quick Setup Guide

Welcome! This guide will help you set up the Telegram bot integration in **under 30 minutes**.

## ✅ What You'll Get

After setup, your team will receive **instant Telegram notifications** for:
- 🆕 New tasks created
- 💬 Comments added
- ✅ Tasks completed  
- 🔄 Task updates
- ⏰ Deadline reminders
- 📢 Admin broadcasts

## 📋 Prerequisites

Before starting, make sure you have:
- [x] A Telegram account
- [x] Your Supabase project already set up (you have this!)
- [x] Access to deploy apps (Railway/Render account OR your own server)
- [x] Basic command line knowledge (optional, GUI options available)

## 🎯 Quick Start (3 Steps)

### Step 1: Create Your Bot (5 minutes)

1. **Open Telegram** and search for `@BotFather`
2. Send `/newbot` and follow the prompts:
   - Name: `UmraGO Assistant`
   - Username: `umrago_assistant_bot` (or choose your own)
3. **Save the bot token** - it looks like:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
   ```
4. Configure bot (send to @BotFather):
   ```
   /setdescription
   ```
   Paste:
   ```
   Real-time task notifications for UmraGO Team Planner
   ```
   
   ```
   /setprivacy
   ```
   Select your bot → Choose **Disable**

✅ **Bot created!**

### Step 2: Update Database (3 minutes)

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Click **SQL Editor** (left sidebar)
4. Click **New Query**
5. Copy and paste the content of `/telegram-bot-schema.sql`
6. Click **Run**
7. Repeat with `/supabase-schema.sql` (for RLS fixes)

✅ **Database updated!**

### Step 3: Deploy (10-15 minutes)

#### Option A: Railway.app (Easiest, Recommended)

1. **Sign up** at [railway.app](https://railway.app)
2. **Deploy Webhook API:**
   - Click **New Project** → **Deploy from GitHub**
   - Select your repository
   - Set **Root Directory**: `telegram-bot`
   - Add variables:
     ```
     TELEGRAM_BOT_TOKEN=your_bot_token_here
     SUPABASE_URL=https://xxxxx.supabase.co
     SUPABASE_ANON_KEY=your_supabase_key
     WEBHOOK_SECRET=generate_random_32_chars
     PORT=5000
     ```
   - To generate `WEBHOOK_SECRET`:
     ```bash
     openssl rand -hex 32
     ```
   - Set **Start Command**: `python webhook_api.py`
   - Deploy
   - **Copy the Railway URL** (e.g., `https://your-app.railway.app`)

3. **Deploy Telegram Bot:**
   - In same Railway project, click **New** → **Empty Service**
   - Name it `telegram-bot`
   - Same **Root Directory**: `telegram-bot`
   - Add same environment variables (except PORT and WEBHOOK_SECRET)
   - Set **Start Command**: `python umrago_bot.py`
   - Deploy

4. **Update Frontend:**
   - Go to [Vercel Dashboard](https://vercel.com)
   - Select your project → **Settings** → **Environment Variables**
   - Add:
     ```
     NEXT_PUBLIC_WEBHOOK_API_URL=https://your-app.railway.app
     NEXT_PUBLIC_WEBHOOK_SECRET=same_secret_as_above
     NEXT_PUBLIC_TELEGRAM_NOTIFICATIONS_ENABLED=true
     ```
   - Redeploy (or push a commit to trigger auto-deploy)

✅ **Deployed!**

#### Option B: Docker (For Self-Hosting)

```bash
# Navigate to telegram-bot directory
cd telegram-bot

# Create .env file
cp .env.example .env
nano .env  # Fill in your values

# Build and run with Docker Compose
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

✅ **Running!**

## 🎉 Test It Out (5 minutes)

### 1. Add Bot to Telegram Group

1. Create a group in Telegram (or use existing)
2. Add members (Arefat, Mekin, Suad, Ramadan)
3. Add your bot: Click group name → **Add Members** → Search for your bot
4. In group, send:
   ```
   /start
   ```
   Bot should reply with welcome message!

### 2. Test Notifications

1. Open your web app: https://team-planner-task-tracker.vercel.app/
2. Click the **+** button
3. Create a test task:
   - Title: "Test Telegram Integration"
   - Assigned to: Anyone
   - Deadline: Tomorrow
   - Priority: High
4. Click **Create Task**

**Check your Telegram group** - you should see:
```
🆕 NEW TASK CREATED

📋 Title: Test Telegram Integration
👤 Assigned to: [Name]
📅 Deadline: 2025-11-20
⚡ Priority: HIGH
✍️ Created by: [Your Name]

👉 View details: [link]
```

### 3. Test Comments

1. Open the test task
2. Add a comment: "Testing notifications!"
3. **Check Telegram** - should see comment notification

### 4. Test Broadcast

In Telegram group, send:
```
/broadcast Team meeting in 30 minutes!
```

All groups should receive the broadcast!

## 🎊 Success!

Your Telegram bot is now **fully operational**! 

## 📚 Next Steps

- **Read Full Documentation**: `/telegram-bot/README.md`
- **Deployment Details**: `/telegram-bot/DEPLOYMENT-GUIDE.md`  
- **Quick Commands**: `/telegram-bot/QUICK-REFERENCE.md`
- **Complete Summary**: `/TELEGRAM-BOT-SUMMARY.md`

## 🔧 Troubleshooting

### Bot Not Responding

```bash
# Check if bot is running (Railway)
# Go to Railway Dashboard → Your Bot Service → Deployments → Logs

# If self-hosting:
docker-compose logs telegram-bot
# or
pm2 logs umrago-bot
```

### Notifications Not Sending

1. **Check webhook API is online:**
   ```bash
   curl https://your-app.railway.app/health
   ```

2. **Check environment variables** in Vercel
3. **View browser console** for errors (F12 → Console tab)

### Database Errors

1. Make sure you ran both SQL files
2. Check RLS policies exist:
   ```sql
   SELECT tablename, policyname 
   FROM pg_policies 
   WHERE tablename IN ('tasks', 'comments');
   ```

## 💡 Tips

- **Add bot to multiple groups** - it works with all of them!
- **Use `/status`** to check if group is registered
- **Use `/groups`** to see all connected groups
- **Customize messages** - edit `webhook_api.py`
- **Monitor logs** - Railway has built-in logging

## 🆘 Need Help?

1. Check the [QUICK-REFERENCE.md](/telegram-bot/QUICK-REFERENCE.md)
2. Review [DEPLOYMENT-GUIDE.md](/telegram-bot/DEPLOYMENT-GUIDE.md)
3. Check bot/API logs
4. Verify environment variables
5. Test each component separately

## 📊 What's Working Now

✅ Delete functionality fixed  
✅ Telegram bot created  
✅ Database schema updated  
✅ Webhook API deployed  
✅ Bot running 24/7  
✅ Frontend integrated  
✅ Multi-group support  
✅ Admin broadcasting  
✅ Notification logging  
✅ Real-time alerts  

## 🚀 Optional Features

Want to add more? You can:
- Set up deadline reminders (cron job)
- Create personal DM notifications
- Add inline buttons for quick actions
- Build analytics dashboard
- Customize notification templates

See [DEPLOYMENT-GUIDE.md](/telegram-bot/DEPLOYMENT-GUIDE.md) for details!

---

**Enjoy your new Telegram integration!** 🎉

Your team will love getting instant notifications without having to constantly check the website.

---

*Setup Guide - Last updated: November 19, 2025*
