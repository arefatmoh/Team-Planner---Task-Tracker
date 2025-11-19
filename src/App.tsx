import { useState, useEffect } from 'react'
import { AuthProvider, useAuth } from './lib/auth-context'
import { LoginPage } from './components/login-page'
import { Dashboard } from './components/dashboard'
import { AddTaskPage } from './components/add-task-page'
import { TaskDetailsPage } from './components/task-details-page'
import { CommentPage } from './components/comment-page'
import { WelcomePage } from './components/welcome-page'
import { AnalyticsPage } from './components/analytics-page'
import { Toaster } from 'sonner@2.0.3'

type Page = 'dashboard' | 'add-task' | 'task-details' | 'comments' | 'my-tasks' | 'analytics'

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
}

function AppContent() {
  const { user, loading } = useAuth()
  const [currentPage, setCurrentPage] = useState<Page>('dashboard')
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [showWelcome, setShowWelcome] = useState(false)
  const [welcomeChecked, setWelcomeChecked] = useState(false)

  // Check if user should see welcome page
  useEffect(() => {
    if (user && !welcomeChecked) {
      checkWelcomeStatus()
    }
  }, [user, welcomeChecked])

  const checkWelcomeStatus = async () => {
    try {
      // First check localStorage
      const hasSeenWelcome = localStorage.getItem('umrago_welcome_seen')
      if (hasSeenWelcome === 'true') {
        setShowWelcome(false)
        setWelcomeChecked(true)
        return
      }

      // If not in localStorage, check database
      const { supabase } = await import('./lib/supabase')
      const { data } = await supabase
        .from('user_preferences')
        .select('has_seen_welcome')
        .eq('user_email', user?.email)
        .single()

      if (data?.has_seen_welcome) {
        // Update localStorage for future
        localStorage.setItem('umrago_welcome_seen', 'true')
        setShowWelcome(false)
      } else {
        setShowWelcome(true)
      }
      setWelcomeChecked(true)
    } catch (error) {
      // If error (e.g., no record), show welcome
      setShowWelcome(true)
      setWelcomeChecked(true)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  // Show welcome page for first-time users
  if (showWelcome && welcomeChecked) {
    return <WelcomePage onComplete={() => setShowWelcome(false)} />
  }

  const handleViewTask = (task: Task) => {
    setSelectedTask(task)
    setCurrentPage('task-details')
  }

  const handleViewComments = (task: Task) => {
    setSelectedTask(task)
    setCurrentPage('comments')
  }

  if (currentPage === 'add-task') {
    return <AddTaskPage onBack={() => setCurrentPage('dashboard')} />
  }

  if (currentPage === 'analytics') {
    return <AnalyticsPage onBack={() => setCurrentPage('dashboard')} />
  }

  if (currentPage === 'task-details' && selectedTask) {
    return (
      <TaskDetailsPage
        task={selectedTask}
        onBack={() => setCurrentPage('dashboard')}
        onViewComments={handleViewComments}
      />
    )
  }

  if (currentPage === 'comments' && selectedTask) {
    return (
      <CommentPage
        task={selectedTask}
        onBack={() => setCurrentPage('task-details')}
      />
    )
  }

  if (currentPage === 'my-tasks') {
    return (
      <Dashboard
        onAddTask={() => setCurrentPage('add-task')}
        onViewTask={handleViewTask}
        showMyTasks={true}
      />
    )
  }

  return (
    <Dashboard
      onAddTask={() => setCurrentPage('add-task')}
      onViewTask={handleViewTask}
      onViewAnalytics={() => setCurrentPage('analytics')}
    />
  )
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
      <Toaster position="top-center" richColors richColors />
    </AuthProvider>
  )
}