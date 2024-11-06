export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      api_security_issues: {
        Row: {
          created_at: string | null
          description: string
          finding_id: string
          id: string
          owasp_category: string
          recommendation: string | null
          severity: string
          target_url: string | null
          updated_at: string | null
          user_id: string
          vulnerability_type: string
        }
        Insert: {
          created_at?: string | null
          description: string
          finding_id: string
          id?: string
          owasp_category: string
          recommendation?: string | null
          severity: string
          target_url?: string | null
          updated_at?: string | null
          user_id: string
          vulnerability_type: string
        }
        Update: {
          created_at?: string | null
          description?: string
          finding_id?: string
          id?: string
          owasp_category?: string
          recommendation?: string | null
          severity?: string
          target_url?: string | null
          updated_at?: string | null
          user_id?: string
          vulnerability_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "api_security_issues_finding_id_fkey"
            columns: ["finding_id"]
            isOneToOne: false
            referencedRelation: "github_api_findings"
            referencedColumns: ["id"]
          },
        ]
      }
      apk_analysis: {
        Row: {
          activities: Json | null
          apk_name: string
          created_at: string | null
          error_message: string | null
          extracted_path: string | null
          file_path: string
          id: string
          manifest_content: Json | null
          min_sdk_version: string | null
          package_name: string | null
          permissions: Json | null
          receivers: Json | null
          services: Json | null
          status: string | null
          target_sdk_version: string | null
          user_id: string
          version_code: string | null
          version_name: string | null
        }
        Insert: {
          activities?: Json | null
          apk_name: string
          created_at?: string | null
          error_message?: string | null
          extracted_path?: string | null
          file_path: string
          id?: string
          manifest_content?: Json | null
          min_sdk_version?: string | null
          package_name?: string | null
          permissions?: Json | null
          receivers?: Json | null
          services?: Json | null
          status?: string | null
          target_sdk_version?: string | null
          user_id: string
          version_code?: string | null
          version_name?: string | null
        }
        Update: {
          activities?: Json | null
          apk_name?: string
          created_at?: string | null
          error_message?: string | null
          extracted_path?: string | null
          file_path?: string
          id?: string
          manifest_content?: Json | null
          min_sdk_version?: string | null
          package_name?: string | null
          permissions?: Json | null
          receivers?: Json | null
          services?: Json | null
          status?: string | null
          target_sdk_version?: string | null
          user_id?: string
          version_code?: string | null
          version_name?: string | null
        }
        Relationships: []
      }
      bounty_reports: {
        Row: {
          created_at: string | null
          description: string
          id: string
          impact: string
          proof_of_concept: string | null
          recommendations: string | null
          severity: string
          status: string | null
          steps_to_reproduce: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          impact: string
          proof_of_concept?: string | null
          recommendations?: string | null
          severity: string
          status?: string | null
          steps_to_reproduce: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          impact?: string
          proof_of_concept?: string | null
          recommendations?: string | null
          severity?: string
          status?: string | null
          steps_to_reproduce?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
          value: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
          value: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
          value?: string
        }
        Relationships: []
      }
      code_snippet_analysis: {
        Row: {
          analysis: string | null
          code_snippet: string
          created_at: string | null
          id: string
          language: string | null
          suggested_payloads: Json | null
          user_id: string
          vulnerability_points: string[] | null
        }
        Insert: {
          analysis?: string | null
          code_snippet: string
          created_at?: string | null
          id?: string
          language?: string | null
          suggested_payloads?: Json | null
          user_id: string
          vulnerability_points?: string[] | null
        }
        Update: {
          analysis?: string | null
          code_snippet?: string
          created_at?: string | null
          id?: string
          language?: string | null
          suggested_payloads?: Json | null
          user_id?: string
          vulnerability_points?: string[] | null
        }
        Relationships: []
      }
      domain_recon_results: {
        Row: {
          error_message: string | null
          file_endpoints: Json | null
          id: string
          js_files: Json | null
          live_subdomains: Json | null
          ok_endpoints: Json | null
          root_domain: string
          scan_status: string | null
          scan_timestamp: string | null
          user_id: string
        }
        Insert: {
          error_message?: string | null
          file_endpoints?: Json | null
          id?: string
          js_files?: Json | null
          live_subdomains?: Json | null
          ok_endpoints?: Json | null
          root_domain: string
          scan_status?: string | null
          scan_timestamp?: string | null
          user_id: string
        }
        Update: {
          error_message?: string | null
          file_endpoints?: Json | null
          id?: string
          js_files?: Json | null
          live_subdomains?: Json | null
          ok_endpoints?: Json | null
          root_domain?: string
          scan_status?: string | null
          scan_timestamp?: string | null
          user_id?: string
        }
        Relationships: []
      }
      finetuning_jobs: {
        Row: {
          colab_script: string | null
          created_at: string | null
          dataset_type: string
          hyperparameters: Json | null
          id: string
          model_name: string
          status: string | null
          task_type: string
          training_config: Json | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          colab_script?: string | null
          created_at?: string | null
          dataset_type: string
          hyperparameters?: Json | null
          id?: string
          model_name: string
          status?: string | null
          task_type: string
          training_config?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          colab_script?: string | null
          created_at?: string | null
          dataset_type?: string
          hyperparameters?: Json | null
          id?: string
          model_name?: string
          status?: string | null
          task_type?: string
          training_config?: Json | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      github_api_findings: {
        Row: {
          api_path: string
          created_at: string | null
          description: string | null
          file_path: string
          id: string
          line_number: number | null
          method: string
          pii_classification: boolean | null
          pii_types: string[] | null
          repository_name: string
          repository_owner: string | null
          repository_url: string
          user_id: string
        }
        Insert: {
          api_path: string
          created_at?: string | null
          description?: string | null
          file_path: string
          id?: string
          line_number?: number | null
          method: string
          pii_classification?: boolean | null
          pii_types?: string[] | null
          repository_name: string
          repository_owner?: string | null
          repository_url: string
          user_id: string
        }
        Update: {
          api_path?: string
          created_at?: string | null
          description?: string | null
          file_path?: string
          id?: string
          line_number?: number | null
          method?: string
          pii_classification?: boolean | null
          pii_types?: string[] | null
          repository_name?: string
          repository_owner?: string | null
          repository_url?: string
          user_id?: string
        }
        Relationships: []
      }
      integration_settings: {
        Row: {
          created_at: string | null
          google_oauth_tokens: Json | null
          id: string
          jira_api_token: string | null
          jira_domain: string | null
          jira_email: string | null
          slack_webhook_url: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          google_oauth_tokens?: Json | null
          id?: string
          jira_api_token?: string | null
          jira_domain?: string | null
          jira_email?: string | null
          slack_webhook_url?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          google_oauth_tokens?: Json | null
          id?: string
          jira_api_token?: string | null
          jira_domain?: string | null
          jira_email?: string | null
          slack_webhook_url?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ip_intelligence_results: {
        Row: {
          asn_info: Json | null
          dns_records: Json | null
          geolocation: Json | null
          id: string
          ip_address: string
          mx_records: Json | null
          nameservers: Json | null
          reverse_dns: string | null
          scan_timestamp: string | null
          user_id: string | null
          whois_data: Json | null
        }
        Insert: {
          asn_info?: Json | null
          dns_records?: Json | null
          geolocation?: Json | null
          id?: string
          ip_address: string
          mx_records?: Json | null
          nameservers?: Json | null
          reverse_dns?: string | null
          scan_timestamp?: string | null
          user_id?: string | null
          whois_data?: Json | null
        }
        Update: {
          asn_info?: Json | null
          dns_records?: Json | null
          geolocation?: Json | null
          id?: string
          ip_address?: string
          mx_records?: Json | null
          nameservers?: Json | null
          reverse_dns?: string | null
          scan_timestamp?: string | null
          user_id?: string | null
          whois_data?: Json | null
        }
        Relationships: []
      }
      llm_scan_results: {
        Row: {
          batch_id: string | null
          batch_name: string | null
          created_at: string | null
          id: string
          label: string | null
          model: string | null
          prompt: string
          provider: string
          raw_response: Json | null
          response_status: number | null
          result: string
          scan_type: string
          user_id: string
        }
        Insert: {
          batch_id?: string | null
          batch_name?: string | null
          created_at?: string | null
          id?: string
          label?: string | null
          model?: string | null
          prompt: string
          provider: string
          raw_response?: Json | null
          response_status?: number | null
          result: string
          scan_type: string
          user_id: string
        }
        Update: {
          batch_id?: string | null
          batch_name?: string | null
          created_at?: string | null
          id?: string
          label?: string | null
          model?: string | null
          prompt?: string
          provider?: string
          raw_response?: Json | null
          response_status?: number | null
          result?: string
          scan_type?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          created_at: string | null
          email_address: string | null
          id: string
          notification_type: string
          slack_webhook_url: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          email_address?: string | null
          id?: string
          notification_type: string
          slack_webhook_url?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          email_address?: string | null
          id?: string
          notification_type?: string
          slack_webhook_url?: string | null
          user_id?: string
        }
        Relationships: []
      }
      nuclei_scan_results: {
        Row: {
          created_at: string | null
          domain: string
          finding_description: string | null
          finding_name: string | null
          id: string
          matched_at: string | null
          scan_timestamp: string | null
          severity: string | null
          template_id: string | null
          url: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          domain: string
          finding_description?: string | null
          finding_name?: string | null
          id?: string
          matched_at?: string | null
          scan_timestamp?: string | null
          severity?: string | null
          template_id?: string | null
          url: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          domain?: string
          finding_description?: string | null
          finding_name?: string | null
          id?: string
          matched_at?: string | null
          scan_timestamp?: string | null
          severity?: string | null
          template_id?: string | null
          url?: string
          user_id?: string | null
        }
        Relationships: []
      }
      postman_collections: {
        Row: {
          collection_name: string | null
          collection_url: string
          description: string | null
          discovered_at: string | null
          id: string
          is_active: boolean | null
          last_updated: string | null
          metadata: Json | null
          organization: string | null
          user_id: string | null
        }
        Insert: {
          collection_name?: string | null
          collection_url: string
          description?: string | null
          discovered_at?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          metadata?: Json | null
          organization?: string | null
          user_id?: string | null
        }
        Update: {
          collection_name?: string | null
          collection_url?: string
          description?: string | null
          discovered_at?: string | null
          id?: string
          is_active?: boolean | null
          last_updated?: string | null
          metadata?: Json | null
          organization?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string
          id: string
        }
        Insert: {
          created_at?: string | null
          email: string
          id: string
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: string
        }
        Relationships: []
      }
      prompt_augmentations: {
        Row: {
          augmented_prompt: string
          category: string | null
          created_at: string | null
          id: string
          keyword: string
          original_prompt: string
          user_id: string
        }
        Insert: {
          augmented_prompt: string
          category?: string | null
          created_at?: string | null
          id?: string
          keyword: string
          original_prompt: string
          user_id: string
        }
        Update: {
          augmented_prompt?: string
          category?: string | null
          created_at?: string | null
          id?: string
          keyword?: string
          original_prompt?: string
          user_id?: string
        }
        Relationships: []
      }
      role_permissions: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      scheduled_llm_scans: {
        Row: {
          active: boolean | null
          api_key: string | null
          created_at: string | null
          curl_command: string | null
          custom_endpoint: string | null
          custom_headers: string | null
          id: string
          is_recurring: boolean | null
          last_run: string | null
          model: string | null
          next_run: string | null
          prompt: string
          prompt_placeholder: string | null
          provider: string
          schedule: string
          user_id: string
        }
        Insert: {
          active?: boolean | null
          api_key?: string | null
          created_at?: string | null
          curl_command?: string | null
          custom_endpoint?: string | null
          custom_headers?: string | null
          id?: string
          is_recurring?: boolean | null
          last_run?: string | null
          model?: string | null
          next_run?: string | null
          prompt: string
          prompt_placeholder?: string | null
          provider: string
          schedule: string
          user_id: string
        }
        Update: {
          active?: boolean | null
          api_key?: string | null
          created_at?: string | null
          curl_command?: string | null
          custom_endpoint?: string | null
          custom_headers?: string | null
          id?: string
          is_recurring?: boolean | null
          last_run?: string | null
          model?: string | null
          next_run?: string | null
          prompt?: string
          prompt_placeholder?: string | null
          provider?: string
          schedule?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"] | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"] | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      xss_payload_sources: {
        Row: {
          created_at: string | null
          id: string
          is_active: boolean | null
          last_fetched: string | null
          source_name: string
          source_url: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_fetched?: string | null
          source_name: string
          source_url: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_fetched?: string | null
          source_name?: string
          source_url?: string
        }
        Relationships: []
      }
      xss_payloads: {
        Row: {
          category: string
          created_at: string | null
          description: string | null
          id: string
          payload: string
          tags: string[] | null
          user_id: string | null
        }
        Insert: {
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          payload: string
          tags?: string[] | null
          user_id?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          payload?: string
          tags?: string[] | null
          user_id?: string | null
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
      user_role: "superadmin" | "admin" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
