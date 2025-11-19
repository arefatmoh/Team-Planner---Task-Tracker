import { useState, useEffect } from 'react'
import { ArrowLeft, MessageCircle, Calendar, User, AlertCircle, Send } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/auth-context'
import { Button } from './ui/button'
import { Badge } from './ui/badge'
import { Checkbox } from './ui/checkbox'
import { Textarea } from './ui/textarea'
import { toast } from 'sonner@2.0.3'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'

interface Task {
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
  completed_at?: string | null
}

interface Comment {
  id: string
  user_name: string
  comment_text: string
  created_at: string
}

interface TaskDetailsPageProps {
  task: Task
  onBack: () => void
  onViewComments: (task: Task) => void
}

export function TaskDetailsPage({ task, onBack, onViewComments }: TaskDetailsPageProps) {
  const { user, userName } = useAuth()
  const [currentTask, setCurrentTask] = useState(task)
  const [comments, setComments] = useState<Comment[]>([])
  const [newComment, setNewComment] = useState('')
  const [loading, setLoading] = useState(false)
  const [sendingComment, setSendingComment] = useState(false)

  useEffect(() => {
    loadComments()

    // Subscribe to real-time updates
    const taskChannel = supabase
      .channel(`task-${task.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'tasks',
        filter: `id=eq.${task.id}`,
      }, (payload) => {
        setCurrentTask(payload.new as Task)
      })
      .subscribe()

    const commentsChannel = supabase
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
      supabase.removeChannel(taskChannel)
      supabase.removeChannel(commentsChannel)
    }
  }, [task.id])

  const loadComments = async () => {
    const { data } = await supabase
      .from('comments')
      .select('*')
      .eq('task_id', task.id)
      .order('created_at', { ascending: false })
      .limit(5)

    if (data) setComments(data)
  }

  const handleStatusChange = async (newStatus: string) => {
    setLoading(true)
    try {
      const updateData: any = { status: newStatus }
      
      // Add completed_at timestamp when marking as completed
      if (newStatus === 'completed') {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id)

      if (error) throw error
      
      toast.success('Task status updated')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update status')
    } finally {
      setLoading(false)
    }
  }

  const handleToggleComplete = async (checked: boolean) => {
    // Only allow assigned user to toggle completion
    if (user?.email !== currentTask.assigned_to_email) {
      return
    }

    setLoading(true)
    try {
      const newStatus = checked ? 'completed' : 'in-progress'
      const updateData: any = { status: newStatus }
      
      // Add completed_at timestamp when marking as completed
      if (checked) {
        updateData.completed_at = new Date().toISOString()
      } else {
        updateData.completed_at = null
      }
      
      const { error } = await supabase
        .from('tasks')
        .update(updateData)
        .eq('id', task.id)

      if (error) throw error
      
      // Update local state immediately for instant feedback
      setCurrentTask({ ...currentTask, status: newStatus })
      
      toast.success(checked ? 'Task marked as completed' : 'Task marked as incomplete')
    } catch (error) {
      console.error('Error updating status:', error)
      toast.error('Failed to update task')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newComment.trim()) return

    setSendingComment(true)
    try {
      const { error } = await supabase.from('comments').insert({
        task_id: task.id,
        user_name: userName,
        user_email: user?.email || '',
        comment_text: newComment.trim(),
      })

      if (error) throw error

      setNewComment('')
      toast.success('Comment added')
      
      // Reload comments to show the new one
      await loadComments()
    } catch (error) {
      console.error('Error adding comment:', error)
      toast.error('Failed to add comment')
    } finally {
      setSendingComment(false)
    }
  }

  const isAssignedToCurrentUser = user?.email === currentTask.assigned_to_email

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
    })
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-700 border-red-200'
      case 'medium':
        return 'bg-yellow-100 text-yellow-700 border-yellow-200'
      case 'low':
        return 'bg-green-100 text-green-700 border-green-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-700 border-green-200'
      case 'in-progress':
        return 'bg-blue-100 text-blue-700 border-blue-200'
      case 'pending':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
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
            <div className="flex-1">
              <h1 className="text-lg" style={{ color: '#043c1c' }}>Task Details</h1>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
        {/* Task Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          {/* Completion Checkbox - Only for assigned user */}
          {isAssignedToCurrentUser && (
            <div className="mb-4 pb-4 border-b border-gray-200">
              <div className="flex items-center gap-3">
                <Checkbox
                  id="task-complete"
                  checked={currentTask.status === 'completed'}
                  onCheckedChange={handleToggleComplete}
                  disabled={loading}
                  className="h-5 w-5"
                />
                <label
                  htmlFor="task-complete"
                  className="text-sm cursor-pointer select-none"
                  style={{ color: '#043c1c' }}
                >
                  Mark as {currentTask.status === 'completed' ? 'incomplete' : 'completed'}
                </label>
              </div>
            </div>
          )}

          <div className="flex items-start gap-3 mb-4">
            <div className="flex-1">
              <h2 
                className={`mb-3 ${currentTask.status === 'completed' ? 'line-through text-gray-500' : ''}`} 
                style={currentTask.status !== 'completed' ? { color: '#043c1c' } : undefined}
              >
                {currentTask.title}
              </h2>
              <div className="flex flex-wrap gap-2">
                <Badge className={getPriorityColor(currentTask.priority)}>
                  {currentTask.priority} priority
                </Badge>
                <Badge className={getStatusColor(currentTask.status)}>
                  {currentTask.status === 'in-progress' ? 'In Progress' : currentTask.status}
                </Badge>
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t">
            <div className="flex items-start gap-3">
              <User className="w-5 h-5 mt-0.5" style={{ color: '#bc8822' }} />
              <div>
                <p className="text-sm text-gray-600">Assigned to</p>
                <p className="text-gray-900">{currentTask.assigned_to}</p>
                <p className="text-sm text-gray-500">{currentTask.assigned_to_email}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <Calendar className="w-5 h-5 mt-0.5" style={{ color: '#bc8822' }} />
              <div>
                <p className="text-sm text-gray-600">Deadline</p>
                <p className="text-gray-900">{formatDate(currentTask.deadline)}</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 mt-0.5" style={{ color: '#bc8822' }} />
              <div className="flex-1">
                <p className="text-sm text-gray-600 mb-2">Status</p>
                <Select
                  value={currentTask.status}
                  onValueChange={handleStatusChange}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="in-progress">In Progress</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>

        {/* Description */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h3 className="mb-3" style={{ color: '#043c1c' }}>Description</h3>
          <p className="text-gray-700 whitespace-pre-wrap">{currentTask.description}</p>
        </div>

        {/* Comments Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 style={{ color: '#043c1c' }}>Comments</h3>
            {comments.length > 0 && (
              <Button
                onClick={() => onViewComments(currentTask)}
                variant="outline"
                size="sm"
                className="gap-2"
              >
                <MessageCircle className="w-4 h-4" />
                View All ({comments.length})
              </Button>
            )}
          </div>

          {/* Comment Input */}
          <form onSubmit={handleSubmitComment} className="mb-4">
            <div className="flex gap-2">
              <Textarea
                placeholder="Write a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                className="flex-1 resize-none min-h-[44px] max-h-[120px]"
                rows={1}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmitComment(e)
                  }
                }}
              />
              <Button
                type="submit"
                disabled={!newComment.trim() || sendingComment}
                className="h-11 px-4 text-white"
                style={{ backgroundColor: '#bc8822' }}
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </form>

          {/* Recent Comments */}
          {comments.length === 0 ? (
            <p className="text-gray-500 text-sm text-center py-4">
              No comments yet. Be the first to comment!
            </p>
          ) : (
            <div className="space-y-3">
              {comments.map((comment) => (
                <div key={comment.id} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-start gap-2 mb-1">
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs flex-shrink-0"
                      style={{ backgroundColor: '#bc8822' }}
                    >
                      {comment.user_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-baseline gap-2">
                        <p className="text-sm">{comment.user_name}</p>
                        <p className="text-xs text-gray-500">
                          {formatTime(comment.created_at)}
                        </p>
                      </div>
                      <p className="text-sm text-gray-700 mt-1">{comment.comment_text}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Created By Info */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <p className="text-sm text-gray-600">
            Created by <span className="text-gray-900">{currentTask.created_by}</span> on{' '}
            {formatDate(currentTask.created_at)} at {formatTime(currentTask.created_at)}
          </p>
        </div>
      </div>
    </div>
  )
}
