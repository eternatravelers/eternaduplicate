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
  const [isCheckingStatus, setIsCheckingStatus] = useState(false)

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
          .eq('user_id', data.user.id)
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
        redirectTo: 'https://eternatravelers-eter-hx4y.bolt.host/'
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
    let mounted = true
    let loadingTimeout: NodeJS.Timeout | null = null

    const checkUserStatus = async (userId: string) => {
      if (isCheckingStatus) return true

      setIsCheckingStatus(true)
      try {
        const { data: userProfile, error: profileError } = await supabase
          .from('user_profiles')
          .select('is_active')
          .eq('user_id', userId)
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
      } finally {
        setIsCheckingStatus(false)
      }
    }

    const getInitialSession = async () => {
      try {
        loadingTimeout = setTimeout(() => {
          if (mounted) {
            console.warn('[useAuth] Session check timeout - forcing loading to false')
            setLoading(false)
            setError('Koneksi lambat. Silakan muat ulang halaman.')
          }
        }, 10000)

        const { data: { session }, error } = await supabase.auth.getSession()

        if (error) throw error

        if (!mounted) return

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const isActive = await checkUserStatus(session.user.id)
          if (mounted && isActive) {
            const role = getUserRole(session.user)
            setUserRole(role)
          }
        }
      } catch (err) {
        console.error('[useAuth] Error getting initial session:', err)
        if (mounted) {
          setError(err instanceof Error ? err.message : 'Unknown error')
        }
      } finally {
        if (loadingTimeout) clearTimeout(loadingTimeout)
        if (mounted) {
          setLoading(false)
        }
      }
    }

    getInitialSession()

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        (async () => {
          if (!mounted) return

          setSession(session)
          setUser(session?.user ?? null)

          if (session?.user) {
            const isActive = await checkUserStatus(session.user.id)
            if (mounted && isActive) {
              const role = getUserRole(session.user)
              setUserRole(role)
            }
          } else {
            if (mounted) setUserRole(null)
          }

          if (mounted) setLoading(false)
        })()
      }
    )

    return () => {
      mounted = false
      if (loadingTimeout) clearTimeout(loadingTimeout)
      subscription.unsubscribe()
    }
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
