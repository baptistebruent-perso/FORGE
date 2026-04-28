export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      workouts: {
        Row: { id: string; user_id: string; name: string; day_of_week: number | null; order_index: number; notes: string | null; created_at: string }
        Insert: { id?: string; user_id: string; name: string; day_of_week?: number | null; order_index?: number; notes?: string | null; created_at?: string }
        Update: { id?: string; user_id?: string; name?: string; day_of_week?: number | null; order_index?: number; notes?: string | null }
        Relationships: []
      }
      exercises_template: {
        Row: { id: string; workout_id: string; name: string; order_index: number; target_sets: number; target_reps_min: number; target_reps_max: number; target_rest_seconds: number; rest_after_exercise_seconds: number; notes: string | null }
        Insert: { id?: string; workout_id: string; name: string; order_index?: number; target_sets?: number; target_reps_min?: number; target_reps_max?: number; target_rest_seconds?: number; rest_after_exercise_seconds?: number; notes?: string | null }
        Update: { id?: string; workout_id?: string; name?: string; order_index?: number; target_sets?: number; target_reps_min?: number; target_reps_max?: number; target_rest_seconds?: number; rest_after_exercise_seconds?: number; notes?: string | null }
        Relationships: [
          {
            foreignKeyName: "exercises_template_workout_id_fkey"
            columns: ["workout_id"]
            isOneToOne: false
            referencedRelation: "workouts"
            referencedColumns: ["id"]
          }
        ]
      }
      sessions: {
        Row: { id: string; user_id: string; workout_id: string | null; started_at: string; ended_at: string | null; notes: string | null; mood: number | null }
        Insert: { id?: string; user_id: string; workout_id?: string | null; started_at?: string; ended_at?: string | null; notes?: string | null; mood?: number | null }
        Update: { id?: string; user_id?: string; workout_id?: string | null; started_at?: string; ended_at?: string | null; notes?: string | null; mood?: number | null }
        Relationships: []
      }
      session_sets: {
        Row: { id: string; session_id: string; exercise_template_id: string | null; exercise_name: string; set_number: number; reps: number | null; weight: number | null; rpe: number | null; completed: boolean; created_at: string }
        Insert: { id?: string; session_id: string; exercise_template_id?: string | null; exercise_name: string; set_number: number; reps?: number | null; weight?: number | null; rpe?: number | null; completed?: boolean; created_at?: string }
        Update: { id?: string; session_id?: string; exercise_template_id?: string | null; exercise_name?: string; set_number?: number; reps?: number | null; weight?: number | null; rpe?: number | null; completed?: boolean }
        Relationships: []
      }
      body_metrics: {
        Row: { id: string; user_id: string; measured_at: string; weight_kg: number | null; body_fat_pct: number | null; chest_cm: number | null; waist_cm: number | null; hips_cm: number | null; arm_cm: number | null; thigh_cm: number | null; calf_cm: number | null; notes: string | null }
        Insert: { id?: string; user_id: string; measured_at?: string; weight_kg?: number | null; body_fat_pct?: number | null; chest_cm?: number | null; waist_cm?: number | null; hips_cm?: number | null; arm_cm?: number | null; thigh_cm?: number | null; calf_cm?: number | null; notes?: string | null }
        Update: { id?: string; user_id?: string; measured_at?: string; weight_kg?: number | null; body_fat_pct?: number | null; chest_cm?: number | null; waist_cm?: number | null; hips_cm?: number | null; arm_cm?: number | null; thigh_cm?: number | null; calf_cm?: number | null; notes?: string | null }
        Relationships: []
      }
      progress_photos: {
        Row: { id: string; user_id: string; taken_at: string; storage_path: string; view_type: string | null; notes: string | null }
        Insert: { id?: string; user_id: string; taken_at?: string; storage_path: string; view_type?: string | null; notes?: string | null }
        Update: { id?: string; user_id?: string; taken_at?: string; storage_path?: string; view_type?: string | null; notes?: string | null }
        Relationships: []
      }
      personal_records: {
        Row: { id: string; user_id: string; exercise_name: string; type: string; value: number; reps: number | null; achieved_at: string; session_id: string | null }
        Insert: { id?: string; user_id: string; exercise_name: string; type: string; value: number; reps?: number | null; achieved_at?: string; session_id?: string | null }
        Update: { id?: string; user_id?: string; exercise_name?: string; type?: string; value?: number; reps?: number | null; achieved_at?: string; session_id?: string | null }
        Relationships: []
      }
      goals: {
        Row: { id: string; user_id: string; title: string; type: string; target_value: number | null; current_value: number | null; unit: string | null; deadline: string | null; exercise_name: string | null; status: string; created_at: string }
        Insert: { id?: string; user_id: string; title: string; type: string; target_value?: number | null; current_value?: number | null; unit?: string | null; deadline?: string | null; exercise_name?: string | null; status?: string; created_at?: string }
        Update: { id?: string; user_id?: string; title?: string; type?: string; target_value?: number | null; current_value?: number | null; unit?: string | null; deadline?: string | null; exercise_name?: string | null; status?: string }
        Relationships: []
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
