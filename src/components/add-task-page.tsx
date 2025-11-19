import { useState } from 'react'
import { ArrowLeft, Upload, X, CalendarIcon, Plus } from 'lucide-react'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Label } from './ui/label'
import { Textarea } from './ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select'
import { Calendar } from './ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from './ui/popover'
import { format } from 'date-fns'

const teamMembers = [
  { name: 'Arefat', email: 'arefat@umrago.com' },
  { name: 'Mekin', email: 'mekin@umrago.com' },
  { name: 'Suad', email: 'suad@umrago.com' },
  { name: 'Ramadan', email: 'ramadan@umrago.com' },
]

interface AddTaskPageProps {
  onBack: () => void
}

export function AddTaskPage({ onBack }: AddTaskPageProps) {
  const { user, userName } = useAuth()
  const [titles, setTitles] = useState<string[]>([''])
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState('')
  const [deadline, setDeadline] = useState<Date | undefined>()
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleAddTitle = () => {
    setTitles([...titles, ''])
  }

  const handleRemoveTitle = (index: number) => {
    if (titles.length > 1) {
      setTitles(titles.filter((_, i) => i !== index))
    }
  }

  const handleTitleChange = (index: number, value: string) => {
    const newTitles = [...titles]
    newTitles[index] = value
    setTitles(newTitles)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      // Filter out empty titles
      const validTitles = titles.filter(t => t.trim() !== '')
      
      if (validTitles.length === 0) {
        throw new Error('Please enter at least one task title')
      }

      // Create multiple tasks
      const tasksToCreate = validTitles.map(title => ({
        title: title.trim(),
        description: description || '',
        assigned_to: assignedTo || '',
        assigned_to_email: assignedTo ? teamMembers.find((m) => m.name === assignedTo)?.email || '' : '',
        deadline: deadline ? deadline.toISOString().split('T')[0] : '',
        priority,
        status: 'pending',
        created_by: userName,
        created_by_email: user?.email || '',
      }))

      const { error: insertError } = await supabase.from('tasks').insert(tasksToCreate)

      if (insertError) throw insertError

      onBack()
    } catch (err: any) {
      setError(err.message || 'Failed to create task')
    } finally {
      setLoading(false)
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
            <div>
              <h1 style={{ color: '#043c1c' }}>Add New Task</h1>
              <p className="text-gray-600 text-sm">Create a task for your team</p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto px-4 py-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 space-y-5">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Task Titles *</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTitle}
                  className="gap-2"
                >
                  <Plus className="h-4 w-4" />
                  Add More
                </Button>
              </div>
              {titles.map((title, index) => (
                <div key={index} className="flex items-center gap-2">
                  <Input
                    placeholder={`Task title ${index + 1}`}
                    value={title}
                    onChange={(e) => handleTitleChange(index, e.target.value)}
                    className="h-12"
                  />
                  {titles.length > 1 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveTitle(index)}
                      className="h-12 w-12 flex-shrink-0"
                    >
                      <X className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
              <p className="text-xs text-gray-500">Add multiple tasks with the same details</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the task in detail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                className="resize-none"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignTo">Assign To</Label>
              <Select value={assignedTo} onValueChange={setAssignedTo}>
                <SelectTrigger id="assignTo" className="h-12">
                  <SelectValue placeholder="Select team member" />
                </SelectTrigger>
                <SelectContent>
                  {teamMembers.map((member) => (
                    <SelectItem key={member.email} value={member.name}>
                      <div className="flex items-center gap-2">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm"
                          style={{ backgroundColor: '#bc8822' }}
                        >
                          {member.name.charAt(0)}
                        </div>
                        <div>
                          <div>{member.name}</div>
                          <div className="text-xs text-gray-500">{member.email}</div>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="deadline">Deadline</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className="w-full h-12 justify-start text-left font-normal"
                    type="button"
                    id="deadline"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" style={{ color: '#bc8822' }} />
                    {deadline ? format(deadline, 'PPP') : <span className="text-gray-500">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={deadline}
                    onSelect={setDeadline}
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={priority}
                onValueChange={(value) => setPriority(value as 'low' | 'medium' | 'high')}
              >
                <SelectTrigger id="priority" className="h-12">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      Low Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="medium">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                      Medium Priority
                    </div>
                  </SelectItem>
                  <SelectItem value="high">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-red-500"></div>
                      High Priority
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="flex-1 h-12"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="flex-1 h-12 text-white"
              style={{ backgroundColor: '#043c1c' }}
              disabled={loading}
            >
              {loading ? 'Creating...' : 'Create Task'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  )
}