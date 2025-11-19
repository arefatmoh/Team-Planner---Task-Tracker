-- SQL Schema for Telegram Bot Integration
-- Run these commands in your Supabase SQL Editor

-- Table for storing Telegram groups where the bot is a member
CREATE TABLE IF NOT EXISTS telegram_groups (
  id BIGSERIAL PRIMARY KEY,
  chat_id TEXT UNIQUE NOT NULL,
  chat_title TEXT NOT NULL,
  chat_type TEXT NOT NULL, -- 'group', 'supergroup', 'channel'
  is_active BOOLEAN DEFAULT TRUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_message_at TIMESTAMP WITH TIME ZONE,
  member_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Table for storing bot notification logs
CREATE TABLE IF NOT EXISTS telegram_notifications (
  id BIGSERIAL PRIMARY KEY,
  notification_type TEXT NOT NULL, -- 'task_created', 'task_updated', 'task_completed', 'comment_added', 'deadline_reminder', 'broadcast'
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  chat_id TEXT NOT NULL,
  message_text TEXT NOT NULL,
  message_id TEXT,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'sent', -- 'sent', 'failed', 'pending'
  error_message TEXT
);

-- Table for storing bot broadcast messages
CREATE TABLE IF NOT EXISTS telegram_broadcasts (
  id BIGSERIAL PRIMARY KEY,
  message_text TEXT NOT NULL,
  sent_by_email TEXT NOT NULL,
  sent_by_name TEXT NOT NULL,
  total_groups INTEGER DEFAULT 0,
  successful_sends INTEGER DEFAULT 0,
  failed_sends INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT DEFAULT 'pending' -- 'pending', 'sending', 'completed', 'failed'
);

-- Enable Row Level Security
ALTER TABLE telegram_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE telegram_broadcasts ENABLE ROW LEVEL SECURITY;

-- Policies for telegram_groups table (all authenticated users can read)
CREATE POLICY "Authenticated users can read telegram groups" ON telegram_groups
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert telegram groups" ON telegram_groups
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update telegram groups" ON telegram_groups
  FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can delete telegram groups" ON telegram_groups
  FOR DELETE USING (auth.role() = 'authenticated');

-- Policies for telegram_notifications table
CREATE POLICY "Authenticated users can read notifications" ON telegram_notifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert notifications" ON telegram_notifications
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Policies for telegram_broadcasts table
CREATE POLICY "Authenticated users can read broadcasts" ON telegram_broadcasts
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can insert broadcasts" ON telegram_broadcasts
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can update broadcasts" ON telegram_broadcasts
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Create trigger for telegram_groups updated_at
CREATE TRIGGER update_telegram_groups_updated_at BEFORE UPDATE ON telegram_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_telegram_groups_chat_id ON telegram_groups(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_groups_is_active ON telegram_groups(is_active);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_task_id ON telegram_notifications(task_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_chat_id ON telegram_notifications(chat_id);
CREATE INDEX IF NOT EXISTS idx_telegram_notifications_sent_at ON telegram_notifications(sent_at);
CREATE INDEX IF NOT EXISTS idx_telegram_broadcasts_created_at ON telegram_broadcasts(created_at);
