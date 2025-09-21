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

  console.log('🔄 useAuthProvider initialized', { loading, user: !!user, userProfile: !!userProfile })

  // Fetch user profile from user_profiles table
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    try {
      console.log('📋 Fetching user profile for userId:', userId)
      
      console.log('🔍 Starting Supabase query for user_profiles...')
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single()
      
      console.log('📊 Supabase query completed. Data:', data, 'Error:', error)

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('❌ No profile found for user:', userId)
          return null
        }
        console.error('❌ Supabase error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
        throw error
      }

      console.log('✅ User profile fetched successfully:', data)
      return data
    } catch (err) {
      console.error('❌ Unhandled error in fetchUserProfile:', err)
      console.error('❌ Error type:', typeof err)
      console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack trace')
      return null
    }
  }

  // Create user profile for new users
  const createUserProfile = async (user: User, signUpData?: SignUpData): Promise<UserProfile | null> => {
    try {
      console.log('🆕 Creating user profile for user:', user.id)
      
      const profileData = {
        user_id: user.id,
        full_name: signUpData?.fullName || user.user_metadata?.full_name || null,
        company_name: signUpData?.companyName || user.user_metadata?.company_name || null,
        phone: signUpData?.phone || user.user_metadata?.phone || null,
        role: 'user', // Default role for new signups
        tenant_id: null // Will be assigned by admin later
      }
      
      console.log('📝 Profile data to insert:', profileData)
      console.log('🔍 Starting Supabase insert for user_profiles...')

      const { data, error } = await supabase
        .from('user_profiles')
        .insert([profileData])
        .select()
        .single()
      
      console.log('📊 Supabase insert completed. Data:', data, 'Error:', error)

      if (error) throw error

      console.log('✅ User profile created successfully:', data)
      return data
    } catch (err) {
      console.error('❌ Unhandled error in createUserProfile:', err)
      console.error('❌ Error type:', typeof err)
      console.error('❌ Error stack:', err instanceof Error ? err.stack : 'No stack trace')
      return null
    }
  }

  // Refresh user profile
  const refreshProfile = async () => {
    console.log('🔄 Refreshing profile for user:', user?.id)
    if (!user) return

    const profile = await fetchUserProfile(user.id)
    setUserProfile(profile)
    
    if (profile) {
      setTenantId(profile.tenant_id)
      setUserRole(profile.role)
      console.log('✅ Profile refreshed:', { role: profile.role, tenantId: profile.tenant_id })
    } else {
      setTenantId(null)
      setUserRole(null)
      console.log('❌ No profile found during refresh')
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
      console.log('🔐 Attempting sign in for:', email)

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) throw error
      console.log('✅ Sign in successful, user:', data.user?.id)

      if (data.user) {
        // Fetch user profile
        const profile = await fetchUserProfile(data.user.id)
        
        if (profile) {
          setUserProfile(profile)
          setTenantId(profile.tenant_id)
          setUserRole(profile.role)
          console.log('✅ Profile loaded after sign in:', { role: profile.role })
        } else {
          // For existing users without profiles, don't auto-create
          // They need to be set up by an admin or created manually
          console.warn('User exists but has no profile. Contact admin to set up profile.')
          setError('Profil pengguna belum diatur. Hubungi administrator untuk mengatur profil Anda.')
          
          // Sign out the user since they can't use the app without a profile
          await supabase.auth.signOut()
          return
        }
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Terjadi kesalahan saat login'
      setError(errorMessage)
      console.error('❌ Sign in error:', errorMessage)
      throw err
    } finally {
      setLoading(false)
      console.log('🔄 Sign in process completed, loading:', false)
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
        // Try to create user profile
        const profile = await createUserProfile(data.user, signUpData)
        if (profile) {
          setUserProfile(profile)
          setTenantId(profile.tenant_id)
          setUserRole(profile.role)
        } else {
          // If profile creation fails, show appropriate message
          setError('Pendaftaran berhasil, tetapi profil belum dapat dibuat. Hubungi administrator.')
        console.error('❌ Supabase insert error details:', {
          code: error.code,
          message: error.message,
          details: error.details,
          hint: error.hint
        })
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
        console.log('🚀 Getting initial session...')
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) throw error
        console.log('📋 Initial session:', { hasSession: !!session, userId: session?.user?.id })

        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('👤 User found in session, fetching profile...')
          const profile = await fetchUserProfile(session.user.id)
          
          if (profile) {
            setUserProfile(profile)
            setTenantId(profile.tenant_id)
            setUserRole(profile.role)
            console.log('✅ Initial profile loaded:', { role: profile.role, tenantId: profile.tenant_id })
          } else {
            // Create profile for existing users who don't have one
            console.log('🆕 No profile found, creating new profile...')
            const newProfile = await createUserProfile(session.user)
            if (newProfile) {
              setUserProfile(newProfile)
              setTenantId(newProfile.tenant_id)
              setUserRole(newProfile.role)
              console.log('✅ New profile created:', { role: newProfile.role })
            }
          }
        } else {
          console.log('❌ No user in session')
        }
      } catch (err) {
        console.error('Error getting initial session:', err)
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
        console.log('🔄 Initial session loading completed, loading:', false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔄 Auth state changed:', { event, hasSession: !!session, userId: session?.user?.id })
        setSession(session)
        setUser(session?.user ?? null)

        if (session?.user) {
          console.log('👤 User in auth state change, fetching profile...')
          const profile = await fetchUserProfile(session.user.id)
          
          if (profile) {
            setUserProfile(profile)
            setTenantId(profile.tenant_id)
            setUserRole(profile.role)
            console.log('✅ Profile loaded in auth state change:', { role: profile.role })
          } else {
            // Create profile for users who don't have one
            console.log('🆕 Creating profile in auth state change...')
            const newProfile = await createUserProfile(session.user)
            if (newProfile) {
              setUserProfile(newProfile)
              setTenantId(newProfile.tenant_id)
              setUserRole(newProfile.role)
              console.log('✅ New profile created in auth state change:', { role: newProfile.role })
            }
          }
        } else {
          console.log('❌ No user in auth state change')
          setUserProfile(null)
          setTenantId(null)
          setUserRole(null)
        }

        setLoading(false)
        console.log('🔄 Auth state change completed, loading:', false)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  console.log('🔄 useAuthProvider returning:', { 
    loading, 
    hasUser: !!user, 
    hasUserProfile: !!userProfile, 
    userRole,
    isAdmin,
    isSuperAdmin 
  })

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