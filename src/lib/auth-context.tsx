import { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  userName: string
  loading: boolean
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

const teamMembers = [
  { name: 'Arefat', email: 'arefat@umrago.com' },
  { name: 'Mekin', email: 'mekin@umrago.com' },
  { name: 'Suad', email: 'suad@umrago.com' },
  { name: 'Ramadan', email: 'ramadan@umrago.com' },
]

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Check active sessions
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const getUserName = () => {
    if (!user?.email) return ''
    const member = teamMembers.find((m) => m.email === user.email)
    return member?.name || ''
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    if (error) throw error
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        userName: getUserName(),
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
