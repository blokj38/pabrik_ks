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
      companies: {
        Row: {
          address: string | null
          code: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          type: Database["public"]["Enums"]["company_type"]
        }
        Insert: {
          address?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          type?: Database["public"]["Enums"]["company_type"]
        }
        Update: {
          address?: string | null
          code?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          type?: Database["public"]["Enums"]["company_type"]
        }
        Relationships: []
      }
      delivery_order_items: {
        Row: {
          delivery_order_id: string
          id: string
          product_id: string
          quantity_returned: number
          quantity_sent: number
          unit_price: number | null
        }
        Insert: {
          delivery_order_id: string
          id?: string
          product_id: string
          quantity_returned?: number
          quantity_sent: number
          unit_price?: number | null
        }
        Update: {
          delivery_order_id?: string
          id?: string
          product_id?: string
          quantity_returned?: number
          quantity_sent?: number
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_order_items_delivery_order_id_fkey"
            columns: ["delivery_order_id"]
            isOneToOne: false
            referencedRelation: "delivery_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      delivery_orders: {
        Row: {
          code: string | null
          completed_at: string | null
          created_at: string
          created_by: string | null
          customer_id: string
          destination_address: string | null
          driver_name: string | null
          id: string
          issued_at: string | null
          status: Database["public"]["Enums"]["delivery_status"]
          vehicle: string | null
        }
        Insert: {
          code?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id: string
          destination_address?: string | null
          driver_name?: string | null
          id?: string
          issued_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          vehicle?: string | null
        }
        Update: {
          code?: string | null
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          customer_id?: string
          destination_address?: string | null
          driver_name?: string | null
          id?: string
          issued_at?: string | null
          status?: Database["public"]["Enums"]["delivery_status"]
          vehicle?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "delivery_orders_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "delivery_orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      production_runs: {
        Row: {
          finished_product_id: string
          id: string
          note: string | null
          produced_at: string
          produced_by: string | null
          quantity_produced: number
          recipe_id: string
        }
        Insert: {
          finished_product_id: string
          id?: string
          note?: string | null
          produced_at?: string
          produced_by?: string | null
          quantity_produced: number
          recipe_id: string
        }
        Update: {
          finished_product_id?: string
          id?: string
          note?: string | null
          produced_at?: string
          produced_by?: string | null
          quantity_produced?: number
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "production_runs_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_runs_produced_by_fkey"
            columns: ["produced_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "production_runs_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          business_model: Database["public"]["Enums"]["business_model"]
          business_unit_id: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at: string
          current_stock: number
          id: string
          min_stock: number
          name: string
          price_retail: number | null
          price_wholesale: number | null
          supplier_id: string | null
          unit_id: string
        }
        Insert: {
          business_model: Database["public"]["Enums"]["business_model"]
          business_unit_id?: string | null
          category: Database["public"]["Enums"]["product_category"]
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number
          name: string
          price_retail?: number | null
          price_wholesale?: number | null
          supplier_id?: string | null
          unit_id: string
        }
        Update: {
          business_model?: Database["public"]["Enums"]["business_model"]
          business_unit_id?: string | null
          category?: Database["public"]["Enums"]["product_category"]
          created_at?: string
          current_stock?: number
          id?: string
          min_stock?: number
          name?: string
          price_retail?: number | null
          price_wholesale?: number | null
          supplier_id?: string | null
          unit_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_business_unit_id_fkey"
            columns: ["business_unit_id"]
            isOneToOne: false
            referencedRelation: "business_units"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_unit_id_fkey"
            columns: ["unit_id"]
            isOneToOne: false
            referencedRelation: "units"
            referencedColumns: ["id"]
          },
        ]
      }
      business_units: {
        Row: {
          address: string | null
          created_at: string
          id: string
          name: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          address?: string | null
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          full_name: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
        }
        Insert: {
          created_at?: string
          full_name?: string | null
          id: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Update: {
          created_at?: string
          full_name?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
        }
        Relationships: []
      }
      recipe_items: {
        Row: {
          id: string
          quantity_per_unit: number
          raw_material_id: string
          recipe_id: string
        }
        Insert: {
          id?: string
          quantity_per_unit: number
          raw_material_id: string
          recipe_id: string
        }
        Update: {
          id?: string
          quantity_per_unit?: number
          raw_material_id?: string
          recipe_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipe_items_raw_material_id_fkey"
            columns: ["raw_material_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recipe_items_recipe_id_fkey"
            columns: ["recipe_id"]
            isOneToOne: false
            referencedRelation: "recipes"
            referencedColumns: ["id"]
          },
        ]
      }
      recipes: {
        Row: {
          created_at: string
          finished_product_id: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          finished_product_id: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          finished_product_id?: string
          id?: string
          name?: string
        }
        Relationships: [
          {
            foreignKeyName: "recipes_finished_product_id_fkey"
            columns: ["finished_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_movements: {
        Row: {
          batch_number: string | null
          created_at: string
          created_by: string | null
          expired_date: string | null
          id: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          note: string | null
          product_id: string
          quantity: number
          reference_id: string | null
          reference_type: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          created_by?: string | null
          expired_date?: string | null
          id?: string
          movement_type: Database["public"]["Enums"]["movement_type"]
          note?: string | null
          product_id: string
          quantity: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          created_by?: string | null
          expired_date?: string | null
          id?: string
          movement_type?: Database["public"]["Enums"]["movement_type"]
          note?: string | null
          product_id?: string
          quantity?: number
          reference_id?: string | null
          reference_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_movements_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_movements_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_opname: {
        Row: {
          counted_at: string
          counted_by: string | null
          counted_quantity: number
          difference: number | null
          id: string
          note: string | null
          product_id: string
          system_quantity: number
        }
        Insert: {
          counted_at?: string
          counted_by?: string | null
          counted_quantity: number
          difference?: number | null
          id?: string
          note?: string | null
          product_id: string
          system_quantity: number
        }
        Update: {
          counted_at?: string
          counted_by?: string | null
          counted_quantity?: number
          difference?: number | null
          id?: string
          note?: string | null
          product_id?: string
          system_quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "stock_opname_counted_by_fkey"
            columns: ["counted_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_opname_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      units: {
        Row: {
          created_at: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_delivery_order_item: {
        Args: {
          p_delivery_order_id: string
          p_product_id: string
          p_quantity_sent: number
          p_unit_price?: number
        }
        Returns: string
      }
      complete_delivery_order: {
        Args: { p_delivery_order_id: string }
        Returns: undefined
      }
      delete_delivery_order: {
        Args: { p_delivery_order_id: string }
        Returns: undefined
      }
      edit_delivery_order_item: {
        Args: {
          p_item_id: string
          p_product_id: string
          p_quantity_sent: number
          p_unit_price?: number
        }
        Returns: undefined
      }
      remove_delivery_order_item: {
        Args: { p_item_id: string }
        Returns: undefined
      }
      get_my_role: {
        Args: never
        Returns: Database["public"]["Enums"]["user_role"]
      }
      issue_delivery_order: {
        Args: { p_delivery_order_id: string }
        Returns: undefined
      }
      run_production: {
        Args: {
          p_note?: string
          p_quantity_produced: number
          p_recipe_id: string
        }
        Returns: string
      }
    }
    Enums: {
      business_model: "manufaktur" | "trading"
      company_type: "supplier" | "customer" | "both"
      delivery_status: "draft" | "diterbitkan" | "dalam_pengiriman" | "selesai"
      movement_type:
        | "in"
        | "out"
        | "production_consume"
        | "production_yield"
        | "adjustment"
        | "delivery_out"
        | "delivery_return"
      product_category: "bahan_baku" | "barang_jadi"
      user_role: "owner" | "admin_gudang" | "operator_produksi" | "kasir_sales"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      business_model: ["manufaktur", "trading"],
      company_type: ["supplier", "customer", "both"],
      delivery_status: ["draft", "diterbitkan", "dalam_pengiriman", "selesai"],
      movement_type: [
        "in",
        "out",
        "production_consume",
        "production_yield",
        "adjustment",
        "delivery_out",
        "delivery_return",
      ],
      product_category: ["bahan_baku", "barang_jadi"],
      user_role: ["owner", "admin_gudang", "operator_produksi", "kasir_sales"],
    },
  },
} as const
