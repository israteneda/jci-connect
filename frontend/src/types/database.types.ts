export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          role: 'admin' | 'senator' | 'member' | 'candidate'
          status: 'active' | 'inactive' | 'suspended' | 'pending'
          first_name: string
          last_name: string
          phone: string | null
          date_of_birth: string | null
          avatar_url: string | null
          bio: string | null
          linkedin_url: string | null
          address: string | null
          language_preference: 'en' | 'es'
          last_login: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          role?: 'admin' | 'senator' | 'member' | 'candidate'
          status?: 'active' | 'inactive' | 'suspended' | 'pending'
          first_name: string
          last_name: string
          phone?: string | null
          date_of_birth?: string | null
          avatar_url?: string | null
          bio?: string | null
          linkedin_url?: string | null
          address?: string | null
          language_preference?: 'en' | 'es'
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          role?: 'admin' | 'senator' | 'member' | 'candidate'
          status?: 'active' | 'inactive' | 'suspended' | 'pending'
          first_name?: string
          last_name?: string
          phone?: string | null
          date_of_birth?: string | null
          avatar_url?: string | null
          bio?: string | null
          linkedin_url?: string | null
          address?: string | null
          language_preference?: 'en' | 'es'
          last_login?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      memberships: {
        Row: {
          id: string
          user_id: string
          membership_type: 'local' | 'senator' | 'national' | 'international'
          status: 'active' | 'expired' | 'suspended'
          start_date: string
          expiry_date: string
          member_number: string
          payment_status: 'paid' | 'pending' | 'overdue'
          payment_type: 'annual' | 'monthly'
          annual_fee: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          membership_type?: 'local' | 'senator' | 'national' | 'international'
          status?: 'active' | 'expired' | 'suspended'
          start_date: string
          expiry_date: string
          member_number: string
          payment_status?: 'paid' | 'pending' | 'overdue'
          payment_type?: 'annual' | 'monthly'
          annual_fee?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          membership_type?: 'local' | 'senator' | 'national' | 'international'
          status?: 'active' | 'expired' | 'suspended'
          start_date?: string
          expiry_date?: string
          member_number?: string
          payment_status?: 'paid' | 'pending' | 'overdue'
          payment_type?: 'annual' | 'monthly'
          annual_fee?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      board_positions: {
        Row: {
          id: string
          user_id: string
          position_title: string
          level: 'local' | 'national' | 'international'
          start_date: string | null
          end_date: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          position_title: string
          level: 'local' | 'national' | 'international'
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          position_title?: string
          level?: 'local' | 'national' | 'international'
          start_date?: string | null
          end_date?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chapter_settings: {
        Row: {
          id: string
          chapter_name: string
          chapter_city: string | null
          chapter_country: string | null
          description: string | null
          email: string | null
          phone: string | null
          website: string | null
          logo_url: string | null
          primary_color: string
          secondary_color: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          chapter_name?: string
          chapter_city?: string | null
          chapter_country?: string | null
          description?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          chapter_name?: string
          chapter_city?: string | null
          chapter_country?: string | null
          description?: string | null
          email?: string | null
          phone?: string | null
          website?: string | null
          logo_url?: string | null
          primary_color?: string
          secondary_color?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}

