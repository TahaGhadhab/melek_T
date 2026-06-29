import { createContext, useContext, useState, useEffect, useCallback, useRef, type ReactNode } from 'react'
import { supabase } from '../lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

// ============================================================
// Types
// ============================================================

interface AuthState {
  user: User | null
  session: Session | null
  isLoading: boolean
}

interface AuthContextValue extends AuthState {
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signUp: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  /** True right after a fresh sign-in (not page refresh). Auto-resets after 5s. */
  isFreshLogin: boolean
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined)

// ============================================================
// Provider
// ============================================================

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    isLoading: true,
  })
  const [isFreshLogin, setIsFreshLogin] = useState(false)
  const freshLoginTimer = useRef<ReturnType<typeof setTimeout>>()

  // Restore session on mount and listen for auth changes
  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({
        user: session?.user ?? null,
        session,
        isLoading: false,
      })
    })

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setState({
          user: session?.user ?? null,
          session,
          isLoading: false,
        })

        // Detect fresh login (not INITIAL_SESSION which fires on page refresh)
        if (event === 'SIGNED_IN') {
          setIsFreshLogin(true)
          clearTimeout(freshLoginTimer.current)
          freshLoginTimer.current = setTimeout(() => setIsFreshLogin(false), 5000)
        }
      }
    )

    return () => {
      subscription.unsubscribe()
      clearTimeout(freshLoginTimer.current)
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: error.message }
    // L'état est mis à jour via onAuthStateChange
    return { error: null }
  }, [])

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: error.message }
    // L'état est mis à jour via onAuthStateChange (confirmation email requise par défaut)
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setState({ user: null, session: null, isLoading: false })
  }, [])

  return (
    <AuthContext.Provider value={{ ...state, signIn, signUp, signOut, isFreshLogin }}>
      {children}
    </AuthContext.Provider>
  )
}

// ============================================================
// Hook
// ============================================================

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider')
  return ctx
}
