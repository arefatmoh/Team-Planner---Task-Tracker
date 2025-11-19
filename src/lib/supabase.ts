import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ccppxhsojzganujfucre.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNjcHB4aHNvanpnYW51amZ1Y3JlIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM1NDIwNzQsImV4cCI6MjA3OTExODA3NH0.bpXXiNdzv5FnVXufWApumNFB9DlqX5pw3kX5bejOgX8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      tasks: {
        Row: {
          id: string
          title: string
          description: string
          assigned_to: string
          assigned_to_email: string
          deadline: string
          priority: 'low' | 'medium' | 'high'
          status: 'pending' | 'in-progress' | 'completed'
          created_by: string
          created_by_email: string
          created_at: string
          attachment_url: string | null
        }
        Insert: {
          id?: string
          title: string
          description: string
          assigned_to: string
          assigned_to_email: string
          deadline: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in-progress' | 'completed'
          created_by: string
          created_by_email: string
          created_at?: string
          attachment_url?: string | null
        }
        Update: {
          id?: string
          title?: string
          description?: string
          assigned_to?: string
          assigned_to_email?: string
          deadline?: string
          priority?: 'low' | 'medium' | 'high'
          status?: 'pending' | 'in-progress' | 'completed'
          created_by?: string
          created_by_email?: string
          created_at?: string
          attachment_url?: string | null
        }
      }
      comments: {
        Row: {
          id: string
          task_id: string
          user_name: string
          user_email: string
          comment_text: string
          created_at: string
        }
        Insert: {
          id?: string
          task_id: string
          user_name: string
          user_email: string
          comment_text: string
          created_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          user_name?: string
          user_email?: string
          comment_text?: string
          created_at?: string
        }
      }
    }
  }
}
