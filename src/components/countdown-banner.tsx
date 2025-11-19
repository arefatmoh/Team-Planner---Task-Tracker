import { useState, useEffect } from 'react'
import { Edit2, Save, X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { toast } from 'sonner'

export function CountdownBanner() {
  const [launchDate, setLaunchDate] = useState<Date>(new Date('2025-11-29'))
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 })
  const [isEditing, setIsEditing] = useState(false)
  const [editDate, setEditDate] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadLaunchDate()
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      calculateTimeLeft()
    }, 1000)

    return () => clearInterval(timer)
  }, [launchDate])

  const loadLaunchDate = async () => {
    try {
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'launch_date')
        .single()

      if (data && !error) {
        setLaunchDate(new Date(data.value))
      }
    } catch (error) {
      console.error('Error loading launch date:', error)
    } finally {
      setLoading(false)
    }
  }

  const calculateTimeLeft = () => {
    const difference = launchDate.getTime() - new Date().getTime()

    if (difference > 0) {
      setTimeLeft({
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
      })
    } else {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 })
    }
  }

  const handleSaveDate = async () => {
    if (!editDate) return

    try {
      const newDate = new Date(editDate)
      
      // Upsert the launch date
      const { error } = await supabase
        .from('settings')
        .upsert({ key: 'launch_date', value: newDate.toISOString() }, { onConflict: 'key' })

      if (error) throw error

      setLaunchDate(newDate)
      setIsEditing(false)
      setEditDate('')
      toast.success('Launch date saved successfully!')
    } catch (error) {
      console.error('Error saving launch date:', error)
      toast.error('Failed to save launch date')
    }
  }

  const startEditing = () => {
    setEditDate(launchDate.toISOString().split('T')[0])
    setIsEditing(true)
  }

  if (loading) {
    return null
  }

  return (
    <div className="w-full" style={{ background: 'linear-gradient(135deg, #043c1c 0%, #065429 100%)' }}>
      <div className="max-w-4xl mx-auto px-4 py-4">
        {isEditing ? (
          <div className="flex items-center gap-2 justify-center">
            <Input
              type="date"
              value={editDate}
              onChange={(e) => setEditDate(e.target.value)}
              className="max-w-xs bg-white/10 text-white border-white/30"
            />
            <Button
              size="sm"
              onClick={handleSaveDate}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <Save className="w-4 h-4" />
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setIsEditing(false)
                setEditDate('')
              }}
              className="bg-white/20 hover:bg-white/30 text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        ) : (
          <div className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <h2 className="text-white text-lg">Launch Countdown</h2>
              <button
                onClick={startEditing}
                className="p-1 hover:bg-white/10 rounded transition-colors"
              >
                <Edit2 className="w-4 h-4 text-white/70 hover:text-white" />
              </button>
            </div>
            
            <div className="flex items-center justify-center gap-4 text-white">
              <div className="flex flex-col items-center min-w-[60px] bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <span className="text-3xl" style={{ color: '#bc8822' }}>{timeLeft.days}</span>
                <span className="text-xs uppercase tracking-wide opacity-80">Days</span>
              </div>
              <div className="flex flex-col items-center min-w-[60px] bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <span className="text-3xl" style={{ color: '#bc8822' }}>{timeLeft.hours}</span>
                <span className="text-xs uppercase tracking-wide opacity-80">Hours</span>
              </div>
              <div className="flex flex-col items-center min-w-[60px] bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <span className="text-3xl" style={{ color: '#bc8822' }}>{timeLeft.minutes}</span>
                <span className="text-xs uppercase tracking-wide opacity-80">Minutes</span>
              </div>
              <div className="flex flex-col items-center min-w-[60px] bg-white/10 backdrop-blur-sm rounded-xl p-3">
                <span className="text-3xl" style={{ color: '#bc8822' }}>{timeLeft.seconds}</span>
                <span className="text-xs uppercase tracking-wide opacity-80">Seconds</span>
              </div>
            </div>
            
            <p className="text-white/70 text-sm mt-2">
              Until {launchDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
            </p>
          </div>
        )}
      </div>
    </div>
  )
}