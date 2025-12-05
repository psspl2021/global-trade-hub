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
      bids: {
        Row: {
          bid_amount: number
          created_at: string
          delivery_timeline_days: number
          id: string
          requirement_id: string
          service_fee: number
          status: Database["public"]["Enums"]["bid_status"]
          supplier_id: string
          terms_and_conditions: string | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          bid_amount: number
          created_at?: string
          delivery_timeline_days: number
          id?: string
          requirement_id: string
          service_fee: number
          status?: Database["public"]["Enums"]["bid_status"]
          supplier_id: string
          terms_and_conditions?: string | null
          total_amount: number
          updated_at?: string
        }
        Update: {
          bid_amount?: number
          created_at?: string
          delivery_timeline_days?: number
          id?: string
          requirement_id?: string
          service_fee?: number
          status?: Database["public"]["Enums"]["bid_status"]
          supplier_id?: string
          terms_and_conditions?: string | null
          total_amount?: number
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
          status?: Database["public"]["Enums"]["document_status"]
          subtotal?: number
          supplier_id?: string
          tax_amount?: number
          tax_rate?: number | null
          terms_and_conditions?: string | null
          total_amount?: number
          updated_at?: string
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
          city: string | null
          company_name: string
          contact_person: string
          country: string | null
          created_at: string
          email: string
          gstin: string | null
          id: string
          phone: string
          state: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          company_name: string
          contact_person: string
          country?: string | null
          created_at?: string
          email: string
          gstin?: string | null
          id: string
          phone: string
          state?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          business_type?: string | null
          city?: string | null
          company_name?: string
          contact_person?: string
          country?: string | null
          created_at?: string
          email?: string
          gstin?: string | null
          id?: string
          phone?: string
          state?: string | null
          updated_at?: string
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
      requirements: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          buyer_id: string
          certifications_required: string | null
          created_at: string
          deadline: string
          delivery_location: string
          description: string
          id: string
          payment_terms: string | null
          product_category: string
          quality_standards: string | null
          quantity: number
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
          deadline: string
          delivery_location: string
          description: string
          id?: string
          payment_terms?: string | null
          product_category: string
          quality_standards?: string | null
          quantity: number
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
          deadline?: string
          delivery_location?: string
          description?: string
          id?: string
          payment_terms?: string | null
          product_category?: string
          quality_standards?: string | null
          quantity?: number
          specifications?: Json | null
          status?: Database["public"]["Enums"]["requirement_status"]
          title?: string
          trade_type?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: []
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
      subscriptions: {
        Row: {
          bids_limit: number
          bids_used_this_month: number
          billing_cycle_start: string
          created_at: string
          id: string
          tier: Database["public"]["Enums"]["subscription_tier"]
          updated_at: string
          user_id: string
        }
        Insert: {
          bids_limit?: number
          bids_used_this_month?: number
          billing_cycle_start?: string
          created_at?: string
          id?: string
          tier?: Database["public"]["Enums"]["subscription_tier"]
          updated_at?: string
          user_id: string
        }
        Update: {
          bids_limit?: number
          bids_used_this_month?: number
          billing_cycle_start?: string
          created_at?: string
          id?: string
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_lowest_bid_for_requirement: {
        Args: { req_id: string }
        Returns: {
          bid_count: number
          lowest_bid_amount: number
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
    }
    Enums: {
      app_role: "buyer" | "supplier" | "admin"
      bid_status: "pending" | "accepted" | "rejected"
      document_status:
        | "draft"
        | "sent"
        | "accepted"
        | "rejected"
        | "paid"
        | "cancelled"
      document_type: "proforma_invoice" | "tax_invoice" | "purchase_order"
      requirement_status: "active" | "closed" | "awarded"
      subscription_tier: "free" | "premium"
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
      app_role: ["buyer", "supplier", "admin"],
      bid_status: ["pending", "accepted", "rejected"],
      document_status: [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "paid",
        "cancelled",
      ],
      document_type: ["proforma_invoice", "tax_invoice", "purchase_order"],
      requirement_status: ["active", "closed", "awarded"],
      subscription_tier: ["free", "premium"],
    },
  },
} as const
