// GENERADO AUTOMATICAMENTE — NO EDITAR A MANO.
// Regenerar tras cada migracion:
//   supabase gen types typescript --project-id wcmtrjjalwbchrmlsvow > src/core/supabase/types.ts
// (o desde el MCP de Supabase, que es como se genero este archivo:
//  la CLI no esta instalada en la maquina de trabajo.)

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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      exercises: {
        Row: {
          created_at: string
          deleted_at: string | null
          equipment: string | null
          id: string
          is_unilateral: boolean
          kind: string
          muscle_group: string | null
          name: string
          notes: string | null
          updated_at: string
          user_id: string | null
          video_url: string | null
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          equipment?: string | null
          id: string
          is_unilateral?: boolean
          kind?: string
          muscle_group?: string | null
          name: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          equipment?: string | null
          id?: string
          is_unilateral?: boolean
          kind?: string
          muscle_group?: string | null
          name?: string
          notes?: string | null
          updated_at?: string
          user_id?: string | null
          video_url?: string | null
        }
        Relationships: []
      }
      notifications_log: {
        Row: {
          channel: string
          error: string | null
          id: string
          payload: Json
          rule_id: string | null
          sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          channel: string
          error?: string | null
          id: string
          payload: Json
          rule_id?: string | null
          sent_at?: string
          status: string
          user_id: string
        }
        Update: {
          channel?: string
          error?: string | null
          id?: string
          payload?: Json
          rule_id?: string | null
          sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_log_rule_id_fkey"
            columns: ["rule_id"]
            isOneToOne: false
            referencedRelation: "reminder_rules"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          id: string
          settings: Json
          telegram_chat_id: number | null
          timezone: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          id: string
          settings?: Json
          telegram_chat_id?: number | null
          timezone?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          id?: string
          settings?: Json
          telegram_chat_id?: number | null
          timezone?: string
          updated_at?: string
        }
        Relationships: []
      }
      reminder_rules: {
        Row: {
          active: boolean
          channels: string[]
          config: Json
          created_at: string
          deleted_at: string | null
          id: string
          kind: string
          last_fired_at: string | null
          module: string
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          channels?: string[]
          config: Json
          created_at?: string
          deleted_at?: string | null
          id: string
          kind: string
          last_fired_at?: string | null
          module: string
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          channels?: string[]
          config?: Json
          created_at?: string
          deleted_at?: string | null
          id?: string
          kind?: string
          last_fired_at?: string | null
          module?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      routine_days: {
        Row: {
          created_at: string
          id: string
          label: string
          position: number
          routine_id: string
          updated_at: string
          user_id: string
          week_number: number
          weekday: number | null
        }
        Insert: {
          created_at?: string
          id: string
          label: string
          position: number
          routine_id: string
          updated_at?: string
          user_id: string
          week_number?: number
          weekday?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          position?: number
          routine_id?: string
          updated_at?: string
          user_id?: string
          week_number?: number
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "routine_days_routine_id_fkey"
            columns: ["routine_id"]
            isOneToOne: false
            referencedRelation: "routines"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          notes: string | null
          position: number
          rest_seconds: number | null
          routine_day_id: string
          target_distance_m: number | null
          target_duration_seconds: number | null
          target_reps_max: number | null
          target_reps_min: number | null
          target_rir: number | null
          target_sets: number | null
          target_weight: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id: string
          notes?: string | null
          position: number
          rest_seconds?: number | null
          routine_day_id: string
          target_distance_m?: number | null
          target_duration_seconds?: number | null
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_rir?: number | null
          target_sets?: number | null
          target_weight?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          notes?: string | null
          position?: number
          rest_seconds?: number | null
          routine_day_id?: string
          target_distance_m?: number | null
          target_duration_seconds?: number | null
          target_reps_max?: number | null
          target_reps_min?: number | null
          target_rir?: number | null
          target_sets?: number | null
          target_weight?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "routine_exercises_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
        ]
      }
      routines: {
        Row: {
          active: boolean
          created_at: string
          deleted_at: string | null
          ends_on: string | null
          id: string
          imported_file_name: string | null
          name: string
          source: string | null
          starts_on: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          ends_on?: string | null
          id: string
          imported_file_name?: string | null
          name: string
          source?: string | null
          starts_on?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          active?: boolean
          created_at?: string
          deleted_at?: string | null
          ends_on?: string | null
          id?: string
          imported_file_name?: string | null
          name?: string
          source?: string | null
          starts_on?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      session_exercises: {
        Row: {
          created_at: string
          exercise_id: string
          id: string
          planned: Json
          position: number
          routine_exercise_id: string | null
          session_id: string
          skipped: boolean
          substituted_from_exercise_id: string | null
          substitution_reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          exercise_id: string
          id: string
          planned?: Json
          position: number
          routine_exercise_id?: string | null
          session_id: string
          skipped?: boolean
          substituted_from_exercise_id?: string | null
          substitution_reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          exercise_id?: string
          id?: string
          planned?: Json
          position?: number
          routine_exercise_id?: string | null
          session_id?: string
          skipped?: boolean
          substituted_from_exercise_id?: string | null
          substitution_reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_routine_exercise_id_fkey"
            columns: ["routine_exercise_id"]
            isOneToOne: false
            referencedRelation: "routine_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_substituted_from_exercise_id_fkey"
            columns: ["substituted_from_exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
        ]
      }
      set_logs: {
        Row: {
          created_at: string
          distance_m: number | null
          duration_seconds: number | null
          id: string
          is_warmup: boolean
          logged_at: string
          note: string | null
          reps: number | null
          rir: number | null
          session_exercise_id: string
          set_index: number
          tags: string[]
          updated_at: string
          user_id: string
          weight: number | null
        }
        Insert: {
          created_at?: string
          distance_m?: number | null
          duration_seconds?: number | null
          id: string
          is_warmup?: boolean
          logged_at?: string
          note?: string | null
          reps?: number | null
          rir?: number | null
          session_exercise_id: string
          set_index: number
          tags?: string[]
          updated_at?: string
          user_id: string
          weight?: number | null
        }
        Update: {
          created_at?: string
          distance_m?: number | null
          duration_seconds?: number | null
          id?: string
          is_warmup?: boolean
          logged_at?: string
          note?: string | null
          reps?: number | null
          rir?: number | null
          session_exercise_id?: string
          set_index?: number
          tags?: string[]
          updated_at?: string
          user_id?: string
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "set_logs_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "session_exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "set_logs_session_exercise_id_fkey"
            columns: ["session_exercise_id"]
            isOneToOne: false
            referencedRelation: "v_session_exercise_summary"
            referencedColumns: ["session_exercise_id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          deleted_at: string | null
          ended_at: string | null
          id: string
          notes: string | null
          perceived_effort: number | null
          routine_day_id: string | null
          started_at: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          ended_at?: string | null
          id: string
          notes?: string | null
          perceived_effort?: number | null
          routine_day_id?: string | null
          started_at: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          ended_at?: string | null
          id?: string
          notes?: string | null
          perceived_effort?: number | null
          routine_day_id?: string | null
          started_at?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workout_sessions_routine_day_id_fkey"
            columns: ["routine_day_id"]
            isOneToOne: false
            referencedRelation: "routine_days"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      v_session_exercise_summary: {
        Row: {
          avg_rir: number | null
          e1rm: number | null
          exercise_id: string | null
          session_exercise_id: string | null
          session_id: string | null
          started_at: string | null
          tonnage: number | null
          top_weight: number | null
          user_id: string | null
          work_sets: number | null
        }
        Relationships: [
          {
            foreignKeyName: "session_exercises_exercise_id_fkey"
            columns: ["exercise_id"]
            isOneToOne: false
            referencedRelation: "exercises"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "session_exercises_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "workout_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
