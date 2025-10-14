import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type Template = Database['public']['Tables']['message_templates']['Row']
type TemplateInsert = Database['public']['Tables']['message_templates']['Insert']
type TemplateUpdate = Database['public']['Tables']['message_templates']['Update']

/**
 * Hook for managing message templates
 */
export function useTemplates() {
  const queryClient = useQueryClient()

  /**
   * Fetch all templates
   */
  const { data: templates, isLoading, error } = useQuery({
    queryKey: ['templates'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('message_templates')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as Template[]
    },
  })

  /**
   * Fetch a single template by ID
   */
  const { data: template, isLoading: isLoadingTemplate } = useQuery({
    queryKey: ['template'],
    queryFn: async () => {
      // This will be used by TemplateEditor with a specific templateId
      return null
    },
    enabled: false, // Disabled by default, will be enabled when templateId is provided
  })

  /**
   * Create a new template
   */
  const createTemplate = useMutation({
    mutationFn: async (templateData: TemplateInsert) => {
      const { data, error } = await supabase
        .from('message_templates')
        .insert(templateData)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  /**
   * Update an existing template
   */
  const updateTemplate = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: TemplateUpdate }) => {
      const { data, error } = await supabase
        .from('message_templates')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
      queryClient.invalidateQueries({ queryKey: ['template'] })
    },
  })

  /**
   * Delete a template
   */
  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('message_templates')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] })
    },
  })

  /**
   * Fetch a single template by ID
   */
  const fetchTemplate = async (id: string): Promise<Template | null> => {
    const { data, error } = await supabase
      .from('message_templates')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Template not found
      }
      throw error
    }
    return data
  }

  return {
    templates,
    template,
    isLoading,
    isLoadingTemplate,
    error,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    fetchTemplate,
  }
}
