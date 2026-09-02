export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          school_name: string | null;
          education_level: string | null;
          subject_specialty: string | null;
          phone_number: string | null;
          role: "USER" | "ADMIN" | "MODERATOR";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          school_name?: string | null;
          education_level?: string | null;
          subject_specialty?: string | null;
          phone_number?: string | null;
          role?: "USER" | "ADMIN" | "MODERATOR";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          school_name?: string | null;
          education_level?: string | null;
          subject_specialty?: string | null;
          phone_number?: string | null;
          role?: "USER" | "ADMIN" | "MODERATOR";
          created_at?: string;
          updated_at?: string;
        };
      };
      projects: {
        Row: {
          id: string;
          user_id: string;
          title: string;
          type: "SKKN" | "GIAI_PHAP_HUU_ICH";
          subject_group: string;
          education_level: string;
          target_grade: string | null;
          school_year: string | null;
          status: "DRAFT" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED" | "ARCHIVED";
          current_step: number;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          title: string;
          type?: "SKKN" | "GIAI_PHAP_HUU_ICH";
          subject_group: string;
          education_level: string;
          target_grade?: string | null;
          school_year?: string | null;
          status?: "DRAFT" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED" | "ARCHIVED";
          current_step?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          title?: string;
          type?: "SKKN" | "GIAI_PHAP_HUU_ICH";
          subject_group?: string;
          education_level?: string;
          target_grade?: string | null;
          school_year?: string | null;
          status?: "DRAFT" | "IN_PROGRESS" | "REVIEWING" | "COMPLETED" | "ARCHIVED";
          current_step?: number;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_facts: {
        Row: {
          id: string;
          project_id: string;
          fact_key: string;
          fact_category: string;
          fact_value: Json;
          source: string;
          confidence_score: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          fact_key: string;
          fact_category: string;
          fact_value: Json;
          source?: string;
          confidence_score?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          fact_key?: string;
          fact_category?: string;
          fact_value?: Json;
          source?: string;
          confidence_score?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      project_sections: {
        Row: {
          id: string;
          project_id: string;
          section_key: string;
          section_title: string;
          order_index: number;
          content_markdown: string;
          status: "EMPTY" | "DRAFTED" | "REVIEWED" | "FINALIZED";
          ai_version: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          project_id: string;
          section_key: string;
          section_title: string;
          order_index: number;
          content_markdown?: string;
          status?: "EMPTY" | "DRAFTED" | "REVIEWED" | "FINALIZED";
          ai_version?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          project_id?: string;
          section_key?: string;
          section_title?: string;
          order_index?: number;
          content_markdown?: string;
          status?: "EMPTY" | "DRAFTED" | "REVIEWED" | "FINALIZED";
          ai_version?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      uploaded_files: {
        Row: {
          id: string;
          user_id: string;
          project_id: string | null;
          file_name: string;
          file_size: number;
          mime_type: string;
          storage_path: string;
          parsed_content: string | null;
          extraction_status: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          project_id?: string | null;
          file_name: string;
          file_size: number;
          mime_type: string;
          storage_path: string;
          parsed_content?: string | null;
          extraction_status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          project_id?: string | null;
          file_name?: string;
          file_size?: number;
          mime_type?: string;
          storage_path?: string;
          parsed_content?: string | null;
          extraction_status?: "PENDING" | "PROCESSING" | "COMPLETED" | "FAILED";
          created_at?: string;
          updated_at?: string;
        };
      };
      ai_requests: {
        Row: {
          id: string;
          user_id: string | null;
          project_id: string | null;
          task_type: string;
          provider: string;
          model: string;
          input_tokens: number;
          output_tokens: number;
          estimated_cost: number;
          status: "SUCCESS" | "FAILED" | "FALLBACK_SUCCESS";
          error_code: string | null;
          duration_ms: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          project_id?: string | null;
          task_type: string;
          provider: string;
          model: string;
          input_tokens?: number;
          output_tokens?: number;
          estimated_cost?: number;
          status?: "SUCCESS" | "FAILED" | "FALLBACK_SUCCESS";
          error_code?: string | null;
          duration_ms?: number | null;
          metadata?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          project_id?: string | null;
          task_type?: string;
          provider?: string;
          model?: string;
          input_tokens?: number;
          output_tokens?: number;
          estimated_cost?: number;
          status?: "SUCCESS" | "FAILED" | "FALLBACK_SUCCESS";
          error_code?: string | null;
          duration_ms?: number | null;
          metadata?: Json;
          created_at?: string;
        };
      };
      prompt_versions: {
        Row: {
          id: string;
          prompt_key: string;
          version: string;
          system_prompt: string;
          user_template: string;
          target_schema: Json | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          prompt_key: string;
          version: string;
          system_prompt: string;
          user_template: string;
          target_schema?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          prompt_key?: string;
          version?: string;
          system_prompt?: string;
          user_template?: string;
          target_schema?: Json | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      devices: {
        Row: {
          id: string;
          user_id: string;
          device_fingerprint: string;
          device_name: string | null;
          ip_address: string | null;
          user_agent: string | null;
          last_active_at: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_fingerprint: string;
          device_name?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          last_active_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_fingerprint?: string;
          device_name?: string | null;
          ip_address?: string | null;
          user_agent?: string | null;
          last_active_at?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          plan_tier: "FREE_TRIAL" | "STANDARD" | "PRO" | "ENTERPRISE";
          status: "ACTIVE" | "EXPIRED" | "CANCELLED";
          starts_at: string;
          expires_at: string | null;
          max_projects: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          plan_tier?: "FREE_TRIAL" | "STANDARD" | "PRO" | "ENTERPRISE";
          status?: "ACTIVE" | "EXPIRED" | "CANCELLED";
          starts_at?: string;
          expires_at?: string | null;
          max_projects?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          plan_tier?: "FREE_TRIAL" | "STANDARD" | "PRO" | "ENTERPRISE";
          status?: "ACTIVE" | "EXPIRED" | "CANCELLED";
          starts_at?: string;
          expires_at?: string | null;
          max_projects?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      licenses: {
        Row: {
          id: string;
          license_key: string;
          tier: "STANDARD" | "PRO" | "INSTITUTIONAL";
          assigned_user_id: string | null;
          activated_at: string | null;
          expires_at: string | null;
          max_devices: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          license_key: string;
          tier: "STANDARD" | "PRO" | "INSTITUTIONAL";
          assigned_user_id?: string | null;
          activated_at?: string | null;
          expires_at?: string | null;
          max_devices?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          license_key?: string;
          tier?: "STANDARD" | "PRO" | "INSTITUTIONAL";
          assigned_user_id?: string | null;
          activated_at?: string | null;
          expires_at?: string | null;
          max_devices?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
      };
      audit_logs: {
        Row: {
          id: string;
          user_id: string | null;
          action: string;
          entity_type: string;
          entity_id: string | null;
          ip_address: string | null;
          payload: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          action: string;
          entity_type: string;
          entity_id?: string | null;
          ip_address?: string | null;
          payload?: Json;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          action?: string;
          entity_type?: string;
          entity_id?: string | null;
          ip_address?: string | null;
          payload?: Json;
          created_at?: string;
        };
      };
    };
  };
}
