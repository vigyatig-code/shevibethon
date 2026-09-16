import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react'
import { supabase } from './supabase'

export interface UserProfile {
  id: string
  phone: string
  date_of_birth: string | null
  gender: string | null
  full_name: string | null
}

interface AuthState {
  session: Awaited<ReturnType<typeof supabase.auth.getSession>>['data']['session'] | null
  profile: UserProfile | null
  loading: boolean
}

interface AuthContextValue extends AuthState {
  signInWithPhone: (phone: string) => Promise<{ error: string | null }>
  verifyOtp: (phone: string, token: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refreshProfile: () => Promise<void>
  isSignedIn: boolean
  needsProfile: boolean
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    session: null,
    profile: null,
    loading: true,
  })

  const loadProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) {
      setState({ session: null, profile: null, loading: false })
      return
    }

    const { data } = await supabase
      .from('user_profiles')
      .select('id, phone, date_of_birth, gender, full_name')
      .eq('id', session.user.id)
      .maybeSingle()

    setState({ session, profile: data, loading: false })
  }, [])

  useEffect(() => {
    loadProfile()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        if (event === 'SIGNED_OUT') {
          setState({ session: null, profile: null, loading: false })
          return
        }
        if (session) {
          const { data } = await supabase
            .from('user_profiles')
            .select('id, phone, date_of_birth, gender, full_name')
            .eq('id', session.user.id)
            .maybeSingle()
          setState({ session, profile: data, loading: false })
        }
      })()
    })

    return () => subscription.unsubscribe()
  }, [loadProfile])

  const signInWithPhone = useCallback(async (phone: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.signInWithOtp({
      phone,
    })
    return { error: error?.message ?? null }
  }, [])

  const verifyOtp = useCallback(async (phone: string, token: string): Promise<{ error: string | null }> => {
    const { error } = await supabase.auth.verifyOtp({
      phone,
      token,
      type: 'sms',
    })
    return { error: error?.message ?? null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setState({ session: null, profile: null, loading: false })
  }, [])

  const refreshProfile = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session) return
    const { data } = await supabase
      .from('user_profiles')
      .select('id, phone, date_of_birth, gender, full_name')
      .eq('id', session.user.id)
      .maybeSingle()
    setState((prev) => ({ ...prev, profile: data }))
  }, [])

  const isSignedIn = !!state.session
  const needsProfile = isSignedIn && (!state.profile?.date_of_birth || !state.profile?.gender)

  return (
    <AuthContext.Provider value={{
      ...state,
      signInWithPhone,
      verifyOtp,
      signOut,
      refreshProfile,
      isSignedIn,
      needsProfile,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
