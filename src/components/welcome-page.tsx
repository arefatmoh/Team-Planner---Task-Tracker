import { useState, useEffect } from 'react'
import { motion } from 'motion/react'
import { Sparkles, Rocket, Target, Users, CheckCircle2, ArrowRight } from 'lucide-react'
import { Button } from './ui/button'
import { useAuth } from '../lib/auth-context'
import { supabase } from '../lib/supabase'

interface WelcomePageProps {
  onComplete: () => void
}

const memberDetails = {
  'arefat@umrago.com': {
    name: 'Arefat',
    role: 'The Mastermind',
    title: 'Project Developer & Manager',
    description: 'Your code brings visions to life. You are the architect of our success.',
    icon: '💻',
    gradient: 'from-blue-500 to-purple-600',
    motivation: 'Build the impossible, one line at a time.',
    strengths: ['Technical Leadership', 'Problem Solving', 'Project Architecture'],
    mission: 'Transform ideas into reality through elegant code and strategic planning'
  },
  'mekin@umrago.com': {
    name: 'Mekin',
    role: 'The Visionary',
    title: 'CEO of Bewide Technologies',
    description: 'Your leadership lights the path forward. You connect worlds and build bridges.',
    icon: '👔',
    gradient: 'from-amber-500 to-orange-600',
    motivation: 'Lead with vision, inspire with action.',
    strengths: ['Strategic Leadership', 'External Relations', 'Business Vision'],
    mission: 'Guide the team to new heights while forging powerful partnerships'
  },
  'suad@umrago.com': {
    name: 'Suad',
    role: 'The Connector',
    title: 'Marketer & Event Organizer',
    description: 'Your creativity spreads our story. You turn moments into memories.',
    icon: '📢',
    gradient: 'from-pink-500 to-rose-600',
    motivation: 'Create experiences that inspire and connect.',
    strengths: ['Marketing Strategy', 'Event Management', 'Brand Building'],
    mission: 'Amplify our message and create unforgettable experiences for our audience'
  },
  'ramadan@umrago.com': {
    name: 'Ramadan',
    role: 'The Artist',
    title: 'Design Lead & Brand Architect',
    description: 'Your designs tell our story. You paint our brand with beauty and purpose.',
    icon: '🎨',
    gradient: 'from-green-500 to-teal-600',
    motivation: 'Design is not just what it looks like, it\'s how it makes people feel.',
    strengths: ['Visual Design', 'Brand Identity', 'Creative Direction'],
    mission: 'Craft a visual identity that resonates and inspires trust and excitement'
  }
}

export function WelcomePage({ onComplete }: WelcomePageProps) {
  const { user } = useAuth()
  const [step, setStep] = useState(0)
  const [isLoading, setIsLoading] = useState(false)
  
  const userDetails = user?.email ? memberDetails[user.email as keyof typeof memberDetails] : null

  const handleComplete = async () => {
    setIsLoading(true)
    try {
      // Mark user as welcomed in localStorage
      localStorage.setItem('umrago_welcome_seen', 'true')
      
      // Also mark in database
      await supabase
        .from('user_preferences')
        .upsert({ 
          user_email: user?.email, 
          has_seen_welcome: true 
        }, { onConflict: 'user_email' })
      
      onComplete()
    } catch (error) {
      console.error('Error saving welcome state:', error)
      onComplete() // Continue anyway
    }
  }

  if (!userDetails) {
    return null
  }

  const steps = [
    // Step 0: Grand Welcome
    <motion.div
      key="step0"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center space-y-6"
    >
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
        className="text-8xl mb-4"
      >
        {userDetails.icon}
      </motion.div>
      
      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.4 }}
      >
        <h1 className="text-4xl mb-2" style={{ color: '#043c1c' }}>
          Welcome, {userDetails.name}!
        </h1>
        <div className={`text-2xl bg-gradient-to-r ${userDetails.gradient} bg-clip-text text-transparent mb-4`}>
          {userDetails.role}
        </div>
        <p className="text-xl text-gray-600 max-w-md mx-auto">
          {userDetails.description}
        </p>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="flex justify-center gap-2"
      >
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.5, 1, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              delay: i * 0.2,
            }}
          >
            <Sparkles className="w-6 h-6" style={{ color: '#bc8822' }} />
          </motion.div>
        ))}
      </motion.div>
    </motion.div>,

    // Step 1: Your Role & Mission
    <motion.div
      key="step1"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className={`inline-block p-4 rounded-2xl bg-gradient-to-br ${userDetails.gradient} mb-4`}>
          <Target className="w-12 h-12 text-white" />
        </div>
        <h2 className="text-3xl mb-2" style={{ color: '#043c1c' }}>Your Mission</h2>
        <p className="text-lg text-gray-600 italic">"{userDetails.motivation}"</p>
      </div>

      <div className="bg-white rounded-2xl p-6 shadow-lg border-2" style={{ borderColor: '#bc8822' }}>
        <h3 className="text-xl mb-4" style={{ color: '#043c1c' }}>
          {userDetails.title}
        </h3>
        <p className="text-gray-700 mb-6">
          {userDetails.mission}
        </p>
        
        <div className="space-y-3">
          <h4 className="text-sm uppercase tracking-wide" style={{ color: '#bc8822' }}>
            Your Superpowers
          </h4>
          {userDetails.strengths.map((strength, index) => (
            <motion.div
              key={strength}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.1 }}
              className="flex items-center gap-3"
            >
              <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
              <span className="text-gray-700">{strength}</span>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>,

    // Step 2: Team Unity
    <motion.div
      key="step2"
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
      className="space-y-6"
    >
      <div className="text-center mb-8">
        <div className="inline-block p-4 rounded-2xl mb-4" style={{ backgroundColor: '#043c1c' }}>
          <svg className="w-12 h-12" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            <text x="50" y="55" fontSize="32" fontWeight="bold" fill="#bc8822" textAnchor="middle" dominantBaseline="middle">
              UG
            </text>
            <circle cx="50" cy="50" r="45" stroke="#bc8822" strokeWidth="3" fill="none"/>
          </svg>
        </div>
        <h2 className="text-3xl mb-2" style={{ color: '#043c1c' }}>Together We Launch</h2>
        <p className="text-lg text-gray-600">
          Four unique talents, one powerful team
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {Object.entries(memberDetails).map(([email, details], index) => (
          <motion.div
            key={email}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.1 }}
            className={`p-4 rounded-xl border-2 ${
              email === user?.email ? 'border-green-500 bg-green-50' : 'border-gray-200 bg-white'
            }`}
          >
            <div className="text-4xl mb-2 text-center">{details.icon}</div>
            <h3 className="text-sm text-center" style={{ color: '#043c1c' }}>
              {details.name}
            </h3>
            <p className="text-xs text-center text-gray-600">{details.role}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-2xl p-6 border-2" style={{ borderColor: '#bc8822' }}>
        <p className="text-center text-gray-700">
          "Great things in business are never done by one person. They're done by a team of people." - Steve Jobs
        </p>
      </div>
    </motion.div>,

    // Step 3: Let's Launch!
    <motion.div
      key="step3"
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      className="text-center space-y-8"
    >
      <motion.div
        animate={{
          scale: [1, 1.1, 1],
          rotate: [0, 10, -10, 0],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut"
        }}
        className="text-8xl mb-4"
      >
        🚀
      </motion.div>

      <div>
        <h2 className="text-4xl mb-4" style={{ color: '#043c1c' }}>Ready to Launch?</h2>
        <p className="text-xl text-gray-600 mb-6 max-w-md mx-auto">
          Your team is counting on you. Let's make UmraGO a success together!
        </p>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="space-y-4"
      >
        <div className="flex flex-col items-center gap-3 text-left max-w-sm mx-auto">
          {['Track your tasks', 'Collaborate in real-time', 'Meet deadlines together', 'Launch successfully!'].map((item, index) => (
            <motion.div
              key={item}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
              className="flex items-center gap-3 w-full"
            >
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: '#bc8822' }}>
                <span className="text-white text-sm">{index + 1}</span>
              </div>
              <span className="text-gray-700">{item}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>
    </motion.div>
  ]

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'linear-gradient(135deg, #f0fdf4 0%, #dbeafe 100%)' }}>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="bg-white rounded-3xl shadow-2xl p-8 md:p-12 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-100 to-transparent rounded-full blur-3xl opacity-30 -z-0" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-blue-100 to-transparent rounded-full blur-3xl opacity-30 -z-0" />
          
          {/* Content */}
          <div className="relative z-10">
            {steps[step]}
          </div>

          {/* Navigation */}
          <div className="relative z-10 mt-8 flex items-center justify-between">
            <div className="flex gap-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 rounded-full transition-all ${
                    index === step ? 'w-8' : 'w-2'
                  }`}
                  style={{ backgroundColor: index === step ? '#bc8822' : '#d1d5db' }}
                />
              ))}
            </div>

            <Button
              onClick={() => {
                if (step < steps.length - 1) {
                  setStep(step + 1)
                } else {
                  handleComplete()
                }
              }}
              disabled={isLoading}
              className="gap-2"
              style={{ backgroundColor: '#bc8822' }}
            >
              {step < steps.length - 1 ? (
                <>
                  Next <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  {isLoading ? 'Loading...' : "Let's Go!"} <Rocket className="w-4 h-4" />
                </>
              )}
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  )
}