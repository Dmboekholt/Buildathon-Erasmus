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
      artifacts: {
        Row: {
          file_name: string
          file_path: string
          id: string
          task_id: string
          uploaded_at: string
        }
        Insert: {
          file_name: string
          file_path: string
          id?: string
          task_id: string
          uploaded_at?: string
        }
        Update: {
          file_name?: string
          file_path?: string
          id?: string
          task_id?: string
          uploaded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      cases: {
        Row: {
          assignee_id: string | null
          company: string | null
          created_at: string
          due_at: string | null
          id: string
          industry: string | null
          metadata: Json
          priority: string
          status: string
          summary: string | null
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id?: string | null
          company?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          industry?: string | null
          metadata?: Json
          priority?: string
          status?: string
          summary?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string | null
          company?: string | null
          created_at?: string
          due_at?: string | null
          id?: string
          industry?: string | null
          metadata?: Json
          priority?: string
          status?: string
          summary?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      curriculum_attempts: {
        Row: {
          accuracy_score: number
          alignment_ai: number
          alignment_historical: number
          alignment_senior: number
          analyst_id: string
          analyst_level: number
          answers: Json
          case_id: string
          created_at: string
          feedback: string | null
          id: string
          per_question_scores: Json
          skill_indicators: Json
          written_insight: string
        }
        Insert: {
          accuracy_score?: number
          alignment_ai?: number
          alignment_historical?: number
          alignment_senior?: number
          analyst_id?: string
          analyst_level?: number
          answers?: Json
          case_id: string
          created_at?: string
          feedback?: string | null
          id?: string
          per_question_scores?: Json
          skill_indicators?: Json
          written_insight?: string
        }
        Update: {
          accuracy_score?: number
          alignment_ai?: number
          alignment_historical?: number
          alignment_senior?: number
          analyst_id?: string
          analyst_level?: number
          answers?: Json
          case_id?: string
          created_at?: string
          feedback?: string | null
          id?: string
          per_question_scores?: Json
          skill_indicators?: Json
          written_insight?: string
        }
        Relationships: [
          {
            foreignKeyName: "curriculum_attempts_case_id_fkey"
            columns: ["case_id"]
            isOneToOne: false
            referencedRelation: "curriculum_cases"
            referencedColumns: ["id"]
          },
        ]
      }
      curriculum_cases: {
        Row: {
          ai_answer: string
          case_text: string
          created_at: string
          difficulty: number
          era: string | null
          expected_insights: string[]
          historical_answer: string
          id: string
          industry: string | null
          questions: Json
          senior_reasoning: string
          source: string
          title: string
          updated_at: string
        }
        Insert: {
          ai_answer: string
          case_text: string
          created_at?: string
          difficulty?: number
          era?: string | null
          expected_insights?: string[]
          historical_answer: string
          id?: string
          industry?: string | null
          questions?: Json
          senior_reasoning: string
          source?: string
          title: string
          updated_at?: string
        }
        Update: {
          ai_answer?: string
          case_text?: string
          created_at?: string
          difficulty?: number
          era?: string | null
          expected_insights?: string[]
          historical_answer?: string
          id?: string
          industry?: string | null
          questions?: Json
          senior_reasoning?: string
          source?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      curriculum_progress: {
        Row: {
          analyst_id: string
          level: number
          updated_at: string
        }
        Insert: {
          analyst_id?: string
          level?: number
          updated_at?: string
        }
        Update: {
          analyst_id?: string
          level?: number
          updated_at?: string
        }
        Relationships: []
      }
      debriefs: {
        Row: {
          case_id: string | null
          completed_at: string | null
          created_at: string
          elevenlabs_conversation_id: string | null
          evaluation_json: Json | null
          id: string
          improvement_items: Json | null
          questions_json: Json | null
          status: string
          task_id: string | null
          transcript: string | null
        }
        Insert: {
          case_id?: string | null
          completed_at?: string | null
          created_at?: string
          elevenlabs_conversation_id?: string | null
          evaluation_json?: Json | null
          id?: string
          improvement_items?: Json | null
          questions_json?: Json | null
          status?: string
          task_id?: string | null
          transcript?: string | null
        }
        Update: {
          case_id?: string | null
          completed_at?: string | null
          created_at?: string
          elevenlabs_conversation_id?: string | null
          evaluation_json?: Json | null
          id?: string
          improvement_items?: Json | null
          questions_json?: Json | null
          status?: string
          task_id?: string | null
          transcript?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "debriefs_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      improvements: {
        Row: {
          area: string
          category: string
          created_at: string
          id: string
          priority: string
          source_debrief_id: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          area: string
          category: string
          created_at?: string
          id?: string
          priority?: string
          source_debrief_id?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          area?: string
          category?: string
          created_at?: string
          id?: string
          priority?: string
          source_debrief_id?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string
          id: string
          phone: string | null
          role: string
        }
        Insert: {
          created_at?: string
          full_name: string
          id?: string
          phone?: string | null
          role?: string
        }
        Update: {
          created_at?: string
          full_name?: string
          id?: string
          phone?: string | null
          role?: string
        }
        Relationships: []
      }
      tasks: {
        Row: {
          assignee_id: string
          created_at: string
          description: string
          due_at: string | null
          id: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          assignee_id: string
          created_at?: string
          description: string
          due_at?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          assignee_id?: string
          created_at?: string
          description?: string
          due_at?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assignee_id_fkey"
            columns: ["assignee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      work_products: {
        Row: {
          company: string | null
          content: Json | null
          created_at: string
          id: string
          industry: string | null
          level: number | null
          mode: string | null
          slug: string | null
          title: string | null
        }
        Insert: {
          company?: string | null
          content?: Json | null
          created_at?: string
          id?: string
          industry?: string | null
          level?: number | null
          mode?: string | null
          slug?: string | null
          title?: string | null
        }
        Update: {
          company?: string | null
          content?: Json | null
          created_at?: string
          id?: string
          industry?: string | null
          level?: number | null
          mode?: string | null
          slug?: string | null
          title?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const
