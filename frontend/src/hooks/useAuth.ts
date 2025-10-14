import { useEffect, useState, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { User } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type UserWithProfile = User & {
  role?: Database['public']['Tables']['profiles']['Row']['role']
  profile?: Database['public']['Tables']['profiles']['Row']
}

export function useAuth() {
  const [user, setUser] = useState<UserWithProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()
  const loadingProfile = useRef(false)
  const lastLoadedUserId = useRef<string | null>(null)

  const loadUserProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setUser(null)
      loadingProfile.current = false
      lastLoadedUserId.current = null
      return
    }

    // Prevent duplicate fetches for the same user
    if (loadingProfile.current || lastLoadedUserId.current === authUser.id) {
      return
    }

    // Check if user is already loaded with correct role
    if (user && user.id === authUser.id && user.role === 'admin') {
      return
    }
    loadingProfile.current = true
    lastLoadedUserId.current = authUser.id

    try {
      // Create timeout promise (3 seconds as safety net)
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 2000)
      })

      // Fetch profile - with optimized RLS this should be instant
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single()

      // Race between timeout and profile fetch
      const { data: profile, error } = await Promise.race([
        profilePromise,
        timeoutPromise
      ])

      if (error) {
        // Try to get role from user metadata as fallback
        const userRole = authUser.user_metadata?.role || 'guest'
        setUser({
          ...authUser,
          role: userRole,
          profile: undefined,
        })
        return
      }

      // Profile loaded successfully
      const profileData = profile as any
      const finalRole = profileData?.role || 'guest'
      setUser({
        ...authUser,
        role: finalRole,
        profile: profileData,
      })
    } catch (error) {
      // Try to get role from user metadata as fallback
      const userRole = authUser.user_metadata?.role || 'guest'
      setUser({
        ...authUser,
        role: userRole,
        profile: undefined,
      })
    } finally {
      loadingProfile.current = false
    }
  }, [])

  useEffect(() => {
    let mounted = true

    // Get initial session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!mounted) return
      
      try {
        // Wait for profile to load before showing dashboard
        await loadUserProfile(session?.user ?? null)
      } finally {
        // Always set loading to false, even if profile fetch fails
        if (mounted) {
          setLoading(false)
        }
      }
    }).catch(() => {
      if (mounted) {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        console.log('🔄 Auth state change:', event, 'User ID:', session?.user?.id)
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_OUT':
            setUser(null)
            break
          case 'SIGNED_IN':
          case 'TOKEN_REFRESHED':
            // Only load profile for the current user, not for newly created users
            if (session?.user && (!user || user.id === session.user.id)) {
              await loadUserProfile(session.user)
            }
            break
          default:
            // Don't load profile for other events to prevent role switching
            break
        }
      }
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUserProfile])

  const signIn = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) throw error

    // Update last_login in profiles and load profile
    if (data.user) {
      const updateData = { last_login: new Date().toISOString() }
      await (supabase
        .from('profiles')
        .update as any)(updateData)
        .eq('id', data.user.id)
      
      // Load profile data immediately after sign in
      await loadUserProfile(data.user)
    }

    return data
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    if (error) throw error
    navigate('/login')
  }

  return {
    user,
    loading,
    signIn,
    signOut,
  }
}

