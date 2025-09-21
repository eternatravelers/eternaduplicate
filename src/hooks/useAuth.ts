import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from '@/lib/supabase'
import type { User, Session } from '@supabase/supabase-js'

interface UserProfile {
  id: string
  user_id: string
  full_name: string | null
  company_name: string | null
  phone: string | null
  role: string
  tenant_id: string | null
  created_at: string
  updated_at: string
}

interface AuthContextType {
  user: User | null
  session: Session | null
  userProfile: UserProfile | null
  loading: boolean
  error: string | null
  signIn: (email: string, password: string) => Promise<void>
  signUp: (data: SignUpData) => Promise<void>
  signOut: () => Promise<void>
  tenantId: string | null
  userRole: string | null
  isAdmin: boolean
  isSuperAdmin: boolean
  refreshProfile: () => Promise<void>
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
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [tenantId, setTenantId] = useState<string | null>(null)
  const [userRole, setUserRole] = useState<string | null>(null)

  // Fetch user profile from user_profiles table
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // No profile found, return null
          return null
        }
        throw error
      }

      return data
    } catch (err) {
      console.error('Error fetching user profile:', err)
      return null
    }
  }

  // Create user profile for new users
  const createUserProfile = async (user: User, signUpData?: SignUpData): Promise<UserProfile | null> => {
    try {
      // For new users, we'll create them as regular users
      // Super admin should be created manually in the database
      // Generate tenant ID only if this is the first user (which should be done manually)
      // For regular signups, we'll leave tenant_id as null initially
      
      const profileData = {
        user_id: user.id,
        full_name: signUpData?.fullName || user.user_metadata?.full_name || null,
        company_name: signUpData?.companyName || user.user_metadata?.company_name || null,
        phone: signUpData?.phone || user.user_metadata?.phone || null,
        role: 'user', // Default role for new signups
        tenant_id: null // Will be assigned by admin later
      }

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single()

      if (error) throw error

      return data
    } catch (err) {
      console.error('Error creating user profile:', err)
      return null
    }
  }

  // Refresh user profile
  const refreshProfile = async () => {
    if (!user) return

    const profile = await fetchUserProfile(user.id)
    setUserProfile(profile)
    
    if (profile) {
      setTenantId(profile.tenant_id)
      setUserRole(profile.role)
    } else {
      setTenantId(null)
      setUserRole(null)
    }
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
        // Fetch user profile
        const profile = await fetchUserProfile(data.user.id)
        
        if (profile) {
          setUserProfile(profile)
          setTenantId(profile.tenant_id)
          setUserRole(profile.role)
        } else {
          // Create profile for existing users who don't have one
          const newProfile = await createUserProfile(data.user)
          if (newProfile) {
            setUserProfile(newProfile)
            setTenantId(newProfile.tenant_id)
            setUserRole(newProfile.role)
          }
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

      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email,
        password: signUpData.password,
        options: {
          data: {
            full_name: signUpData.fullName,
            company_name: signUpData.companyName,
            phone: signUpData.phone
          }
        }
      })

      if (error) throw error

      if (data.user) {
        // Create user profile
        const profile = await createUserProfile(data.user, signUpData)
        if (profile) {
          setUserProfile(profile)
          setTenantId(profile.tenant_id)
          setUserRole(profile.role)
        }
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

      setUserProfile(null)
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
          const profile = await fetchUserProfile(session.user.id)
          
          if (profile) {
            setUserProfile(profile)
            setTenantId(profile.tenant_id)
            setUserRole(profile.role)
          } else {
            // Create profile for existing users who don't have one
            const newProfile = await createUserProfile(session.user)
            if (newProfile) {
              setUserProfile(newProfile)
              setTenantId(newProfile.tenant_id)
              setUserRole(newProfile.role)
            }
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
          const profile = await fetchUserProfile(session.user.id)
          
          if (profile) {
            setUserProfile(profile)
            setTenantId(profile.tenant_id)
            setUserRole(profile.role)
          } else {
            // Create profile for users who don't have one
            const newProfile = await createUserProfile(session.user)
            if (newProfile) {
              setUserProfile(newProfile)
              setTenantId(newProfile.tenant_id)
              setUserRole(newProfile.role)
            }
          }
        } else {
          setUserProfile(null)
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
    userProfile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    tenantId,
    userRole,
    isAdmin,
    isSuperAdmin,
    refreshProfile
  }
}

// Export the context for provider usage
export { AuthContext }