import { useState, useEffect, useRef } from 'react'
import { ArrowLeft, Send } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Textarea } from './ui/textarea'

interface Task {
  id: string
  title: string
}

interface Comment {
  id: string
  user_name: string
  user_email: string
  comment_text: string
  created_at: string
}

interface CommentPageProps {
  task: Task
  onBack: () => void
}

export function CommentPage({ task, onBack }: CommentPageProps) {
  const { user, userName } = useAuth()
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const commentsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadComments()

    // Subscribe to real-time comments
    const channel = supabase
      .channel(`comments-${task.id}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'comments',
        filter: `task_id=eq.${task.id}`,
      }, () => {
        loadComments()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [task.id])

  useEffect(() => {
    scrollToBottom()
  }, [comments])

  const scrollToBottom = () => {
    commentsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: true })

    if (data) setComments(data)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setLoading(true)
    try {
      const { error } = await supabase.from('comments').insert({
        task_id: task.id,
        user_name: userName,
        user_email: user?.email || '',
        comment_text: newComment.trim(),
      })

      if (error) throw error

      setNewComment('')
    } catch (error) {
      console.error('Error adding comment:', error)
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (diffInSeconds < 60) return 'just now'
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex-1 min-w-0">
              <h1 className="text-lg truncate" style={{ color: '#043c1c' }}>
                {task.title}
              </h1>
              <p className="text-sm text-gray-600">Comments</p>
            </div>
          </div>
        </div>
      </div>

      {/* Comments List */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          {comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
                <Send className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-gray-900 mb-2">No comments yet</h3>
              <p className="text-gray-600 text-sm">
                Start the conversation by adding a comment below
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {comments.map((comment, index) => {
                const isCurrentUser = comment.user_email === user?.email
                return (
                  <div
                    key={comment.id}
                    className={`flex ${isCurrentUser ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] ${
                        isCurrentUser
                          ? 'bg-gradient-to-br from-[#043c1c] to-[#065a2a]'
                          : 'bg-white border border-gray-200'
                      } rounded-2xl p-4 shadow-sm`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div
                          className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm`}
                          style={{ backgroundColor: isCurrentUser ? '#bc8822' : '#043c1c' }}
                        >
                          {comment.user_name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p
                            className={`text-sm ${
                              isCurrentUser ? 'text-white/90' : 'text-gray-900'
                            }`}
                          >
                            {comment.user_name}
                          </p>
                          <p
                            className={`text-xs ${
                              isCurrentUser ? 'text-white/70' : 'text-gray-500'
                            }`}
                          >
                            {formatTime(comment.created_at)}
                          </p>
                        </div>
                      </div>
                      <p
                        className={`${
                          isCurrentUser ? 'text-white' : 'text-gray-800'
                        } whitespace-pre-wrap`}
                      >
                        {comment.comment_text}
                      </p>
                    </div>
                  </div>
                )
              })}
              <div ref={commentsEndRef} />
            </div>
          )}
        </div>
      </div>

      {/* Comment Input */}
      <div className="sticky bottom-0 bg-white border-t shadow-lg">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-3">
            <Textarea
              placeholder="Write a comment..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="flex-1 resize-none min-h-[44px] max-h-[120px]"
              rows={1}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSubmit(e)
                }
              }}
            />
            <Button
              type="submit"
              disabled={!newComment.trim() || loading}
              className="h-11 px-6 text-white"
              style={{ backgroundColor: '#bc8822' }}
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  )
}
