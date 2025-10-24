import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signOut: () => Promise<void>
  resetPassword: (email: string) => Promise<void>
  userRole: string | null
  isAdmin: boolean
  isSuperAdmin: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

export function useAuthProvider(): AuthContextType {
  const [user, setUser] = useState<User | null>(null)
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  const getUserRole = (user: User): string => {
    const userMetaRole = user.user_metadata?.role
    const appMetaRole = user.app_metadata?.role

    console.log('[useAuth] Getting user role:', {
      userMetaRole,
      appMetaRole,
      userId: user.id,
      email: user.email
    })

    const role = userMetaRole || appMetaRole

    if (!role) {
      console.warn('[useAuth] No role found in user metadata, defaulting to admin')
      return 'admin'
    }

    if (role === 'super_admin' || role === 'admin') {
      console.log('[useAuth] Role assigned:', role)
      return role
    }

    console.warn('[useAuth] Unknown role detected:', role, '- defaulting to admin')
    return 'admin'
  }

  const isAdmin = userRole === 'admin' || userRole === 'super_admin'
  const isSuperAdmin = userRole === 'super_admin'

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true)
      setError(null)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error

      if (data.user) {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_active')
          .eq('id', data.user.id)
          .maybeSingle()

        if (profileError) {
          console.error('[useAuth] Error checking user status:', profileError)
        }

        if (userProfile && !userProfile.is_active) {
          await supabase.auth.signOut()
          throw new Error('Akun Anda telah dinonaktifkan. Silakan hubungi administrator.')
        }

        const role = getUserRole(data.user)
        setUserRole(role)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat login'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const resetPassword = async (email: string) => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) throw error
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat reset password'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signOut = async () => {
    try {
      setLoading(true)
      setError(null)

      const { error } = await supabase.auth.signOut()
      if (error) throw error

      setUserRole(null)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat logout'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const checkUserStatus = async (userId: string) => {
      const { data: userProfile, error: profileError } = await supabase
        .from('user_profiles')
        .select('is_active')
        .eq('id', userId)
        .maybeSingle()

      if (profileError) {
        console.error('[useAuth] Error checking user status:', profileError)
        return true
      }

      if (userProfile && !userProfile.is_active) {
        await supabase.auth.signOut()
        setError('Akun Anda telah dinonaktifkan. Silakan hubungi administrator.')
        return false
      }

      return true
    }

    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const isActive = await checkUserStatus(session.user.id)
          if (isActive) {
            const role = getUserRole(session.user)
            setUserRole(role)
          }
        }
      } catch (err) {
        console.error('Error getting initial session:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const isActive = await checkUserStatus(session.user.id)
          if (isActive) {
            const role = getUserRole(session.user)
            setUserRole(role)
          }
        } else {
          setUserRole(null)
        }

        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  return {
    user,
    session,
    loading,
    error,
    signIn,
    signOut,
    resetPassword,
    userRole,
    isAdmin,
    isSuperAdmin
  }
}

export { AuthContext }
