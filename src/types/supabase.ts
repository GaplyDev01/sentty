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
      articles: {
        Row: {
          id: string
          title: string
          content: string
          source: string
          url: string
          image_url: string | null
          published_at: string
          created_at: string
          relevance_score: number | null
          category: string
          tags: string[] | null
        }
        Insert: {
          id?: string
          title: string
          content: string
          source: string
          url: string
          image_url?: string | null
          published_at: string
          created_at?: string
          relevance_score?: number | null
          category: string
          tags?: string[] | null
        }
        Update: {
          id?: string
          title?: string
          content?: string
          source?: string
          url?: string
          image_url?: string | null
          published_at?: string
          created_at?: string
          relevance_score?: number | null
          category?: string
          tags?: string[] | null
        }
      }
      user_preferences: {
        Row: {
          id: string
          user_id: string
          keywords: string[] | null
          categories: string[] | null
          sources: string[] | null
          excluded_keywords: string[] | null
          update_frequency: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          keywords?: string[] | null
          categories?: string[] | null
          sources?: string[] | null
          excluded_keywords?: string[] | null
          update_frequency?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          keywords?: string[] | null
          categories?: string[] | null
          sources?: string[] | null
          excluded_keywords?: string[] | null
          update_frequency?: string
          created_at?: string
          updated_at?: string
        }
      }
      profiles: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          role: string
          created_at: string
          last_login: string | null
        }
        Insert: {
          id: string
          email: string
          username: string
          avatar_url?: string | null
          role?: string
          created_at?: string
          last_login?: string | null
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          role?: string
          created_at?: string
          last_login?: string | null
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