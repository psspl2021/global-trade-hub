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
      bid_items: {
        Row: {
          bid_id: string
          created_at: string | null
          id: string
          quantity: number
          requirement_item_id: string
          total: number
          unit_price: number
        }
        Insert: {
          bid_id: string
          created_at?: string | null
          id?: string
          quantity: number
          requirement_item_id: string
          total: number
          unit_price: number
        }
        Update: {
          bid_id?: string
          created_at?: string | null
          id?: string
          quantity?: number
          requirement_item_id?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "bid_items_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: false
            referencedRelation: "bids"
            referencedColumns: ["id"]
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
          bid_amount: number
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
          quality_status: string | null
          requirement_id: string
          service_fee: number
          status: Database["public"]["Enums"]["bid_status"]
          supplier_id: string
          supplier_net_price: number
          terms_and_conditions: string | null
          total_amount: number
          transaction_type: string | null
          updated_at: string
        }
        Insert: {
          bid_amount: number
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
          quality_status?: string | null
          requirement_id: string
          service_fee: number
          status?: Database["public"]["Enums"]["bid_status"]
          supplier_id: string
          supplier_net_price: number
          terms_and_conditions?: string | null
          total_amount: number
          transaction_type?: string | null
          updated_at?: string
        }
        Update: {
          bid_amount?: number
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
          quality_status?: string | null
          requirement_id?: string
          service_fee?: number
          status?: Database["public"]["Enums"]["bid_status"]
          supplier_id?: string
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
          created_at: string
          delivery_address: string | null
          discount_amount: number
          discount_percent: number | null
          expected_delivery_date: string | null
          id: string
          notes: string | null
          order_date: string
          po_number: string
          status: Database["public"]["Enums"]["document_status"]
          subtotal: number
          supplier_id: string
          tax_amount: number
          tax_rate: number | null
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string
          vendor_address: string | null
          vendor_email: string | null
          vendor_gstin: string | null
          vendor_name: string
          vendor_phone: string | null
        }
        Insert: {
          created_at?: string
          delivery_address?: string | null
          discount_amount?: number
          discount_percent?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number: string
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          supplier_id: string
          tax_amount?: number
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          vendor_address?: string | null
          vendor_email?: string | null
          vendor_gstin?: string | null
          vendor_name: string
          vendor_phone?: string | null
        }
        Update: {
          created_at?: string
          delivery_address?: string | null
          discount_amount?: number
          discount_percent?: number | null
          expected_delivery_date?: string | null
          id?: string
          notes?: string | null
          order_date?: string
          po_number?: string
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
          vendor_address?: string | null
          vendor_email?: string | null
          vendor_gstin?: string | null
          vendor_name?: string
          vendor_phone?: string | null
        }
        Relationships: []
      }
      referral_commissions: {
        Row: {
          bid_amount: number
          bid_id: string
          commission_amount: number
          commission_percentage: number
          created_at: string
          dispatched_qty: number | null
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
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_commissions_bid_id_fkey"
            columns: ["bid_id"]
            isOneToOne: true
            referencedRelation: "bids"
            referencedColumns: ["id"]
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
          id: string
          referral_code: string
          referred_email: string | null
          referred_id: string | null
          referrer_id: string
          reward_credited: boolean | null
          rewarded_at: string | null
          signed_up_at: string | null
          status: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_code: string
          referred_email?: string | null
          referred_id?: string | null
          referrer_id: string
          reward_credited?: boolean | null
          rewarded_at?: string | null
          signed_up_at?: string | null
          status?: string
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code?: string
          referred_email?: string | null
          referred_id?: string | null
          referrer_id?: string
          reward_credited?: boolean | null
          rewarded_at?: string | null
          signed_up_at?: string | null
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
            foreignKeyName: "referrals_referrer_id_fkey"
            columns: ["referrer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
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
          selection_mode: string | null
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
          selection_mode?: string | null
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
          selection_mode?: string | null
          specifications?: Json | null
          status?: Database["public"]["Enums"]["requirement_status"]
          title?: string
          trade_type?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
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
            referencedRelation: "bids"
            referencedColumns: ["id"]
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
            referencedRelation: "bids"
            referencedColumns: ["id"]
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
      get_lowest_logistics_bid: {
        Args: { req_id: string }
        Returns: {
          bid_count: number
          lowest_bid_amount: number
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
      verify_totp_securely: { Args: { p_code: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "buyer"
        | "supplier"
        | "admin"
        | "logistics_partner"
        | "affiliate"
      bid_status: "pending" | "accepted" | "rejected"
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
      bid_status: ["pending", "accepted", "rejected"],
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
