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
      admin_activity_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          id: string
          ip_address: string | null
          metadata: Json | null
          target_details: Json | null
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_details?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          target_details?: Json | null
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_signal_pages: {
        Row: {
          category: string
          conversion_rate: number | null
          created_at: string | null
          headline: string
          id: string
          intent_score: number | null
          is_active: boolean | null
          primary_cta: string | null
          rfqs_submitted: number | null
          secondary_cta: string | null
          slug: string
          subcategory: string
          subheadline: string | null
          successful_deals_count: number | null
          target_country: string
          target_industries: string[] | null
          updated_at: string | null
          verified_suppliers_count: number | null
          views: number | null
        }
        Insert: {
          category: string
          conversion_rate?: number | null
          created_at?: string | null
          headline: string
          id?: string
          intent_score?: number | null
          is_active?: boolean | null
          primary_cta?: string | null
          rfqs_submitted?: number | null
          secondary_cta?: string | null
          slug: string
          subcategory: string
          subheadline?: string | null
          successful_deals_count?: number | null
          target_country?: string
          target_industries?: string[] | null
          updated_at?: string | null
          verified_suppliers_count?: number | null
          views?: number | null
        }
        Update: {
          category?: string
          conversion_rate?: number | null
          created_at?: string | null
          headline?: string
          id?: string
          intent_score?: number | null
          is_active?: boolean | null
          primary_cta?: string | null
          rfqs_submitted?: number | null
          secondary_cta?: string | null
          slug?: string
          subcategory?: string
          subheadline?: string | null
          successful_deals_count?: number | null
          target_country?: string
          target_industries?: string[] | null
          updated_at?: string | null
          verified_suppliers_count?: number | null
          views?: number | null
        }
        Relationships: []
      }
      affiliate_eligibility: {
        Row: {
          commission_tier: string | null
          created_at: string
          disqualification_reason: string | null
          eligibility_type: string
          id: string
          is_eligible: boolean | null
          kyc_verified: boolean | null
          kyc_verified_at: string | null
          kyc_verified_by: string | null
          max_commission_per_order: number | null
          monthly_payout_cap: number | null
          total_gmv_referred: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          commission_tier?: string | null
          created_at?: string
          disqualification_reason?: string | null
          eligibility_type: string
          id?: string
          is_eligible?: boolean | null
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          kyc_verified_by?: string | null
          max_commission_per_order?: number | null
          monthly_payout_cap?: number | null
          total_gmv_referred?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          commission_tier?: string | null
          created_at?: string
          disqualification_reason?: string | null
          eligibility_type?: string
          id?: string
          is_eligible?: boolean | null
          kyc_verified?: boolean | null
          kyc_verified_at?: string | null
          kyc_verified_by?: string | null
          max_commission_per_order?: number | null
          monthly_payout_cap?: number | null
          total_gmv_referred?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      affiliates: {
        Row: {
          activated_at: string | null
          created_at: string | null
          deactivated_at: string | null
          deactivation_reason: string | null
          id: string
          joined_at: string | null
          queue_position: number | null
          referral_code: string | null
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          activated_at?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          id?: string
          joined_at?: string | null
          queue_position?: number | null
          referral_code?: string | null
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          activated_at?: string | null
          created_at?: string | null
          deactivated_at?: string | null
          deactivation_reason?: string | null
          id?: string
          joined_at?: string | null
          queue_position?: number | null
          referral_code?: string | null
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_sales_conversions: {
        Row: {
          conversion_type: string
          converted_at: string | null
          deal_closed_at: string | null
          deal_value: number | null
          id: string
          landing_page_id: string | null
          lead_id: string | null
          rfq_id: string | null
          source_channel: string | null
          source_type: string | null
        }
        Insert: {
          conversion_type: string
          converted_at?: string | null
          deal_closed_at?: string | null
          deal_value?: number | null
          id?: string
          landing_page_id?: string | null
          lead_id?: string | null
          rfq_id?: string | null
          source_channel?: string | null
          source_type?: string | null
        }
        Update: {
          conversion_type?: string
          converted_at?: string | null
          deal_closed_at?: string | null
          deal_value?: number | null
          id?: string
          landing_page_id?: string | null
          lead_id?: string | null
          rfq_id?: string | null
          source_channel?: string | null
          source_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_sales_conversions_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "admin_landing_page_metrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sales_conversions_landing_page_id_fkey"
            columns: ["landing_page_id"]
            isOneToOne: false
            referencedRelation: "ai_sales_landing_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sales_conversions_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "ai_sales_leads"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ai_sales_conversions_rfq_id_fkey"
            columns: ["rfq_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_sales_discovery_jobs: {
        Row: {
          buyer_type: string | null
          category: string
          completed_at: string | null
          country: string
          created_at: string | null
          created_by: string | null
          error_message: string | null
          id: string
          leads_found: number | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          buyer_type?: string | null
          category: string
          completed_at?: string | null
          country: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          leads_found?: number | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          buyer_type?: string | null
          category?: string
          completed_at?: string | null
          country?: string
          created_at?: string | null
          created_by?: string | null
          error_message?: string | null
          id?: string
          leads_found?: number | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      ai_sales_landing_pages: {
        Row: {
          category: string
          conversion_count: number | null
          country: string
          created_at: string | null
          cta_text: string | null
          headline: string
          hero_image_url: string | null
          id: string
          is_active: boolean | null
          meta_description: string | null
          meta_title: string | null
          slug: string
          subheadline: string | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          category: string
          conversion_count?: number | null
          country: string
          created_at?: string | null
          cta_text?: string | null
          headline: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          slug: string
          subheadline?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string
          conversion_count?: number | null
          country?: string
          created_at?: string | null
          cta_text?: string | null
          headline?: string
          hero_image_url?: string | null
          id?: string
          is_active?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          slug?: string
          subheadline?: string | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      ai_sales_leads: {
        Row: {
          acquisition_source: string | null
          buyer_name: string | null
          buyer_type: string | null
          category: string | null
          city: string | null
          company_name: string | null
          company_role: string | null
          confidence_score: number | null
          contacted_at: string | null
          country: string | null
          created_at: string | null
          discovered_at: string | null
          email: string | null
          enrichment_data: Json | null
          id: string
          industry_segment: string | null
          lead_fingerprint: string | null
          lead_source: string | null
          notes: string | null
          phone: string | null
          status: string | null
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          acquisition_source?: string | null
          buyer_name?: string | null
          buyer_type?: string | null
          category?: string | null
          city?: string | null
          company_name?: string | null
          company_role?: string | null
          confidence_score?: number | null
          contacted_at?: string | null
          country?: string | null
          created_at?: string | null
          discovered_at?: string | null
          email?: string | null
          enrichment_data?: Json | null
          id?: string
          industry_segment?: string | null
          lead_fingerprint?: string | null
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          acquisition_source?: string | null
          buyer_name?: string | null
          buyer_type?: string | null
          category?: string | null
          city?: string | null
          company_name?: string | null
          company_role?: string | null
          confidence_score?: number | null
          contacted_at?: string | null
          country?: string | null
          created_at?: string | null
          discovered_at?: string | null
          email?: string | null
          enrichment_data?: Json | null
          id?: string
          industry_segment?: string | null
          lead_fingerprint?: string | null
          lead_source?: string | null
          notes?: string | null
          phone?: string | null
          status?: string | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_sales_messages: {
        Row: {
          category: string
          channel: string
          country: string
          created_at: string | null
          id: string
          is_active: boolean | null
          message_body: string
          subject: string | null
          tone: string | null
          updated_at: string | null
          usage_count: number | null
        }
        Insert: {
          category: string
          channel: string
          country: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_body: string
          subject?: string | null
          tone?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Update: {
          category?: string
          channel?: string
          country?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          message_body?: string
          subject?: string | null
          tone?: string | null
          updated_at?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      ai_sem_runs: {
        Row: {
          ads_generated: number | null
          avg_deal_size: number | null
          buyer_type: string | null
          campaigns_created: number | null
          category: string | null
          company_role: string | null
          completed_at: string | null
          cost_per_rfq: number | null
          country: string | null
          created_at: string
          created_by: string | null
          error_message: string | null
          id: string
          industry_match_rate: number | null
          min_deal_size: number | null
          qualified_leads: number | null
          rfqs_submitted: number | null
          started_at: string | null
          status: string
          subcategory: string | null
          target_industries: string[] | null
          total_clicks: number | null
          total_conversions: number | null
          total_impressions: number | null
        }
        Insert: {
          ads_generated?: number | null
          avg_deal_size?: number | null
          buyer_type?: string | null
          campaigns_created?: number | null
          category?: string | null
          company_role?: string | null
          completed_at?: string | null
          cost_per_rfq?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          industry_match_rate?: number | null
          min_deal_size?: number | null
          qualified_leads?: number | null
          rfqs_submitted?: number | null
          started_at?: string | null
          status?: string
          subcategory?: string | null
          target_industries?: string[] | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_impressions?: number | null
        }
        Update: {
          ads_generated?: number | null
          avg_deal_size?: number | null
          buyer_type?: string | null
          campaigns_created?: number | null
          category?: string | null
          company_role?: string | null
          completed_at?: string | null
          cost_per_rfq?: number | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          error_message?: string | null
          id?: string
          industry_match_rate?: number | null
          min_deal_size?: number | null
          qualified_leads?: number | null
          rfqs_submitted?: number | null
          started_at?: string | null
          status?: string
          subcategory?: string | null
          target_industries?: string[] | null
          total_clicks?: number | null
          total_conversions?: number | null
          total_impressions?: number | null
        }
        Relationships: []
      }
      ai_sem_settings: {
        Row: {
          buyer_type: string | null
          category: string | null
          company_role: string | null
          country: string | null
          created_at: string | null
          enabled: boolean | null
          frequency: string | null
          id: string
          last_run_at: string | null
          min_deal_size: number | null
          subcategory: string | null
          target_industries: string[] | null
          updated_at: string | null
        }
        Insert: {
          buyer_type?: string | null
          category?: string | null
          company_role?: string | null
          country?: string | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string | null
          id?: string
          last_run_at?: string | null
          min_deal_size?: number | null
          subcategory?: string | null
          target_industries?: string[] | null
          updated_at?: string | null
        }
        Update: {
          buyer_type?: string | null
          category?: string | null
          company_role?: string | null
          country?: string | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string | null
          id?: string
          last_run_at?: string | null
          min_deal_size?: number | null
          subcategory?: string | null
          target_industries?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      ai_seo_runs: {
        Row: {
          auto_rfq_id: string | null
          available_suppliers_count: number | null
          avg_deal_size: number | null
          buyer_inquiries: number | null
          category: string | null
          company_role: string | null
          completed_at: string | null
          country: string | null
          created_at: string
          created_by: string | null
          decision_action: string | null
          error_message: string | null
          estimated_order_value: number | null
          fulfilment_confidence: number | null
          id: string
          industries_reached: string[] | null
          industry_match_rate: number | null
          intent_score: number | null
          keywords_discovered: number | null
          pages_audited: number | null
          pages_generated: number | null
          qualified_leads: number | null
          rfqs_submitted: number | null
          signal_classification: string | null
          started_at: string | null
          status: string
          subcategories_covered: string[] | null
          subcategory: string | null
          urgency_score: number | null
        }
        Insert: {
          auto_rfq_id?: string | null
          available_suppliers_count?: number | null
          avg_deal_size?: number | null
          buyer_inquiries?: number | null
          category?: string | null
          company_role?: string | null
          completed_at?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          decision_action?: string | null
          error_message?: string | null
          estimated_order_value?: number | null
          fulfilment_confidence?: number | null
          id?: string
          industries_reached?: string[] | null
          industry_match_rate?: number | null
          intent_score?: number | null
          keywords_discovered?: number | null
          pages_audited?: number | null
          pages_generated?: number | null
          qualified_leads?: number | null
          rfqs_submitted?: number | null
          signal_classification?: string | null
          started_at?: string | null
          status?: string
          subcategories_covered?: string[] | null
          subcategory?: string | null
          urgency_score?: number | null
        }
        Update: {
          auto_rfq_id?: string | null
          available_suppliers_count?: number | null
          avg_deal_size?: number | null
          buyer_inquiries?: number | null
          category?: string | null
          company_role?: string | null
          completed_at?: string | null
          country?: string | null
          created_at?: string
          created_by?: string | null
          decision_action?: string | null
          error_message?: string | null
          estimated_order_value?: number | null
          fulfilment_confidence?: number | null
          id?: string
          industries_reached?: string[] | null
          industry_match_rate?: number | null
          intent_score?: number | null
          keywords_discovered?: number | null
          pages_audited?: number | null
          pages_generated?: number | null
          qualified_leads?: number | null
          rfqs_submitted?: number | null
          signal_classification?: string | null
          started_at?: string | null
          status?: string
          subcategories_covered?: string[] | null
          subcategory?: string | null
          urgency_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "ai_seo_runs_auto_rfq_id_fkey"
            columns: ["auto_rfq_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_seo_settings: {
        Row: {
          category: string | null
          company_role: string | null
          country: string | null
          created_at: string | null
          enabled: boolean | null
          frequency: string | null
          id: string
          last_run_at: string | null
          min_deal_size: number | null
          subcategory: string | null
          target_industries: string[] | null
          updated_at: string | null
        }
        Insert: {
          category?: string | null
          company_role?: string | null
          country?: string | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string | null
          id?: string
          last_run_at?: string | null
          min_deal_size?: number | null
          subcategory?: string | null
          target_industries?: string[] | null
          updated_at?: string | null
        }
        Update: {
          category?: string | null
          company_role?: string | null
          country?: string | null
          created_at?: string | null
          enabled?: boolean | null
          frequency?: string | null
          id?: string
          last_run_at?: string | null
          min_deal_size?: number | null
          subcategory?: string | null
          target_industries?: string[] | null
          updated_at?: string | null
        }
        Relationships: []
      }
      award_audit_logs: {
        Row: {
          action: string
          award_type: string | null
          bid_id: string | null
          coverage_percentage: number | null
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          requirement_id: string | null
        }
        Insert: {
          action: string
          award_type?: string | null
          bid_id?: string | null
          coverage_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          requirement_id?: string | null
        }
        Update: {
          action?: string
          award_type?: string | null
          bid_id?: string | null
          coverage_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          requirement_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "award_audit_logs_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "admin_deal_analytics"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "award_audit_logs_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "anonymized_supplier_quotes"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "award_audit_logs_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "award_audit_logs_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "supplier_deal_closures"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "award_audit_logs_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      bid_items: {
        Row: {
          bid_id: string
          created_at: string | null
          dispatched_qty: number | null
          id: string
          quantity: number
          requirement_item_id: string
          supplier_unit_price: number
          total: number
          unit_price: number
        }
        Insert: {
          bid_id: string
          created_at?: string | null
          dispatched_qty?: number | null
          id?: string
          quantity: number
          requirement_item_id: string
          supplier_unit_price: number
          total: number
          unit_price: number
        }
        Update: {
          bid_id?: string
          created_at?: string | null
          dispatched_qty?: number | null
          id?: string
          quantity?: number
          requirement_item_id?: string
          supplier_unit_price?: number
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bid_items_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "admin_deal_analytics"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "bid_items_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "anonymized_supplier_quotes"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "bid_items_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_items_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "supplier_deal_closures"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "bid_items_requirement_item_id_fkey"
            columns: ["requirement_item_id"]
            isOneToOne: false
            referencedRelation: "requirement_items"
            referencedColumns: ["id"]
          },
        ]
      }
      bids: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          award_coverage_percentage: number | null
          award_justification: string | null
          award_type: string | null
          bid_amount: number
          buyer_logistics_price: number | null
          buyer_material_price: number | null
          buyer_visible_price: number
          created_at: string
          delivered_at: string | null
          delivery_timeline_days: number
          dispatched_qty: number | null
          expected_delivery_date: string | null
          id: string
          is_paid_bid: boolean
          logistics_execution_mode: string | null
          logistics_notes: string | null
          markup_amount: number | null
          markup_percentage: number | null
          platform_margin: number | null
          quality_status: string | null
          requirement_id: string
          service_fee: number
          status: Database["public"]["Enums"]["bid_status"]
          supplier_id: string
          supplier_logistics_price: number | null
          supplier_material_price: number | null
          supplier_net_price: number
          terms_and_conditions: string | null
          total_amount: number
          transaction_type: string | null
          updated_at: string
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          award_coverage_percentage?: number | null
          award_justification?: string | null
          award_type?: string | null
          bid_amount: number
          buyer_logistics_price?: number | null
          buyer_material_price?: number | null
          buyer_visible_price: number
          created_at?: string
          delivered_at?: string | null
          delivery_timeline_days: number
          dispatched_qty?: number | null
          expected_delivery_date?: string | null
          id?: string
          is_paid_bid?: boolean
          logistics_execution_mode?: string | null
          logistics_notes?: string | null
          markup_amount?: number | null
          markup_percentage?: number | null
          platform_margin?: number | null
          quality_status?: string | null
          requirement_id: string
          service_fee: number
          status?: Database["public"]["Enums"]["bid_status"]
          supplier_id: string
          supplier_logistics_price?: number | null
          supplier_material_price?: number | null
          supplier_net_price: number
          terms_and_conditions?: string | null
          total_amount: number
          transaction_type?: string | null
          updated_at?: string
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          award_coverage_percentage?: number | null
          award_justification?: string | null
          award_type?: string | null
          bid_amount?: number
          buyer_logistics_price?: number | null
          buyer_material_price?: number | null
          buyer_visible_price?: number
          created_at?: string
          delivered_at?: string | null
          delivery_timeline_days?: number
          dispatched_qty?: number | null
          expected_delivery_date?: string | null
          id?: string
          is_paid_bid?: boolean
          logistics_execution_mode?: string | null
          logistics_notes?: string | null
          markup_amount?: number | null
          markup_percentage?: number | null
          platform_margin?: number | null
          quality_status?: string | null
          requirement_id?: string
          service_fee?: number
          status?: Database["public"]["Enums"]["bid_status"]
          supplier_id?: string
          supplier_logistics_price?: number | null
          supplier_material_price?: number | null
          supplier_net_price?: number
          terms_and_conditions?: string | null
          total_amount?: number
          transaction_type?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bids_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      blogs: {
        Row: {
          author_id: string | null
          author_name: string | null
          category: string
          content: string
          cover_image: string | null
          created_at: string
          excerpt: string | null
          id: string
          is_published: boolean
          published_at: string | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          category?: string
          content: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          category?: string
          content?: string
          cover_image?: string | null
          created_at?: string
          excerpt?: string | null
          id?: string
          is_published?: boolean
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      buyer_inventory: {
        Row: {
          buyer_id: string
          category: string | null
          created_at: string
          description: string | null
          id: string
          last_restocked_at: string | null
          location: string | null
          max_stock_level: number | null
          min_stock_level: number | null
          product_name: string
          quantity: number
          sku: string | null
          supplier_name: string | null
          unit: string
          unit_price: number | null
          updated_at: string
        }
        Insert: {
          buyer_id: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_restocked_at?: string | null
          location?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          product_name: string
          quantity?: number
          sku?: string | null
          supplier_name?: string | null
          unit?: string
          unit_price?: number | null
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          last_restocked_at?: string | null
          location?: string | null
          max_stock_level?: number | null
          min_stock_level?: number | null
          product_name?: string
          quantity?: number
          sku?: string | null
          supplier_name?: string | null
          unit?: string
          unit_price?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      buyer_purchase_items: {
        Row: {
          created_at: string
          id: string
          product_name: string
          purchase_id: string
          quantity: number
          tax_amount: number
          tax_rate: number | null
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_name: string
          purchase_id: string
          quantity?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_name?: string
          purchase_id?: string
          quantity?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "buyer_purchase_items_purchase_id_fkey"
            columns: ["purchase_id"]
            isOneToOne: false
            referencedRelation: "buyer_purchases"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_purchases: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          invoice_number: string | null
          notes: string | null
          payment_status: string
          purchase_date: string
          status: string
          supplier_id: string | null
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string
          purchase_date?: string
          status?: string
          supplier_id?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string
          purchase_date?: string
          status?: string
          supplier_id?: string | null
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "buyer_purchases_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "buyer_suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_stock_movements: {
        Row: {
          buyer_id: string
          created_at: string
          id: string
          inventory_id: string
          movement_type: string
          notes: string | null
          quantity: number
          reference_number: string | null
        }
        Insert: {
          buyer_id: string
          created_at?: string
          id?: string
          inventory_id: string
          movement_type: string
          notes?: string | null
          quantity: number
          reference_number?: string | null
        }
        Update: {
          buyer_id?: string
          created_at?: string
          id?: string
          inventory_id?: string
          movement_type?: string
          notes?: string | null
          quantity?: number
          reference_number?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_stock_movements_inventory_id_fkey"
            columns: ["inventory_id"]
            isOneToOne: false
            referencedRelation: "buyer_inventory"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_suppliers: {
        Row: {
          address: string | null
          buyer_id: string
          company_name: string | null
          created_at: string
          email: string | null
          gstin: string | null
          id: string
          notes: string | null
          phone: string | null
          supplier_name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          buyer_id: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          supplier_name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          buyer_id?: string
          company_name?: string | null
          created_at?: string
          email?: string | null
          gstin?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          supplier_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      contract_audit_logs: {
        Row: {
          action: string
          contract_id: string | null
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
        }
        Insert: {
          action: string
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
        }
        Update: {
          action?: string
          contract_id?: string | null
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "contract_audit_logs_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      contracts: {
        Row: {
          bid_id: string
          buyer_id: string
          contract_pdf_url: string | null
          contract_status: string
          contract_type: string
          contract_value: number
          coverage_percentage: number | null
          created_at: string | null
          created_by: string | null
          currency: string | null
          id: string
          requirement_id: string
          signed_at: string | null
          supplier_id: string
        }
        Insert: {
          bid_id: string
          buyer_id: string
          contract_pdf_url?: string | null
          contract_status?: string
          contract_type: string
          contract_value: number
          coverage_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          requirement_id: string
          signed_at?: string | null
          supplier_id: string
        }
        Update: {
          bid_id?: string
          buyer_id?: string
          contract_pdf_url?: string | null
          contract_status?: string
          contract_type?: string
          contract_value?: number
          coverage_percentage?: number | null
          created_at?: string | null
          created_by?: string | null
          currency?: string | null
          id?: string
          requirement_id?: string
          signed_at?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contracts_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "admin_deal_analytics"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "contracts_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "anonymized_supplier_quotes"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "contracts_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "supplier_deal_closures"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "contracts_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      demand_discovery_keywords: {
        Row: {
          category: string
          classification: string | null
          clicks: number | null
          created_at: string | null
          feasibility_score: number | null
          id: string
          impressions: number | null
          industry: string
          intent_score: number | null
          intent_type: string
          is_active: boolean | null
          keyword: string
          last_scored_at: string | null
          rfqs_generated: number | null
          subcategory: string
          updated_at: string | null
          urgency_score: number | null
          value_score: number | null
        }
        Insert: {
          category: string
          classification?: string | null
          clicks?: number | null
          created_at?: string | null
          feasibility_score?: number | null
          id?: string
          impressions?: number | null
          industry: string
          intent_score?: number | null
          intent_type: string
          is_active?: boolean | null
          keyword: string
          last_scored_at?: string | null
          rfqs_generated?: number | null
          subcategory: string
          updated_at?: string | null
          urgency_score?: number | null
          value_score?: number | null
        }
        Update: {
          category?: string
          classification?: string | null
          clicks?: number | null
          created_at?: string | null
          feasibility_score?: number | null
          id?: string
          impressions?: number | null
          industry?: string
          intent_score?: number | null
          intent_type?: string
          is_active?: boolean | null
          keyword?: string
          last_scored_at?: string | null
          rfqs_generated?: number | null
          subcategory?: string
          updated_at?: string | null
          urgency_score?: number | null
          value_score?: number | null
        }
        Relationships: []
      }
      demand_intelligence_settings: {
        Row: {
          admin_review_min_score: number | null
          auto_rfq_min_score: number | null
          buy_classification_min_score: number | null
          created_at: string | null
          enabled: boolean | null
          enabled_categories: string[] | null
          enabled_countries: string[] | null
          frequency: string | null
          id: string
          last_run_at: string | null
          min_matching_suppliers: number | null
          min_supplier_match_score: number | null
          require_supplier_availability: boolean | null
          research_classification_max_score: number | null
          updated_at: string | null
        }
        Insert: {
          admin_review_min_score?: number | null
          auto_rfq_min_score?: number | null
          buy_classification_min_score?: number | null
          created_at?: string | null
          enabled?: boolean | null
          enabled_categories?: string[] | null
          enabled_countries?: string[] | null
          frequency?: string | null
          id?: string
          last_run_at?: string | null
          min_matching_suppliers?: number | null
          min_supplier_match_score?: number | null
          require_supplier_availability?: boolean | null
          research_classification_max_score?: number | null
          updated_at?: string | null
        }
        Update: {
          admin_review_min_score?: number | null
          auto_rfq_min_score?: number | null
          buy_classification_min_score?: number | null
          created_at?: string | null
          enabled?: boolean | null
          enabled_categories?: string[] | null
          enabled_countries?: string[] | null
          frequency?: string | null
          id?: string
          last_run_at?: string | null
          min_matching_suppliers?: number | null
          min_supplier_match_score?: number | null
          require_supplier_availability?: boolean | null
          research_classification_max_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      demand_intelligence_signals: {
        Row: {
          best_supplier_match_score: number | null
          buyer_type: string | null
          category: string | null
          classification: string
          confidence_score: number
          converted_at: string | null
          converted_to_rfq_id: string | null
          country: string | null
          created_at: string | null
          decision_action: string | null
          decision_made_at: string | null
          decision_made_by: string | null
          decision_notes: string | null
          delivery_location: string | null
          delivery_timeline_days: number | null
          discovered_at: string | null
          estimated_quantity: number | null
          estimated_unit: string | null
          estimated_value: number | null
          external_source_url: string | null
          feasibility_score: number | null
          fulfilment_feasible: boolean | null
          id: string
          industry: string | null
          intent_score: number | null
          matching_suppliers_count: number | null
          overall_score: number | null
          product_description: string | null
          run_id: string | null
          signal_page_id: string | null
          signal_source: string
          subcategory: string | null
          updated_at: string | null
          urgency_score: number | null
          value_score: number | null
        }
        Insert: {
          best_supplier_match_score?: number | null
          buyer_type?: string | null
          category?: string | null
          classification?: string
          confidence_score?: number
          converted_at?: string | null
          converted_to_rfq_id?: string | null
          country?: string | null
          created_at?: string | null
          decision_action?: string | null
          decision_made_at?: string | null
          decision_made_by?: string | null
          decision_notes?: string | null
          delivery_location?: string | null
          delivery_timeline_days?: number | null
          discovered_at?: string | null
          estimated_quantity?: number | null
          estimated_unit?: string | null
          estimated_value?: number | null
          external_source_url?: string | null
          feasibility_score?: number | null
          fulfilment_feasible?: boolean | null
          id?: string
          industry?: string | null
          intent_score?: number | null
          matching_suppliers_count?: number | null
          overall_score?: number | null
          product_description?: string | null
          run_id?: string | null
          signal_page_id?: string | null
          signal_source: string
          subcategory?: string | null
          updated_at?: string | null
          urgency_score?: number | null
          value_score?: number | null
        }
        Update: {
          best_supplier_match_score?: number | null
          buyer_type?: string | null
          category?: string | null
          classification?: string
          confidence_score?: number
          converted_at?: string | null
          converted_to_rfq_id?: string | null
          country?: string | null
          created_at?: string | null
          decision_action?: string | null
          decision_made_at?: string | null
          decision_made_by?: string | null
          decision_notes?: string | null
          delivery_location?: string | null
          delivery_timeline_days?: number | null
          discovered_at?: string | null
          estimated_quantity?: number | null
          estimated_unit?: string | null
          estimated_value?: number | null
          external_source_url?: string | null
          feasibility_score?: number | null
          fulfilment_feasible?: boolean | null
          id?: string
          industry?: string | null
          intent_score?: number | null
          matching_suppliers_count?: number | null
          overall_score?: number | null
          product_description?: string | null
          run_id?: string | null
          signal_page_id?: string | null
          signal_source?: string
          subcategory?: string | null
          updated_at?: string | null
          urgency_score?: number | null
          value_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_intelligence_signals_converted_to_rfq_id_fkey"
            columns: ["converted_to_rfq_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_intelligence_signals_run_id_fkey"
            columns: ["run_id"]
            isOneToOne: false
            referencedRelation: "ai_seo_runs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "demand_intelligence_signals_signal_page_id_fkey"
            columns: ["signal_page_id"]
            isOneToOne: false
            referencedRelation: "admin_signal_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      demo_requests: {
        Row: {
          company_name: string | null
          contacted_at: string | null
          created_at: string
          email: string
          id: string
          message: string | null
          name: string
          notes: string | null
          phone: string | null
          status: string
        }
        Insert: {
          company_name?: string | null
          contacted_at?: string | null
          created_at?: string
          email: string
          id?: string
          message?: string | null
          name: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Update: {
          company_name?: string | null
          contacted_at?: string | null
          created_at?: string
          email?: string
          id?: string
          message?: string | null
          name?: string
          notes?: string | null
          phone?: string | null
          status?: string
        }
        Relationships: []
      }
      documents: {
        Row: {
          document_type: string
          file_name: string
          file_url: string
          id: string
          uploaded_at: string
          user_id: string
          verified: boolean
        }
        Insert: {
          document_type: string
          file_name: string
          file_url: string
          id?: string
          uploaded_at?: string
          user_id: string
          verified?: boolean
        }
        Update: {
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          uploaded_at?: string
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      email_subscription_payments: {
        Row: {
          amount: number
          cf_payment_id: string | null
          created_at: string
          currency: string
          expires_at: string | null
          id: string
          metadata: Json | null
          order_id: string
          paid_at: string | null
          payment_method: string | null
          payment_session_id: string | null
          status: string
          supplier_id: string
        }
        Insert: {
          amount?: number
          cf_payment_id?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_session_id?: string | null
          status?: string
          supplier_id: string
        }
        Update: {
          amount?: number
          cf_payment_id?: string | null
          created_at?: string
          currency?: string
          expires_at?: string | null
          id?: string
          metadata?: Json | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_session_id?: string | null
          status?: string
          supplier_id?: string
        }
        Relationships: []
      }
      international_leads: {
        Row: {
          company_name: string | null
          country: string
          created_at: string
          email: string
          id: string
          interested_categories: string[] | null
          monthly_volume: string | null
          name: string
          phone: string | null
          source: string | null
          trade_interest: string
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          company_name?: string | null
          country: string
          created_at?: string
          email: string
          id?: string
          interested_categories?: string[] | null
          monthly_volume?: string | null
          name: string
          phone?: string | null
          source?: string | null
          trade_interest?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          company_name?: string | null
          country?: string
          created_at?: string
          email?: string
          id?: string
          interested_categories?: string[] | null
          monthly_volume?: string | null
          name?: string
          phone?: string | null
          source?: string | null
          trade_interest?: string
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      invoice_items: {
        Row: {
          created_at: string
          description: string
          hsn_code: string | null
          id: string
          invoice_id: string
          product_id: string | null
          quantity: number
          tax_amount: number
          tax_rate: number | null
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          hsn_code?: string | null
          id?: string
          invoice_id: string
          product_id?: string | null
          quantity?: number
          tax_amount?: number
          tax_rate?: number | null
          total: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          hsn_code?: string | null
          id?: string
          invoice_id?: string
          product_id?: string | null
          quantity?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "invoice_items_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoice_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_inventory_performance"
            referencedColumns: ["product_id"]
          },
        ]
      }
      invoices: {
        Row: {
          bank_details: string | null
          buyer_address: string | null
          buyer_email: string | null
          buyer_gstin: string | null
          buyer_name: string
          buyer_phone: string | null
          created_at: string
          discount_amount: number
          discount_percent: number | null
          document_type: Database["public"]["Enums"]["document_type"]
          due_date: string | null
          id: string
          invoice_number: string
          issue_date: string
          notes: string | null
          reference_invoice_id: string | null
          reference_invoice_number: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          supplier_id: string
          tax_amount: number
          tax_rate: number | null
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          bank_details?: string | null
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_gstin?: string | null
          buyer_name: string
          buyer_phone?: string | null
          created_at?: string
          discount_amount?: number
          discount_percent?: number | null
          document_type?: Database["public"]["Enums"]["document_type"]
          due_date?: string | null
          id?: string
          invoice_number: string
          issue_date?: string
          notes?: string | null
          reference_invoice_id?: string | null
          reference_invoice_number?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          bank_details?: string | null
          buyer_address?: string | null
          buyer_email?: string | null
          buyer_gstin?: string | null
          buyer_name?: string
          buyer_phone?: string | null
          created_at?: string
          discount_amount?: number
          discount_percent?: number | null
          document_type?: Database["public"]["Enums"]["document_type"]
          due_date?: string | null
          id?: string
          invoice_number?: string
          issue_date?: string
          notes?: string | null
          reference_invoice_id?: string | null
          reference_invoice_number?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_reference_invoice_id_fkey"
            columns: ["reference_invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
        ]
      }
      lead_activities: {
        Row: {
          activity_date: string
          activity_type: string
          created_at: string
          description: string | null
          duration_minutes: number | null
          id: string
          lead_id: string
          outcome: string | null
          subject: string
          supplier_id: string
        }
        Insert: {
          activity_date?: string
          activity_type: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id: string
          outcome?: string | null
          subject: string
          supplier_id: string
        }
        Update: {
          activity_date?: string
          activity_type?: string
          created_at?: string
          description?: string | null
          duration_minutes?: number | null
          id?: string
          lead_id?: string
          outcome?: string | null
          subject?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "lead_activities_lead_id_fkey"
            columns: ["lead_id"]
            isOneToOne: false
            referencedRelation: "supplier_leads"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_bids: {
        Row: {
          bid_amount: number
          created_at: string
          estimated_transit_days: number
          id: string
          is_paid_bid: boolean
          rate_per_unit: number | null
          requirement_id: string
          service_fee: number
          status: Database["public"]["Enums"]["logistics_bid_status"]
          terms_and_conditions: string | null
          total_amount: number
          transporter_id: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          bid_amount: number
          created_at?: string
          estimated_transit_days: number
          id?: string
          is_paid_bid?: boolean
          rate_per_unit?: number | null
          requirement_id: string
          service_fee: number
          status?: Database["public"]["Enums"]["logistics_bid_status"]
          terms_and_conditions?: string | null
          total_amount: number
          transporter_id: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          bid_amount?: number
          created_at?: string
          estimated_transit_days?: number
          id?: string
          is_paid_bid?: boolean
          rate_per_unit?: number | null
          requirement_id?: string
          service_fee?: number
          status?: Database["public"]["Enums"]["logistics_bid_status"]
          terms_and_conditions?: string | null
          total_amount?: number
          transporter_id?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "logistics_bids_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "logistics_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "logistics_bids_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      logistics_requirements: {
        Row: {
          budget_max: number | null
          created_at: string
          customer_id: string
          delivery_deadline: string
          delivery_location: string
          id: string
          material_description: string | null
          material_type: string
          pickup_date: string
          pickup_location: string
          quantity: number
          special_requirements: string | null
          status: Database["public"]["Enums"]["logistics_requirement_status"]
          title: string
          unit: string
          updated_at: string
          vehicle_type_preference:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
        }
        Insert: {
          budget_max?: number | null
          created_at?: string
          customer_id: string
          delivery_deadline: string
          delivery_location: string
          id?: string
          material_description?: string | null
          material_type: string
          pickup_date: string
          pickup_location: string
          quantity: number
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["logistics_requirement_status"]
          title: string
          unit?: string
          updated_at?: string
          vehicle_type_preference?:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
        }
        Update: {
          budget_max?: number | null
          created_at?: string
          customer_id?: string
          delivery_deadline?: string
          delivery_location?: string
          id?: string
          material_description?: string | null
          material_type?: string
          pickup_date?: string
          pickup_location?: string
          quantity?: number
          special_requirements?: string | null
          status?: Database["public"]["Enums"]["logistics_requirement_status"]
          title?: string
          unit?: string
          updated_at?: string
          vehicle_type_preference?:
            | Database["public"]["Enums"]["vehicle_type"]
            | null
        }
        Relationships: []
      }
      logistics_transactions: {
        Row: {
          amount: number
          bid_id: string | null
          created_at: string
          customer_id: string
          fee_paid: boolean
          id: string
          payment_date: string | null
          service_fee: number
          transporter_id: string
        }
        Insert: {
          amount: number
          bid_id?: string | null
          created_at?: string
          customer_id: string
          fee_paid?: boolean
          id?: string
          payment_date?: string | null
          service_fee: number
          transporter_id: string
        }
        Update: {
          amount?: number
          bid_id?: string | null
          created_at?: string
          customer_id?: string
          fee_paid?: boolean
          id?: string
          payment_date?: string | null
          service_fee?: number
          transporter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "logistics_transactions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "logistics_bids"
            referencedColumns: ["id"]
          },
        ]
      }
      margin_settings: {
        Row: {
          base_margin_percent: number
          id: string
          logistics_markup_percent: number
          risk_premium_percent: number
          service_fee_percent: number
          updated_at: string | null
        }
        Insert: {
          base_margin_percent?: number
          id?: string
          logistics_markup_percent?: number
          risk_premium_percent?: number
          service_fee_percent?: number
          updated_at?: string | null
        }
        Update: {
          base_margin_percent?: number
          id?: string
          logistics_markup_percent?: number
          risk_premium_percent?: number
          service_fee_percent?: number
          updated_at?: string | null
        }
        Relationships: []
      }
      market_price_indices: {
        Row: {
          average_market_price: number
          created_at: string
          data_source: string | null
          demand_index: number
          id: string
          last_updated: string
          max_market_price: number
          min_market_price: number
          price_std_deviation: number
          product_category: string
          sample_size: number | null
          supply_index: number
          volatility_index: number
        }
        Insert: {
          average_market_price?: number
          created_at?: string
          data_source?: string | null
          demand_index?: number
          id?: string
          last_updated?: string
          max_market_price?: number
          min_market_price?: number
          price_std_deviation?: number
          product_category: string
          sample_size?: number | null
          supply_index?: number
          volatility_index?: number
        }
        Update: {
          average_market_price?: number
          created_at?: string
          data_source?: string | null
          demand_index?: number
          id?: string
          last_updated?: string
          max_market_price?: number
          min_market_price?: number
          price_std_deviation?: number
          product_category?: string
          sample_size?: number | null
          supply_index?: number
          volatility_index?: number
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          source: string | null
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          source?: string | null
          subscribed_at?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          id: string
          message: string
          metadata: Json | null
          read: boolean | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          message: string
          metadata?: Json | null
          read?: boolean | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          message?: string
          metadata?: Json | null
          read?: boolean | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      page_visits: {
        Row: {
          browser: string | null
          country: string | null
          country_code: string | null
          created_at: string | null
          device_type: string | null
          gclid: string | null
          id: string
          page_path: string
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          source: string | null
          time_spent_seconds: number | null
          user_agent: string | null
          utm_campaign: string | null
          utm_content: string | null
          utm_medium: string | null
          utm_source: string | null
          utm_term: string | null
          visitor_id: string
        }
        Insert: {
          browser?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          device_type?: string | null
          gclid?: string | null
          id?: string
          page_path: string
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          source?: string | null
          time_spent_seconds?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id: string
        }
        Update: {
          browser?: string | null
          country?: string | null
          country_code?: string | null
          created_at?: string | null
          device_type?: string | null
          gclid?: string | null
          id?: string
          page_path?: string
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          source?: string | null
          time_spent_seconds?: number | null
          user_agent?: string | null
          utm_campaign?: string | null
          utm_content?: string | null
          utm_medium?: string | null
          utm_source?: string | null
          utm_term?: string | null
          visitor_id?: string
        }
        Relationships: []
      }
      partner_documents: {
        Row: {
          captured_at: string | null
          document_type: string
          file_name: string
          file_url: string
          geolocation: Json | null
          id: string
          partner_id: string
          rejection_reason: string | null
          updated_at: string
          uploaded_at: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          captured_at?: string | null
          document_type: string
          file_name: string
          file_url: string
          geolocation?: Json | null
          id?: string
          partner_id: string
          rejection_reason?: string | null
          updated_at?: string
          uploaded_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          captured_at?: string | null
          document_type?: string
          file_name?: string
          file_url?: string
          geolocation?: Json | null
          id?: string
          partner_id?: string
          rejection_reason?: string | null
          updated_at?: string
          uploaded_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      password_reset_tokens: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          token: string
          used_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          token: string
          used_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          token?: string
          used_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      platform_invoices: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          invoice_number: string
          invoice_type: string
          metadata: Json | null
          paid_at: string | null
          payment_reference: string | null
          related_transaction_id: string | null
          status: string
          tax_amount: number
          tax_rate: number | null
          total_amount: number
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number: string
          invoice_type: string
          metadata?: Json | null
          paid_at?: string | null
          payment_reference?: string | null
          related_transaction_id?: string | null
          status?: string
          tax_amount?: number
          tax_rate?: number | null
          total_amount: number
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          invoice_number?: string
          invoice_type?: string
          metadata?: Json | null
          paid_at?: string | null
          payment_reference?: string | null
          related_transaction_id?: string | null
          status?: string
          tax_amount?: number
          tax_rate?: number | null
          total_amount?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "platform_invoices_related_transaction_id_fkey"
            columns: ["related_transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      po_audit_logs: {
        Row: {
          action: string
          created_at: string | null
          created_by: string | null
          id: string
          metadata: Json | null
          po_id: string | null
        }
        Insert: {
          action: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          po_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string | null
          created_by?: string | null
          id?: string
          metadata?: Json | null
          po_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "po_audit_logs_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      po_items: {
        Row: {
          created_at: string
          description: string
          hsn_code: string | null
          id: string
          po_id: string
          quantity: number
          tax_amount: number
          tax_rate: number | null
          total: number
          unit: string | null
          unit_price: number
        }
        Insert: {
          created_at?: string
          description: string
          hsn_code?: string | null
          id?: string
          po_id: string
          quantity?: number
          tax_amount?: number
          tax_rate?: number | null
          total: number
          unit?: string | null
          unit_price: number
        }
        Update: {
          created_at?: string
          description?: string
          hsn_code?: string | null
          id?: string
          po_id?: string
          quantity?: number
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          unit?: string | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "po_items_po_id_fkey"
            columns: ["po_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      premium_bid_payments: {
        Row: {
          amount: number
          bids_credited: boolean
          bids_purchased: number
          cf_payment_id: string | null
          created_at: string
          currency: string
          id: string
          metadata: Json | null
          order_id: string
          paid_at: string | null
          payment_method: string | null
          payment_session_id: string | null
          status: string
          user_id: string
        }
        Insert: {
          amount?: number
          bids_credited?: boolean
          bids_purchased?: number
          cf_payment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          order_id: string
          paid_at?: string | null
          payment_method?: string | null
          payment_session_id?: string | null
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          bids_credited?: boolean
          bids_purchased?: number
          cf_payment_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          metadata?: Json | null
          order_id?: string
          paid_at?: string | null
          payment_method?: string | null
          payment_session_id?: string | null
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      price_confidence_scores: {
        Row: {
          bid_id: string | null
          buyer_message: string
          buyer_visible_price: number
          competition_score: number | null
          confidence_label: string
          confidence_score: number
          confidence_suppressed: boolean | null
          created_at: string
          historical_price_variance: number | null
          id: string
          logistics_note: string | null
          margin_type: string | null
          market_stability: number | null
          price_behavior_note: string | null
          price_position: number | null
          price_spread_ratio: number | null
          requirement_id: string
          selection_mode: string
          total_bids: number | null
        }
        Insert: {
          bid_id?: string | null
          buyer_message: string
          buyer_visible_price: number
          competition_score?: number | null
          confidence_label: string
          confidence_score: number
          confidence_suppressed?: boolean | null
          created_at?: string
          historical_price_variance?: number | null
          id?: string
          logistics_note?: string | null
          margin_type?: string | null
          market_stability?: number | null
          price_behavior_note?: string | null
          price_position?: number | null
          price_spread_ratio?: number | null
          requirement_id: string
          selection_mode: string
          total_bids?: number | null
        }
        Update: {
          bid_id?: string | null
          buyer_message?: string
          buyer_visible_price?: number
          competition_score?: number | null
          confidence_label?: string
          confidence_score?: number
          confidence_suppressed?: boolean | null
          created_at?: string
          historical_price_variance?: number | null
          id?: string
          logistics_note?: string | null
          margin_type?: string | null
          market_stability?: number | null
          price_behavior_note?: string | null
          price_position?: number | null
          price_spread_ratio?: number | null
          requirement_id?: string
          selection_mode?: string
          total_bids?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "price_confidence_scores_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "admin_deal_analytics"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "price_confidence_scores_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "anonymized_supplier_quotes"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "price_confidence_scores_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "price_confidence_scores_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "supplier_deal_closures"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "price_confidence_scores_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      procurement_config: {
        Row: {
          config_key: string
          config_value: Json
          created_at: string | null
          description: string | null
          id: string
          updated_at: string | null
        }
        Insert: {
          config_key: string
          config_value: Json
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Update: {
          config_key?: string
          config_value?: Json
          created_at?: string | null
          description?: string | null
          id?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      product_images: {
        Row: {
          created_at: string
          display_order: number
          id: string
          image_url: string
          product_id: string
        }
        Insert: {
          created_at?: string
          display_order?: number
          id?: string
          image_url: string
          product_id: string
        }
        Update: {
          created_at?: string
          display_order?: number
          id?: string
          image_url?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_inventory_performance"
            referencedColumns: ["product_id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          created_at: string
          description: string | null
          hs_code: string | null
          id: string
          is_active: boolean
          lead_time_days: number | null
          moq: number | null
          name: string
          packaging_details: string | null
          price_range_max: number | null
          price_range_min: number | null
          specifications: Json | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string | null
          hs_code?: string | null
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          moq?: number | null
          name: string
          packaging_details?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          specifications?: Json | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          hs_code?: string | null
          id?: string
          is_active?: boolean
          lead_time_days?: number | null
          moq?: number | null
          name?: string
          packaging_details?: string | null
          price_range_max?: number | null
          price_range_min?: number | null
          specifications?: Json | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_ifsc_code: string | null
          bank_name: string | null
          business_type: string | null
          buyer_industry: string | null
          city: string | null
          company_logo_url: string | null
          company_name: string
          contact_person: string
          country: string | null
          created_at: string
          email: string
          email_notifications_enabled: boolean | null
          gstin: string | null
          house_address: string | null
          id: string
          is_test_account: boolean
          is_verified_supplier: boolean | null
          logistics_partner_type:
            | Database["public"]["Enums"]["logistics_partner_type"]
            | null
          office_address: string | null
          phone: string
          referred_by_name: string | null
          referred_by_phone: string | null
          state: string | null
          supplier_categories: string[] | null
          supplier_notification_subcategories: string[] | null
          updated_at: string
          yard_location: string | null
        }
        Insert: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          business_type?: string | null
          buyer_industry?: string | null
          city?: string | null
          company_logo_url?: string | null
          company_name: string
          contact_person: string
          country?: string | null
          created_at?: string
          email: string
          email_notifications_enabled?: boolean | null
          gstin?: string | null
          house_address?: string | null
          id: string
          is_test_account?: boolean
          is_verified_supplier?: boolean | null
          logistics_partner_type?:
            | Database["public"]["Enums"]["logistics_partner_type"]
            | null
          office_address?: string | null
          phone: string
          referred_by_name?: string | null
          referred_by_phone?: string | null
          state?: string | null
          supplier_categories?: string[] | null
          supplier_notification_subcategories?: string[] | null
          updated_at?: string
          yard_location?: string | null
        }
        Update: {
          address?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_ifsc_code?: string | null
          bank_name?: string | null
          business_type?: string | null
          buyer_industry?: string | null
          city?: string | null
          company_logo_url?: string | null
          company_name?: string
          contact_person?: string
          country?: string | null
          created_at?: string
          email?: string
          email_notifications_enabled?: boolean | null
          gstin?: string | null
          house_address?: string | null
          id?: string
          is_test_account?: boolean
          is_verified_supplier?: boolean | null
          logistics_partner_type?:
            | Database["public"]["Enums"]["logistics_partner_type"]
            | null
          office_address?: string | null
          phone?: string
          referred_by_name?: string | null
          referred_by_phone?: string | null
          state?: string | null
          supplier_categories?: string[] | null
          supplier_notification_subcategories?: string[] | null
          updated_at?: string
          yard_location?: string | null
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          contract_id: string | null
          created_at: string
          created_by: string | null
          currency: string | null
          delivery_address: string | null
          delivery_due_date: string | null
          discount_amount: number
          discount_percent: number | null
          expected_delivery_date: string | null
          id: string
          immutable_hash: string | null
          legal_hold: boolean | null
          notes: string | null
          order_date: string
          original_po_value: number | null
          po_number: string
          po_status: string | null
          po_value: number | null
          requirement_id: string | null
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          supplier_id: string
          tax_amount: number
          tax_rate: number | null
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string
          value_locked_at: string | null
          vendor_address: string | null
          vendor_email: string | null
          vendor_gstin: string | null
          vendor_name: string
          vendor_phone: string | null
        }
        Insert: {
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_address?: string | null
          delivery_due_date?: string | null
          discount_amount?: number
          discount_percent?: number | null
          expected_delivery_date?: string | null
          id?: string
          immutable_hash?: string | null
          legal_hold?: boolean | null
          notes?: string | null
          order_date?: string
          original_po_value?: number | null
          po_number: string
          po_status?: string | null
          po_value?: number | null
          requirement_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          value_locked_at?: string | null
          vendor_address?: string | null
          vendor_email?: string | null
          vendor_gstin?: string | null
          vendor_name: string
          vendor_phone?: string | null
        }
        Update: {
          contract_id?: string | null
          created_at?: string
          created_by?: string | null
          currency?: string | null
          delivery_address?: string | null
          delivery_due_date?: string | null
          discount_amount?: number
          discount_percent?: number | null
          expected_delivery_date?: string | null
          id?: string
          immutable_hash?: string | null
          legal_hold?: boolean | null
          notes?: string | null
          order_date?: string
          original_po_value?: number | null
          po_number?: string
          po_status?: string | null
          po_value?: number | null
          requirement_id?: string | null
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          value_locked_at?: string | null
          vendor_address?: string | null
          vendor_email?: string | null
          vendor_gstin?: string | null
          vendor_name?: string
          vendor_phone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      referral_commissions: {
        Row: {
          bid_amount: number
          bid_id: string
          commission_amount: number
          commission_percentage: number
          created_at: string
          dispatched_qty: number | null
          fraud_flags: Json | null
          fraud_review_status: string | null
          fraud_reviewed_at: string | null
          fraud_reviewed_by: string | null
          fraud_score: number | null
          id: string
          notes: string | null
          paid_at: string | null
          platform_fee_amount: number | null
          platform_fee_percentage: number | null
          platform_net_revenue: number | null
          referral_id: string
          referral_share_percentage: number | null
          referred_id: string
          referrer_id: string
          release_eligible_at: string | null
          release_hold_reason: string | null
          status: string
          updated_at: string
        }
        Insert: {
          bid_amount: number
          bid_id: string
          commission_amount: number
          commission_percentage?: number
          created_at?: string
          dispatched_qty?: number | null
          fraud_flags?: Json | null
          fraud_review_status?: string | null
          fraud_reviewed_at?: string | null
          fraud_reviewed_by?: string | null
          fraud_score?: number | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          platform_fee_amount?: number | null
          platform_fee_percentage?: number | null
          platform_net_revenue?: number | null
          referral_id: string
          referral_share_percentage?: number | null
          referred_id: string
          referrer_id: string
          release_eligible_at?: string | null
          release_hold_reason?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          bid_id?: string
          commission_amount?: number
          commission_percentage?: number
          created_at?: string
          dispatched_qty?: number | null
          fraud_flags?: Json | null
          fraud_review_status?: string | null
          fraud_reviewed_at?: string | null
          fraud_reviewed_by?: string | null
          fraud_score?: number | null
          id?: string
          notes?: string | null
          paid_at?: string | null
          platform_fee_amount?: number | null
          platform_fee_percentage?: number | null
          platform_net_revenue?: number | null
          referral_id?: string
          referral_share_percentage?: number | null
          referred_id?: string
          referrer_id?: string
          release_eligible_at?: string | null
          release_hold_reason?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: true
            referencedRelation: "admin_deal_analytics"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "referral_commissions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: true
            referencedRelation: "anonymized_supplier_quotes"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "referral_commissions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: true
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_commissions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: true
            referencedRelation: "supplier_deal_closures"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "referral_commissions_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          device_fingerprint: string | null
          fraud_detected: boolean | null
          fraud_reason: string | null
          id: string
          is_self_referral: boolean | null
          referral_code: string
          referred_bank_account: string | null
          referred_email: string | null
          referred_gstin: string | null
          referred_id: string | null
          referred_phone: string | null
          referrer_bank_account: string | null
          referrer_device_fingerprint: string | null
          referrer_email: string | null
          referrer_gstin: string | null
          referrer_id: string
          referrer_phone: string | null
          referrer_signup_ip: string | null
          reward_credited: boolean | null
          rewarded_at: string | null
          signed_up_at: string | null
          signup_ip_address: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          device_fingerprint?: string | null
          fraud_detected?: boolean | null
          fraud_reason?: string | null
          id?: string
          is_self_referral?: boolean | null
          referral_code: string
          referred_bank_account?: string | null
          referred_email?: string | null
          referred_gstin?: string | null
          referred_id?: string | null
          referred_phone?: string | null
          referrer_bank_account?: string | null
          referrer_device_fingerprint?: string | null
          referrer_email?: string | null
          referrer_gstin?: string | null
          referrer_id: string
          referrer_phone?: string | null
          referrer_signup_ip?: string | null
          reward_credited?: boolean | null
          rewarded_at?: string | null
          signed_up_at?: string | null
          signup_ip_address?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          device_fingerprint?: string | null
          fraud_detected?: boolean | null
          fraud_reason?: string | null
          id?: string
          is_self_referral?: boolean | null
          referral_code?: string
          referred_bank_account?: string | null
          referred_email?: string | null
          referred_gstin?: string | null
          referred_id?: string | null
          referred_phone?: string | null
          referrer_bank_account?: string | null
          referrer_device_fingerprint?: string | null
          referrer_email?: string | null
          referrer_gstin?: string | null
          referrer_id?: string
          referrer_phone?: string | null
          referrer_signup_ip?: string | null
          reward_credited?: boolean | null
          rewarded_at?: string | null
          signed_up_at?: string | null
          signup_ip_address?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referred_id_fkey"
            columns: ["referred_id"]
            isOneToOne: false
            referencedRelation: "safe_supplier_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "safe_supplier_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      referrer_kyc_documents: {
        Row: {
          created_at: string
          document_type: string
          file_name: string
          file_url: string
          id: string
          referrer_id: string
          rejection_reason: string | null
          updated_at: string
          verification_status: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          document_type: string
          file_name: string
          file_url: string
          id?: string
          referrer_id: string
          rejection_reason?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          document_type?: string
          file_name?: string
          file_url?: string
          id?: string
          referrer_id?: string
          rejection_reason?: string | null
          updated_at?: string
          verification_status?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      related_party_registry: {
        Row: {
          confidence_score: number | null
          detected_at: string
          id: string
          is_confirmed: boolean | null
          notes: string | null
          relationship_type: string
          user_id_1: string
          user_id_2: string
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          confidence_score?: number | null
          detected_at?: string
          id?: string
          is_confirmed?: boolean | null
          notes?: string | null
          relationship_type: string
          user_id_1: string
          user_id_2: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          confidence_score?: number | null
          detected_at?: string
          id?: string
          is_confirmed?: boolean | null
          notes?: string | null
          relationship_type?: string
          user_id_1?: string
          user_id_2?: string
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      requirement_items: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          category: string
          created_at: string | null
          description: string | null
          id: string
          item_name: string
          quantity: number
          requirement_id: string
          specifications: Json | null
          unit: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          category: string
          created_at?: string | null
          description?: string | null
          id?: string
          item_name: string
          quantity?: number
          requirement_id: string
          specifications?: Json | null
          unit?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          category?: string
          created_at?: string | null
          description?: string | null
          id?: string
          item_name?: string
          quantity?: number
          requirement_id?: string
          specifications?: Json | null
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirement_items_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      requirement_supplier_reveals: {
        Row: {
          created_at: string | null
          id: string
          paid_at: string | null
          payment_id: string | null
          payment_reference: string | null
          requested_at: string | null
          requirement_id: string
          reveal_fee: number | null
          reveal_status: string
          revealed_at: string | null
          supplier_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_reference?: string | null
          requested_at?: string | null
          requirement_id: string
          reveal_fee?: number | null
          reveal_status?: string
          revealed_at?: string | null
          supplier_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          paid_at?: string | null
          payment_id?: string | null
          payment_reference?: string | null
          requested_at?: string | null
          requirement_id?: string
          reveal_fee?: number | null
          reveal_status?: string
          revealed_at?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirement_supplier_reveals_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      requirements: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          buyer_id: string
          certifications_required: string | null
          created_at: string
          customer_name: string | null
          deadline: string
          delivery_location: string
          description: string
          fast_track: boolean | null
          id: string
          payment_terms: string | null
          product_category: string
          quality_standards: string | null
          quantity: number
          reveal_fee: number | null
          reveal_status: string | null
          reveal_unlocked_at: string | null
          rfq_source: string | null
          selection_mode: string | null
          signal_page_id: string | null
          source: string | null
          source_metadata: Json | null
          source_product_id: string | null
          source_run_id: string | null
          specifications: Json | null
          status: Database["public"]["Enums"]["requirement_status"]
          title: string
          trade_type: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          buyer_id: string
          certifications_required?: string | null
          created_at?: string
          customer_name?: string | null
          deadline: string
          delivery_location: string
          description: string
          fast_track?: boolean | null
          id?: string
          payment_terms?: string | null
          product_category: string
          quality_standards?: string | null
          quantity: number
          reveal_fee?: number | null
          reveal_status?: string | null
          reveal_unlocked_at?: string | null
          rfq_source?: string | null
          selection_mode?: string | null
          signal_page_id?: string | null
          source?: string | null
          source_metadata?: Json | null
          source_product_id?: string | null
          source_run_id?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["requirement_status"]
          title: string
          trade_type?: string | null
          unit: string
          updated_at?: string
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          buyer_id?: string
          certifications_required?: string | null
          created_at?: string
          customer_name?: string | null
          deadline?: string
          delivery_location?: string
          description?: string
          fast_track?: boolean | null
          id?: string
          payment_terms?: string | null
          product_category?: string
          quality_standards?: string | null
          quantity?: number
          reveal_fee?: number | null
          reveal_status?: string | null
          reveal_unlocked_at?: string | null
          rfq_source?: string | null
          selection_mode?: string | null
          signal_page_id?: string | null
          source?: string | null
          source_metadata?: Json | null
          source_product_id?: string | null
          source_run_id?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["requirement_status"]
          title?: string
          trade_type?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "requirements_signal_page_id_fkey"
            columns: ["signal_page_id"]
            isOneToOne: false
            referencedRelation: "admin_signal_pages"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requirements_source_product_id_fkey"
            columns: ["source_product_id"]
            isOneToOne: false
            referencedRelation: "supplier_inventory_performance"
            referencedColumns: ["product_id"]
          },
          {
            foreignKeyName: "requirements_source_run_id_fkey"
            columns: ["source_run_id"]
            isOneToOne: false
            referencedRelation: "ai_seo_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      seo_content_suggestions: {
        Row: {
          created_at: string
          id: string
          is_used: boolean | null
          keyword: string
          suggestion: string
          suggestion_type: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_used?: boolean | null
          keyword: string
          suggestion: string
          suggestion_type?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_used?: boolean | null
          keyword?: string
          suggestion?: string
          suggestion_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      seo_keywords: {
        Row: {
          created_at: string
          current_position: number | null
          difficulty: string | null
          id: string
          keyword: string
          last_checked: string | null
          previous_position: number | null
          search_volume: number | null
          target_url: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_position?: number | null
          difficulty?: string | null
          id?: string
          keyword: string
          last_checked?: string | null
          previous_position?: number | null
          search_volume?: number | null
          target_url?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_position?: number | null
          difficulty?: string | null
          id?: string
          keyword?: string
          last_checked?: string | null
          previous_position?: number | null
          search_volume?: number | null
          target_url?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      seo_page_audits: {
        Row: {
          created_at: string
          h1_count: number | null
          id: string
          image_alt_missing: number | null
          issues: Json | null
          meta_description: string | null
          page_url: string
          score: number | null
          suggestions: Json | null
          title_tag: string | null
          user_id: string
          word_count: number | null
        }
        Insert: {
          created_at?: string
          h1_count?: number | null
          id?: string
          image_alt_missing?: number | null
          issues?: Json | null
          meta_description?: string | null
          page_url: string
          score?: number | null
          suggestions?: Json | null
          title_tag?: string | null
          user_id: string
          word_count?: number | null
        }
        Update: {
          created_at?: string
          h1_count?: number | null
          id?: string
          image_alt_missing?: number | null
          issues?: Json | null
          meta_description?: string | null
          page_url?: string
          score?: number | null
          suggestions?: Json | null
          title_tag?: string | null
          user_id?: string
          word_count?: number | null
        }
        Relationships: []
      }
      shipment_updates: {
        Row: {
          created_at: string
          id: string
          location: string | null
          notes: string | null
          photo_url: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
          updated_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          photo_url?: string | null
          shipment_id: string
          status: Database["public"]["Enums"]["shipment_status"]
          updated_by: string
        }
        Update: {
          created_at?: string
          id?: string
          location?: string | null
          notes?: string | null
          photo_url?: string | null
          shipment_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
          updated_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipment_updates_shipment_id_fkey"
            columns: ["shipment_id"]
            isOneToOne: false
            referencedRelation: "shipments"
            referencedColumns: ["id"]
          },
        ]
      }
      shipments: {
        Row: {
          bid_id: string
          created_at: string
          current_location: string | null
          customer_id: string
          delivered_at: string | null
          estimated_delivery: string | null
          id: string
          pickup_time: string | null
          requirement_id: string
          status: Database["public"]["Enums"]["shipment_status"]
          transaction_id: string | null
          transporter_id: string
          updated_at: string
          vehicle_id: string | null
        }
        Insert: {
          bid_id: string
          created_at?: string
          current_location?: string | null
          customer_id: string
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          pickup_time?: string | null
          requirement_id: string
          status?: Database["public"]["Enums"]["shipment_status"]
          transaction_id?: string | null
          transporter_id: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Update: {
          bid_id?: string
          created_at?: string
          current_location?: string | null
          customer_id?: string
          delivered_at?: string | null
          estimated_delivery?: string | null
          id?: string
          pickup_time?: string | null
          requirement_id?: string
          status?: Database["public"]["Enums"]["shipment_status"]
          transaction_id?: string | null
          transporter_id?: string
          updated_at?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "logistics_bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "logistics_requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "logistics_transactions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipments_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_inventory: {
        Row: {
          id: string
          last_updated: string
          low_stock_threshold: number
          product_id: string
          quantity: number
          unit: string
        }
        Insert: {
          id?: string
          last_updated?: string
          low_stock_threshold?: number
          product_id: string
          quantity?: number
          unit?: string
        }
        Update: {
          id?: string
          last_updated?: string
          low_stock_threshold?: number
          product_id?: string
          quantity?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_inventory_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "supplier_inventory_performance"
            referencedColumns: ["product_id"]
          },
        ]
      }
      stock_sync_logs: {
        Row: {
          api_key_id: string | null
          created_at: string | null
          error_details: Json | null
          errors: number | null
          id: string
          products_created: number | null
          products_updated: number | null
          source: string
          status: string
          supplier_id: string
        }
        Insert: {
          api_key_id?: string | null
          created_at?: string | null
          error_details?: Json | null
          errors?: number | null
          id?: string
          products_created?: number | null
          products_updated?: number | null
          source: string
          status: string
          supplier_id: string
        }
        Update: {
          api_key_id?: string | null
          created_at?: string | null
          error_details?: Json | null
          errors?: number | null
          id?: string
          products_created?: number | null
          products_updated?: number | null
          source?: string
          status?: string
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_sync_logs_api_key_id_fkey"
            columns: ["api_key_id"]
            isOneToOne: false
            referencedRelation: "supplier_api_keys"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_updates: {
        Row: {
          change_reason: string | null
          created_at: string
          id: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          updated_by: string | null
        }
        Insert: {
          change_reason?: string | null
          created_at?: string
          id?: string
          new_quantity: number
          previous_quantity: number
          product_id: string
          updated_by?: string | null
        }
        Update: {
          change_reason?: string | null
          created_at?: string
          id?: string
          new_quantity?: number
          previous_quantity?: number
          product_id?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_updates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_updates_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_inventory_performance"
            referencedColumns: ["product_id"]
          },
        ]
      }
      subscription_invoices: {
        Row: {
          cgst_amount: number | null
          company_address: string
          company_gstin: string
          company_name: string
          created_at: string
          customer_address: string | null
          customer_email: string | null
          customer_gstin: string | null
          customer_name: string
          customer_phone: string | null
          description: string
          email_sent: boolean | null
          email_sent_at: string | null
          hsn_sac_code: string | null
          id: string
          igst_amount: number | null
          invoice_date: string
          invoice_number: string
          payment_date: string | null
          payment_id: string
          payment_type: string
          pdf_url: string | null
          place_of_supply: string | null
          quantity: number | null
          sgst_amount: number | null
          subtotal: number
          tax_rate: number | null
          total_amount: number
          total_tax: number
          unit_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          cgst_amount?: number | null
          company_address?: string
          company_gstin?: string
          company_name?: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name: string
          customer_phone?: string | null
          description: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          hsn_sac_code?: string | null
          id?: string
          igst_amount?: number | null
          invoice_date?: string
          invoice_number: string
          payment_date?: string | null
          payment_id: string
          payment_type: string
          pdf_url?: string | null
          place_of_supply?: string | null
          quantity?: number | null
          sgst_amount?: number | null
          subtotal: number
          tax_rate?: number | null
          total_amount: number
          total_tax: number
          unit_price: number
          updated_at?: string
          user_id: string
        }
        Update: {
          cgst_amount?: number | null
          company_address?: string
          company_gstin?: string
          company_name?: string
          created_at?: string
          customer_address?: string | null
          customer_email?: string | null
          customer_gstin?: string | null
          customer_name?: string
          customer_phone?: string | null
          description?: string
          email_sent?: boolean | null
          email_sent_at?: string | null
          hsn_sac_code?: string | null
          id?: string
          igst_amount?: number | null
          invoice_date?: string
          invoice_number?: string
          payment_date?: string | null
          payment_id?: string
          payment_type?: string
          pdf_url?: string | null
          place_of_supply?: string | null
          quantity?: number | null
          sgst_amount?: number | null
          subtotal?: number
          tax_rate?: number | null
          total_amount?: number
          total_tax?: number
          unit_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          bids_limit: number
          bids_used_this_month: number
          billing_cycle_start: string
          created_at: string
          early_adopter_expires_at: string | null
          id: string
          is_early_adopter: boolean | null
          premium_bids_balance: number
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bids_limit?: number
          bids_used_this_month?: number
          billing_cycle_start?: string
          created_at?: string
          early_adopter_expires_at?: string | null
          id?: string
          is_early_adopter?: boolean | null
          premium_bids_balance?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bids_limit?: number
          bids_used_this_month?: number
          billing_cycle_start?: string
          created_at?: string
          early_adopter_expires_at?: string | null
          id?: string
          is_early_adopter?: boolean | null
          premium_bids_balance?: number
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      supplier_api_keys: {
        Row: {
          api_key_hash: string
          api_key_prefix: string
          created_at: string | null
          id: string
          is_active: boolean | null
          last_used_at: string | null
          name: string
          revoked_at: string | null
          supplier_id: string
          webhook_events: string[] | null
          webhook_url: string | null
        }
        Insert: {
          api_key_hash: string
          api_key_prefix: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          supplier_id: string
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Update: {
          api_key_hash?: string
          api_key_prefix?: string
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          last_used_at?: string | null
          name?: string
          revoked_at?: string | null
          supplier_id?: string
          webhook_events?: string[] | null
          webhook_url?: string | null
        }
        Relationships: []
      }
      supplier_category_performance: {
        Row: {
          avg_price_per_unit: number | null
          category: string
          created_at: string
          id: string
          l1_wins: number | null
          last_order_date: string | null
          successful_deliveries: number | null
          supplier_id: string
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          avg_price_per_unit?: number | null
          category: string
          created_at?: string
          id?: string
          l1_wins?: number | null
          last_order_date?: string | null
          successful_deliveries?: number | null
          supplier_id: string
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          avg_price_per_unit?: number | null
          category?: string
          created_at?: string
          id?: string
          l1_wins?: number | null
          last_order_date?: string | null
          successful_deliveries?: number | null
          supplier_id?: string
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      supplier_customers: {
        Row: {
          address: string | null
          company_name: string | null
          created_at: string
          customer_name: string
          email: string | null
          gstin: string | null
          id: string
          notes: string | null
          phone: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          customer_name: string
          email?: string | null
          gstin?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_name?: string | null
          created_at?: string
          customer_name?: string
          email?: string | null
          gstin?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_email_logs: {
        Row: {
          bounce_reason: string | null
          bounced_at: string | null
          brevo_message_id: string | null
          click_count: number | null
          clicked_at: string | null
          created_at: string
          delivered_at: string | null
          email_type: string
          id: string
          logistics_requirement_id: string | null
          metadata: Json | null
          open_count: number | null
          opened_at: string | null
          recipient_email: string
          requirement_id: string | null
          sent_at: string
          status: string
          subject: string
          supplier_id: string
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          bounce_reason?: string | null
          bounced_at?: string | null
          brevo_message_id?: string | null
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email_type?: string
          id?: string
          logistics_requirement_id?: string | null
          metadata?: Json | null
          open_count?: number | null
          opened_at?: string | null
          recipient_email: string
          requirement_id?: string | null
          sent_at?: string
          status?: string
          subject: string
          supplier_id: string
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          bounce_reason?: string | null
          bounced_at?: string | null
          brevo_message_id?: string | null
          click_count?: number | null
          clicked_at?: string | null
          created_at?: string
          delivered_at?: string | null
          email_type?: string
          id?: string
          logistics_requirement_id?: string | null
          metadata?: Json | null
          open_count?: number | null
          opened_at?: string | null
          recipient_email?: string
          requirement_id?: string | null
          sent_at?: string
          status?: string
          subject?: string
          supplier_id?: string
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_email_logs_logistics_requirement_id_fkey"
            columns: ["logistics_requirement_id"]
            isOneToOne: false
            referencedRelation: "logistics_requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_email_quotas: {
        Row: {
          created_at: string
          daily_emails_sent: number
          has_email_subscription: boolean
          id: string
          last_daily_reset: string
          last_monthly_reset: string
          monthly_emails_sent: number
          subscription_expires_at: string | null
          subscription_started_at: string | null
          supplier_id: string
          updated_at: string
          user_id: string | null
          user_type: string | null
        }
        Insert: {
          created_at?: string
          daily_emails_sent?: number
          has_email_subscription?: boolean
          id?: string
          last_daily_reset?: string
          last_monthly_reset?: string
          monthly_emails_sent?: number
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          supplier_id: string
          updated_at?: string
          user_id?: string | null
          user_type?: string | null
        }
        Update: {
          created_at?: string
          daily_emails_sent?: number
          has_email_subscription?: boolean
          id?: string
          last_daily_reset?: string
          last_monthly_reset?: string
          monthly_emails_sent?: number
          subscription_expires_at?: string | null
          subscription_started_at?: string | null
          supplier_id?: string
          updated_at?: string
          user_id?: string | null
          user_type?: string | null
        }
        Relationships: []
      }
      supplier_inventory_matches: {
        Row: {
          ai_version: string
          boost_expires_at: string | null
          created_at: string
          historical_acceptance: number
          id: string
          is_boosted: boolean
          last_calculated_at: string
          location_proximity: number
          match_score: number
          matching_rfq_count: number
          product_id: string
          recalculation_locked_until: string | null
          supplier_city: string | null
          supplier_id: string
          updated_at: string
        }
        Insert: {
          ai_version?: string
          boost_expires_at?: string | null
          created_at?: string
          historical_acceptance?: number
          id?: string
          is_boosted?: boolean
          last_calculated_at?: string
          location_proximity?: number
          match_score?: number
          matching_rfq_count?: number
          product_id: string
          recalculation_locked_until?: string | null
          supplier_city?: string | null
          supplier_id: string
          updated_at?: string
        }
        Update: {
          ai_version?: string
          boost_expires_at?: string | null
          created_at?: string
          historical_acceptance?: number
          id?: string
          is_boosted?: boolean
          last_calculated_at?: string
          location_proximity?: number
          match_score?: number
          matching_rfq_count?: number
          product_id?: string
          recalculation_locked_until?: string | null
          supplier_city?: string | null
          supplier_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_inventory_matches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_inventory_matches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_inventory_performance"
            referencedColumns: ["product_id"]
          },
        ]
      }
      supplier_inventory_signals: {
        Row: {
          available_quantity: number | null
          category: string
          confidence_score: number | null
          created_at: string
          id: string
          last_updated: string
          location: string | null
          product_name: string | null
          supplier_id: string
          unit: string | null
          valid_until: string | null
        }
        Insert: {
          available_quantity?: number | null
          category: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          last_updated?: string
          location?: string | null
          product_name?: string | null
          supplier_id: string
          unit?: string | null
          valid_until?: string | null
        }
        Update: {
          available_quantity?: number | null
          category?: string
          confidence_score?: number | null
          created_at?: string
          id?: string
          last_updated?: string
          location?: string | null
          product_name?: string | null
          supplier_id?: string
          unit?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      supplier_leads: {
        Row: {
          company_name: string | null
          country: string | null
          created_at: string
          email: string | null
          expected_value: number | null
          id: string
          name: string
          next_follow_up: string | null
          notes: string | null
          phone: string | null
          source: string | null
          status: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          expected_value?: number | null
          id?: string
          name: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          company_name?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          expected_value?: number | null
          id?: string
          name?: string
          next_follow_up?: string | null
          notes?: string | null
          phone?: string | null
          source?: string | null
          status?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      supplier_performance: {
        Row: {
          avg_delivery_days: number | null
          created_at: string
          current_load: number | null
          daily_capacity: number | null
          id: string
          last_order_date: string | null
          late_deliveries: number | null
          load_reset_date: string | null
          on_time_deliveries: number | null
          quality_complaints: number | null
          quality_rejections: number | null
          quality_risk_score: number | null
          successful_deliveries: number | null
          supplier_id: string
          total_orders: number | null
          updated_at: string
        }
        Insert: {
          avg_delivery_days?: number | null
          created_at?: string
          current_load?: number | null
          daily_capacity?: number | null
          id?: string
          last_order_date?: string | null
          late_deliveries?: number | null
          load_reset_date?: string | null
          on_time_deliveries?: number | null
          quality_complaints?: number | null
          quality_rejections?: number | null
          quality_risk_score?: number | null
          successful_deliveries?: number | null
          supplier_id: string
          total_orders?: number | null
          updated_at?: string
        }
        Update: {
          avg_delivery_days?: number | null
          created_at?: string
          current_load?: number | null
          daily_capacity?: number | null
          id?: string
          last_order_date?: string | null
          late_deliveries?: number | null
          load_reset_date?: string | null
          on_time_deliveries?: number | null
          quality_complaints?: number | null
          quality_rejections?: number | null
          quality_risk_score?: number | null
          successful_deliveries?: number | null
          supplier_id?: string
          total_orders?: number | null
          updated_at?: string
        }
        Relationships: []
      }
      supplier_sale_items: {
        Row: {
          created_at: string
          id: string
          product_name: string
          quantity: number
          sale_id: string
          tax_amount: number
          tax_rate: number | null
          total: number
          unit: string
          unit_price: number
        }
        Insert: {
          created_at?: string
          id?: string
          product_name: string
          quantity?: number
          sale_id: string
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          unit?: string
          unit_price?: number
        }
        Update: {
          created_at?: string
          id?: string
          product_name?: string
          quantity?: number
          sale_id?: string
          tax_amount?: number
          tax_rate?: number | null
          total?: number
          unit?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "supplier_sales"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_sales: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          invoice_number: string | null
          notes: string | null
          payment_status: string
          sale_date: string
          status: string
          supplier_id: string
          tax_amount: number
          total_amount: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string
          sale_date?: string
          status?: string
          supplier_id: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          invoice_number?: string | null
          notes?: string | null
          payment_status?: string
          sale_date?: string
          status?: string
          supplier_id?: string
          tax_amount?: number
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "supplier_sales_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "supplier_customers"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_selection_log: {
        Row: {
          ai_reasoning: Json | null
          composite_score: number | null
          created_at: string
          delivery_success_probability: number | null
          fallback_reason: string | null
          fallback_triggered: boolean | null
          id: string
          logistics_cost: number | null
          material_cost: number | null
          quality_risk_score: number | null
          requirement_id: string
          runner_up_suppliers: Json | null
          selected_bid_id: string | null
          selected_supplier_id: string
          selection_mode: string
          total_landed_cost: number | null
        }
        Insert: {
          ai_reasoning?: Json | null
          composite_score?: number | null
          created_at?: string
          delivery_success_probability?: number | null
          fallback_reason?: string | null
          fallback_triggered?: boolean | null
          id?: string
          logistics_cost?: number | null
          material_cost?: number | null
          quality_risk_score?: number | null
          requirement_id: string
          runner_up_suppliers?: Json | null
          selected_bid_id?: string | null
          selected_supplier_id: string
          selection_mode: string
          total_landed_cost?: number | null
        }
        Update: {
          ai_reasoning?: Json | null
          composite_score?: number | null
          created_at?: string
          delivery_success_probability?: number | null
          fallback_reason?: string | null
          fallback_triggered?: boolean | null
          id?: string
          logistics_cost?: number | null
          material_cost?: number | null
          quality_risk_score?: number | null
          requirement_id?: string
          runner_up_suppliers?: Json | null
          selected_bid_id?: string | null
          selected_supplier_id?: string
          selection_mode?: string
          total_landed_cost?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_selection_log_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_selection_log_selected_bid_id_fkey"
            columns: ["selected_bid_id"]
            isOneToOne: false
            referencedRelation: "admin_deal_analytics"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "supplier_selection_log_selected_bid_id_fkey"
            columns: ["selected_bid_id"]
            isOneToOne: false
            referencedRelation: "anonymized_supplier_quotes"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "supplier_selection_log_selected_bid_id_fkey"
            columns: ["selected_bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_selection_log_selected_bid_id_fkey"
            columns: ["selected_bid_id"]
            isOneToOne: false
            referencedRelation: "supplier_deal_closures"
            referencedColumns: ["bid_id"]
          },
        ]
      }
      supplier_subscription_history: {
        Row: {
          admin_notes: string | null
          amount_paid: number | null
          created_at: string
          created_by: string | null
          emails_allowed: number
          emails_used: number
          id: string
          payment_reference: string | null
          payment_status: string | null
          plan_expires_at: string | null
          plan_started_at: string
          plan_type: string
          supplier_id: string
          updated_at: string
        }
        Insert: {
          admin_notes?: string | null
          amount_paid?: number | null
          created_at?: string
          created_by?: string | null
          emails_allowed?: number
          emails_used?: number
          id?: string
          payment_reference?: string | null
          payment_status?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string
          plan_type?: string
          supplier_id: string
          updated_at?: string
        }
        Update: {
          admin_notes?: string | null
          amount_paid?: number | null
          created_at?: string
          created_by?: string | null
          emails_allowed?: number
          emails_used?: number
          id?: string
          payment_reference?: string | null
          payment_status?: string | null
          plan_expires_at?: string | null
          plan_started_at?: string
          plan_type?: string
          supplier_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      transactions: {
        Row: {
          amount: number
          bid_id: string | null
          buyer_id: string
          created_at: string
          fee_paid: boolean
          id: string
          payment_date: string | null
          service_fee: number
          supplier_id: string
        }
        Insert: {
          amount: number
          bid_id?: string | null
          buyer_id: string
          created_at?: string
          fee_paid?: boolean
          id?: string
          payment_date?: string | null
          service_fee: number
          supplier_id: string
        }
        Update: {
          amount?: number
          bid_id?: string | null
          buyer_id?: string
          created_at?: string
          fee_paid?: boolean
          id?: string
          payment_date?: string | null
          service_fee?: number
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "admin_deal_analytics"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "transactions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "anonymized_supplier_quotes"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "transactions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "supplier_deal_closures"
            referencedColumns: ["bid_id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_totp_secrets: {
        Row: {
          backup_codes: string[] | null
          created_at: string
          encrypted_secret: string
          id: string
          is_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          backup_codes?: string[] | null
          created_at?: string
          encrypted_secret: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          backup_codes?: string[] | null
          created_at?: string
          encrypted_secret?: string
          id?: string
          is_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vehicles: {
        Row: {
          capacity_tons: number | null
          capacity_volume_cbm: number | null
          created_at: string | null
          current_location: string | null
          fuel_type: Database["public"]["Enums"]["fuel_type"] | null
          id: string
          insurance_valid_until: string | null
          is_available: boolean | null
          manufacturer: string | null
          model: string | null
          partner_id: string
          permit_valid_until: string | null
          rc_document_url: string | null
          rc_uploaded_at: string | null
          registration_number: string
          rejection_reason: string | null
          routes: Json | null
          specifications: Json | null
          updated_at: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          verification_status: Database["public"]["Enums"]["vehicle_verification_status"]
          verified_at: string | null
          verified_by: string | null
          year_of_manufacture: number | null
        }
        Insert: {
          capacity_tons?: number | null
          capacity_volume_cbm?: number | null
          created_at?: string | null
          current_location?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          insurance_valid_until?: string | null
          is_available?: boolean | null
          manufacturer?: string | null
          model?: string | null
          partner_id: string
          permit_valid_until?: string | null
          rc_document_url?: string | null
          rc_uploaded_at?: string | null
          registration_number: string
          rejection_reason?: string | null
          routes?: Json | null
          specifications?: Json | null
          updated_at?: string | null
          vehicle_type: Database["public"]["Enums"]["vehicle_type"]
          verification_status?: Database["public"]["Enums"]["vehicle_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          year_of_manufacture?: number | null
        }
        Update: {
          capacity_tons?: number | null
          capacity_volume_cbm?: number | null
          created_at?: string | null
          current_location?: string | null
          fuel_type?: Database["public"]["Enums"]["fuel_type"] | null
          id?: string
          insurance_valid_until?: string | null
          is_available?: boolean | null
          manufacturer?: string | null
          model?: string | null
          partner_id?: string
          permit_valid_until?: string | null
          rc_document_url?: string | null
          rc_uploaded_at?: string | null
          registration_number?: string
          rejection_reason?: string | null
          routes?: Json | null
          specifications?: Json | null
          updated_at?: string | null
          vehicle_type?: Database["public"]["Enums"]["vehicle_type"]
          verification_status?: Database["public"]["Enums"]["vehicle_verification_status"]
          verified_at?: string | null
          verified_by?: string | null
          year_of_manufacture?: number | null
        }
        Relationships: []
      }
      warehouses: {
        Row: {
          address: string
          available_area_sqft: number
          city: string
          contact_person: string | null
          contact_phone: string | null
          country: string | null
          created_at: string | null
          facilities: Json | null
          id: string
          is_active: boolean | null
          name: string
          operating_hours: string | null
          partner_id: string
          pincode: string | null
          rental_rate_per_sqft: number | null
          state: string
          total_area_sqft: number
          updated_at: string | null
          warehouse_type: Database["public"]["Enums"]["warehouse_type"] | null
        }
        Insert: {
          address: string
          available_area_sqft: number
          city: string
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          facilities?: Json | null
          id?: string
          is_active?: boolean | null
          name: string
          operating_hours?: string | null
          partner_id: string
          pincode?: string | null
          rental_rate_per_sqft?: number | null
          state: string
          total_area_sqft: number
          updated_at?: string | null
          warehouse_type?: Database["public"]["Enums"]["warehouse_type"] | null
        }
        Update: {
          address?: string
          available_area_sqft?: number
          city?: string
          contact_person?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string | null
          facilities?: Json | null
          id?: string
          is_active?: boolean | null
          name?: string
          operating_hours?: string | null
          partner_id?: string
          pincode?: string | null
          rental_rate_per_sqft?: number | null
          state?: string
          total_area_sqft?: number
          updated_at?: string | null
          warehouse_type?: Database["public"]["Enums"]["warehouse_type"] | null
        }
        Relationships: []
      }
    }
    Views: {
      admin_ai_inventory_suppliers: {
        Row: {
          ai_matched_products: number | null
          city: string | null
          match_rate_percent: number | null
          products_uploaded: number | null
          supplier_id: string | null
          supplier_name: string | null
          total_stock_units: number | null
        }
        Relationships: []
      }
      admin_ai_sales_metrics: {
        Row: {
          avg_confidence: number | null
          category: string | null
          country: string | null
          deals_closed: number | null
          leads_contacted: number | null
          leads_ignored: number | null
          leads_last_7_days: number | null
          rfqs_created: number | null
          total_leads: number | null
        }
        Relationships: []
      }
      admin_daily_kpis: {
        Row: {
          ai_rfqs: number | null
          bids_received: number | null
          daily_margin: number | null
          date: string | null
          deals_closed: number | null
          rfqs_created: number | null
          unique_buyers: number | null
          unique_suppliers: number | null
        }
        Relationships: []
      }
      admin_deal_analytics: {
        Row: {
          bid_created_at: string | null
          bid_id: string | null
          bid_status: Database["public"]["Enums"]["bid_status"] | null
          deal_value: number | null
          delivered_at: string | null
          delivery_location: string | null
          dispatched_qty: number | null
          markup_percentage: number | null
          platform_margin: number | null
          product_category: string | null
          quantity: number | null
          requirement_id: string | null
          requirement_title: string | null
          rfq_source: string | null
          supplier_id: string | null
          supplier_name: string | null
          supplier_net_price: number | null
          trade_type: string | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_landing_page_metrics: {
        Row: {
          category: string | null
          conversion_count: number | null
          conversion_rate: number | null
          country: string | null
          created_at: string | null
          headline: string | null
          id: string | null
          is_active: boolean | null
          slug: string | null
          view_count: number | null
        }
        Insert: {
          category?: string | null
          conversion_count?: number | null
          conversion_rate?: never
          country?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string | null
          is_active?: boolean | null
          slug?: string | null
          view_count?: number | null
        }
        Update: {
          category?: string | null
          conversion_count?: number | null
          conversion_rate?: never
          country?: string | null
          created_at?: string | null
          headline?: string | null
          id?: string | null
          is_active?: boolean | null
          slug?: string | null
          view_count?: number | null
        }
        Relationships: []
      }
      admin_overview_metrics: {
        Row: {
          active_buyers: number | null
          active_rfqs: number | null
          ai_inventory_requirements: number | null
          deals_closed: number | null
          deals_completed: number | null
          manual_requirements: number | null
          total_requirements: number | null
        }
        Relationships: []
      }
      admin_profit_summary: {
        Row: {
          avg_margin_per_deal: number | null
          date: string | null
          deals_closed: number | null
          total_gmv: number | null
          total_profit: number | null
        }
        Relationships: []
      }
      admin_revenue_by_trade_type: {
        Row: {
          avg_margin: number | null
          avg_markup_percent: number | null
          deals_count: number | null
          total_gmv: number | null
          total_margin: number | null
          trade_type: string | null
        }
        Relationships: []
      }
      anonymized_supplier_quotes: {
        Row: {
          bid_amount: number | null
          bid_id: string | null
          bid_status: Database["public"]["Enums"]["bid_status"] | null
          buyer_visible_price: number | null
          created_at: string | null
          delivery_timeline_days: number | null
          is_paid_bid: boolean | null
          is_verified_supplier: boolean | null
          requirement_id: string | null
          supplier_categories: string[] | null
          supplier_city: string | null
          supplier_code: string | null
          supplier_id: string | null
          terms_and_conditions: string | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_bid_items_view: {
        Row: {
          bid_id: string | null
          created_at: string | null
          dispatched_qty: number | null
          id: string | null
          quantity: number | null
          requirement_item_id: string | null
          supplier_unit_price: number | null
          total: number | null
          unit_price: number | null
        }
        Insert: {
          bid_id?: string | null
          created_at?: string | null
          dispatched_qty?: number | null
          id?: string | null
          quantity?: number | null
          requirement_item_id?: string | null
          supplier_unit_price?: never
          total?: number | null
          unit_price?: number | null
        }
        Update: {
          bid_id?: string | null
          created_at?: string | null
          dispatched_qty?: number | null
          id?: string | null
          quantity?: number | null
          requirement_item_id?: string | null
          supplier_unit_price?: never
          total?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bid_items_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "admin_deal_analytics"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "bid_items_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "anonymized_supplier_quotes"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "bid_items_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "bid_items_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "supplier_deal_closures"
            referencedColumns: ["bid_id"]
          },
          {
            foreignKeyName: "bid_items_requirement_item_id_fkey"
            columns: ["requirement_item_id"]
            isOneToOne: false
            referencedRelation: "requirement_items"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_inventory_discovery: {
        Row: {
          available_quantity: number | null
          category: string | null
          is_featured: boolean | null
          match_strength: string | null
          product_id: string | null
          product_name: string | null
          unit: string | null
        }
        Relationships: [
          {
            foreignKeyName: "supplier_inventory_matches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "supplier_inventory_matches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "supplier_inventory_performance"
            referencedColumns: ["product_id"]
          },
        ]
      }
      demand_intelligence_dashboard: {
        Row: {
          category: string | null
          classification: string | null
          converted_to_rfq_id: string | null
          decision_action: string | null
          delivery_location: string | null
          delivery_timeline_days: number | null
          discovered_at: string | null
          estimated_value: number | null
          feasibility_score: number | null
          fulfilment_feasible: boolean | null
          id: string | null
          industry: string | null
          intent_score: number | null
          matching_suppliers_count: number | null
          overall_score: number | null
          priority_level: string | null
          product_description: string | null
          signal_source: string | null
          status: string | null
          subcategory: string | null
          urgency_score: number | null
          value_score: number | null
        }
        Insert: {
          category?: string | null
          classification?: string | null
          converted_to_rfq_id?: string | null
          decision_action?: string | null
          delivery_location?: string | null
          delivery_timeline_days?: number | null
          discovered_at?: string | null
          estimated_value?: number | null
          feasibility_score?: number | null
          fulfilment_feasible?: boolean | null
          id?: string | null
          industry?: string | null
          intent_score?: number | null
          matching_suppliers_count?: number | null
          overall_score?: number | null
          priority_level?: never
          product_description?: string | null
          signal_source?: string | null
          status?: never
          subcategory?: string | null
          urgency_score?: number | null
          value_score?: number | null
        }
        Update: {
          category?: string | null
          classification?: string | null
          converted_to_rfq_id?: string | null
          decision_action?: string | null
          delivery_location?: string | null
          delivery_timeline_days?: number | null
          discovered_at?: string | null
          estimated_value?: number | null
          feasibility_score?: number | null
          fulfilment_feasible?: boolean | null
          id?: string | null
          industry?: string | null
          intent_score?: number | null
          matching_suppliers_count?: number | null
          overall_score?: number | null
          priority_level?: never
          product_description?: string | null
          signal_source?: string | null
          status?: never
          subcategory?: string | null
          urgency_score?: number | null
          value_score?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_intelligence_signals_converted_to_rfq_id_fkey"
            columns: ["converted_to_rfq_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      safe_supplier_profiles: {
        Row: {
          city: string | null
          country: string | null
          created_at: string | null
          id: string | null
          is_verified_supplier: boolean | null
          state: string | null
          supplier_categories: string[] | null
        }
        Insert: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          is_verified_supplier?: boolean | null
          state?: string | null
          supplier_categories?: string[] | null
        }
        Update: {
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string | null
          is_verified_supplier?: boolean | null
          state?: string | null
          supplier_categories?: string[] | null
        }
        Relationships: []
      }
      supplier_deal_closures: {
        Row: {
          bid_id: string | null
          created_at: string | null
          delivered_at: string | null
          delivery_location: string | null
          product_category: string | null
          quantity_sold: number | null
          requirement_id: string | null
          requirement_title: string | null
          status: Database["public"]["Enums"]["bid_status"] | null
          supplier_id: string | null
          supplier_receivable: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bids_requirement_id_fkey"
            columns: ["requirement_id"]
            isOneToOne: false
            referencedRelation: "requirements"
            referencedColumns: ["id"]
          },
        ]
      }
      supplier_inventory_performance: {
        Row: {
          ai_matches: number | null
          category: string | null
          current_stock: number | null
          deals_closed: number | null
          product_id: string | null
          product_name: string | null
          revenue_earned: number | null
          supplier_id: string | null
          unit: string | null
          units_sold: number | null
        }
        Relationships: []
      }
      user_totp_status: {
        Row: {
          backup_codes_remaining: number | null
          created_at: string | null
          is_enabled: boolean | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          backup_codes_remaining?: never
          created_at?: string | null
          is_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          backup_codes_remaining?: never
          created_at?: string | null
          is_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      activate_affiliate_fifo: {
        Args: { p_affiliate_id: string }
        Returns: string
      }
      admin_adjust_supplier_quota: {
        Args: {
          p_daily_adjustment?: number
          p_monthly_adjustment?: number
          p_set_subscription?: boolean
          p_subscription_expires_at?: string
          p_supplier_id: string
        }
        Returns: boolean
      }
      apply_platform_margin: {
        Args: { p_logistics: number; p_material: number; p_trade_type: string }
        Returns: {
          buyer_logistics: number
          buyer_material: number
          buyer_total: number
          platform_profit: number
        }[]
      }
      auto_assign_supplier: {
        Args: { p_requirement_id: string }
        Returns: Json
      }
      auto_expire_requirements: { Args: never; Returns: undefined }
      calculate_bid_markup: {
        Args: {
          p_buyer_country: string
          p_ship_to_country: string
          p_supplier_country: string
          p_supplier_net_price: number
        }
        Returns: {
          buyer_visible_price: number
          markup_amount: number
          markup_percentage: number
          transaction_type: string
        }[]
      }
      calculate_delivery_success_rate: {
        Args: { p_supplier_id: string }
        Returns: number
      }
      calculate_price_confidence:
        | {
            Args: {
              p_bid_id?: string
              p_buyer_visible_price?: number
              p_requirement_id: string
              p_selection_mode?: string
            }
            Returns: Json
          }
        | {
            Args: {
              p_bid_id?: string
              p_requirement_id: string
              p_selection_mode?: string
            }
            Returns: Json
          }
      calculate_tiered_commission: {
        Args: { p_base_commission: number; p_gmv: number; p_user_id: string }
        Returns: number
      }
      can_view_full_profile: { Args: { _profile_id: string }; Returns: boolean }
      check_and_increment_email_quota: {
        Args: { p_supplier_id: string }
        Returns: {
          can_send: boolean
          is_subscribed: boolean
          remaining_daily: number
          remaining_monthly: number
        }[]
      }
      check_self_referral: {
        Args: { p_referred_id: string; p_referrer_id: string }
        Returns: Json
      }
      check_self_referral_v2: {
        Args: {
          p_referrer_id: string
          p_user_email?: string
          p_user_id: string
          p_user_phone?: string
        }
        Returns: Json
      }
      complete_supplier_reveal: {
        Args: {
          p_payment_reference?: string
          p_requirement_id: string
          p_supplier_id: string
        }
        Returns: boolean
      }
      consume_backup_code: { Args: { p_code: string }; Returns: boolean }
      generate_referral_code: { Args: { user_id: string }; Returns: string }
      get_bids_for_buyer: {
        Args: { p_requirement_id: string }
        Returns: {
          bid_amount: number
          bid_id: string
          created_at: string
          delivery_timeline_days: number
          status: string
          supplier_name: string
          terms_and_conditions: string
        }[]
      }
      get_bids_for_supplier: {
        Args: { p_supplier_id: string }
        Returns: {
          bid_amount: number
          bid_id: string
          created_at: string
          delivery_timeline_days: number
          requirement_id: string
          requirement_title: string
          status: string
        }[]
      }
      get_business_contact_profile: {
        Args: { _profile_id: string }
        Returns: {
          city: string
          company_name: string
          contact_person: string
          country: string
          id: string
          state: string
        }[]
      }
      get_delivery_success_rate: {
        Args: { p_supplier_id: string }
        Returns: number
      }
      get_email_quota_status: {
        Args: { p_supplier_id: string }
        Returns: {
          daily_limit: number
          daily_sent: number
          is_subscribed: boolean
          monthly_limit: number
          monthly_sent: number
          subscription_expires_at: string
        }[]
      }
      get_logistics_details_internal: {
        Args: { p_bid_id: string }
        Returns: {
          actual_handler_id: string
          bid_id: string
          logistics_execution_mode: string
          logistics_notes: string
          supplier_id: string
        }[]
      }
      get_logistics_handler_for_buyer: {
        Args: { p_bid_id: string }
        Returns: {
          logistics_handler_contact: string
          logistics_handler_name: string
          logistics_status: string
        }[]
      }
      get_lowest_bid_for_requirement: {
        Args: { req_id: string }
        Returns: {
          bid_count: number
          lowest_bid_amount: number
        }[]
      }
      get_lowest_bid_secure: {
        Args: { req_id: string }
        Returns: {
          can_view: boolean
          lowest_bid_amount: number
        }[]
      }
      get_lowest_logistics_bid: {
        Args: { req_id: string }
        Returns: {
          bid_count: number
          lowest_bid_amount: number
        }[]
      }
      get_po_amount: {
        Args: { po: Database["public"]["Tables"]["purchase_orders"]["Row"] }
        Returns: number
      }
      get_revealed_supplier_contact: {
        Args: { p_requirement_id: string; p_supplier_id: string }
        Returns: {
          revealed_at: string
          supplier_address: string
          supplier_company: string
          supplier_email: string
          supplier_gstin: string
          supplier_name: string
          supplier_phone: string
        }[]
      }
      get_supplier_email_stats: {
        Args: { p_supplier_id?: string }
        Returns: {
          click_rate: number
          delivery_rate: number
          open_rate: number
          supplier_id: string
          total_bounced: number
          total_clicked: number
          total_delivered: number
          total_opened: number
          total_sent: number
        }[]
      }
      has_business_relationship: {
        Args: { _profile_id: string; _viewer_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      increment_intent_score: {
        Args: { delta: number; page_id: string }
        Returns: undefined
      }
      increment_page_views: { Args: { page_id: string }; Returns: undefined }
      increment_rfq_count: { Args: { page_id: string }; Returns: undefined }
      is_admin: { Args: never; Returns: boolean }
      log_email_sent: {
        Args: {
          p_brevo_message_id: string
          p_email_type?: string
          p_recipient_email: string
          p_requirement_id: string
          p_subject: string
          p_supplier_id: string
        }
        Returns: string
      }
      promote_next_affiliate: { Args: never; Returns: undefined }
      promote_next_waitlisted_affiliate: { Args: never; Returns: undefined }
      register_affiliate: { Args: { p_user_id: string }; Returns: string }
      request_supplier_reveal: {
        Args: {
          p_bid_id: string
          p_requirement_id: string
          p_supplier_id: string
        }
        Returns: Json
      }
      reset_all_supplier_daily_loads: { Args: never; Returns: number }
      select_supplier_with_bidding: {
        Args: { p_requirement_id: string }
        Returns: Json
      }
      send_email_notification: {
        Args: {
          p_data: Json
          p_requirement_id?: string
          p_subject: string
          p_supplier_id?: string
          p_to: string
          p_type: string
        }
        Returns: undefined
      }
      validate_referral_eligibility: {
        Args: { p_referred_id: string; p_referrer_id: string }
        Returns: boolean
      }
      verify_totp_securely: { Args: { p_code: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "buyer"
        | "supplier"
        | "admin"
        | "logistics_partner"
        | "affiliate"
      bid_status: "pending" | "accepted" | "rejected" | "withdrawn"
      document_status:
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "paid"
        | "cancelled"
      document_type:
        | "proforma_invoice"
        | "tax_invoice"
        | "purchase_order"
        | "debit_note"
        | "credit_note"
      fuel_type: "diesel" | "petrol" | "cng" | "electric" | "hybrid"
      logistics_bid_status: "pending" | "accepted" | "rejected"
      logistics_partner_type: "agent" | "fleet_owner"
      logistics_requirement_status: "active" | "closed" | "cancelled"
      requirement_status: "active" | "closed" | "awarded" | "expired"
      shipment_status:
        | "awaiting_pickup"
        | "picked_up"
        | "in_transit"
        | "at_checkpoint"
        | "out_for_delivery"
        | "delivered"
        | "delayed"
        | "cancelled"
      subscription_tier: "free" | "premium"
      vehicle_type:
        | "truck"
        | "trailer"
        | "tanker"
        | "container_truck"
        | "mini_truck"
        | "pickup"
        | "tempo"
        | "lpv"
      vehicle_verification_status: "pending" | "verified" | "rejected"
      warehouse_type:
        | "dry_storage"
        | "cold_storage"
        | "bonded"
        | "open_yard"
        | "hazmat"
        | "general"
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
      app_role: [
        "buyer",
        "supplier",
        "admin",
        "logistics_partner",
        "affiliate",
      ],
      bid_status: ["pending", "accepted", "rejected", "withdrawn"],
      document_status: [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "paid",
        "cancelled",
      ],
      document_type: [
        "proforma_invoice",
        "tax_invoice",
        "purchase_order",
        "debit_note",
        "credit_note",
      ],
      fuel_type: ["diesel", "petrol", "cng", "electric", "hybrid"],
      logistics_bid_status: ["pending", "accepted", "rejected"],
      logistics_partner_type: ["agent", "fleet_owner"],
      logistics_requirement_status: ["active", "closed", "cancelled"],
      requirement_status: ["active", "closed", "awarded", "expired"],
      shipment_status: [
        "awaiting_pickup",
        "picked_up",
        "in_transit",
        "at_checkpoint",
        "out_for_delivery",
        "delivered",
        "delayed",
        "cancelled",
      ],
      subscription_tier: ["free", "premium"],
      vehicle_type: [
        "truck",
        "trailer",
        "tanker",
        "container_truck",
        "mini_truck",
        "pickup",
        "tempo",
        "lpv",
      ],
      vehicle_verification_status: ["pending", "verified", "rejected"],
      warehouse_type: [
        "dry_storage",
        "cold_storage",
        "bonded",
        "open_yard",
        "hazmat",
        "general",
      ],
    },
  },
} as const
