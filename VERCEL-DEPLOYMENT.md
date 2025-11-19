# Deploying Everything on Vercel 🚀

Great news! You can deploy **both your website AND the Telegram bot webhook API** on Vercel! 

---

## ✅ **What Can Be Deployed on Vercel**

1. **Frontend (React/Vite)** ✅ - Already configured
2. **Telegram Webhook API** ✅ - Can be deployed as serverless functions
3. **Polling Bot (`umrago_bot.py`)** ❌ - Cannot run on Vercel (needs continuous running)

---

## 🤔 **Do You Need the Polling Bot?**

**Good news**: You probably **don't need** `umrago_bot.py` for basic functionality!

The polling bot (`umrago_bot.py`) is only needed if you want:
- Telegram commands like `/start`, `/help`, `/broadcast` from within Telegram
- Bot to automatically register groups when added

**For notifications only**, you only need the **webhook API**, which can run on Vercel!

---

## 🚀 **Deployment Steps**

### Step 1: Update Your Frontend `.env`

Your frontend `.env` should point to your Vercel deployment:

```env
# After deploying, this will be your Vercel URL
VITE_WEBHOOK_API_URL=https://your-project.vercel.app
VITE_WEBHOOK_SECRET=your-webhook-secret-here
VITE_TELEGRAM_NOTIFICATIONS_ENABLED=true
```

### Step 2: Set Environment Variables in Vercel

Go to your Vercel project settings > Environment Variables and add:

**For the Frontend:**
- `VITE_WEBHOOK_API_URL` = `https://your-project.vercel.app` (your Vercel URL)
- `VITE_WEBHOOK_SECRET` = (your secret)
- `VITE_TELEGRAM_NOTIFICATIONS_ENABLED` = `true`

**For the API Functions:**
- `TELEGRAM_BOT_TOKEN` = (from @BotFather)
- `SUPABASE_URL` = (your Supabase URL)
- `SUPABASE_ANON_KEY` = (your Supabase anon key)
- `WEBHOOK_SECRET` = (same as VITE_WEBHOOK_SECRET)
- `WEB_APP_URL` = `https://your-project.vercel.app`

### Step 3: Update Frontend Code

Update `src/lib/telegram-notifications.ts` to use the correct API paths:

The webhook API will be available at:
- `https://your-project.vercel.app/api/telegram-webhook/task-created`
- `https://your-project.vercel.app/api/telegram-webhook/comment-added`
- etc.

### Step 4: Deploy to Vercel

```bash
# Push to GitHub (if not already)
git add .
git commit -m "Add Vercel serverless functions for Telegram bot"
git push

# Deploy to Vercel
vercel --prod
```

Or connect your GitHub repo to Vercel for automatic deployments.

---

## 📁 **File Structure**

After setup, your project structure will be:

```
Team Planner & Task Tracker/
├── api/
│   ├── telegram-webhook.py    ← Serverless function (NEW)
│   └── requirements.txt        ← Python dependencies (NEW)
├── src/
│   ├── lib/
│   │   └── telegram-notifications.ts
│   └── ...
├── vercel.json                 ← Updated with Python runtime
├── .env                        ← Frontend env vars
└── package.json
```

---

## 🔧 **How It Works**

1. **Frontend** calls `notifyTaskCreated()` from `telegram-notifications.ts`
2. **Function** sends request to `/api/telegram-webhook/task-created`
3. **Vercel** routes to `api/telegram-webhook.py` serverless function
4. **Function** sends message to Telegram via Bot API
5. **Function** logs notification to Supabase

---

## ⚠️ **Important Notes**

### 1. API Endpoints

The serverless function will be available at:
- `https://your-project.vercel.app/api/telegram-webhook/task-created`
- `https://your-project.vercel.app/api/telegram-webhook/comment-added`
- `https://your-project.vercel.app/api/telegram-webhook/task-completed`
- `https://your-project.vercel.app/api/telegram-webhook/broadcast`
- `https://your-project.vercel.app/api/telegram-webhook/health`

### 2. Update Frontend Code

You need to update `src/lib/telegram-notifications.ts`:

```typescript
// Change from:
const WEBHOOK_API_URL = import.meta.env?.VITE_WEBHOOK_API_URL || 'https://your-webhook-api.railway.app'

// To:
const WEBHOOK_API_URL = import.meta.env?.VITE_WEBHOOK_API_URL || window.location.origin
```

Or keep it as a separate URL if you prefer.

### 3. Cold Starts

Vercel serverless functions have "cold starts" - the first request after inactivity may be slower (1-2 seconds). Subsequent requests are fast.

### 4. Function Timeout

Vercel free tier: 10 seconds max execution time
Vercel Pro: 60 seconds max execution time

This should be plenty for sending Telegram messages.

---

## 🎯 **What About the Polling Bot?**

If you want Telegram commands (`/start`, `/help`, `/broadcast`), you have two options:

### Option 1: Deploy Polling Bot Separately (Recommended)
- Use Railway, Render, or a VPS for `umrago_bot.py`
- This bot only needs to run when you want Telegram commands
- The webhook API handles all notifications

### Option 2: Use Telegram Webhooks Instead of Polling
- Configure Telegram to send webhooks to your Vercel function
- More complex setup, but everything stays on Vercel

**For most use cases, Option 1 is simpler** - you only need the polling bot if you want interactive Telegram commands.

---

## ✅ **Deployment Checklist**

- [ ] Created `api/telegram-webhook.py` ✅
- [ ] Created `api/requirements.txt` ✅
- [ ] Updated `vercel.json` ✅
- [ ] Set environment variables in Vercel dashboard
- [ ] Updated frontend `.env` file
- [ ] Updated `telegram-notifications.ts` to use correct API URL
- [ ] Deployed to Vercel
- [ ] Tested notification sending
- [ ] Verified Telegram messages are received

---

## 🧪 **Testing**

After deployment, test the health endpoint:

```bash
curl https://your-project.vercel.app/api/telegram-webhook/health
```

Should return:
```json
{"status": "ok", "service": "UmraGO Telegram Webhook API"}
```

---

## 🎉 **Benefits of Vercel Deployment**

✅ **Everything in one place** - Frontend + API on same domain  
✅ **No separate hosting** - No need for Railway/Render  
✅ **Automatic deployments** - Push to GitHub, auto-deploy  
✅ **Free tier available** - Great for development  
✅ **Fast CDN** - Global edge network  
✅ **Easy environment variables** - Set in dashboard  

---

## 📝 **Summary**

**Yes, you can deploy everything on Vercel!** 

- ✅ Frontend: Already working
- ✅ Webhook API: Now configured as serverless functions
- ❌ Polling Bot: Only needed if you want Telegram commands (deploy separately if needed)

The webhook API handles all your notification needs, and it works perfectly on Vercel!

