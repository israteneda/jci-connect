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

  const loadUserProfile = useCallback(async (authUser: User | null) => {
    if (!authUser) {
      setUser(null)
      loadingProfile.current = false
      return
    }

    // Prevent duplicate fetches
    if (loadingProfile.current) {
      return
    }

    loadingProfile.current = true

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
        console.error('Error fetching profile:', error)
        // Set user without profile data if fetch fails
        setUser({
          ...authUser,
          role: 'candidate',
          profile: undefined,
        })
        return
      }

      // Profile loaded successfully
      const profileData = profile as any
      setUser({
        ...authUser,
        role: profileData?.role || 'candidate',
        profile: profileData,
      })
    } catch (error) {
      console.error('Exception loading profile:', error)
      // Set user without profile data on exception (includes timeout)
      setUser({
        ...authUser,
        role: 'candidate',
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
    }).catch((error) => {
      console.error('Error getting session:', error)
      if (mounted) {
        setLoading(false)
      }
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (mounted) {
        console.log('🔄 Auth state changed:', event, session ? 'Session exists' : 'No session')
        
        // Handle different auth events
        switch (event) {
          case 'SIGNED_IN':
            console.log('✅ User signed in')
            break
          case 'SIGNED_OUT':
            console.log('❌ User signed out')
            setUser(null)
            break
          case 'TOKEN_REFRESHED':
            console.log('🔄 Token refreshed successfully')
            break
          case 'PASSWORD_RECOVERY':
            console.log('🔑 Password recovery initiated')
            break
          default:
            console.log('🔄 Auth event:', event)
        }
        
        await loadUserProfile(session?.user ?? null)
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

