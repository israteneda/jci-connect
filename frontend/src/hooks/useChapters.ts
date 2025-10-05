import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Chapter = Database['public']['Tables']['chapters']['Row']

export function useChapters() {
  const queryClient = useQueryClient()

  // Fetch all chapters using Supabase client
  const { data: chapters, isLoading, error } = useQuery({
    queryKey: ['chapters'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('chapters')
        .select('*')
        .order('name', { ascending: true })

      if (error) throw error
      return data as Chapter[]
    },
  })

  // Get single chapter with members
  const getChapter = async (chapterId: string) => {
    const { data, error } = await supabase
      .from('chapters')
      .select(`
        *,
        memberships(*)
      `)
      .eq('id', chapterId)
      .single()

    if (error) throw error
    return data
  }

  // Create chapter using Supabase client
  const createChapter = useMutation({
    mutationFn: async (chapterData: Database['public']['Tables']['chapters']['Insert']) => {
      const { data, error } = await supabase
        .from('chapters')
        .insert(chapterData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
    },
  })

  // Update chapter using Supabase client
  const updateChapter = useMutation({
    mutationFn: async ({
      id,
      ...updates
    }: { id: string } & Partial<Database['public']['Tables']['chapters']['Update']>) => {
      const { data, error } = await supabase
        .from('chapters')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
    },
  })

  // Delete chapter using Supabase client
  const deleteChapter = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('chapters')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['chapters'] })
    },
  })

  return {
    chapters,
    isLoading,
    error,
    getChapter,
    createChapter,
    updateChapter,
    deleteChapter,
  }
}

