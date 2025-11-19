# Complete .env Files Guide 📝

This guide shows you **exactly** what to fill in your `.env` files for Vercel deployment.

---

## 🎯 **For Vercel Deployment (Recommended)**

Since you're deploying on Vercel, you need:

1. **Frontend `.env` file** (for local development)
2. **Vercel Environment Variables** (for production)

---

## 📁 **Step 1: Frontend `.env` File**

**Location:** Create `.env` in the **root directory** (same folder as `package.json`)

**File:** `.env`

```env
# Frontend Environment Variables (Vite)
# For Vercel deployment, you can leave VITE_WEBHOOK_API_URL empty
# or set it to your Vercel URL after deployment

# Option 1: Leave empty (will use relative paths - works for Vercel)
VITE_WEBHOOK_API_URL=

# Option 2: Set to your Vercel URL after deployment
# VITE_WEBHOOK_API_URL=https://your-project-name.vercel.app

# Webhook Secret - Generate a strong random string
# This must match the WEBHOOK_SECRET in Vercel environment variables
VITE_WEBHOOK_SECRET=your-secret-here-replace-this

# Enable Telegram notifications
VITE_TELEGRAM_NOTIFICATIONS_ENABLED=true
```

### How to Get Each Value:

#### 1. `VITE_WEBHOOK_API_URL`
- **For Vercel**: Leave empty `""` OR set to your Vercel URL after deployment
- **Example**: `https://team-planner-task-tracker.vercel.app`
- **After first deployment**: You'll get your Vercel URL, then you can update this

#### 2. `VITE_WEBHOOK_SECRET`
- **Generate a random string** (32+ characters recommended)
- **Options to generate**:
  - Online: https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")
  - Command line: `openssl rand -hex 32`
  - Or use: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`
- **Important**: This must match `WEBHOOK_SECRET` in Vercel!

#### 3. `VITE_TELEGRAM_NOTIFICATIONS_ENABLED`
- Set to `true` to enable, `false` to disable
- Simple on/off switch

---

## ☁️ **Step 2: Vercel Environment Variables**

**Location:** Vercel Dashboard > Your Project > Settings > Environment Variables

You need to add **5 environment variables** in Vercel:

### Variables to Add:

#### 1. `TELEGRAM_BOT_TOKEN`
**How to get:**
1. Open Telegram app
2. Search for `@BotFather`
3. Send `/newbot`
4. Follow instructions to create a bot
5. BotFather will give you a token like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`
6. Copy and paste it here

**Example:**
```
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
```

#### 2. `SUPABASE_URL`
**How to get:**
1. Go to https://supabase.com/dashboard
2. Select your project
3. Go to **Settings** > **API**
4. Copy the **Project URL**

**From your code, I can see yours is:**
```
SUPABASE_URL=https://ccppxhsojzganujfucre.supabase.co
```

#### 3. `SUPABASE_ANON_KEY`
**How to get:**
1. Same page (Settings > API)
2. Copy the **anon/public** key

**From your code, I can see yours is:**
```
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcHB4aHNvanpnYW51amZ1Y3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDIwNzQsImV4cCI6MjA3OTExODA3NH0.bpXXiNdzv5FnVXufWApumNFB9DlqX5pw3kX5bejOgX8
```

#### 4. `WEBHOOK_SECRET`
**Important**: This must be the **SAME** as `VITE_WEBHOOK_SECRET` in your frontend `.env` file!

- Use the same random string you generated for `VITE_WEBHOOK_SECRET`
- Example: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

#### 5. `WEB_APP_URL`
**Set to your Vercel deployment URL**

- After first deployment, you'll get a URL like: `https://team-planner-task-tracker.vercel.app`
- Or use your custom domain if you have one
- **Important**: Include `https://` and no trailing slash

**Example:**
```
WEB_APP_URL=https://team-planner-task-tracker.vercel.app
```

---

## 📋 **Complete Example**

### Frontend `.env` (Root Directory):
```env
VITE_WEBHOOK_API_URL=
VITE_WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
VITE_TELEGRAM_NOTIFICATIONS_ENABLED=true
```

### Vercel Environment Variables:
```
TELEGRAM_BOT_TOKEN=1234567890:ABCdefGHIjklMNOpqrsTUVwxyz
SUPABASE_URL=https://ccppxhsojzganujfucre.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcHB4aHNvanpnYW51amZ1Y3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDIwNzQsImV4cCI6MjA3OTExODA3NH0.bpXXiNdzv5FnVXufWApumNFB9DlqX5pw3kX5bejOgX8
WEBHOOK_SECRET=a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
WEB_APP_URL=https://team-planner-task-tracker.vercel.app
```

---

## 🚀 **Step-by-Step Setup**

### Step 1: Create Frontend `.env`
1. In your project root, create a file named `.env`
2. Copy the example above
3. Generate a random string for `VITE_WEBHOOK_SECRET`
4. Save the file

### Step 2: Get Telegram Bot Token
1. Open Telegram
2. Search `@BotFather`
3. Send `/newbot`
4. Follow instructions
5. Copy the token

### Step 3: Add Vercel Environment Variables
1. Go to https://vercel.com/dashboard
2. Select your project
3. Click **Settings** tab
4. Click **Environment Variables** in sidebar
5. Add each variable one by one:
   - Click **Add New**
   - Enter variable name
   - Enter variable value
   - Select **Production**, **Preview**, and **Development** (or just Production)
   - Click **Save**
6. Repeat for all 5 variables

### Step 4: Deploy
1. After adding all variables, **redeploy** your project
2. Vercel will use the new environment variables
3. Your bot should work!

---

## ✅ **Quick Checklist**

- [ ] Created `.env` file in root directory
- [ ] Generated `VITE_WEBHOOK_SECRET` (random string)
- [ ] Got `TELEGRAM_BOT_TOKEN` from @BotFather
- [ ] Added all 5 variables to Vercel dashboard
- [ ] Made sure `WEBHOOK_SECRET` matches `VITE_WEBHOOK_SECRET`
- [ ] Set `WEB_APP_URL` to your Vercel URL
- [ ] Redeployed project after adding variables

---

## 🔍 **How to Verify**

### Test 1: Check Environment Variables Loaded
1. Go to Vercel dashboard
2. Project > Settings > Environment Variables
3. Verify all 5 variables are there

### Test 2: Test Health Endpoint
After deployment, visit:
```
https://your-project.vercel.app/api/telegram-webhook/health
```

Should return:
```json
{"status": "ok", "service": "UmraGO Telegram Webhook API"}
```

### Test 3: Create a Task
1. Create a task in your app
2. Check Telegram group
3. Should receive notification!

---

## ⚠️ **Important Notes**

1. **Never commit `.env` files** - They're already in `.gitignore` ✅
2. **`WEBHOOK_SECRET` must match** in both frontend `.env` and Vercel
3. **After adding Vercel variables**, you must **redeploy** for them to take effect
4. **Telegram Bot Token** is secret - never share it publicly
5. **Supabase keys** are safe to expose (they're public keys)

---

## 🆘 **Troubleshooting**

### Variables not working?
- ✅ Make sure you **redeployed** after adding variables
- ✅ Check variable names are **exactly** correct (case-sensitive)
- ✅ Verify `WEBHOOK_SECRET` matches in both places

### Bot not sending messages?
- ✅ Check `TELEGRAM_BOT_TOKEN` is correct
- ✅ Make sure bot is added to Telegram group
- ✅ Send `/start` in Telegram group to register it
- ✅ Check Vercel function logs for errors

### Frontend can't connect?
- ✅ Check `VITE_WEBHOOK_SECRET` matches `WEBHOOK_SECRET` in Vercel
- ✅ Verify API endpoint is accessible
- ✅ Check browser console for errors

---

## 📝 **Summary**

**You need:**
1. ✅ **1 `.env` file** in root (for local dev)
2. ✅ **5 environment variables** in Vercel (for production)

**That's it!** Once you fill these in, your Telegram bot will work! 🎉

