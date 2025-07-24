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
      blog_posts: {
        Row: {
          category: string
          created_at: string
          cta_text: string
          cta_url: string | null
          day: number | null
          deep_dive_content: string | null
          deep_dive_title: string | null
          featured: boolean
          hero_badge: string | null
          hero_headline: string
          hero_image_16_9_url: string | null
          hero_image_4_3_url: string | null
          hero_image_url: string | null
          hero_subhead: string
          hero_video_url: string | null
          id: string
          intro_content: string
          meta_description: string
          meta_keywords: string[] | null
          meta_title: string
          og_image_url: string | null
          published_at: string | null
          read_time: number | null
          share_enabled: boolean
          slug: string
          status: string
          tags: string[] | null
          tldr_bullets: Json
          tldr_title: string
          updated_at: string
          user_id: string
          visual_sections: Json
          word_count: number | null
        }
        Insert: {
          category: string
          created_at?: string
          cta_text: string
          cta_url?: string | null
          day?: number | null
          deep_dive_content?: string | null
          deep_dive_title?: string | null
          featured?: boolean
          hero_badge?: string | null
          hero_headline: string
          hero_image_16_9_url?: string | null
          hero_image_4_3_url?: string | null
          hero_image_url?: string | null
          hero_subhead: string
          hero_video_url?: string | null
          id?: string
          intro_content: string
          meta_description: string
          meta_keywords?: string[] | null
          meta_title: string
          og_image_url?: string | null
          published_at?: string | null
          read_time?: number | null
          share_enabled?: boolean
          slug: string
          status?: string
          tags?: string[] | null
          tldr_bullets: Json
          tldr_title?: string
          updated_at?: string
          user_id: string
          visual_sections: Json
          word_count?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          cta_text?: string
          cta_url?: string | null
          day?: number | null
          deep_dive_content?: string | null
          deep_dive_title?: string | null
          featured?: boolean
          hero_badge?: string | null
          hero_headline?: string
          hero_image_16_9_url?: string | null
          hero_image_4_3_url?: string | null
          hero_image_url?: string | null
          hero_subhead?: string
          hero_video_url?: string | null
          id?: string
          intro_content?: string
          meta_description?: string
          meta_keywords?: string[] | null
          meta_title?: string
          og_image_url?: string | null
          published_at?: string | null
          read_time?: number | null
          share_enabled?: boolean
          slug?: string
          status?: string
          tags?: string[] | null
          tldr_bullets?: Json
          tldr_title?: string
          updated_at?: string
          user_id?: string
          visual_sections?: Json
          word_count?: number | null
        }
        Relationships: []
      }
      cached_prompts: {
        Row: {
          cache_key: string
          category: string
          created_at: string
          id: string
          metadata: Json | null
          prompt_text: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          cache_key: string
          category: string
          created_at?: string
          id?: string
          metadata?: Json | null
          prompt_text: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          cache_key?: string
          category?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          prompt_text?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      case_studies: {
        Row: {
          created_at: string
          cta_title: string
          description: string
          hero_image: string | null
          hero_image_alt: string | null
          id: string
          outcomes_title: string
          problem_description: string
          problem_title: string
          reflection_title: string
          role: string
          role_details: string | null
          slug: string
          solution_title: string
          status: string
          tags: string[] | null
          timeline: string
          timeline_details: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cta_title: string
          description: string
          hero_image?: string | null
          hero_image_alt?: string | null
          id?: string
          outcomes_title: string
          problem_description: string
          problem_title: string
          reflection_title: string
          role: string
          role_details?: string | null
          slug: string
          solution_title: string
          status?: string
          tags?: string[] | null
          timeline: string
          timeline_details?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          cta_title?: string
          description?: string
          hero_image?: string | null
          hero_image_alt?: string | null
          id?: string
          outcomes_title?: string
          problem_description?: string
          problem_title?: string
          reflection_title?: string
          role?: string
          role_details?: string | null
          slug?: string
          solution_title?: string
          status?: string
          tags?: string[] | null
          timeline?: string
          timeline_details?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      case_study_visuals: {
        Row: {
          case_study_id: string
          created_at: string
          design_artifacts: string[]
          id: string
          process_documentation: string[]
        }
        Insert: {
          case_study_id: string
          created_at?: string
          design_artifacts: string[]
          id?: string
          process_documentation: string[]
        }
        Update: {
          case_study_id?: string
          created_at?: string
          design_artifacts?: string[]
          id?: string
          process_documentation?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "case_study_visuals_case_study_id_fkey"
            columns: ["case_study_id"]
            isOneToOne: false
            referencedRelation: "case_studies"
            referencedColumns: ["id"]
          },
        ]
      }
      company_portfolios: {
        Row: {
          company_name: string
          company_slug: string
          cover_letter: string | null
          created_at: string
          custom_image_url: string | null
          custom_video_url: string | null
          generated_content: Json | null
          id: string
          job_application_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          company_name: string
          company_slug: string
          cover_letter?: string | null
          created_at?: string
          custom_image_url?: string | null
          custom_video_url?: string | null
          generated_content?: Json | null
          id?: string
          job_application_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          company_name?: string
          company_slug?: string
          cover_letter?: string | null
          created_at?: string
          custom_image_url?: string | null
          custom_video_url?: string | null
          generated_content?: Json | null
          id?: string
          job_application_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_portfolios_job_application_id_fkey"
            columns: ["job_application_id"]
            isOneToOne: false
            referencedRelation: "job_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_basic_info: {
        Row: {
          category: string
          company1_value: string
          company2_value: string
          comparison_id: string
          created_at: string
          id: string
          sort_order: number
        }
        Insert: {
          category: string
          company1_value: string
          company2_value: string
          comparison_id: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Update: {
          category?: string
          company1_value?: string
          company2_value?: string
          comparison_id?: string
          created_at?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "comparison_basic_info_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_companies: {
        Row: {
          company_position: number
          comparison_id: string
          created_at: string
          founded: string | null
          headquarters: string | null
          id: string
          key_benefits: string[] | null
          name: string
          unique_strengths: string[] | null
          vendor_id: string | null
        }
        Insert: {
          company_position: number
          comparison_id: string
          created_at?: string
          founded?: string | null
          headquarters?: string | null
          id?: string
          key_benefits?: string[] | null
          name: string
          unique_strengths?: string[] | null
          vendor_id?: string | null
        }
        Update: {
          company_position?: number
          comparison_id?: string
          created_at?: string
          founded?: string | null
          headquarters?: string | null
          id?: string
          key_benefits?: string[] | null
          name?: string
          unique_strengths?: string[] | null
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "comparison_companies_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comparison_companies_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_features: {
        Row: {
          company1_value: string
          company2_value: string
          comparison_id: string
          created_at: string
          feature_name: string
          id: string
          sort_order: number
        }
        Insert: {
          company1_value: string
          company2_value: string
          comparison_id: string
          created_at?: string
          feature_name: string
          id?: string
          sort_order?: number
        }
        Update: {
          company1_value?: string
          company2_value?: string
          comparison_id?: string
          created_at?: string
          feature_name?: string
          id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "comparison_features_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_insights: {
        Row: {
          company_position: number
          comparison_id: string
          created_at: string
          id: string
          insight_text: string
        }
        Insert: {
          company_position: number
          comparison_id: string
          created_at?: string
          id?: string
          insight_text: string
        }
        Update: {
          company_position?: number
          comparison_id?: string
          created_at?: string
          id?: string
          insight_text?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_insights_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
        ]
      }
      comparison_use_cases: {
        Row: {
          best_fit: string
          comparison_id: string
          created_at: string
          id: string
          sort_order: number
          use_case: string
        }
        Insert: {
          best_fit: string
          comparison_id: string
          created_at?: string
          id?: string
          sort_order?: number
          use_case: string
        }
        Update: {
          best_fit?: string
          comparison_id?: string
          created_at?: string
          id?: string
          sort_order?: number
          use_case?: string
        }
        Relationships: [
          {
            foreignKeyName: "comparison_use_cases_comparison_id_fkey"
            columns: ["comparison_id"]
            isOneToOne: false
            referencedRelation: "comparisons"
            referencedColumns: ["id"]
          },
        ]
      }
      comparisons: {
        Row: {
          basic_info: Json
          company1_data: Json
          company2_data: Json
          created_at: string
          created_by: string
          features: Json
          id: string
          meta_description: string
          meta_title: string
          slug: string
          status: string
          summary_insights: Json
          title: string
          updated_at: string
          use_cases: Json
        }
        Insert: {
          basic_info?: Json
          company1_data: Json
          company2_data: Json
          created_at?: string
          created_by: string
          features?: Json
          id?: string
          meta_description: string
          meta_title: string
          slug: string
          status?: string
          summary_insights?: Json
          title: string
          updated_at?: string
          use_cases?: Json
        }
        Update: {
          basic_info?: Json
          company1_data?: Json
          company2_data?: Json
          created_at?: string
          created_by?: string
          features?: Json
          id?: string
          meta_description?: string
          meta_title?: string
          slug?: string
          status?: string
          summary_insights?: Json
          title?: string
          updated_at?: string
          use_cases?: Json
        }
        Relationships: []
      }
      events: {
        Row: {
          capacity: number | null
          created_at: string
          currency: string | null
          description: string | null
          end_time: string | null
          event_date: string
          id: string
          invite_only: boolean | null
          is_online_event: boolean | null
          is_public: boolean
          location: string | null
          max_price: number | null
          min_price: number | null
          organizer_description: string | null
          organizer_id: string | null
          organizer_name: string | null
          published_at: string | null
          start_time: string | null
          status: Database["public"]["Enums"]["event_status"]
          summary: string | null
          timezone: string | null
          title: string
          updated_at: string
          url: string | null
          user_id: string
          venue_address_city: string | null
          venue_address_country: string | null
          venue_address_region: string | null
          venue_id: string | null
        }
        Insert: {
          capacity?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          end_time?: string | null
          event_date: string
          id?: string
          invite_only?: boolean | null
          is_online_event?: boolean | null
          is_public?: boolean
          location?: string | null
          max_price?: number | null
          min_price?: number | null
          organizer_description?: string | null
          organizer_id?: string | null
          organizer_name?: string | null
          published_at?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          summary?: string | null
          timezone?: string | null
          title: string
          updated_at?: string
          url?: string | null
          user_id: string
          venue_address_city?: string | null
          venue_address_country?: string | null
          venue_address_region?: string | null
          venue_id?: string | null
        }
        Update: {
          capacity?: number | null
          created_at?: string
          currency?: string | null
          description?: string | null
          end_time?: string | null
          event_date?: string
          id?: string
          invite_only?: boolean | null
          is_online_event?: boolean | null
          is_public?: boolean
          location?: string | null
          max_price?: number | null
          min_price?: number | null
          organizer_description?: string | null
          organizer_id?: string | null
          organizer_name?: string | null
          published_at?: string | null
          start_time?: string | null
          status?: Database["public"]["Enums"]["event_status"]
          summary?: string | null
          timezone?: string | null
          title?: string
          updated_at?: string
          url?: string | null
          user_id?: string
          venue_address_city?: string | null
          venue_address_country?: string | null
          venue_address_region?: string | null
          venue_id?: string | null
        }
        Relationships: []
      }
      formd_submission: {
        Row: {
          accessionnumber: string
          created_at: string
          file_num: string | null
          filing_date: string | null
          over100issuerflag: boolean | null
          over100personsflag: boolean | null
          schemaversion: string | null
          sic_code: number | null
          submissiontype: string | null
          testorlive: string | null
          updated_at: string
        }
        Insert: {
          accessionnumber: string
          created_at?: string
          file_num?: string | null
          filing_date?: string | null
          over100issuerflag?: boolean | null
          over100personsflag?: boolean | null
          schemaversion?: string | null
          sic_code?: number | null
          submissiontype?: string | null
          testorlive?: string | null
          updated_at?: string
        }
        Update: {
          accessionnumber?: string
          created_at?: string
          file_num?: string | null
          filing_date?: string | null
          over100issuerflag?: boolean | null
          over100personsflag?: boolean | null
          schemaversion?: string | null
          sic_code?: number | null
          submissiontype?: string | null
          testorlive?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      home_health: {
        Row: {
          address: string | null
          address1: string | null
          city: string | null
          created_at: string
          home_health_agency_name: string | null
          id: number
          region: string | null
          state: string | null
          total_medicare_patients: number | null
          total_medicare_visits: number | null
          total_patients: number | null
          website: string | null
          zip: number | null
        }
        Insert: {
          address?: string | null
          address1?: string | null
          city?: string | null
          created_at?: string
          home_health_agency_name?: string | null
          id?: number
          region?: string | null
          state?: string | null
          total_medicare_patients?: number | null
          total_medicare_visits?: number | null
          total_patients?: number | null
          website?: string | null
          zip?: number | null
        }
        Update: {
          address?: string | null
          address1?: string | null
          city?: string | null
          created_at?: string
          home_health_agency_name?: string | null
          id?: number
          region?: string | null
          state?: string | null
          total_medicare_patients?: number | null
          total_medicare_visits?: number | null
          total_patients?: number | null
          website?: string | null
          zip?: number | null
        }
        Relationships: []
      }
      investors: {
        Row: {
          address: string | null
          check_size_max: number | null
          check_size_min: number | null
          city: string | null
          company_name: string
          contact_email: string | null
          created_at: string
          id: string
          latest_fund_name: string | null
          latest_fund_size: number | null
          latest_fund_year: number | null
          lead_partner: string | null
          sector_focus: string[]
          slug: string
          stage: string | null
          state: string | null
          status: string
          total_aum: number | null
          updated_at: string
          user_id: string
          website: string | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          check_size_max?: number | null
          check_size_min?: number | null
          city?: string | null
          company_name: string
          contact_email?: string | null
          created_at?: string
          id?: string
          latest_fund_name?: string | null
          latest_fund_size?: number | null
          latest_fund_year?: number | null
          lead_partner?: string | null
          sector_focus?: string[]
          slug: string
          stage?: string | null
          state?: string | null
          status?: string
          total_aum?: number | null
          updated_at?: string
          user_id: string
          website?: string | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          check_size_max?: number | null
          check_size_min?: number | null
          city?: string | null
          company_name?: string
          contact_email?: string | null
          created_at?: string
          id?: string
          latest_fund_name?: string | null
          latest_fund_size?: number | null
          latest_fund_year?: number | null
          lead_partner?: string | null
          sector_focus?: string[]
          slug?: string
          stage?: string | null
          state?: string | null
          status?: string
          total_aum?: number | null
          updated_at?: string
          user_id?: string
          website?: string | null
          zip?: string | null
        }
        Relationships: []
      }
      issuers: {
        Row: {
          accessionnumber: string
          cik: number | null
          city: string | null
          created_at: string
          edgar_previousname_1: string | null
          edgar_previousname_2: string | null
          edgar_previousname_3: string | null
          entityname: string | null
          entitytype: string | null
          entitytypeotherdesc: string | null
          id: string
          is_primaryissuer_flag: boolean | null
          issuer_previousname_1: string | null
          issuer_previousname_2: string | null
          issuer_previousname_3: string | null
          issuer_seq_key: string | null
          issuerphonenumber: string | null
          jurisdictionofinc: string | null
          stateorcountry: string | null
          stateorcountrydescription: string | null
          street1: string | null
          street2: string | null
          updated_at: string
          yearofinc_timespan_choice: string | null
          yearofinc_value_entered: string | null
          zipcode: string | null
        }
        Insert: {
          accessionnumber: string
          cik?: number | null
          city?: string | null
          created_at?: string
          edgar_previousname_1?: string | null
          edgar_previousname_2?: string | null
          edgar_previousname_3?: string | null
          entityname?: string | null
          entitytype?: string | null
          entitytypeotherdesc?: string | null
          id?: string
          is_primaryissuer_flag?: boolean | null
          issuer_previousname_1?: string | null
          issuer_previousname_2?: string | null
          issuer_previousname_3?: string | null
          issuer_seq_key?: string | null
          issuerphonenumber?: string | null
          jurisdictionofinc?: string | null
          stateorcountry?: string | null
          stateorcountrydescription?: string | null
          street1?: string | null
          street2?: string | null
          updated_at?: string
          yearofinc_timespan_choice?: string | null
          yearofinc_value_entered?: string | null
          zipcode?: string | null
        }
        Update: {
          accessionnumber?: string
          cik?: number | null
          city?: string | null
          created_at?: string
          edgar_previousname_1?: string | null
          edgar_previousname_2?: string | null
          edgar_previousname_3?: string | null
          entityname?: string | null
          entitytype?: string | null
          entitytypeotherdesc?: string | null
          id?: string
          is_primaryissuer_flag?: boolean | null
          issuer_previousname_1?: string | null
          issuer_previousname_2?: string | null
          issuer_previousname_3?: string | null
          issuer_seq_key?: string | null
          issuerphonenumber?: string | null
          jurisdictionofinc?: string | null
          stateorcountry?: string | null
          stateorcountrydescription?: string | null
          street1?: string | null
          street2?: string | null
          updated_at?: string
          yearofinc_timespan_choice?: string | null
          yearofinc_value_entered?: string | null
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "issuers_accessionnumber_fkey"
            columns: ["accessionnumber"]
            isOneToOne: false
            referencedRelation: "formd_submission"
            referencedColumns: ["accessionnumber"]
          },
        ]
      }
      job_applications: {
        Row: {
          attachment_filename: string | null
          attachment_type: string | null
          attachment_url: string | null
          company_name: string
          cover_letter_link: string | null
          created_at: string
          id: string
          job_description: string
          job_description_link: string | null
          resume_link: string | null
          resume_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attachment_filename?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          company_name: string
          cover_letter_link?: string | null
          created_at?: string
          id?: string
          job_description: string
          job_description_link?: string | null
          resume_link?: string | null
          resume_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attachment_filename?: string | null
          attachment_type?: string | null
          attachment_url?: string | null
          company_name?: string
          cover_letter_link?: string | null
          created_at?: string
          id?: string
          job_description?: string
          job_description_link?: string | null
          resume_link?: string | null
          resume_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      offerings: {
        Row: {
          accessionnumber: string
          aggregatenetassetvaluerange: string | null
          authorizedrepresentative: string | null
          buscombclarificationofresp: string | null
          created_at: string
          descriptionofothertype: string | null
          federalexemptions_items_list: string | null
          finderfeeclarificationofresp: string | null
          findersfee_dollaramount: number | null
          findersfee_isestimate: boolean | null
          grossproceedsused_clarofresp: string | null
          grossproceedsused_dollaramount: number | null
          grossproceedsused_isestimate: boolean | null
          hasnonaccreditedinvestors: boolean | null
          industrygrouptype: string | null
          investmentfundtype: string | null
          is40act: boolean | null
          isamendment: boolean | null
          isbusinesscombinationtrans: boolean | null
          isdebttype: boolean | null
          isequitytype: boolean | null
          ismineralpropertytype: boolean | null
          isoptiontoacquiretype: boolean | null
          isothertype: boolean | null
          ispooledinvestmentfundtype: boolean | null
          issecuritytobeacquiredtype: boolean | null
          istenantincommontype: boolean | null
          minimuminvestmentaccepted: number | null
          morethanoneyear: boolean | null
          numbernonaccreditedinvestors: number | null
          over100recipientflag: boolean | null
          previousaccessionnumber: string | null
          revenuerange: string | null
          sale_date: string | null
          salesamtclarificationofresp: string | null
          salescomm_dollaramount: number | null
          salescomm_isestimate: boolean | null
          totalamountsold: number | null
          totalnumberalreadyinvested: number | null
          totalofferingamount: number | null
          totalremaining: number | null
          updated_at: string
          yettooccur: boolean | null
        }
        Insert: {
          accessionnumber: string
          aggregatenetassetvaluerange?: string | null
          authorizedrepresentative?: string | null
          buscombclarificationofresp?: string | null
          created_at?: string
          descriptionofothertype?: string | null
          federalexemptions_items_list?: string | null
          finderfeeclarificationofresp?: string | null
          findersfee_dollaramount?: number | null
          findersfee_isestimate?: boolean | null
          grossproceedsused_clarofresp?: string | null
          grossproceedsused_dollaramount?: number | null
          grossproceedsused_isestimate?: boolean | null
          hasnonaccreditedinvestors?: boolean | null
          industrygrouptype?: string | null
          investmentfundtype?: string | null
          is40act?: boolean | null
          isamendment?: boolean | null
          isbusinesscombinationtrans?: boolean | null
          isdebttype?: boolean | null
          isequitytype?: boolean | null
          ismineralpropertytype?: boolean | null
          isoptiontoacquiretype?: boolean | null
          isothertype?: boolean | null
          ispooledinvestmentfundtype?: boolean | null
          issecuritytobeacquiredtype?: boolean | null
          istenantincommontype?: boolean | null
          minimuminvestmentaccepted?: number | null
          morethanoneyear?: boolean | null
          numbernonaccreditedinvestors?: number | null
          over100recipientflag?: boolean | null
          previousaccessionnumber?: string | null
          revenuerange?: string | null
          sale_date?: string | null
          salesamtclarificationofresp?: string | null
          salescomm_dollaramount?: number | null
          salescomm_isestimate?: boolean | null
          totalamountsold?: number | null
          totalnumberalreadyinvested?: number | null
          totalofferingamount?: number | null
          totalremaining?: number | null
          updated_at?: string
          yettooccur?: boolean | null
        }
        Update: {
          accessionnumber?: string
          aggregatenetassetvaluerange?: string | null
          authorizedrepresentative?: string | null
          buscombclarificationofresp?: string | null
          created_at?: string
          descriptionofothertype?: string | null
          federalexemptions_items_list?: string | null
          finderfeeclarificationofresp?: string | null
          findersfee_dollaramount?: number | null
          findersfee_isestimate?: boolean | null
          grossproceedsused_clarofresp?: string | null
          grossproceedsused_dollaramount?: number | null
          grossproceedsused_isestimate?: boolean | null
          hasnonaccreditedinvestors?: boolean | null
          industrygrouptype?: string | null
          investmentfundtype?: string | null
          is40act?: boolean | null
          isamendment?: boolean | null
          isbusinesscombinationtrans?: boolean | null
          isdebttype?: boolean | null
          isequitytype?: boolean | null
          ismineralpropertytype?: boolean | null
          isoptiontoacquiretype?: boolean | null
          isothertype?: boolean | null
          ispooledinvestmentfundtype?: boolean | null
          issecuritytobeacquiredtype?: boolean | null
          istenantincommontype?: boolean | null
          minimuminvestmentaccepted?: number | null
          morethanoneyear?: boolean | null
          numbernonaccreditedinvestors?: number | null
          over100recipientflag?: boolean | null
          previousaccessionnumber?: string | null
          revenuerange?: string | null
          sale_date?: string | null
          salesamtclarificationofresp?: string | null
          salescomm_dollaramount?: number | null
          salescomm_isestimate?: boolean | null
          totalamountsold?: number | null
          totalnumberalreadyinvested?: number | null
          totalofferingamount?: number | null
          totalremaining?: number | null
          updated_at?: string
          yettooccur?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "offerings_accessionnumber_fkey"
            columns: ["accessionnumber"]
            isOneToOne: true
            referencedRelation: "formd_submission"
            referencedColumns: ["accessionnumber"]
          },
        ]
      }
      openai_agents: {
        Row: {
          created_at: string
          id: string
          input_source: string
          last_run: string | null
          metrics: Json | null
          model_version: string
          name: string
          notes: string | null
          output_target: string
          owner: string
          purpose: string
          schedule: string
          status: Database["public"]["Enums"]["agent_status"]
          tags: string[] | null
          trigger: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          input_source: string
          last_run?: string | null
          metrics?: Json | null
          model_version?: string
          name: string
          notes?: string | null
          output_target: string
          owner: string
          purpose: string
          schedule?: string
          status?: Database["public"]["Enums"]["agent_status"]
          tags?: string[] | null
          trigger: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          input_source?: string
          last_run?: string | null
          metrics?: Json | null
          model_version?: string
          name?: string
          notes?: string | null
          output_target?: string
          owner?: string
          purpose?: string
          schedule?: string
          status?: Database["public"]["Enums"]["agent_status"]
          tags?: string[] | null
          trigger?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      recipients: {
        Row: {
          accessionnumber: string
          associatedbdcrdnumber: number | null
          associatedbdname: string | null
          city: string | null
          created_at: string
          descriptions_list: string | null
          foreignsolicitation: boolean | null
          id: string
          recipient_seq_key: number | null
          recipientcrdnumber: number | null
          recipientname: string | null
          stateorcountry: string | null
          stateorcountrydescription: string | null
          states_or_value_list: string | null
          street1: string | null
          street2: string | null
          updated_at: string
          zipcode: string | null
        }
        Insert: {
          accessionnumber: string
          associatedbdcrdnumber?: number | null
          associatedbdname?: string | null
          city?: string | null
          created_at?: string
          descriptions_list?: string | null
          foreignsolicitation?: boolean | null
          id?: string
          recipient_seq_key?: number | null
          recipientcrdnumber?: number | null
          recipientname?: string | null
          stateorcountry?: string | null
          stateorcountrydescription?: string | null
          states_or_value_list?: string | null
          street1?: string | null
          street2?: string | null
          updated_at?: string
          zipcode?: string | null
        }
        Update: {
          accessionnumber?: string
          associatedbdcrdnumber?: number | null
          associatedbdname?: string | null
          city?: string | null
          created_at?: string
          descriptions_list?: string | null
          foreignsolicitation?: boolean | null
          id?: string
          recipient_seq_key?: number | null
          recipientcrdnumber?: number | null
          recipientname?: string | null
          stateorcountry?: string | null
          stateorcountrydescription?: string | null
          states_or_value_list?: string | null
          street1?: string | null
          street2?: string | null
          updated_at?: string
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recipients_accessionnumber_fkey"
            columns: ["accessionnumber"]
            isOneToOne: false
            referencedRelation: "formd_submission"
            referencedColumns: ["accessionnumber"]
          },
        ]
      }
      related_persons: {
        Row: {
          accessionnumber: string
          city: string | null
          created_at: string
          firstname: string | null
          id: string
          lastname: string | null
          middlename: string | null
          relatedperson_seq_key: number | null
          relationship_1: string | null
          relationship_2: string | null
          relationship_3: string | null
          relationshipclarification: string | null
          stateorcountry: string | null
          stateorcountrydescription: string | null
          street1: string | null
          street2: string | null
          updated_at: string
          zipcode: string | null
        }
        Insert: {
          accessionnumber: string
          city?: string | null
          created_at?: string
          firstname?: string | null
          id?: string
          lastname?: string | null
          middlename?: string | null
          relatedperson_seq_key?: number | null
          relationship_1?: string | null
          relationship_2?: string | null
          relationship_3?: string | null
          relationshipclarification?: string | null
          stateorcountry?: string | null
          stateorcountrydescription?: string | null
          street1?: string | null
          street2?: string | null
          updated_at?: string
          zipcode?: string | null
        }
        Update: {
          accessionnumber?: string
          city?: string | null
          created_at?: string
          firstname?: string | null
          id?: string
          lastname?: string | null
          middlename?: string | null
          relatedperson_seq_key?: number | null
          relationship_1?: string | null
          relationship_2?: string | null
          relationship_3?: string | null
          relationshipclarification?: string | null
          stateorcountry?: string | null
          stateorcountrydescription?: string | null
          street1?: string | null
          street2?: string | null
          updated_at?: string
          zipcode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "related_persons_accessionnumber_fkey"
            columns: ["accessionnumber"]
            isOneToOne: false
            referencedRelation: "formd_submission"
            referencedColumns: ["accessionnumber"]
          },
        ]
      }
      signatures: {
        Row: {
          accessionnumber: string
          created_at: string
          id: string
          issuername: string | null
          nameofsigner: string | null
          signature_seq_key: number | null
          signaturedate: string | null
          signaturename: string | null
          signaturetitle: string | null
          updated_at: string
        }
        Insert: {
          accessionnumber: string
          created_at?: string
          id?: string
          issuername?: string | null
          nameofsigner?: string | null
          signature_seq_key?: number | null
          signaturedate?: string | null
          signaturename?: string | null
          signaturetitle?: string | null
          updated_at?: string
        }
        Update: {
          accessionnumber?: string
          created_at?: string
          id?: string
          issuername?: string | null
          nameofsigner?: string | null
          signature_seq_key?: number | null
          signaturedate?: string | null
          signaturename?: string | null
          signaturetitle?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "signatures_accessionnumber_fkey"
            columns: ["accessionnumber"]
            isOneToOne: false
            referencedRelation: "formd_submission"
            referencedColumns: ["accessionnumber"]
          },
        ]
      }
      social_media_posts: {
        Row: {
          category: string
          created_at: string
          day: number | null
          description: string
          general_gif_url: string | null
          general_video_url: string | null
          generated_image_prompt: string | null
          id: string
          image_16_9_gif_url: string | null
          image_16_9_url: string | null
          image_16_9_video_url: string | null
          image_3_4_gif_url: string | null
          image_3_4_url: string | null
          image_3_4_video_url: string | null
          image_4_3_url: string | null
          image_9_16_url: string | null
          platform_tags: Json | null
          scheduled_date: string | null
          status: Database["public"]["Enums"]["post_status"]
          theme: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category?: string
          created_at?: string
          day?: number | null
          description: string
          general_gif_url?: string | null
          general_video_url?: string | null
          generated_image_prompt?: string | null
          id?: string
          image_16_9_gif_url?: string | null
          image_16_9_url?: string | null
          image_16_9_video_url?: string | null
          image_3_4_gif_url?: string | null
          image_3_4_url?: string | null
          image_3_4_video_url?: string | null
          image_4_3_url?: string | null
          image_9_16_url?: string | null
          platform_tags?: Json | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          theme?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          day?: number | null
          description?: string
          general_gif_url?: string | null
          general_video_url?: string | null
          generated_image_prompt?: string | null
          id?: string
          image_16_9_gif_url?: string | null
          image_16_9_url?: string | null
          image_16_9_video_url?: string | null
          image_3_4_gif_url?: string | null
          image_3_4_url?: string | null
          image_3_4_video_url?: string | null
          image_4_3_url?: string | null
          image_9_16_url?: string | null
          platform_tags?: Json | null
          scheduled_date?: string | null
          status?: Database["public"]["Enums"]["post_status"]
          theme?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      vendor_jobs: {
        Row: {
          created_at: string
          id: string
          job_description: string
          job_title: string | null
          job_url: string
          resume_text: string | null
          updated_at: string
          user_id: string
          vendor_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          job_description: string
          job_title?: string | null
          job_url: string
          resume_text?: string | null
          updated_at?: string
          user_id: string
          vendor_id: string
        }
        Update: {
          created_at?: string
          id?: string
          job_description?: string
          job_title?: string | null
          job_url?: string
          resume_text?: string | null
          updated_at?: string
          user_id?: string
          vendor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendor_jobs_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
      }
      vendors: {
        Row: {
          awards_recognition: string[] | null
          business_model: string | null
          certifications: string[] | null
          company_data: Json | null
          company_name: string
          company_type: string
          competitive_advantages: string[]
          competitors: string[]
          contact_address: string | null
          contact_email: string | null
          contact_phone: string | null
          core_services: string[]
          created_at: string
          customers: string[]
          description: string
          employee_count_range: string | null
          founding_year: number | null
          funding_stage: string | null
          geographic_presence: string | null
          headquarters: string
          id: string
          key_benefits: string[]
          key_features: string[]
          key_investors: string[]
          linkedin_url: string | null
          notable_customers: string[]
          office_locations: string[] | null
          partnerships: string[] | null
          performance_metrics: Json | null
          research_data: Json | null
          sec_accession_number: string | null
          sitemap_agent_id: string | null
          sitemap_fetched_at: string | null
          sitemap_tree: Json | null
          slug: string
          source_url: string | null
          specialties: string[]
          status: string | null
          tech_stack: string[] | null
          total_funding: string | null
          twitter_url: string | null
          updated_at: string
          user_id: string
          vendor_images: Json | null
          website_url: string | null
        }
        Insert: {
          awards_recognition?: string[] | null
          business_model?: string | null
          certifications?: string[] | null
          company_data?: Json | null
          company_name: string
          company_type: string
          competitive_advantages?: string[]
          competitors?: string[]
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          core_services?: string[]
          created_at?: string
          customers?: string[]
          description: string
          employee_count_range?: string | null
          founding_year?: number | null
          funding_stage?: string | null
          geographic_presence?: string | null
          headquarters: string
          id?: string
          key_benefits?: string[]
          key_features?: string[]
          key_investors?: string[]
          linkedin_url?: string | null
          notable_customers?: string[]
          office_locations?: string[] | null
          partnerships?: string[] | null
          performance_metrics?: Json | null
          research_data?: Json | null
          sec_accession_number?: string | null
          sitemap_agent_id?: string | null
          sitemap_fetched_at?: string | null
          sitemap_tree?: Json | null
          slug: string
          source_url?: string | null
          specialties?: string[]
          status?: string | null
          tech_stack?: string[] | null
          total_funding?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id: string
          vendor_images?: Json | null
          website_url?: string | null
        }
        Update: {
          awards_recognition?: string[] | null
          business_model?: string | null
          certifications?: string[] | null
          company_data?: Json | null
          company_name?: string
          company_type?: string
          competitive_advantages?: string[]
          competitors?: string[]
          contact_address?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          core_services?: string[]
          created_at?: string
          customers?: string[]
          description?: string
          employee_count_range?: string | null
          founding_year?: number | null
          funding_stage?: string | null
          geographic_presence?: string | null
          headquarters?: string
          id?: string
          key_benefits?: string[]
          key_features?: string[]
          key_investors?: string[]
          linkedin_url?: string | null
          notable_customers?: string[]
          office_locations?: string[] | null
          partnerships?: string[] | null
          performance_metrics?: Json | null
          research_data?: Json | null
          sec_accession_number?: string | null
          sitemap_agent_id?: string | null
          sitemap_fetched_at?: string | null
          sitemap_tree?: Json | null
          slug?: string
          source_url?: string | null
          specialties?: string[]
          status?: string | null
          tech_stack?: string[] | null
          total_funding?: string | null
          twitter_url?: string | null
          updated_at?: string
          user_id?: string
          vendor_images?: Json | null
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vendors_sec_accession_number_fkey"
            columns: ["sec_accession_number"]
            isOneToOne: false
            referencedRelation: "mv_offerings_enriched"
            referencedColumns: ["accessionnumber"]
          },
          {
            foreignKeyName: "vendors_sec_accession_number_fkey"
            columns: ["sec_accession_number"]
            isOneToOne: false
            referencedRelation: "offerings"
            referencedColumns: ["accessionnumber"]
          },
          {
            foreignKeyName: "vendors_sitemap_agent_id_fkey"
            columns: ["sitemap_agent_id"]
            isOneToOne: false
            referencedRelation: "openai_agents"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      mv_offerings_enriched: {
        Row: {
          accessionnumber: string | null
          aggregatenetassetvaluerange: string | null
          authorizedrepresentative: string | null
          buscombclarificationofresp: string | null
          company_city: string | null
          company_location: string | null
          company_name: string | null
          country_code: string | null
          created_at: string | null
          descriptionofothertype: string | null
          federalexemptions_items_list: string | null
          finderfeeclarificationofresp: string | null
          findersfee_dollaramount: number | null
          findersfee_isestimate: boolean | null
          grossproceedsused_clarofresp: string | null
          grossproceedsused_dollaramount: number | null
          grossproceedsused_isestimate: boolean | null
          hasnonaccreditedinvestors: boolean | null
          industrygrouptype: string | null
          investmentfundtype: string | null
          is_fully_raised: boolean | null
          is_us_company: boolean | null
          is40act: boolean | null
          isamendment: boolean | null
          isbusinesscombinationtrans: boolean | null
          isdebttype: boolean | null
          isequitytype: boolean | null
          ismineralpropertytype: boolean | null
          isoptiontoacquiretype: boolean | null
          isothertype: boolean | null
          ispooledinvestmentfundtype: boolean | null
          issecuritytobeacquiredtype: boolean | null
          istenantincommontype: boolean | null
          minimuminvestmentaccepted: number | null
          morethanoneyear: boolean | null
          numbernonaccreditedinvestors: number | null
          over100recipientflag: boolean | null
          previousaccessionnumber: string | null
          primary_signer: string | null
          revenuerange: string | null
          sale_date: string | null
          salesamtclarificationofresp: string | null
          salescomm_dollaramount: number | null
          salescomm_isestimate: boolean | null
          totalamountsold: number | null
          totalnumberalreadyinvested: number | null
          totalofferingamount: number | null
          totalremaining: number | null
          updated_at: string | null
          yettooccur: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "offerings_accessionnumber_fkey"
            columns: ["accessionnumber"]
            isOneToOne: true
            referencedRelation: "formd_submission"
            referencedColumns: ["accessionnumber"]
          },
        ]
      }
    }
    Functions: {
      add_coding_ai_data_for_user: {
        Args: { target_user_id: string }
        Returns: number
      }
      fuzzy_search_offerings: {
        Args: { search_term: string; similarity_threshold?: number }
        Returns: {
          accessionnumber: string
          company_name: string
          similarity_score: number
        }[]
      }
      has_role: {
        Args: {
          _user_id: string
          _role: Database["public"]["Enums"]["app_role"]
        }
        Returns: boolean
      }
      insert_category_content: {
        Args: { category_name: string; posts_data: Json }
        Returns: number
      }
      insert_cdi_content: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      insert_contracts_content: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      insert_sample_agents: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      insert_sirs_agent: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      refresh_offerings_view: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      validate_tldr_bullets: {
        Args: { bullets: Json }
        Returns: boolean
      }
      validate_visual_sections: {
        Args: { sections: Json }
        Returns: boolean
      }
    }
    Enums: {
      agent_status: "active" | "paused" | "deprecated"
      app_role: "admin" | "moderator" | "user"
      detection_method: "manual" | "voice_pattern" | "hybrid"
      event_status: "upcoming" | "in-progress" | "completed" | "cancelled"
      post_status: "draft" | "scheduled" | "published"
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
      agent_status: ["active", "paused", "deprecated"],
      app_role: ["admin", "moderator", "user"],
      detection_method: ["manual", "voice_pattern", "hybrid"],
      event_status: ["upcoming", "in-progress", "completed", "cancelled"],
      post_status: ["draft", "scheduled", "published"],
    },
  },
} as const
