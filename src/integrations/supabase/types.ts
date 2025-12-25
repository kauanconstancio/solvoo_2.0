export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string
        }
        Insert: {
          action: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type: string
        }
        Update: {
          action?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string
        }
        Relationships: []
      }
      appointments: {
        Row: {
          client_confirmed: boolean | null
          client_id: string
          conversation_id: string | null
          created_at: string
          description: string | null
          duration_minutes: number
          id: string
          location: string | null
          notes: string | null
          professional_confirmed: boolean | null
          professional_id: string
          quote_id: string | null
          reminder_24h_sent: boolean | null
          reminder_sent: boolean | null
          scheduled_date: string
          scheduled_time: string
          service_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_confirmed?: boolean | null
          client_id: string
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          notes?: string | null
          professional_confirmed?: boolean | null
          professional_id: string
          quote_id?: string | null
          reminder_24h_sent?: boolean | null
          reminder_sent?: boolean | null
          scheduled_date: string
          scheduled_time: string
          service_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          client_confirmed?: boolean | null
          client_id?: string
          conversation_id?: string | null
          created_at?: string
          description?: string | null
          duration_minutes?: number
          id?: string
          location?: string | null
          notes?: string | null
          professional_confirmed?: boolean | null
          professional_id?: string
          quote_id?: string | null
          reminder_24h_sent?: boolean | null
          reminder_sent?: boolean | null
          scheduled_date?: string
          scheduled_time?: string
          service_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "appointments_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      bank_accounts: {
        Row: {
          account_holder_document: string
          account_holder_name: string
          account_number: string | null
          account_type: string
          agency: string | null
          bank_code: string | null
          bank_name: string | null
          created_at: string
          id: string
          is_default: boolean | null
          pix_key: string | null
          pix_key_type: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          account_holder_document: string
          account_holder_name: string
          account_number?: string | null
          account_type?: string
          agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          account_holder_document?: string
          account_holder_name?: string
          account_number?: string | null
          account_type?: string
          agency?: string | null
          bank_code?: string | null
          bank_name?: string | null
          created_at?: string
          id?: string
          is_default?: boolean | null
          pix_key?: string | null
          pix_key_type?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      conversation_clearances: {
        Row: {
          cleared_at: string
          conversation_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          cleared_at?: string
          conversation_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          cleared_at?: string
          conversation_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_clearances_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          client_id: string
          created_at: string
          id: string
          last_message_at: string
          professional_id: string
          service_id: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          id?: string
          last_message_at?: string
          professional_id: string
          service_id?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          id?: string
          last_message_at?: string
          professional_id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          service_category: string | null
          service_id: string
          service_image: string | null
          service_price: string | null
          service_provider: string | null
          service_subcategory: string | null
          service_title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          service_category?: string | null
          service_id: string
          service_image?: string | null
          service_price?: string | null
          service_provider?: string | null
          service_subcategory?: string | null
          service_title: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          service_category?: string | null
          service_id?: string
          service_image?: string | null
          service_price?: string | null
          service_provider?: string | null
          service_subcategory?: string | null
          service_title?: string
          user_id?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          file_name: string | null
          file_url: string | null
          id: string
          message_type: string | null
          read_at: string | null
          reply_to_id: string | null
          sender_id: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message_type?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          file_name?: string | null
          file_url?: string | null
          id?: string
          message_type?: string | null
          read_at?: string | null
          reply_to_id?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_reply_to_id_fkey"
            columns: ["reply_to_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_type: string | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          cpf: string | null
          created_at: string
          full_name: string | null
          id: string
          phone: string | null
          state: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          account_type?: string | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          cpf?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          phone?: string | null
          state?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      quotes: {
        Row: {
          client_confirmed: boolean | null
          client_confirmed_at: string | null
          client_id: string
          client_response: string | null
          completed_at: string | null
          conversation_id: string
          created_at: string
          description: string | null
          expires_at: string
          id: string
          pix_br_code: string | null
          pix_br_code_base64: string | null
          pix_expires_at: string | null
          pix_id: string | null
          price: number
          professional_id: string
          responded_at: string | null
          service_id: string | null
          status: string
          title: string
          updated_at: string
          validity_days: number
        }
        Insert: {
          client_confirmed?: boolean | null
          client_confirmed_at?: string | null
          client_id: string
          client_response?: string | null
          completed_at?: string | null
          conversation_id: string
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          pix_br_code?: string | null
          pix_br_code_base64?: string | null
          pix_expires_at?: string | null
          pix_id?: string | null
          price: number
          professional_id: string
          responded_at?: string | null
          service_id?: string | null
          status?: string
          title: string
          updated_at?: string
          validity_days?: number
        }
        Update: {
          client_confirmed?: boolean | null
          client_confirmed_at?: string | null
          client_id?: string
          client_response?: string | null
          completed_at?: string | null
          conversation_id?: string
          created_at?: string
          description?: string | null
          expires_at?: string
          id?: string
          pix_br_code?: string | null
          pix_br_code_base64?: string | null
          pix_expires_at?: string | null
          pix_id?: string | null
          price?: number
          professional_id?: string
          responded_at?: string | null
          service_id?: string | null
          status?: string
          title?: string
          updated_at?: string
          validity_days?: number
        }
        Relationships: [
          {
            foreignKeyName: "quotes_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "quotes_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          reason: string
          reported_review_id: string | null
          reported_service_id: string | null
          reported_user_id: string | null
          reporter_id: string | null
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          reason: string
          reported_review_id?: string | null
          reported_service_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          reason?: string
          reported_review_id?: string | null
          reported_service_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_review_id_fkey"
            columns: ["reported_review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_service_id_fkey"
            columns: ["reported_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          comment: string | null
          created_at: string
          id: string
          rating: number
          service_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          comment?: string | null
          created_at?: string
          id?: string
          rating: number
          service_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          comment?: string | null
          created_at?: string
          id?: string
          rating?: number
          service_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      service_views: {
        Row: {
          id: string
          service_id: string
          view_date: string | null
          viewed_at: string
          viewer_id: string | null
        }
        Insert: {
          id?: string
          service_id: string
          view_date?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Update: {
          id?: string
          service_id?: string
          view_date?: string | null
          viewed_at?: string
          viewer_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_views_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          category: string
          city: string
          created_at: string
          description: string
          favorites_count: number
          id: string
          images: string[] | null
          phone: string | null
          price: string
          price_type: string
          slug: string | null
          state: string
          status: string
          subcategory: string | null
          title: string
          updated_at: string
          user_id: string
          verified: boolean
          views_count: number
          whatsapp: string | null
        }
        Insert: {
          category: string
          city: string
          created_at?: string
          description: string
          favorites_count?: number
          id?: string
          images?: string[] | null
          phone?: string | null
          price: string
          price_type?: string
          slug?: string | null
          state: string
          status?: string
          subcategory?: string | null
          title: string
          updated_at?: string
          user_id: string
          verified?: boolean
          views_count?: number
          whatsapp?: string | null
        }
        Update: {
          category?: string
          city?: string
          created_at?: string
          description?: string
          favorites_count?: number
          id?: string
          images?: string[] | null
          phone?: string | null
          price?: string
          price_type?: string
          slug?: string | null
          state?: string
          status?: string
          subcategory?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          verified?: boolean
          views_count?: number
          whatsapp?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "services_user_id_profiles_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wallet_transactions: {
        Row: {
          amount: number
          bank_account_id: string | null
          created_at: string
          customer_name: string | null
          description: string
          fee: number
          id: string
          net_amount: number
          processed_at: string | null
          processed_by: string | null
          quote_id: string | null
          rejection_reason: string | null
          status: string
          type: string
          user_id: string
        }
        Insert: {
          amount: number
          bank_account_id?: string | null
          created_at?: string
          customer_name?: string | null
          description: string
          fee?: number
          id?: string
          net_amount: number
          processed_at?: string | null
          processed_by?: string | null
          quote_id?: string | null
          rejection_reason?: string | null
          status?: string
          type: string
          user_id: string
        }
        Update: {
          amount?: number
          bank_account_id?: string | null
          created_at?: string
          customer_name?: string | null
          description?: string
          fee?: number
          id?: string
          net_amount?: number
          processed_at?: string | null
          processed_by?: string | null
          quote_id?: string | null
          rejection_reason?: string | null
          status?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wallet_transactions_bank_account_id_fkey"
            columns: ["bank_account_id"]
            isOneToOne: false
            referencedRelation: "bank_accounts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wallet_transactions_quote_id_fkey"
            columns: ["quote_id"]
            isOneToOne: false
            referencedRelation: "quotes"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      generate_slug: { Args: { title: string }; Returns: string }
      has_any_role: { Args: { _user_id: string }; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_views: { Args: { service_id: string }; Returns: undefined }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      unaccent: { Args: { "": string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "moderator" | "support"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "support"],
    },
  },
} as const
