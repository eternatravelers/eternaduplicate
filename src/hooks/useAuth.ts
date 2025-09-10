import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface AuthContextType {
  user: User | null
  session: Session | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  tenantId: string | null
  userRole: string | null
  isAdmin: boolean
  isSuperAdmin: boolean
}

interface SignUpData {
  email: string
  password: string
  fullName: string
  companyName: string
  phone: string
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
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Get tenant ID from user metadata
  const getTenantId = (user: User): string | null => {
    return user.user_metadata?.tenant_id || user.app_metadata?.tenant_id || null
  }

  // Get user role from user metadata
  const getUserRole = (user: User): string => {
    return user.user_metadata?.role || user.app_metadata?.role || 'admin'
  }

  // Check if user is admin (has basic access)
  const isAdmin = userRole === 'admin' || userRole === 'super_admin'

  // Check if user is super admin (has full access)
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
        const userTenantId = getTenantId(data.user)
        const role = getUserRole(data.user)
        setUserRole(role)
        if (userTenantId) {
          setTenantId(userTenantId)
        } else {
          // For now, create a default tenant ID if none exists
          const defaultTenantId = crypto.randomUUID()
          setTenantId(defaultTenantId)
          console.log('Created default tenant ID:', defaultTenantId)
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat login'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }

  const signUp = async (signUpData: SignUpData) => {
    try {
      setLoading(true)
      setError(null)

      // Generate a tenant ID for the new user
      const newTenantId = crypto.randomUUID()

      // Create the user with tenant_id in metadata
      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName,
            company_name: signUpData.companyName,
            phone: signUpData.phone,
            tenant_id: newTenantId,
            role: 'super_admin' // First user becomes super admin
          }
        }
      })

      if (error) throw error

      if (data.user) {
        setTenantId(newTenantId)
        setUserRole('super_admin')
        console.log('User registered with tenant ID:', newTenantId)
      }

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat mendaftar'
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

      setTenantId(null)
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
    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const userTenantId = getTenantId(session.user)
          const role = getUserRole(session.user)
          setUserRole(role)
          if (userTenantId) {
            setTenantId(userTenantId)
          } else {
            // Create a default tenant ID if none exists
            const defaultTenantId = crypto.randomUUID()
            setTenantId(defaultTenantId)
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

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          const userTenantId = getTenantId(session.user)
          const role = getUserRole(session.user)
          setUserRole(role)
          if (userTenantId) {
            setTenantId(userTenantId)
          } else {
            // Create a default tenant ID if none exists
            const defaultTenantId = crypto.randomUUID()
            setTenantId(defaultTenantId)
          }
        } else {
          setTenantId(null)
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
    signUp,
    signOut,
    tenantId,
    userRole,
    isAdmin,
    isSuperAdmin
  }
}

// Export the context for provider usage
export { AuthContext }