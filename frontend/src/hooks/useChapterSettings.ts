import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type ChapterSettings = Database['public']['Tables']['chapter_settings']['Row']
type ChapterSettingsUpdate = Database['public']['Tables']['chapter_settings']['Update']

const SETTINGS_ID = '00000000-0000-0000-0000-000000000001'

/**
 * Hook for managing chapter settings
 * 
 * Provides access to organization/chapter configuration
 */
export function useChapterSettings() {
  const queryClient = useQueryClient()

  /**
   * Fetch chapter settings
   */
  const { data: settings, isLoading, error } = useQuery({
    queryKey: ['chapter-settings'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chapter_settings')
        .select('*')
        .eq('id', SETTINGS_ID)
        .single()

      if (error) throw error
      return data as ChapterSettings
    },
  })

  /**
   * Update chapter settings
   */
  const updateSettings = useMutation({
    mutationFn: async (updates: ChapterSettingsUpdate) => {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString(),
      }
      
      const { data, error } = await supabase
        .from('chapter_settings')
        .update(updateData as any)
        .eq('id', SETTINGS_ID)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapter-settings'] })
    },
  })

  return {
    settings,
    isLoading,
    error,
    updateSettings,
  }
}

