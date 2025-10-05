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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      products: {
        Row: {
          barcode: string | null
          category: string | null
          code: string | null
          cost_price: number
          created_at: string | null
          id: string
          is_photocopy: boolean | null
          name: string
          sell_price: number
          stock: number | null
          store_id: string | null
          updated_at: string | null
        }
        Insert: {
          barcode?: string | null
          category?: string | null
          code?: string | null
          cost_price: number
          created_at?: string | null
          id?: string
          is_photocopy?: boolean | null
          name: string
          sell_price: number
          stock?: number | null
          store_id?: string | null
          updated_at?: string | null
        }
        Update: {
          barcode?: string | null
          category?: string | null
          code?: string | null
          cost_price?: number
          created_at?: string | null
          id?: string
          is_photocopy?: boolean | null
          name?: string
          sell_price?: number
          stock?: number | null
          store_id?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          admin_password: string | null
          approved_at: string | null
          approved_by: string | null
          created_at: string
          email: string
          id: string
          is_approved: boolean | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          admin_password?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email: string
          id?: string
          is_approved?: boolean | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          admin_password?: string | null
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          email?: string
          id?: string
          is_approved?: boolean | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      receipt_items: {
        Row: {
          cost_price: number | null
          created_at: string | null
          final_price: number | null
          id: string
          product_id: string | null
          product_name: string
          profit: number | null
          quantity: number
          receipt_id: string
          total_price: number | null
          unit_price: number
        }
        Insert: {
          cost_price?: number | null
          created_at?: string | null
          final_price?: number | null
          id?: string
          product_id?: string | null
          product_name: string
          profit?: number | null
          quantity: number
          receipt_id: string
          total_price?: number | null
          unit_price: number
        }
        Update: {
          cost_price?: number | null
          created_at?: string | null
          final_price?: number | null
          id?: string
          product_id?: string | null
          product_name?: string
          profit?: number | null
          quantity?: number
          receipt_id?: string
          total_price?: number | null
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "receipt_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "receipt_items_receipt_id_fkey"
            columns: ["receipt_id"]
            isOneToOne: false
            referencedRelation: "receipts"
            referencedColumns: ["id"]
          },
        ]
      }
      receipts: {
        Row: {
          created_at: string | null
          discount: number | null
          id: string
          invoice_number: string | null
          payment_method: string | null
          profit: number
          store_id: string | null
          subtotal: number
          total: number
          user_id: string
        }
        Insert: {
          created_at?: string | null
          discount?: number | null
          id: string
          invoice_number?: string | null
          payment_method?: string | null
          profit: number
          store_id?: string | null
          subtotal: number
          total: number
          user_id: string
        }
        Update: {
          created_at?: string | null
          discount?: number | null
          id?: string
          invoice_number?: string | null
          payment_method?: string | null
          profit?: number
          store_id?: string | null
          subtotal?: number
          total?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "receipts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shopping_items: {
        Row: {
          created_at: string | null
          current_stock: number | null
          id: string
          is_completed: boolean | null
          name: string
          notes: string | null
          quantity: number | null
          store_id: string | null
          unit: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          current_stock?: number | null
          id?: string
          is_completed?: boolean | null
          name: string
          notes?: string | null
          quantity?: number | null
          store_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          current_stock?: number | null
          id?: string
          is_completed?: boolean | null
          name?: string
          notes?: string | null
          quantity?: number | null
          store_id?: string | null
          unit?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shopping_items_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          admin_password: string | null
          bank_account_holder: string | null
          bank_account_number: string | null
          bank_name: string | null
          cashier_name: string | null
          category: string
          closing_hours: string | null
          created_at: string | null
          dana_number: string | null
          ewallet_number: string | null
          gopay_number: string | null
          id: string
          name: string
          opening_hours: string | null
          ovo_number: string | null
          owner_id: string
          phone: string | null
          qris_image_url: string | null
          settings_password: string | null
          shopeepay_number: string | null
          updated_at: string | null
          whatsapp_number: string | null
        }
        Insert: {
          address?: string | null
          admin_password?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          cashier_name?: string | null
          category: string
          closing_hours?: string | null
          created_at?: string | null
          dana_number?: string | null
          ewallet_number?: string | null
          gopay_number?: string | null
          id?: string
          name: string
          opening_hours?: string | null
          ovo_number?: string | null
          owner_id: string
          phone?: string | null
          qris_image_url?: string | null
          settings_password?: string | null
          shopeepay_number?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Update: {
          address?: string | null
          admin_password?: string | null
          bank_account_holder?: string | null
          bank_account_number?: string | null
          bank_name?: string | null
          cashier_name?: string | null
          category?: string
          closing_hours?: string | null
          created_at?: string | null
          dana_number?: string | null
          ewallet_number?: string | null
          gopay_number?: string | null
          id?: string
          name?: string
          opening_hours?: string | null
          ovo_number?: string | null
          owner_id?: string
          phone?: string | null
          qris_image_url?: string | null
          settings_password?: string | null
          shopeepay_number?: string | null
          updated_at?: string | null
          whatsapp_number?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      get_user_by_username_or_email: {
        Args: { identifier: string }
        Returns: {
          email: string
          username: string
        }[]
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
      app_role: "admin" | "user"
      store_category:
        | "sembako"
        | "bangunan"
        | "agen_sosis"
        | "atk"
        | "elektronik"
        | "pakaian"
        | "farmasi"
        | "lainnya"
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
      store_category: [
        "sembako",
        "bangunan",
        "agen_sosis",
        "atk",
        "elektronik",
        "pakaian",
        "farmasi",
        "lainnya",
      ],
    },
  },
} as const
