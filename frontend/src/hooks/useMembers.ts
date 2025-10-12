import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { triggerN8nWebhook } from '@/lib/webhooks'
import { generateMemberNumber } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type Member = Database['public']['Tables']['profiles']['Row'] & {
  email?: string // From auth.users
  memberships: Database['public']['Tables']['memberships']['Row']
}

interface CreateMemberData {
  email: string
  password: string
  role: 'guest' | 'prospective' | 'member' | 'admin'
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
  // Note: Fetches anyone with a membership record (includes admin-members)
  const { data: members, isLoading, error } = useQuery({
    queryKey: ['members'],
    queryFn: async () => {
      // Fetch memberships
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select('*')
        .order('created_at', { ascending: false })

      if (membershipsError) throw membershipsError
      if (!memberships) return []

      const membershipsData = memberships as any[]

      // Get user IDs from memberships
      const userIds = membershipsData.map(m => m.user_id)

      // Fetch profiles for those users
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .in('id', userIds)

      if (profilesError) throw profilesError
      if (!profiles) return []

      const profilesData = profiles as any[]

      // Create a map of profiles by id for quick lookup
      const profileMap = new Map(profilesData.map(p => [p.id, p]))

      // Reshape data to match Member type and fetch emails
      const membersWithEmails = await Promise.all(
        membershipsData.map(async (membership: any) => {
          const profile = profileMap.get(membership.user_id)
          if (!profile) return null

          const { data: email } = await (supabase.rpc as any)('get_user_email', {
            user_id: profile.id
          })
          
          return {
            ...profile,
            email: email || null,
            memberships: membership
          } as Member
        })
      )

      // Filter out any null values
      return membersWithEmails.filter(m => m !== null) as Member[]
    },
  })

  // Get single member
  const getMember = async (userId: string): Promise<Member> => {
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
  }

  // Create member using Supabase client
  const createMember = useMutation({
    mutationFn: async (memberData: CreateMemberData) => {
      // 1. Create auth user
      // Profile is auto-created by trigger: handle_new_user()
      // NOTE: Email confirmation must be disabled in Supabase project settings
      // Dashboard > Authentication > Email Auth > Enable email confirmations = OFF
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: memberData.email,
        password: memberData.password,
        options: {
          data: {
            first_name: memberData.first_name,
            last_name: memberData.last_name,
            role: memberData.role,
            status: memberData.role === 'prospective' ? 'pending' : 'active',
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

      let memberNumber: string | undefined

      // 4. Create membership (if membership data is provided)
      if (memberData.membership_type && memberData.start_date && memberData.expiry_date) {
        // Generate member number - use first 3 chars of address or fallback to JCI
        const addressPrefix = memberData.address?.split(',')[0]?.trim().substring(0, 3).toUpperCase() || 'JCI'
        memberNumber = generateMemberNumber(addressPrefix)

        // Create membership
        const { error: membershipError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            membership_type: memberData.membership_type,
            payment_type: memberData.payment_type || 'annual',
            start_date: memberData.start_date,
            expiry_date: memberData.expiry_date,
            member_number: memberNumber,
            annual_fee: memberData.annual_fee,
            status: 'active',
            payment_status: 'pending',
          } as any)

        if (membershipError) {
          throw new Error(`Failed to create membership: ${membershipError.message}. User was created but membership creation failed. User ID: ${userId}`)
        }
      }

      // 5. Trigger n8n webhook
      await triggerN8nWebhook('member.created', {
        user_id: userId,
        email: memberData.email,
        role: memberData.role,
        first_name: memberData.first_name,
        last_name: memberData.last_name,
        phone: memberData.phone,
        member_number: memberNumber,
        membership_type: memberData.membership_type,
      })

      return { userId, memberNumber }
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

      // Trigger n8n webhook
      const { data: member } = await supabase
        .from('profiles')
        .select('*, memberships(*)')
        .eq('id', userId)
        .single() as any

      if (member) {
        await triggerN8nWebhook('member.updated', {
          user_id: userId,
          ...member,
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

      // Trigger n8n webhook
      await triggerN8nWebhook('member.deleted', { user_id: userId })
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

