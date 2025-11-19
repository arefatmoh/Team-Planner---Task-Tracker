# Quick .env Setup Reference Card 🚀

## 📝 **What You Need to Fill**

### 1️⃣ **Frontend `.env` File** (Root Directory)

Create file: `.env` in project root

```env
VITE_WEBHOOK_API_URL=
VITE_WEBHOOK_SECRET=PASTE_YOUR_SECRET_HERE
VITE_TELEGRAM_NOTIFICATIONS_ENABLED=true
```

**Where to get `VITE_WEBHOOK_SECRET`:**
- Generate at: https://randomkeygen.com/ (use "CodeIgniter Encryption Keys")
- Or use: `a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6`

---

### 2️⃣ **Vercel Environment Variables** (5 Variables)

Go to: Vercel Dashboard > Your Project > Settings > Environment Variables

Add these 5 variables:

| Variable Name | Where to Get | Example Value |
|--------------|--------------|---------------|
| `TELEGRAM_BOT_TOKEN` | @BotFather on Telegram | `1234567890:ABCdef...` |
| `SUPABASE_URL` | Supabase Dashboard > Settings > API | `https://ccppxhsojzganujfucre.supabase.co` |
| `SUPABASE_ANON_KEY` | Same page (anon/public key) | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` |
| `WEBHOOK_SECRET` | **Same as VITE_WEBHOOK_SECRET** | `a1b2c3d4e5f6g7h8...` |
| `WEB_APP_URL` | Your Vercel URL after deployment | `https://your-project.vercel.app` |

---

## 🎯 **Quick Steps**

1. **Create `.env`** in root → Fill 3 values
2. **Get Telegram Bot Token** → Message @BotFather `/newbot`
3. **Add 5 variables to Vercel** → Dashboard > Settings > Environment Variables
4. **Redeploy** → Variables take effect after redeploy

---

## ✅ **Checklist**

- [ ] `.env` file created with 3 values
- [ ] Telegram bot token from @BotFather
- [ ] All 5 variables added to Vercel
- [ ] `WEBHOOK_SECRET` matches in both places
- [ ] Project redeployed

---

## 🔑 **Your Current Values** (From Your Code)

You already have these in your code, so you can copy them:

```env
SUPABASE_URL=https://ccppxhsojzganujfucre.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcHB4aHNvanpnYW51amZ1Y3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDIwNzQsImV4cCI6MjA3OTExODA3NH0.bpXXiNdzv5FnVXufWApumNFB9DlqX5pw3kX5bejOgX8
```

Just need to:
1. Get Telegram Bot Token (from @BotFather)
2. Generate a secret (for WEBHOOK_SECRET)
3. Get your Vercel URL (after first deployment)

---

**That's it!** See `ENV-FILES-COMPLETE-GUIDE.md` for detailed instructions.

