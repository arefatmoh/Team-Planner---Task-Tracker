import { useState, useEffect } from 'react'
import { Plus, MessageCircle, User, LogOut, ClipboardList, Calendar, AlertCircle, BarChart3, Trash2 } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Avatar, AvatarFallback } from './ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu'
import { Badge } from './ui/badge'
import { CountdownBanner } from './countdown-banner'
import { toast } from 'sonner@2.0.3'

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
  comment_count?: number
}

interface DashboardProps {
  onAddTask: () => void
  onViewTask: (task: Task) => void
  showMyTasks?: boolean
  onViewAnalytics?: () => void
}

export function Dashboard({ onAddTask, onViewTask, showMyTasks = false, onViewAnalytics }: DashboardProps) {
  const { user, userName, signOut } = useAuth()
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadTasks()

    // Subscribe to real-time changes
    const tasksChannel = supabase
      .channel('tasks-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, () => {
        loadTasks()
      })
      .subscribe()

    const commentsChannel = supabase
      .channel('comments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'comments' }, () => {
        loadTasks()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(tasksChannel)
      supabase.removeChannel(commentsChannel)
    }
  }, [showMyTasks, user?.email])

  const loadTasks = async () => {
    try {
      let query = supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (showMyTasks && user?.email) {
        query = query.eq('assigned_to_email', user.email)
      }

      const { data, error } = await query

      if (error) throw error

      // Load comment counts for each task
      const tasksWithCounts = await Promise.all(
        (data || []).map(async (task) => {
          const { count } = await supabase
            .from('comments')
            .select('*', { count: 'exact', head: true })
            .eq('task_id', task.id)

          return { ...task, comment_count: count || 0 }
        })
      )

      setTasks(tasksWithCounts)
    } catch (error) {
      console.error('Error loading tasks:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteTask = async (e: React.MouseEvent, taskId: string) => {
    e.stopPropagation()

    try {
      // First, delete all comments associated with the task
      const { error: commentsError } = await supabase
        .from('comments')
        .delete()
        .eq('task_id', taskId)

      if (commentsError) {
        console.error('Error deleting comments:', commentsError)
        throw commentsError
      }
      
      // Then delete the task itself
      const { error: taskError, data } = await supabase
        .from('tasks')
        .delete()
        .eq('id', taskId)
        .select()

      if (taskError) {
        console.error('Error deleting task:', taskError)
        throw taskError
      }

      // Check if task was actually deleted
      if (!data || data.length === 0) {
        throw new Error('Task not found or could not be deleted')
      }

      toast.success('Task deleted successfully')
      
      // Remove task from local state immediately for instant feedback
      setTasks(prevTasks => prevTasks.filter(task => task.id !== taskId))
    } catch (error) {
      console.error('Error deleting task:', error)
      toast.error('Failed to delete task. Please try again.')
    }
  }

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000)

    if (seconds < 60) return 'just now'
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
    if (seconds < 604800) return `${Math.floor(seconds / 86400)}d ago`
    return date.toLocaleDateString()
  }

  const formatDeadline = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
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
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Countdown Banner */}
      <CountdownBanner />
      
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 style={{ color: '#043c1c' }}>
                {showMyTasks ? 'My Tasks' : 'Team Planner'}
              </h1>
              <p className="text-gray-600 text-sm">
                {showMyTasks ? 'Tasks assigned to you' : 'Add and Track Weekly Progress'}
              </p>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-10 w-10 rounded-full p-0">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback style={{ backgroundColor: '#bc8822', color: 'white' }}>
                      {userName.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <div className="px-2 py-2 border-b">
                  <p className="text-sm">{userName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                {onViewAnalytics && (
                  <DropdownMenuItem onClick={onViewAnalytics}>
                    <BarChart3 className="mr-2 h-4 w-4" />
                    Analytics
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem onClick={signOut} className="text-red-600">
                  <LogOut className="mr-2 h-4 w-4" />
                  Log Out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tasks List */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading tasks...</div>
          </div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <ClipboardList className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-gray-900 mb-2">No tasks yet</h3>
            <p className="text-gray-600 text-sm">
              {showMyTasks ? 'No tasks assigned to you yet' : 'Start by adding your first task'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 hover:shadow-md transition-shadow relative"
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 
                    onClick={() => onViewTask(task)}
                    className={`flex-1 pr-2 cursor-pointer ${task.status === 'completed' ? 'line-through text-gray-500' : ''}`} 
                    style={task.status !== 'completed' ? { color: '#043c1c' } : undefined}
                  >
                    {task.title}
                  </h3>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Badge className={getPriorityColor(task.priority)}>
                      {task.priority}
                    </Badge>
                    {user?.email === task.created_by_email && (
                      <button
                        onClick={(e) => handleDeleteTask(e, task.id)}
                        className="p-1.5 hover:bg-red-50 rounded-lg transition-colors z-10"
                        title="Delete task"
                        type="button"
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </button>
                    )}
                  </div>
                </div>

                <div onClick={() => onViewTask(task)} className="cursor-pointer">
                  <p className={`text-sm mb-3 line-clamp-2 ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-600'}`}>
                    {task.description}
                  </p>

                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <div className="flex items-center gap-1 text-gray-700">
                      <User className="w-4 h-4" style={{ color: '#bc8822' }} />
                      <span>Assigned to: {task.assigned_to}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3 text-sm">
                    <Calendar className="w-4 h-4" style={{ color: '#bc8822' }} />
                    <span className="text-gray-700">Deadline: {formatDeadline(task.deadline)}</span>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={getStatusColor(task.status)}>
                      {task.status === 'in-progress' ? 'In Progress' : task.status}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500">
                      Added by {task.created_by} • {getTimeAgo(task.created_at)}
                    </p>
                    <div className="flex items-center gap-1 text-gray-600">
                      <MessageCircle className="w-4 h-4" />
                      <span className="text-xs">{task.comment_count || 0}</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Add Button */}
      <Button
        onClick={onAddTask}
        className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-lg hover:shadow-xl transition-shadow"
        style={{ backgroundColor: '#bc8822' }}
      >
        <Plus className="h-6 w-6 text-white" />
      </Button>
    </div>
  )
}