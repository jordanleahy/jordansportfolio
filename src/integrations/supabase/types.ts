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
          deep_dive_content: string | null
          deep_dive_title: string | null
          featured: boolean
          hero_badge: string | null
          hero_headline: string
          hero_image_url: string | null
          hero_subhead: string
          hero_video_url: string | null
          id: string
          intro_content: string
          meta_description: string
          meta_keywords: string[] | null
          meta_title: string
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
          deep_dive_content?: string | null
          deep_dive_title?: string | null
          featured?: boolean
          hero_badge?: string | null
          hero_headline: string
          hero_image_url?: string | null
          hero_subhead: string
          hero_video_url?: string | null
          id?: string
          intro_content: string
          meta_description: string
          meta_keywords?: string[] | null
          meta_title: string
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
          deep_dive_content?: string | null
          deep_dive_title?: string | null
          featured?: boolean
          hero_badge?: string | null
          hero_headline?: string
          hero_image_url?: string | null
          hero_subhead?: string
          hero_video_url?: string | null
          id?: string
          intro_content?: string
          meta_description?: string
          meta_keywords?: string[] | null
          meta_title?: string
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
          sic_code: string | null
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
          sic_code?: string | null
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
          sic_code?: string | null
          submissiontype?: string | null
          testorlive?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      issuers: {
        Row: {
          accessionnumber: string
          cik: string | null
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
          cik?: string | null
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
          cik?: string | null
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
      recipients: {
        Row: {
          accessionnumber: string
          associatedbdcrdnumber: string | null
          associatedbdname: string | null
          city: string | null
          created_at: string
          descriptions_list: string | null
          foreignsolicitation: boolean | null
          id: string
          recipient_seq_key: number | null
          recipientcrdnumber: string | null
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
          associatedbdcrdnumber?: string | null
          associatedbdname?: string | null
          city?: string | null
          created_at?: string
          descriptions_list?: string | null
          foreignsolicitation?: boolean | null
          id?: string
          recipient_seq_key?: number | null
          recipientcrdnumber?: string | null
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
          associatedbdcrdnumber?: string | null
          associatedbdname?: string | null
          city?: string | null
          created_at?: string
          descriptions_list?: string | null
          foreignsolicitation?: boolean | null
          id?: string
          recipient_seq_key?: number | null
          recipientcrdnumber?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
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
      detection_method: "manual" | "voice_pattern" | "hybrid"
      event_status: "upcoming" | "in-progress" | "completed" | "cancelled"
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
      detection_method: ["manual", "voice_pattern", "hybrid"],
      event_status: ["upcoming", "in-progress", "completed", "cancelled"],
    },
  },
} as const
