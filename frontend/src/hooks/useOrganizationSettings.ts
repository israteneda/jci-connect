import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type OrganizationSettings = Database['public']['Tables']['organization_settings']['Row']
type OrganizationSettingsUpdate = Database['public']['Tables']['organization_settings']['Update']

const SETTINGS_ID = '00000000-0000-0000-0000-000000000000'

/**
 * Hook for managing organization settings
 * 
 * Provides access to organization configuration
 */
export function useOrganizationSettings() {
  const queryClient = useQueryClient()

  /**
   * Fetch organization settings
   */
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['organization-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('organization_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .maybeSingle()

      if (error) throw error
      if (!data) {
        throw new Error('Organization settings not found. Please run database migrations.')
      }
      return data as OrganizationSettings
    },
  })

  /**
   * Update organization settings
   */
  const updateSettings = useMutation({
    mutationFn: async (updates: OrganizationSettingsUpdate) => {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }
      
      const { data, error } = await (supabase
        .from('organization_settings')
        .update as any)(updateData)
        .eq('id', SETTINGS_ID)
        .select()
        .maybeSingle()

      if (error) throw error
      if (!data) {
        throw new Error('Failed to update organization settings')
      }
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organization-settings'] })
    },
  })

  return {
    settings,
    isLoading,
    error,
    updateSettings,
  }
}

