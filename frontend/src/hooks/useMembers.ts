import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { triggerN8nWebhook } from '@/lib/webhooks'
import { generateMemberNumber } from '@/lib/utils'
import type { Database } from '@/types/database.types'

type Member = Database['public']['Tables']['profiles']['Row'] & {
  email?: string // From auth.users
  memberships: Database['public']['Tables']['memberships']['Row'] & {
    chapters: Database['public']['Tables']['chapters']['Row']
  }
}

interface CreateMemberData {
  email: string
  password: string
  role: 'admin' | 'member' | 'candidate'
  first_name: string
  last_name: string
  phone?: string
  date_of_birth?: string
  city?: string
  country?: string
  chapter_id?: string  // Optional for candidates and admins without membership
  membership_type?: 'local' | 'national' | 'international'
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
      // Fetch memberships with chapters
      const { data: memberships, error: membershipsError } = await supabase
        .from('memberships')
        .select(`
          *,
          chapters(*)
        `)
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
            memberships: {
              ...membership,
              chapters: membership.chapters
            }
          } as Member
        })
      )

      // Filter out any null values
      return membersWithEmails.filter(m => m !== null) as Member[]
    },
  })

  // Get single member
  const getMember = async (userId: string): Promise<Member> => {
    // Fetch membership with chapter
    const membershipResult = await supabase
      .from('memberships')
      .select(`
        *,
        chapters(*)
      `)
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
      memberships: {
        ...membershipData,
        chapters: membershipData.chapters
      }
    }

    return member
  }

  // Create member using Supabase client
  const createMember = useMutation({
    mutationFn: async (memberData: CreateMemberData) => {
      // 1. Create auth user (profile is auto-created by trigger)
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: memberData.email,
        password: memberData.password,
        options: {
          data: {
            first_name: memberData.first_name,
            last_name: memberData.last_name,
            role: memberData.role,
          },
        },
      })

      if (authError) throw authError
      if (!authData.user) throw new Error('Failed to create user')

      const userId = authData.user.id

      // 2. Update profile with additional data
      const { error: profileError } = await (supabase
        .from('profiles')
        .update as any)({
          role: memberData.role,
          phone: memberData.phone,
          date_of_birth: memberData.date_of_birth,
          city: memberData.city,
          country: memberData.country,
          status: memberData.role === 'candidate' ? 'pending' : 'active',
        })
        .eq('id', userId)

      if (profileError) throw profileError

      let memberNumber: string | undefined

      // 3. Create membership (only if chapter_id is provided)
      if (memberData.chapter_id && memberData.membership_type && memberData.start_date && memberData.expiry_date) {
        // Get chapter info for member number
        const { data: chapter } = await supabase
          .from('chapters')
          .select('city')
          .eq('id', memberData.chapter_id)
          .single() as any

        memberNumber = generateMemberNumber(
          chapter?.city.substring(0, 3).toUpperCase() || 'UA'
        )

        // Create membership
        const { error: membershipError } = await supabase
          .from('memberships')
          .insert({
            user_id: userId,
            chapter_id: memberData.chapter_id,
            membership_type: memberData.membership_type,
            start_date: memberData.start_date,
            expiry_date: memberData.expiry_date,
            member_number: memberNumber,
            annual_fee: memberData.annual_fee,
            status: 'active',
            payment_status: 'pending',
          } as any)

        if (membershipError) throw membershipError

        // Update chapter member count
        await (supabase.rpc as any)('increment_chapter_members', {
          chapter_id: memberData.chapter_id,
        })
      }

      // 4. Trigger n8n webhook
      await triggerN8nWebhook('member.created', {
        user_id: userId,
        email: memberData.email,
        role: memberData.role,
        first_name: memberData.first_name,
        last_name: memberData.last_name,
        phone: memberData.phone,
        member_number: memberNumber,
        chapter_id: memberData.chapter_id,
        membership_type: memberData.membership_type,
      })

      return { userId, memberNumber }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
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
      // Get chapter_id before deleting
      const { data: membership } = await supabase
        .from('memberships')
        .select('chapter_id')
        .eq('user_id', userId)
        .single() as any

      // Delete profile (cascades from auth.users deletion)
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId)

      if (profileError) throw profileError

      // Delete auth user (admin only)
      const { error } = await supabase.auth.admin.deleteUser(userId)
      if (error) throw error

      // Update chapter member count
      if (membership?.chapter_id) {
        await (supabase.rpc as any)('decrement_chapter_members', {
          chapter_id: membership.chapter_id,
        })
      }

      // Trigger n8n webhook
      await triggerN8nWebhook('member.deleted', { user_id: userId })
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['members'] })
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
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

