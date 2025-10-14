import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { sendWelcomeEmail } from '../lib/email'
import type { Database } from '@/types/database.types'

type Member = Database['public']['Tables']['profiles']['Row'] & {
  email?: string // From auth.users
  memberships: Database['public']['Tables']['memberships']['Row']
}

interface CreateMemberData {
  email: string
  password?: string
  role: 'guest' | 'prospective' | 'member'
  first_name: string
  last_name: string
  phone?: string
  date_of_birth?: string
  address?: string
  diet_restrictions?: string
  membership_type?: 'local' | 'national' | 'international'
  payment_type?: 'annual' | 'monthly'
  start_date?: string
  expiry_date?: string
  annual_fee?: number
}

export function useMembers() {
  const queryClient = useQueryClient()

  // Fetch all members using Supabase client
  // Note: Fetches all profiles (users with or without memberships)
  const { data: members, isLoading, error } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      // Fetch all profiles first (excluding admin users)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .neq('role', 'admin')
        .order('created_at', { ascending: false })

      if (profilesError) throw profilesError
      if (!profiles) return []

      const profilesData = profiles as any[]

      // Get user IDs from profiles
      const userIds = profilesData.map(p => p.id)

      // Fetch memberships for those users (if any exist)
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('*')
        .in('user_id', userIds)

      if (membershipsError) throw membershipsError

      // Create a map of memberships by user_id
      const membershipsMap = new Map()
      if (memberships) {
        memberships.forEach(membership => {
          membershipsMap.set(membership.user_id, membership)
        })
      }

      // Reshape data to match Member type and fetch emails
      const membersWithEmails = await Promise.all(
        profilesData.map(async (profile: any) => {
          const { data: email } = await (supabase.rpc as any)('get_user_email', {
            user_id: profile.id
          })
          
          return {
            ...profile,
            email: email || null,
            memberships: membershipsMap.get(profile.id) || null
          } as Member
        })
      )

      return membersWithEmails
    },
  })

  // Get single member - memoized to prevent infinite loops
  const getMember = useCallback(async (userId: string): Promise<Member> => {
    // Fetch membership
    const membershipResult = await supabase
      .from('memberships')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (membershipResult.error) throw membershipResult.error

    const membershipData: any = membershipResult.data

    // Fetch profile
    const profileResult = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()

    if (profileResult.error) throw profileResult.error

    const profileData: any = profileResult.data
    
    // Fetch email using secure Postgres function
    const emailResult = await (supabase.rpc as any)('get_user_email', {
      user_id: userId
    })
    
    const member: Member = {
      ...profileData,
      email: emailResult.data || null,
      memberships: membershipData
    }

    return member
  }, [])

  // Create member using Supabase client
  const createMember = useMutation({
    mutationFn: async (memberData: CreateMemberData) => {
      // 1. Create auth user
      // Profile is auto-created by trigger: handle_new_user()
      // NOTE: Email confirmation must be disabled in Supabase project settings
      // Dashboard > Authentication > Email Auth > Enable email confirmations = OFF
      // Use default password from environment if none provided
      const password = memberData.password || import.meta.env.VITE_DEFAULT_USER_PASSWORD

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: memberData.email,
        password: password,
        options: {
          data: {
            first_name: memberData.first_name,
            last_name: memberData.last_name,
            phone: memberData.phone || '+1000000000', // Ensure phone is not null (10 digits)
            role: memberData.role,
            status: memberData.role === 'prospective' ? 'pending' : 'active',
            temp_password: !memberData.password, // Flag to indicate if using default password
          },
          emailRedirectTo: undefined, // Prevent confirmation email redirect
        },
      })

      if (authError) {
        // More descriptive error message
        throw new Error(`Failed to create user: ${authError.message}`)
      }
      
      if (!authData.user) {
        throw new Error('Failed to create user - no user data returned')
      }

      const userId = authData.user.id

      // 2. Wait for profile to be created by trigger and verify it exists
      let profileExists = false
      let retries = 0
      const maxRetries = 10
      
      while (!profileExists && retries < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 300))
        
        // Use maybeSingle() instead of single() to avoid error when profile doesn't exist yet
        const { data: profile, error: checkError } = await supabase
          .from('profiles')
          .select('id')
          .eq('id', userId)
          .maybeSingle()
        
        // If profile exists (not null) and no error, we're good
        if (profile !== null && !checkError) {
          profileExists = true
        } else {
          retries++
        }
      }

      if (!profileExists) {
        throw new Error('Profile creation timed out. Please check if the user was created in Supabase Auth and try again.')
      }

      // 3. Update profile with additional data
      const { error: profileError } = await (supabase
        .from('profiles')
        .update as any)({
          role: memberData.role,
          phone: memberData.phone,
          date_of_birth: memberData.date_of_birth,
          address: memberData.address,
          diet_restrictions: memberData.diet_restrictions,
          status: memberData.role === 'prospective' ? 'pending' : 'active',
        })
        .eq('id', userId)

      if (profileError) {
        throw new Error(`Failed to update profile: ${profileError.message}`)
      }

      // 4. Send welcome email with user data
      await sendWelcomeEmail({
        email: memberData.email,
        first_name: memberData.first_name,
        last_name: memberData.last_name,
        role: memberData.role,
        member_number: undefined, // No membership number since we're not creating membership
        temp_password: !memberData.password, // Flag to indicate if using default password
        password: password // Use the actual password that was set (either provided or default)
      })

      return { userId }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  // Update member using Supabase client
  const updateMember = useMutation({
    mutationFn: async ({
      userId,
      profileData,
      membershipData,
    }: {
      userId: string
      profileData?: Partial<Database['public']['Tables']['profiles']['Update']>
      membershipData?: Partial<Database['public']['Tables']['memberships']['Update']>
    }) => {
      // Update profile if provided
      if (profileData) {
        const { error } = await (supabase
          .from('profiles')
          .update as any)({
            ...profileData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)

        if (error) throw error
      }

      // Update membership if provided
      if (membershipData) {
        const updateData = {
          ...membershipData,
          updated_at: new Date().toISOString(),
        }
        const { error } = await (supabase
          .from('memberships')
          .update as any)(updateData)
          .eq('user_id', userId)

        if (error) throw error
      }

      // Send update notification email
      const { data: member } = await supabase
        .from('profiles')
        .select('*, memberships(*)')
        .eq('id', userId)
        .single() as any

      if (member) {
        await sendWelcomeEmail({
          email: member.email,
          first_name: member.first_name,
          last_name: member.last_name,
          role: member.role,
          member_number: member.memberships?.member_number,
          is_update: true
        })
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  // Delete member using Supabase client
  const deleteMember = useMutation({
    mutationFn: async (userId: string) => {
      // Use secure database function to delete user
      // This function checks admin permissions and cascades deletion
      const result = await (supabase.rpc as any)('delete_user', {
        target_user_id: userId
      })

      const data = result.data as { success: boolean; error?: string } | null
      const error = result.error

      if (error) {
        throw new Error(`Failed to delete user: ${error.message}`)
      }

      // Check if the function returned an error
      if (data && !data.success) {
        throw new Error(data.error || 'Failed to delete user')
      }

      // Send deletion notification email to admins
      await sendWelcomeEmail({
        email: 'admin@jci-connect.com', // Admin notification email
        first_name: 'Admin',
        last_name: 'User',
        role: 'admin',
        is_deletion: true,
        deleted_user_id: userId
      })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  return {
    members,
    isLoading,
    error,
    getMember,
    createMember,
    updateMember,
    deleteMember,
  }
}

