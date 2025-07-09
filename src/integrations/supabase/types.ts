export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      agent_configurations: {
        Row: {
          agent_name: string
          created_at: string
          description: string | null
          id: string
          is_active: boolean | null
          max_tokens: number | null
          model: string
          system_prompt: string
          temperature: number | null
          updated_at: string
          user_prompt: string | null
        }
        Insert: {
          agent_name: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string
          system_prompt: string
          temperature?: number | null
          updated_at?: string
          user_prompt?: string | null
        }
        Update: {
          agent_name?: string
          created_at?: string
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_tokens?: number | null
          model?: string
          system_prompt?: string
          temperature?: number | null
          updated_at?: string
          user_prompt?: string | null
        }
        Relationships: []
      }
      agent_logs: {
        Row: {
          agent_name: string
          created_at: string
          error_message: string | null
          event_id: string | null
          execution_time_ms: number | null
          id: string
          input_payload: Json | null
          output_payload: Json | null
          status: string
        }
        Insert: {
          agent_name: string
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          execution_time_ms?: number | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          status: string
        }
        Update: {
          agent_name?: string
          created_at?: string
          error_message?: string | null
          event_id?: string | null
          execution_time_ms?: number | null
          id?: string
          input_payload?: Json | null
          output_payload?: Json | null
          status?: string
        }
        Relationships: []
      }
      app_configuration: {
        Row: {
          config_key: string
          config_type: string
          config_value: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          is_public: boolean
          updated_at: string
        }
        Insert: {
          config_key: string
          config_type?: string
          config_value?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          updated_at?: string
        }
        Update: {
          config_key?: string
          config_type?: string
          config_value?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          is_public?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      ce_accrediting_bodies: {
        Row: {
          body_abbreviation: string
          created_at: string
          description: string | null
          display_order: number
          full_name: string
          id: string
          is_active: boolean
          logo_url: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          body_abbreviation: string
          created_at?: string
          description?: string | null
          display_order?: number
          full_name: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          body_abbreviation?: string
          created_at?: string
          description?: string | null
          display_order?: number
          full_name?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      conferences: {
        Row: {
          conference_url: string
          created_at: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          conference_url: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          conference_url?: string
          created_at?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      discovered_events: {
        Row: {
          created_at: string
          discovery_log_id: string | null
          error_message: string | null
          event_description: string | null
          event_id: string | null
          event_title: string | null
          event_url: string
          id: string
          processed_at: string | null
          processing_status: string
          relevance_score: number | null
        }
        Insert: {
          created_at?: string
          discovery_log_id?: string | null
          error_message?: string | null
          event_description?: string | null
          event_id?: string | null
          event_title?: string | null
          event_url: string
          id?: string
          processed_at?: string | null
          processing_status?: string
          relevance_score?: number | null
        }
        Update: {
          created_at?: string
          discovery_log_id?: string | null
          error_message?: string | null
          event_description?: string | null
          event_id?: string | null
          event_title?: string | null
          event_url?: string
          id?: string
          processed_at?: string | null
          processing_status?: string
          relevance_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "discovered_events_discovery_log_id_fkey"
            columns: ["discovery_log_id"]
            isOneToOne: false
            referencedRelation: "discovery_logs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "discovered_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_logs: {
        Row: {
          created_at: string
          error_message: string | null
          execution_time_ms: number | null
          filtered_results: number
          id: string
          new_events_discovered: number
          processing_status: string
          query_id: string | null
          query_text: string
          run_id: string
          total_results_found: number
        }
        Insert: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          filtered_results?: number
          id?: string
          new_events_discovered?: number
          processing_status?: string
          query_id?: string | null
          query_text: string
          run_id?: string
          total_results_found?: number
        }
        Update: {
          created_at?: string
          error_message?: string | null
          execution_time_ms?: number | null
          filtered_results?: number
          id?: string
          new_events_discovered?: number
          processing_status?: string
          query_id?: string | null
          query_text?: string
          run_id?: string
          total_results_found?: number
        }
        Relationships: [
          {
            foreignKeyName: "discovery_logs_query_id_fkey"
            columns: ["query_id"]
            isOneToOne: false
            referencedRelation: "discovery_queries"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_queries: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean
          location_filter: string | null
          priority: number
          query_text: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location_filter?: string | null
          priority?: number
          query_text: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          location_filter?: string | null
          priority?: number
          query_text?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_categories: {
        Row: {
          category_name: string
          color_code: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          updated_at: string
        }
        Insert: {
          category_name: string
          color_code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Update: {
          category_name?: string
          color_code?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          updated_at?: string
        }
        Relationships: []
      }
      event_ce_credits: {
        Row: {
          accrediting_body: string | null
          approved: boolean | null
          created_at: string | null
          credit_category: string | null
          description: string | null
          event_id: string
          hours: number | null
          id: string
          type: string | null
        }
        Insert: {
          accrediting_body?: string | null
          approved?: boolean | null
          created_at?: string | null
          credit_category?: string | null
          description?: string | null
          event_id: string
          hours?: number | null
          id?: string
          type?: string | null
        }
        Update: {
          accrediting_body?: string | null
          approved?: boolean | null
          created_at?: string | null
          credit_category?: string | null
          description?: string | null
          event_id?: string
          hours?: number | null
          id?: string
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_ce_credits_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      event_hosts: {
        Row: {
          created_at: string
          event_id: string
          host_role: string | null
          id: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          host_role?: string | null
          id?: string
          organization_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          host_role?: string | null
          id?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_hosts_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_hosts_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_organizers: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          is_primary_contact: boolean | null
          organization_id: string | null
          organizer_role: Database["public"]["Enums"]["organizer_role_enum"]
          person_title_at_org: string | null
          profile_id: string
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          is_primary_contact?: boolean | null
          organization_id?: string | null
          organizer_role: Database["public"]["Enums"]["organizer_role_enum"]
          person_title_at_org?: string | null
          profile_id: string
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          is_primary_contact?: boolean | null
          organization_id?: string | null
          organizer_role?: Database["public"]["Enums"]["organizer_role_enum"]
          person_title_at_org?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_organizers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_organizers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_organizers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "extracted_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_speakers: {
        Row: {
          created_at: string | null
          event_id: string
          id: string
          organization_id: string | null
          profile_id: string
          session_title: string | null
          speaker_bio_override: string | null
          speaker_order: number | null
          speaking_role:
            | Database["public"]["Enums"]["speaking_role_enum"]
            | null
          speaking_topic: string | null
          track_or_room: string | null
        }
        Insert: {
          created_at?: string | null
          event_id: string
          id?: string
          organization_id?: string | null
          profile_id: string
          session_title?: string | null
          speaker_bio_override?: string | null
          speaker_order?: number | null
          speaking_role?:
            | Database["public"]["Enums"]["speaking_role_enum"]
            | null
          speaking_topic?: string | null
          track_or_room?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string
          id?: string
          organization_id?: string | null
          profile_id?: string
          session_title?: string | null
          speaker_bio_override?: string | null
          speaker_order?: number | null
          speaking_role?:
            | Database["public"]["Enums"]["speaking_role_enum"]
            | null
          speaking_topic?: string | null
          track_or_room?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_speakers_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_speakers_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_speakers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "extracted_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      event_sponsors: {
        Row: {
          booth_location: string | null
          contact_person_id: string | null
          created_at: string | null
          event_id: string
          id: string
          logo_url: string | null
          organization_id: string
          sponsor_level:
            | Database["public"]["Enums"]["sponsor_level_enum"]
            | null
          sponsorship_description: string | null
          sponsorship_type:
            | Database["public"]["Enums"]["sponsorship_type_enum"]
            | null
        }
        Insert: {
          booth_location?: string | null
          contact_person_id?: string | null
          created_at?: string | null
          event_id: string
          id?: string
          logo_url?: string | null
          organization_id: string
          sponsor_level?:
            | Database["public"]["Enums"]["sponsor_level_enum"]
            | null
          sponsorship_description?: string | null
          sponsorship_type?:
            | Database["public"]["Enums"]["sponsorship_type_enum"]
            | null
        }
        Update: {
          booth_location?: string | null
          contact_person_id?: string | null
          created_at?: string | null
          event_id?: string
          id?: string
          logo_url?: string | null
          organization_id?: string
          sponsor_level?:
            | Database["public"]["Enums"]["sponsor_level_enum"]
            | null
          sponsorship_description?: string | null
          sponsorship_type?:
            | Database["public"]["Enums"]["sponsorship_type_enum"]
            | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sponsors_contact_person_id_fkey"
            columns: ["contact_person_id"]
            isOneToOne: false
            referencedRelation: "extracted_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsors_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sponsors_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      event_tracks: {
        Row: {
          category_id: string | null
          created_at: string
          description: string | null
          display_order: number
          id: string
          is_active: boolean
          track_name: string
          updated_at: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          track_name: string
          updated_at?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          id?: string
          is_active?: boolean
          track_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_tracks_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          additional_session_fee: number | null
          admin_notes: string | null
          banner_image_url: string | null
          category: string | null
          category_id: string | null
          city: string
          conference_id: string | null
          conference_pricing_url: string | null
          conference_ticket_price: number | null
          conference_url: string | null
          country: string
          created_at: string | null
          currency: string | null
          early_bird_price: number | null
          event_type: string
          event_url: string
          extraction_confidence: number | null
          hosts: Json | null
          id: string
          is_free: boolean | null
          is_host_location: boolean | null
          is_included_in_conference: boolean | null
          marketing_coordinated_at: string | null
          marketing_execution_status: string | null
          marketing_performance: Json | null
          marketing_strategy: Json | null
          member_price: number | null
          original_screenshot_file_size: number | null
          original_screenshot_height: number | null
          original_screenshot_url: string | null
          original_screenshot_width: number | null
          postal_code: string | null
          pricing_tiers: Json | null
          pricing_type: Database["public"]["Enums"]["pricing_type_enum"]
          processing_status:
            | Database["public"]["Enums"]["processing_status_enum"]
            | null
          requires_conference_registration: boolean | null
          room_name: string | null
          room_or_venue: string | null
          search_tags: string[] | null
          seo_generated_at: string | null
          seo_generation_status: string | null
          seo_meta_description: string | null
          seo_meta_title: string | null
          session_description: string | null
          session_end_time: string | null
          session_start_time: string
          session_title: string
          session_track: string | null
          session_type: Database["public"]["Enums"]["session_type_enum"] | null
          social_media_content: Json | null
          social_media_generated_at: string | null
          social_media_generation_status: string | null
          social_media_images: Json | null
          social_media_performance: Json | null
          social_media_published: Json | null
          sponsors: Json | null
          state: string
          ticket_price: number | null
          timezone: string
          track_id: string | null
          updated_at: string | null
          venue_address: string
          venue_id: string | null
          venue_name: string | null
        }
        Insert: {
          additional_session_fee?: number | null
          admin_notes?: string | null
          banner_image_url?: string | null
          category?: string | null
          category_id?: string | null
          city: string
          conference_id?: string | null
          conference_pricing_url?: string | null
          conference_ticket_price?: number | null
          conference_url?: string | null
          country: string
          created_at?: string | null
          currency?: string | null
          early_bird_price?: number | null
          event_type?: string
          event_url: string
          extraction_confidence?: number | null
          hosts?: Json | null
          id?: string
          is_free?: boolean | null
          is_host_location?: boolean | null
          is_included_in_conference?: boolean | null
          marketing_coordinated_at?: string | null
          marketing_execution_status?: string | null
          marketing_performance?: Json | null
          marketing_strategy?: Json | null
          member_price?: number | null
          original_screenshot_file_size?: number | null
          original_screenshot_height?: number | null
          original_screenshot_url?: string | null
          original_screenshot_width?: number | null
          postal_code?: string | null
          pricing_tiers?: Json | null
          pricing_type: Database["public"]["Enums"]["pricing_type_enum"]
          processing_status?:
            | Database["public"]["Enums"]["processing_status_enum"]
            | null
          requires_conference_registration?: boolean | null
          room_name?: string | null
          room_or_venue?: string | null
          search_tags?: string[] | null
          seo_generated_at?: string | null
          seo_generation_status?: string | null
          seo_meta_description?: string | null
          seo_meta_title?: string | null
          session_description?: string | null
          session_end_time?: string | null
          session_start_time: string
          session_title: string
          session_track?: string | null
          session_type?: Database["public"]["Enums"]["session_type_enum"] | null
          social_media_content?: Json | null
          social_media_generated_at?: string | null
          social_media_generation_status?: string | null
          social_media_images?: Json | null
          social_media_performance?: Json | null
          social_media_published?: Json | null
          sponsors?: Json | null
          state: string
          ticket_price?: number | null
          timezone: string
          track_id?: string | null
          updated_at?: string | null
          venue_address: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Update: {
          additional_session_fee?: number | null
          admin_notes?: string | null
          banner_image_url?: string | null
          category?: string | null
          category_id?: string | null
          city?: string
          conference_id?: string | null
          conference_pricing_url?: string | null
          conference_ticket_price?: number | null
          conference_url?: string | null
          country?: string
          created_at?: string | null
          currency?: string | null
          early_bird_price?: number | null
          event_type?: string
          event_url?: string
          extraction_confidence?: number | null
          hosts?: Json | null
          id?: string
          is_free?: boolean | null
          is_host_location?: boolean | null
          is_included_in_conference?: boolean | null
          marketing_coordinated_at?: string | null
          marketing_execution_status?: string | null
          marketing_performance?: Json | null
          marketing_strategy?: Json | null
          member_price?: number | null
          original_screenshot_file_size?: number | null
          original_screenshot_height?: number | null
          original_screenshot_url?: string | null
          original_screenshot_width?: number | null
          postal_code?: string | null
          pricing_tiers?: Json | null
          pricing_type?: Database["public"]["Enums"]["pricing_type_enum"]
          processing_status?:
            | Database["public"]["Enums"]["processing_status_enum"]
            | null
          requires_conference_registration?: boolean | null
          room_name?: string | null
          room_or_venue?: string | null
          search_tags?: string[] | null
          seo_generated_at?: string | null
          seo_generation_status?: string | null
          seo_meta_description?: string | null
          seo_meta_title?: string | null
          session_description?: string | null
          session_end_time?: string | null
          session_start_time?: string
          session_title?: string
          session_track?: string | null
          session_type?: Database["public"]["Enums"]["session_type_enum"] | null
          social_media_content?: Json | null
          social_media_generated_at?: string | null
          social_media_generation_status?: string | null
          social_media_images?: Json | null
          social_media_performance?: Json | null
          social_media_published?: Json | null
          sponsors?: Json | null
          state?: string
          ticket_price?: number | null
          timezone?: string
          track_id?: string | null
          updated_at?: string | null
          venue_address?: string
          venue_id?: string | null
          venue_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "events_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_conference_id_fkey"
            columns: ["conference_id"]
            isOneToOne: false
            referencedRelation: "conferences"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "event_tracks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_venue_id_fkey"
            columns: ["venue_id"]
            isOneToOne: false
            referencedRelation: "venues"
            referencedColumns: ["id"]
          },
        ]
      }
      events_flexible: {
        Row: {
          city: string | null
          country: string | null
          created_at: string
          event_data: Json
          event_url: string
          extraction_confidence: number | null
          id: string
          legacy_event_id: string | null
          migrated_from_legacy: boolean | null
          schema_version: number
          session_start_time: string | null
          state: string | null
          updated_at: string
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string
          event_data?: Json
          event_url: string
          extraction_confidence?: number | null
          id?: string
          legacy_event_id?: string | null
          migrated_from_legacy?: boolean | null
          schema_version?: number
          session_start_time?: string | null
          state?: string | null
          updated_at?: string
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string
          event_data?: Json
          event_url?: string
          extraction_confidence?: number | null
          id?: string
          legacy_event_id?: string | null
          migrated_from_legacy?: boolean | null
          schema_version?: number
          session_start_time?: string | null
          state?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      extracted_profiles: {
        Row: {
          admin_notes: string | null
          bio: string | null
          company_domain: string | null
          created_at: string | null
          current_company: string | null
          current_title: string | null
          email: string | null
          first_name: string | null
          full_name: string
          id: string
          industry: string | null
          is_user: boolean | null
          last_name: string | null
          linkedin_discovery_last_attempted_at: string | null
          linkedin_discovery_status: Database["public"]["Enums"]["linkedin_discovery_status_enum"]
          linkedin_url: string | null
          linkedin_url_discovered_at: string | null
          linkedin_url_discovery_confidence: number | null
          location_city: string | null
          phone: string | null
          profile_image_url: string | null
          profile_source:
            | Database["public"]["Enums"]["profile_source_enum"]
            | null
          twitter_url: string | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          admin_notes?: string | null
          bio?: string | null
          company_domain?: string | null
          created_at?: string | null
          current_company?: string | null
          current_title?: string | null
          email?: string | null
          first_name?: string | null
          full_name: string
          id?: string
          industry?: string | null
          is_user?: boolean | null
          last_name?: string | null
          linkedin_discovery_last_attempted_at?: string | null
          linkedin_discovery_status?: Database["public"]["Enums"]["linkedin_discovery_status_enum"]
          linkedin_url?: string | null
          linkedin_url_discovered_at?: string | null
          linkedin_url_discovery_confidence?: number | null
          location_city?: string | null
          phone?: string | null
          profile_image_url?: string | null
          profile_source?:
            | Database["public"]["Enums"]["profile_source_enum"]
            | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          admin_notes?: string | null
          bio?: string | null
          company_domain?: string | null
          created_at?: string | null
          current_company?: string | null
          current_title?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string
          id?: string
          industry?: string | null
          is_user?: boolean | null
          last_name?: string | null
          linkedin_discovery_last_attempted_at?: string | null
          linkedin_discovery_status?: Database["public"]["Enums"]["linkedin_discovery_status_enum"]
          linkedin_url?: string | null
          linkedin_url_discovered_at?: string | null
          linkedin_url_discovery_confidence?: number | null
          location_city?: string | null
          phone?: string | null
          profile_image_url?: string | null
          profile_source?:
            | Database["public"]["Enums"]["profile_source_enum"]
            | null
          twitter_url?: string | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      networking_preferences: {
        Row: {
          availability_for_networking: string | null
          created_at: string | null
          id: string
          networking_goals: string | null
          open_to_collaboration: boolean | null
          preferred_contact_method: string | null
          seeking_mentorship: boolean | null
          updated_at: string | null
          user_id: string | null
          willing_to_mentor: boolean | null
        }
        Insert: {
          availability_for_networking?: string | null
          created_at?: string | null
          id?: string
          networking_goals?: string | null
          open_to_collaboration?: boolean | null
          preferred_contact_method?: string | null
          seeking_mentorship?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          willing_to_mentor?: boolean | null
        }
        Update: {
          availability_for_networking?: string | null
          created_at?: string | null
          id?: string
          networking_goals?: string | null
          open_to_collaboration?: boolean | null
          preferred_contact_method?: string | null
          seeking_mentorship?: boolean | null
          updated_at?: string | null
          user_id?: string | null
          willing_to_mentor?: boolean | null
        }
        Relationships: []
      }
      organizations: {
        Row: {
          created_at: string | null
          description: string | null
          domains: string[] | null
          headquarters_address: string | null
          id: string
          industry: string | null
          linkedin_company_url: string | null
          logo_url: string | null
          main_email: string | null
          main_phone: string | null
          name: string
          size_category: string | null
          updated_at: string | null
          verified: boolean | null
          website_discovery_last_attempted_at: string | null
          website_discovery_status: Database["public"]["Enums"]["website_discovery_status_enum"]
          website_url: string | null
          website_url_discovered_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          domains?: string[] | null
          headquarters_address?: string | null
          id?: string
          industry?: string | null
          linkedin_company_url?: string | null
          logo_url?: string | null
          main_email?: string | null
          main_phone?: string | null
          name: string
          size_category?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website_discovery_last_attempted_at?: string | null
          website_discovery_status?: Database["public"]["Enums"]["website_discovery_status_enum"]
          website_url?: string | null
          website_url_discovered_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          domains?: string[] | null
          headquarters_address?: string | null
          id?: string
          industry?: string | null
          linkedin_company_url?: string | null
          logo_url?: string | null
          main_email?: string | null
          main_phone?: string | null
          name?: string
          size_category?: string | null
          updated_at?: string | null
          verified?: boolean | null
          website_discovery_last_attempted_at?: string | null
          website_discovery_status?: Database["public"]["Enums"]["website_discovery_status_enum"]
          website_url?: string | null
          website_url_discovered_at?: string | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          bio: string | null
          created_at: string | null
          current_company: string | null
          current_title: string | null
          email: string | null
          first_name: string | null
          full_name: string | null
          id: string
          industry: string | null
          last_name: string | null
          linkedin_url: string | null
          location_city: string | null
          location_state: string | null
          phone: string | null
          profile_image_url: string | null
          updated_at: string | null
          website_url: string | null
          years_of_experience: number | null
        }
        Insert: {
          bio?: string | null
          created_at?: string | null
          current_company?: string | null
          current_title?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id: string
          industry?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          location_city?: string | null
          location_state?: string | null
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          years_of_experience?: number | null
        }
        Update: {
          bio?: string | null
          created_at?: string | null
          current_company?: string | null
          current_title?: string | null
          email?: string | null
          first_name?: string | null
          full_name?: string | null
          id?: string
          industry?: string | null
          last_name?: string | null
          linkedin_url?: string | null
          location_city?: string | null
          location_state?: string | null
          phone?: string | null
          profile_image_url?: string | null
          updated_at?: string | null
          website_url?: string | null
          years_of_experience?: number | null
        }
        Relationships: []
      }
      saved_events: {
        Row: {
          created_at: string | null
          event_id: string | null
          id: string
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_id?: string | null
          id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "saved_events_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      user_certifications: {
        Row: {
          certification_name: string
          certification_url: string | null
          created_at: string | null
          expiration_date: string | null
          id: string
          is_active: boolean | null
          issue_date: string | null
          issuing_organization: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          certification_name: string
          certification_url?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuing_organization?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          certification_name?: string
          certification_url?: string | null
          created_at?: string | null
          expiration_date?: string | null
          id?: string
          is_active?: boolean | null
          issue_date?: string | null
          issuing_organization?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      user_interests: {
        Row: {
          category_id: string | null
          created_at: string | null
          id: string
          interest_level: string | null
          user_id: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          interest_level?: string | null
          user_id?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          id?: string
          interest_level?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_interests_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "event_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      venues: {
        Row: {
          address: string | null
          amenities: Json | null
          capacity: number | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          phone: string | null
          postal_code: string | null
          state: string | null
          updated_at: string
          venue_name: string
          venue_type: string | null
          website_url: string | null
        }
        Insert: {
          address?: string | null
          amenities?: Json | null
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          venue_name: string
          venue_type?: string | null
          website_url?: string | null
        }
        Update: {
          address?: string | null
          amenities?: Json | null
          capacity?: number | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          phone?: string | null
          postal_code?: string | null
          state?: string | null
          updated_at?: string
          venue_name?: string
          venue_type?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      events_flexible_legacy_view: {
        Row: {
          category: string | null
          city: string | null
          country: string | null
          created_at: string | null
          currency: string | null
          event_data: Json | null
          event_url: string | null
          extraction_confidence: number | null
          id: string | null
          pricing_type: string | null
          session_description: string | null
          session_end_time: string | null
          session_start_time: string | null
          session_title: string | null
          session_track: string | null
          state: string | null
          ticket_price: number | null
          updated_at: string | null
          venue_address: string | null
          venue_name: string | null
        }
        Insert: {
          category?: never
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: never
          event_data?: Json | null
          event_url?: string | null
          extraction_confidence?: number | null
          id?: string | null
          pricing_type?: never
          session_description?: never
          session_end_time?: never
          session_start_time?: string | null
          session_title?: never
          session_track?: never
          state?: string | null
          ticket_price?: never
          updated_at?: string | null
          venue_address?: never
          venue_name?: never
        }
        Update: {
          category?: never
          city?: string | null
          country?: string | null
          created_at?: string | null
          currency?: never
          event_data?: Json | null
          event_url?: string | null
          extraction_confidence?: number | null
          id?: string | null
          pricing_type?: never
          session_description?: never
          session_end_time?: never
          session_start_time?: string | null
          session_title?: never
          session_track?: never
          state?: string | null
          ticket_price?: never
          updated_at?: string | null
          venue_address?: never
          venue_name?: never
        }
        Relationships: []
      }
    }
    Functions: {
      gtrgm_compress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_decompress: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_in: {
        Args: { "": unknown }
        Returns: unknown
      }
      gtrgm_options: {
        Args: { "": unknown }
        Returns: undefined
      }
      gtrgm_out: {
        Args: { "": unknown }
        Returns: unknown
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      is_admin: {
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
      search_events: {
        Args: { search_term: string }
        Returns: {
          id: string
          session_title: string
          session_description: string
          city: string
          state: string
          session_start_time: string
          pricing_type: Database["public"]["Enums"]["pricing_type_enum"]
          is_free: boolean
        }[]
      }
      set_limit: {
        Args: { "": number }
        Returns: number
      }
      show_limit: {
        Args: Record<PropertyKey, never>
        Returns: number
      }
      show_trgm: {
        Args: { "": string }
        Returns: string[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      linkedin_discovery_status_enum:
        | "pending"
        | "in_progress"
        | "completed"
        | "failed"
        | "not_attempted"
      organization_relationship_type: "organizer" | "sponsor" | "host"
      organizer_role_enum: "primary" | "secondary" | "support" | "coordinator"
      pricing_type_enum: "standalone" | "conference" | "hybrid" | "free"
      processing_status_enum:
        | "pending"
        | "processing"
        | "completed"
        | "failed"
        | "manual_review"
      profile_source_enum: "extracted" | "manual" | "imported" | "user_created"
      session_type_enum:
        | "presentation"
        | "workshop"
        | "panel"
        | "keynote"
        | "poster"
        | "networking"
      speaking_role_enum:
        | "keynote"
        | "presenter"
        | "panelist"
        | "moderator"
        | "facilitator"
      sponsor_level_enum:
        | "platinum"
        | "gold"
        | "silver"
        | "bronze"
        | "exhibitor"
      sponsorship_type_enum:
        | "financial"
        | "venue"
        | "catering"
        | "technology"
        | "materials"
      website_discovery_status_enum:
        | "pending"
        | "in_progress"
        | "completed"
        | "failed"
        | "not_attempted"
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
      app_role: ["admin", "user"],
      linkedin_discovery_status_enum: [
        "pending",
        "in_progress",
        "completed",
        "failed",
        "not_attempted",
      ],
      organization_relationship_type: ["organizer", "sponsor", "host"],
      organizer_role_enum: ["primary", "secondary", "support", "coordinator"],
      pricing_type_enum: ["standalone", "conference", "hybrid", "free"],
      processing_status_enum: [
        "pending",
        "processing",
        "completed",
        "failed",
        "manual_review",
      ],
      profile_source_enum: ["extracted", "manual", "imported", "user_created"],
      session_type_enum: [
        "presentation",
        "workshop",
        "panel",
        "keynote",
        "poster",
        "networking",
      ],
      speaking_role_enum: [
        "keynote",
        "presenter",
        "panelist",
        "moderator",
        "facilitator",
      ],
      sponsor_level_enum: ["platinum", "gold", "silver", "bronze", "exhibitor"],
      sponsorship_type_enum: [
        "financial",
        "venue",
        "catering",
        "technology",
        "materials",
      ],
      website_discovery_status_enum: [
        "pending",
        "in_progress",
        "completed",
        "failed",
        "not_attempted",
      ],
    },
  },
} as const
