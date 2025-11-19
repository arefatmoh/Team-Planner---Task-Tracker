import { useState, useEffect } from 'react'
import { ArrowLeft, TrendingUp, CheckCircle, Target, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Card } from './ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

interface AnalyticsPageProps {
  onBack: () => void
}

interface Task {
  id: string
  title: string
  status: 'pending' | 'in-progress' | 'completed'
  deadline: string
  created_at: string
  completed_at?: string
  assigned_to: string
  assigned_to_email: string
}

interface TeamMemberStats {
  name: string
  email: string
  totalTasks: number
  completedTasks: number
  inProgressTasks: number
  onTimeTasks: number
  completionRate: number
}

const teamMembers = [
  { name: 'Arefat', email: 'arefat@umrago.com', icon: '💻' },
  { name: 'Mekin', email: 'mekin@umrago.com', icon: '👔' },
  { name: 'Suad', email: 'suad@umrago.com', icon: '📢' },
  { name: 'Ramadan', email: 'ramadan@umrago.com', icon: '🎨' }
]

export function AnalyticsPage({ onBack }: AnalyticsPageProps) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [teamStats, setTeamStats] = useState<TeamMemberStats[]>([])
  const [completionData, setCompletionData] = useState<any[]>([])

  useEffect(() => {
    loadAnalytics()
  }, [])

  const loadAnalytics = async () => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error

      setTasks(data || [])
      processTeamStats(data || [])
      processCompletionData(data || [])
    } catch (error) {
      console.error('Error loading analytics:', error)
    } finally {
      setLoading(false)
    }
  }

  const processTeamStats = (tasksData: Task[]) => {
    const stats = teamMembers.map(member => {
      const memberTasks = tasksData.filter(task => task.assigned_to_email === member.email)
      const completedTasks = memberTasks.filter(task => task.status === 'completed')
      const inProgressTasks = memberTasks.filter(task => task.status === 'in-progress')
      
      // Calculate on-time tasks
      let onTimeTasks = 0
      completedTasks.forEach(task => {
        if (task.completed_at && task.deadline) {
          const completedDate = new Date(task.completed_at)
          const deadlineDate = new Date(task.deadline)
          if (completedDate <= deadlineDate) {
            onTimeTasks++
          }
        }
      })

      const completionRate = memberTasks.length > 0 
        ? Math.round((completedTasks.length / memberTasks.length) * 100) 
        : 0

      return {
        name: member.name,
        email: member.email,
        totalTasks: memberTasks.length,
        completedTasks: completedTasks.length,
        inProgressTasks: inProgressTasks.length,
        onTimeTasks,
        completionRate
      }
    })

    setTeamStats(stats)
  }

  const processCompletionData = (tasksData: Task[]) => {
    // Process tasks completed per day (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const date = new Date()
      date.setDate(date.getDate() - (6 - i))
      return date.toISOString().split('T')[0]
    })

    const completionByDay = last7Days.map(date => {
      const completed = tasksData.filter(task => 
        task.status === 'completed' && 
        task.completed_at && 
        task.completed_at.startsWith(date)
      ).length

      const dateObj = new Date(date)
      return {
        date: dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        completed
      }
    })

    setCompletionData(completionByDay)
  }

  const totalTasks = tasks.length
  const completedTasks = tasks.filter(t => t.status === 'completed').length
  const inProgressTasks = tasks.filter(t => t.status === 'in-progress').length
  const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0

  // Calculate total on-time tasks
  let totalOnTime = 0
  tasks.filter(t => t.status === 'completed').forEach(task => {
    if (task.completed_at && task.deadline) {
      const completedDate = new Date(task.completed_at)
      const deadlineDate = new Date(task.deadline)
      if (completedDate <= deadlineDate) {
        totalOnTime++
      }
    }
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={onBack}
              className="h-9 w-9"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 style={{ color: '#043c1c' }}>Team Analytics</h1>
              <p className="text-gray-600 text-sm">Track team performance and progress</p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-6xl mx-auto px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-gray-500">Loading analytics...</div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Overall Team Metrics */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#043c1c' }}>
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Total Tasks</p>
                    <p className="text-2xl" style={{ color: '#043c1c' }}>{totalTasks}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-green-100">
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completed</p>
                    <p className="text-2xl text-green-600">{completedTasks}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">In Progress</p>
                    <p className="text-2xl text-blue-600">{inProgressTasks}</p>
                  </div>
                </div>
              </Card>

              <Card className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg" style={{ backgroundColor: '#bc8822' }}>
                    <Target className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Success Rate</p>
                    <p className="text-2xl" style={{ color: '#bc8822' }}>{completionRate}%</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Tasks Completed Per Day */}
            <Card className="p-6">
              <h2 className="text-xl mb-4" style={{ color: '#043c1c' }}>
                Tasks Completed (Last 7 Days)
              </h2>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={completionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip />
                  <Bar dataKey="completed" fill="#bc8822" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Team Members Performance */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-6">
                <Users className="w-6 h-6" style={{ color: '#043c1c' }} />
                <h2 className="text-xl" style={{ color: '#043c1c' }}>
                  Team Performance
                </h2>
              </div>
              
              <div className="grid md:grid-cols-2 gap-4">
                {teamStats.map((member, index) => {
                  const memberIcon = teamMembers.find(m => m.email === member.email)?.icon || '👤'
                  return (
                    <div
                      key={member.email}
                      className="p-4 rounded-xl border-2 border-gray-200 bg-white hover:shadow-md transition-shadow"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          <div className="text-3xl">{memberIcon}</div>
                          <div>
                            <h3 className="text-lg" style={{ color: '#043c1c' }}>
                              {member.name}
                            </h3>
                            <p className="text-xs text-gray-500">{member.email}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-2xl" style={{ color: '#bc8822' }}>
                            {member.completionRate}%
                          </div>
                          <p className="text-xs text-gray-600">Completion</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-3 text-center">
                        <div className="p-2 rounded-lg bg-gray-50">
                          <div className="text-xl" style={{ color: '#043c1c' }}>
                            {member.totalTasks}
                          </div>
                          <p className="text-xs text-gray-600">Total</p>
                        </div>
                        <div className="p-2 rounded-lg bg-green-50">
                          <div className="text-xl text-green-600">
                            {member.completedTasks}
                          </div>
                          <p className="text-xs text-gray-600">Done</p>
                        </div>
                        <div className="p-2 rounded-lg bg-blue-50">
                          <div className="text-xl text-blue-600">
                            {member.inProgressTasks}
                          </div>
                          <p className="text-xs text-gray-600">Active</p>
                        </div>
                      </div>

                      {member.completedTasks > 0 && (
                        <div className="mt-3 pt-3 border-t border-gray-100">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">On-Time Delivery</span>
                            <span className="text-green-600">
                              {member.onTimeTasks} of {member.completedTasks}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
