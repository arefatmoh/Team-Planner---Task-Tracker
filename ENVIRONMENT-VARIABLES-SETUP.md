# Environment Variables Setup Guide 🔐

This guide explains where to set up all environment variables for your Telegram bot integration.

---

## 📁 **File Locations**

You need to create **2 separate `.env` files**:

1. **Root `.env`** - For the frontend (Vite/React)
2. **`src/telegram-bot/.env`** - For the Python Telegram bot

---

## 🎯 **Step 1: Frontend Environment Variables**

**Location:** Create `.env` in the **root directory** of your project

**File:** `.env` (copy from `.env.example`)

```bash
# Frontend Environment Variables (Vite)
VITE_WEBHOOK_API_URL=https://your-webhook-api.railway.app
VITE_WEBHOOK_SECRET=your-webhook-secret-here
VITE_TELEGRAM_NOTIFICATIONS_ENABLED=true
```

### How to get these values:

1. **`VITE_WEBHOOK_API_URL`**: 
   - This is the URL where you deploy your `webhook_api.py` (Railway, Render, Heroku, etc.)
   - Example: `https://umrago-webhook.railway.app`
   - ⚠️ **Important**: Don't include a trailing slash

2. **`VITE_WEBHOOK_SECRET`**: 
   - Generate a strong random string
   - **Must match** the `WEBHOOK_SECRET` in your bot's `.env` file
   - Generate with: `openssl rand -hex 32` or use an online generator

3. **`VITE_TELEGRAM_NOTIFICATIONS_ENABLED`**: 
   - Set to `true` to enable notifications, `false` to disable

---

## 🤖 **Step 2: Telegram Bot Environment Variables**

**Location:** Create `.env` in the **`src/telegram-bot/`** directory

**File:** `src/telegram-bot/.env` (copy from `src/telegram-bot/.env.example`)

```bash
# Telegram Bot Environment Variables
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
WEBHOOK_SECRET=your-webhook-secret-here
PORT=5000
```

### How to get these values:

1. **`TELEGRAM_BOT_TOKEN`**: 
   - Open Telegram and search for `@BotFather`
   - Send `/newbot` and follow instructions
   - BotFather will give you a token like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
   - ⚠️ **Keep this secret!** Never commit it to git.

2. **`SUPABASE_URL`**: 
   - Go to your Supabase project dashboard
   - Settings > API
   - Copy the "Project URL"
   - Example: `https://ccppxhsojzganujfucre.supabase.co`

3. **`SUPABASE_ANON_KEY`**: 
   - Same page (Settings > API)
   - Copy the "anon/public" key
   - This is safe to expose (it's the public key)

4. **`WEBHOOK_SECRET`**: 
   - **Must match** `VITE_WEBHOOK_SECRET` in your frontend `.env`
   - Use the same value you generated for the frontend

5. **`PORT`** (Optional): 
   - Default is 5000
   - Only change if deploying to a service that requires a specific port

---

## 🚀 **Quick Setup Commands**

### For Frontend:
```bash
# In the root directory
cp .env.example .env
# Then edit .env with your values
```

### For Telegram Bot:
```bash
# Navigate to telegram-bot directory
cd src/telegram-bot
cp .env.example .env
# Then edit .env with your values
```

---

## 🔒 **Security Notes**

1. ✅ **`.env` files are already in `.gitignore`** - they won't be committed
2. ✅ **Never commit** `.env` files to git
3. ✅ **Never share** your `TELEGRAM_BOT_TOKEN` publicly
4. ✅ Use strong, random strings for `WEBHOOK_SECRET`

---

## 📋 **Deployment Checklist**

### For Local Development:
- [ ] Created `.env` in root directory
- [ ] Created `src/telegram-bot/.env`
- [ ] Filled in all values
- [ ] Verified `WEBHOOK_SECRET` matches in both files

### For Production Deployment:

#### Frontend (Vercel):
- [ ] Go to Vercel project settings > Environment Variables
- [ ] Add all `VITE_*` variables from your `.env` file
- [ ] Redeploy after adding variables

#### Telegram Bot (Railway/Render/etc.):
- [ ] Go to your deployment platform's environment variables settings
- [ ] Add all variables from `src/telegram-bot/.env`
- [ ] Make sure `WEBHOOK_SECRET` matches frontend value
- [ ] Restart the service after adding variables

---

## 🧪 **Testing Your Setup**

### Test Frontend:
```bash
# Start dev server
npm run dev

# Check browser console - should see:
# "Telegram notification sent: {success: true}"
```

### Test Bot:
```bash
# In telegram-bot directory
cd src/telegram-bot
python webhook_api.py

# Should see:
# "Running on http://0.0.0.0:5000"
```

### Test Integration:
1. Create a task in your app
2. Check Telegram group - should receive notification
3. Check webhook API logs for any errors

---

## ❓ **Troubleshooting**

### Frontend can't connect to webhook API:
- ✅ Check `VITE_WEBHOOK_API_URL` is correct (no trailing slash)
- ✅ Check webhook API is running and accessible
- ✅ Check CORS is enabled in `webhook_api.py` (it is)

### Bot not receiving notifications:
- ✅ Verify `WEBHOOK_SECRET` matches in both `.env` files
- ✅ Check bot is added to Telegram groups
- ✅ Run `/start` command in Telegram group
- ✅ Check webhook API logs for errors

### Environment variables not loading:
- ✅ **Frontend**: Restart dev server after changing `.env`
- ✅ **Python**: Make sure you're using `python-dotenv` to load `.env` files
- ✅ Check file names are exactly `.env` (not `.env.txt`)

---

## 📝 **Example Values**

### Frontend `.env`:
```env
VITE_WEBHOOK_API_URL=https://umrago-webhook-production.up.railway.app
VITE_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
VITE_TELEGRAM_NOTIFICATIONS_ENABLED=true
```

### Bot `src/telegram-bot/.env`:
```env
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz-ExampleToken
SUPABASE_URL=https://ccppxhsojzganujfucre.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
PORT=5000
```

---

## ✅ **You're All Set!**

Once you've created both `.env` files with the correct values, your Telegram bot integration should work perfectly!

Need help? Check the deployment guides in `src/telegram-bot/DEPLOYMENT-GUIDE.md`

