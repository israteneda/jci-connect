import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Database } from '@/types/database.types'

type BoardPosition = Database['public']['Tables']['board_positions']['Row']

type BoardPositionInsert = Database['public']['Tables']['board_positions']['Insert']
type BoardPositionUpdate = Database['public']['Tables']['board_positions']['Update']

/**
 * Hook for managing board positions
 * 
 * Provides CRUD operations for member board positions at local, national, and international levels
 */
export function useBoardPositions(userId?: string) {
  const queryClient = useQueryClient()

  /**
   * Fetch all active board positions for a user
   */
  const { data: positions, isLoading, error } = useQuery({
    queryKey: ['board-positions', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('board_positions')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('level', { ascending: true })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as BoardPosition[]
    },
    enabled: !!userId,
  })

  /**
   * Fetch all board positions (including inactive) for a user
   */
  const { data: allPositions } = useQuery({
    queryKey: ['board-positions-all', userId],
    queryFn: async () => {
      if (!userId) return []

      const { data, error } = await supabase
        .from('board_positions')
        .select('*')
        .eq('user_id', userId)
        .order('is_active', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data as BoardPosition[]
    },
    enabled: !!userId,
  })

  /**
   * Create a new board position
   */
  const createPosition = useMutation({
    mutationFn: async (position: BoardPositionInsert) => {
      const { data, error } = await supabase
        .from('board_positions')
        .insert(position as any)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-positions'] })
      queryClient.invalidateQueries({ queryKey: ['board-positions-all'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  /**
   * Update an existing board position
   */
  const updatePosition = useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: BoardPositionUpdate }) => {
      const { data, error } = await supabase
        .from('board_positions')
        .update(updates as any)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-positions'] })
      queryClient.invalidateQueries({ queryKey: ['board-positions-all'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  /**
   * Delete a board position (soft delete by setting is_active to false)
   */
  const deletePosition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('board_positions')
        .update({ is_active: false, end_date: new Date().toISOString().split('T')[0] } as any)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-positions'] })
      queryClient.invalidateQueries({ queryKey: ['board-positions-all'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  /**
   * Hard delete a board position (actually remove from database)
   */
  const hardDeletePosition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('board_positions')
        .delete()
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-positions'] })
      queryClient.invalidateQueries({ queryKey: ['board-positions-all'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  /**
   * Reactivate a board position
   */
  const reactivatePosition = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('board_positions')
        .update({ is_active: true, end_date: null } as any)
        .eq('id', id)

      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['board-positions'] })
      queryClient.invalidateQueries({ queryKey: ['board-positions-all'] })
      queryClient.invalidateQueries({ queryKey: ['members'] })
    },
  })

  return {
    positions,
    allPositions,
    isLoading,
    error,
    createPosition,
    updatePosition,
    deletePosition,
    hardDeletePosition,
    reactivatePosition,
  }
}

/**
 * Helper function to get badge color based on position level
 */
export function getPositionLevelColor(level: 'local' | 'national' | 'international') {
  switch (level) {
    case 'local':
      return 'bg-blue-100 text-blue-800'
    case 'national':
      return 'bg-green-100 text-green-800'
    case 'international':
      return 'bg-purple-100 text-purple-800'
    default:
      return 'bg-gray-100 text-gray-800'
  }
}

/**
 * Helper function to format position display text
 */
export function formatPositionDisplay(position: BoardPosition): string {
  const level = position.level.charAt(0).toUpperCase() + position.level.slice(1)
  return `${position.position_title} (${level})`
}

