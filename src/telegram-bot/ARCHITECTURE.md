# UmraGO Telegram Bot - System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         USER DEVICES                             │
│                                                                   │
│  ┌──────────────┐              ┌──────────────────┐             │
│  │   Mobile     │              │    Desktop       │             │
│  │   Browser    │              │    Browser       │             │
│  └──────┬───────┘              └────────┬─────────┘             │
│         │                               │                        │
│         └───────────────┬───────────────┘                        │
└─────────────────────────┼────────────────────────────────────────┘
                          │
                          │ HTTPS
                          ▼
         ┌─────────────────────────────────────┐
         │      Vercel (Frontend Host)         │
         │  team-planner-task-tracker.vercel   │
         │                                       │
         │  ┌───────────────────────────┐       │
         │  │   React Components        │       │
         │  │   - Dashboard             │       │
         │  │   - Add Task              │       │
         │  │   - Task Details          │       │
         │  └───────────┬───────────────┘       │
         │              │                        │
         │  ┌───────────▼───────────────┐       │
         │  │  telegram-notifications.ts│       │
         │  │  (Helper Functions)       │       │
         │  └───────────┬───────────────┘       │
         └──────────────┼─────────────────────────┘
                        │
                        │ REST API Calls
                        ▼
┌────────────────────────────────────────────────────────────────┐
│                    Supabase (Backend)                          │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │              PostgreSQL Database                  │          │
│  │                                                    │          │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐   │          │
│  │  │  tasks   │  │ comments │  │telegram_groups│   │          │
│  │  └──────────┘  └──────────┘  └──────────────┘   │          │
│  │                                                    │          │
│  │  ┌──────────────────────┐  ┌──────────────────┐ │          │
│  │  │telegram_notifications│  │telegram_broadcasts│ │          │
│  │  └──────────────────────┘  └──────────────────┘ │          │
│  │                                                    │          │
│  │  Row Level Security (RLS) Policies               │          │
│  │  - User authentication                           │          │
│  │  - Task ownership verification                   │          │
│  │  - Delete permissions                            │          │
│  └──────────────────────────────────────────────────┘          │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │              Realtime Subscriptions               │          │
│  │  - Task changes                                   │          │
│  │  - Comment updates                                │          │
│  │  - Live synchronization                           │          │
│  └──────────────────────────────────────────────────┘          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Database Queries
                         │
                         ▼
┌────────────────────────────────────────────────────────────────┐
│               Railway/Render (API Host)                        │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │         Webhook API (Flask/Python)                │          │
│  │                                                    │          │
│  │  Endpoints:                                       │          │
│  │  ├─ POST /webhook/task-created                   │          │
│  │  ├─ POST /webhook/task-updated                   │          │
│  │  ├─ POST /webhook/task-completed                 │          │
│  │  ├─ POST /webhook/comment-added                  │          │
│  │  ├─ POST /webhook/broadcast                      │          │
│  │  ├─ POST /webhook/deadline-reminder              │          │
│  │  └─ GET  /health                                  │          │
│  │                                                    │          │
│  │  Security:                                        │          │
│  │  - Webhook secret verification                   │          │
│  │  - CORS configuration                            │          │
│  │  - Request validation                            │          │
│  └──────────────────────┬───────────────────────────┘          │
└─────────────────────────┼──────────────────────────────────────┘
                          │
                          │ Telegram Bot API (HTTPS)
                          ▼
         ┌────────────────────────────────────────┐
         │  Telegram Bot (Python/python-telegram) │
         │                                          │
         │  ┌────────────────────────────────┐    │
         │  │    Command Handlers            │    │
         │  │    ├─ /start                   │    │
         │  │    ├─ /help                    │    │
         │  │    ├─ /status                  │    │
         │  │    ├─ /groups                  │    │
         │  │    └─ /broadcast               │    │
         │  └────────────────────────────────┘    │
         │                                          │
         │  ┌────────────────────────────────┐    │
         │  │    Features                    │    │
         │  │    - Group management          │    │
         │  │    - Message formatting        │    │
         │  │    - Error handling            │    │
         │  │    - Logging                   │    │
         │  └────────────────────────────────┘    │
         └──────────────┬─────────────────────────┘
                        │
                        │ Telegram Bot API
                        ▼
┌────────────────────────────────────────────────────────────────┐
│                    Telegram Servers                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────┐          │
│  │              Message Delivery                     │          │
│  │              - Instant push notifications         │          │
│  │              - Multi-device sync                  │          │
│  │              - Reliable delivery                  │          │
│  └──────────────────────────────────────────────────┘          │
└────────────────────────┬─────────────────────────────────────────┘
                         │
                         │ Push Notifications
                         ▼
         ┌─────────────────────────────────────┐
         │      Team Telegram Groups           │
         │                                       │
         │  Group 1: Main Team                  │
         │  Group 2: Developers                 │
         │  Group 3: Management                 │
         │  ...                                  │
         │                                       │
         │  Team Members:                        │
         │  - Arefat                            │
         │  - Mekin                             │
         │  - Suad                              │
         │  - Ramadan                           │
         └───────────────────────────────────────┘
```

## Data Flow Diagrams

### Task Creation Flow

```
User                Frontend           Supabase         Webhook API      Telegram Bot    Telegram
 │                     │                   │                 │                │            │
 │  1. Create Task    │                   │                 │                │            │
 │───────────────────>│                   │                 │                │            │
 │                     │                   │                 │                │            │
 │                     │  2. Save Task    │                 │                │            │
 │                     │─────────────────>│                 │                │            │
 │                     │                   │                 │                │            │
 │                     │  3. Task Created │                 │                │            │
 │                     │<─────────────────│                 │                │            │
 │                     │                   │                 │                │            │
 │                     │  4. Send Notification               │                │            │
 │                     │────────────────────────────────────>│                │            │
 │                     │                   │                 │                │            │
 │                     │                   │  5. Get Groups  │                │            │
 │                     │                   │<────────────────│                │            │
 │                     │                   │                 │                │            │
 │                     │                   │  6. Group List  │                │            │
 │                     │                   │────────────────>│                │            │
 │                     │                   │                 │                │            │
 │                     │                   │                 │  7. Send Msg  │            │
 │                     │                   │                 │──────────────>│            │
 │                     │                   │                 │                │            │
 │                     │                   │                 │                │ 8. Deliver │
 │                     │                   │                 │                │───────────>│
 │                     │                   │                 │                │            │
 │                     │                   │                 │  9. Log        │            │
 │                     │                   │<────────────────│                │            │
 │                     │                   │                 │                │            │
 │  10. Success       │                   │                 │                │            │
 │<───────────────────│                   │                 │                │            │
```

### Comment Notification Flow

```
User                Frontend           Supabase         Webhook API      Groups
 │                     │                   │                 │              │
 │  1. Add Comment    │                   │                 │              │
 │───────────────────>│                   │                 │              │
 │                     │                   │                 │              │
 │                     │  2. Insert        │                 │              │
 │                     │─────────────────>│                 │              │
 │                     │                   │                 │              │
 │                     │  3. Success       │                 │              │
 │                     │<─────────────────│                 │              │
 │                     │                   │                 │              │
 │                     │  4. Notify API    │                 │              │
 │                     │────────────────────────────────────>│              │
 │                     │                   │                 │              │
 │                     │                   │  5. Get Task    │              │
 │                     │                   │<────────────────│              │
 │                     │                   │                 │              │
 │                     │                   │  6. Task Data   │              │
 │                     │                   │────────────────>│              │
 │                     │                   │                 │              │
 │                     │                   │                 │  7. Format & Send
 │                     │                   │                 │─────────────>│
 │                     │                   │                 │              │
 │  8. Comment Added  │                   │                 │              │
 │<───────────────────│                   │                 │              │
```

### Broadcast Flow

```
Admin               Bot                Supabase         Webhook API      Groups
 │                    │                    │                 │              │
 │  /broadcast msg    │                    │                 │              │
 │───────────────────>│                    │                 │              │
 │                    │                    │                 │              │
 │                    │  Get active groups │                 │              │
 │                    │───────────────────>│                 │              │
 │                    │                    │                 │              │
 │                    │  Groups list       │                 │              │
 │                    │<───────────────────│                 │              │
 │                    │                    │                 │              │
 │                    │  Create broadcast  │                 │              │
 │                    │───────────────────>│                 │              │
 │                    │                    │                 │              │
 │                    │  For each group:                     │              │
 │                    │  Send message      │                 │              │
 │                    │────────────────────────────────────────────────────>│
 │                    │                    │                 │              │
 │                    │  Update stats      │                 │              │
 │                    │───────────────────>│                 │              │
 │                    │                    │                 │              │
 │  Success stats     │                    │                 │              │
 │<───────────────────│                    │                 │              │
```

## Component Architecture

### Frontend (React/Next.js)
```
┌────────────────────────────────────┐
│        Pages/Components             │
├────────────────────────────────────┤
│  App.tsx                            │
│  ├─ Dashboard                       │
│  ├─ AddTaskPage                     │
│  ├─ TaskDetailsPage                 │
│  ├─ AnalyticsPage                   │
│  └─ CommentPage                     │
├────────────────────────────────────┤
│        Helper Libraries              │
├────────────────────────────────────┤
│  /lib/                               │
│  ├─ supabase.ts                     │
│  ├─ auth-context.tsx                │
│  └─ telegram-notifications.ts       │
│      ├─ notifyTaskCreated()         │
│      ├─ notifyCommentAdded()        │
│      ├─ notifyTaskCompleted()       │
│      └─ sendBroadcast()             │
└────────────────────────────────────┘
```

### Backend (Python)
```
┌────────────────────────────────────┐
│        Telegram Bot                 │
├────────────────────────────────────┤
│  umrago_bot.py                      │
│  ├─ UmraGOBot class                 │
│  │  ├─ start()                      │
│  │  ├─ help_command()               │
│  │  ├─ status_command()             │
│  │  ├─ groups_command()             │
│  │  ├─ broadcast_command()          │
│  │  └─ register_group()             │
│  └─ Event handlers                  │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│        Webhook API                  │
├────────────────────────────────────┤
│  webhook_api.py                     │
│  ├─ Flask app                       │
│  ├─ Routes:                         │
│  │  ├─ /health                      │
│  │  ├─ /webhook/task-created        │
│  │  ├─ /webhook/task-updated        │
│  │  ├─ /webhook/task-completed      │
│  │  ├─ /webhook/comment-added       │
│  │  ├─ /webhook/broadcast           │
│  │  └─ /webhook/deadline-reminder   │
│  └─ Helper functions                │
│     ├─ send_telegram_message()      │
│     ├─ get_active_groups()          │
│     └─ log_notification()           │
└────────────────────────────────────┘
```

### Database Schema
```
┌────────────────────────────────────┐
│        Core Tables                  │
├────────────────────────────────────┤
│  tasks                               │
│  ├─ id (uuid)                       │
│  ├─ title                           │
│  ├─ description                     │
│  ├─ assigned_to                     │
│  ├─ deadline                        │
│  ├─ priority                        │
│  ├─ status                          │
│  ├─ created_by                      │
│  └─ completed_at ✨ NEW             │
├────────────────────────────────────┤
│  comments                            │
│  ├─ id (uuid)                       │
│  ├─ task_id                         │
│  ├─ user_name                       │
│  ├─ comment_text                    │
│  └─ created_at                      │
└────────────────────────────────────┘

┌────────────────────────────────────┐
│    Telegram Bot Tables ✨ NEW      │
├────────────────────────────────────┤
│  telegram_groups                    │
│  ├─ id                              │
│  ├─ chat_id (unique)                │
│  ├─ chat_title                      │
│  ├─ chat_type                       │
│  ├─ is_active                       │
│  ├─ joined_at                       │
│  └─ member_count                    │
├────────────────────────────────────┤
│  telegram_notifications             │
│  ├─ id                              │
│  ├─ notification_type               │
│  ├─ task_id                         │
│  ├─ chat_id                         │
│  ├─ message_text                    │
│  ├─ status                          │
│  └─ sent_at                         │
├────────────────────────────────────┤
│  telegram_broadcasts                │
│  ├─ id                              │
│  ├─ message_text                    │
│  ├─ sent_by_name                    │
│  ├─ total_groups                    │
│  ├─ successful_sends                │
│  ├─ failed_sends                    │
│  └─ created_at                      │
└────────────────────────────────────┘
```

## Deployment Architecture

### Production Setup

```
┌──────────────────────────────────────────────────────────────┐
│                      Client Side                              │
│  ┌────────────────┐           ┌────────────────┐            │
│  │ Mobile Devices │           │ Desktop Browser │            │
│  └────────┬───────┘           └────────┬───────┘            │
└───────────┼──────────────────────────┼──────────────────────┘
            │                            │
            │         HTTPS/TLS          │
            └────────────┬───────────────┘
                         │
            ┌────────────▼───────────────┐
            │   Vercel CDN Edge Network  │
            │   - Global distribution    │
            │   - Automatic HTTPS        │
            │   - Serverless functions   │
            └────────────┬───────────────┘
                         │
     ┌───────────────────┼───────────────────┐
     │                   │                   │
     ▼                   ▼                   ▼
┌─────────┐      ┌──────────────┐     ┌─────────────┐
│Supabase │      │ Railway/Render│     │  Telegram   │
│Database │◄────►│  - Bot        │────►│   Servers   │
│         │      │  - Webhook API│     │             │
└─────────┘      └──────────────┘     └─────────────┘
```

### Scaling Considerations

```
Component            Current          Can Scale To
─────────────────────────────────────────────────────
Frontend (Vercel)    Free Tier        → Unlimited requests
Database (Supabase)  Free Tier        → 500GB, 50GB bandwidth
Bot (Railway)        $5/mo free       → Auto-scale to demand
Webhook API          $5/mo free       → Auto-scale to demand
Telegram Groups      4 team members   → Unlimited groups
Notifications        ~100/day         → 30 messages/second
```

## Security Architecture

```
┌────────────────────────────────────────────────────┐
│              Security Layers                        │
├────────────────────────────────────────────────────┤
│  Layer 1: Transport Security                        │
│  ├─ HTTPS/TLS for all connections                  │
│  ├─ Certificate validation                         │
│  └─ Encrypted data in transit                      │
├────────────────────────────────────────────────────┤
│  Layer 2: Authentication                            │
│  ├─ Supabase Auth (JWT tokens)                     │
│  ├─ Row Level Security (RLS)                       │
│  └─ Email-based user identification                │
├────────────────────────────────────────────────────┤
│  Layer 3: Authorization                             │
│  ├─ RLS policies for data access                   │
│  ├─ Task ownership verification                    │
│  ├─ Delete permissions check                       │
│  └─ Admin role validation                          │
├────────────────────────────────────────────────────┤
│  Layer 4: API Security                              │
│  ├─ Webhook secret verification                    │
│  ├─ CORS configuration                             │
│  ├─ Rate limiting (Telegram API)                   │
│  └─ Input validation                               │
├────────────────────────────────────────────────────┤
│  Layer 5: Data Security                             │
│  ├─ Environment variables for secrets              │
│  ├─ No secrets in code/logs                        │
│  ├─ Secure storage (Supabase encryption)           │
│  └─ Audit logging                                  │
└────────────────────────────────────────────────────┘
```

## Monitoring & Observability

```
┌────────────────────────────────────────────────────┐
│              Logging Points                         │
├────────────────────────────────────────────────────┤
│  Application Logs:                                  │
│  ├─ Railway/Render: Built-in log aggregation       │
│  ├─ Bot: Python logging to stdout                  │
│  ├─ API: Flask request/response logging            │
│  └─ Frontend: Browser console (development)        │
├────────────────────────────────────────────────────┤
│  Database Logs:                                     │
│  ├─ Supabase query logs                            │
│  ├─ RLS policy violations                          │
│  └─ Performance metrics                            │
├────────────────────────────────────────────────────┤
│  Notification Audit:                                │
│  ├─ telegram_notifications table                   │
│  ├─ Success/failure tracking                       │
│  ├─ Delivery timestamps                            │
│  └─ Error messages                                 │
└────────────────────────────────────────────────────┘
```

---

*Architecture Documentation - Last Updated: November 19, 2025*
