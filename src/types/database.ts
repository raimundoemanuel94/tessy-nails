export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; name: string; email: string | null; phone: string | null; role: string; studio_id: string | null; avatar_url: string | null; created_at: string; updated_at: string };
        Insert: { id: string; name?: string; email?: string | null; phone?: string | null; role?: string; studio_id?: string | null; avatar_url?: string | null };
        Update: { name?: string; email?: string | null; phone?: string | null; role?: string; studio_id?: string | null; avatar_url?: string | null };
      };
      studios: {
        Row: { id: string; name: string; slug: string; owner_id: string | null; phone: string | null; address: string | null; avatar_url: string | null; plan: string; is_active: boolean; trial_ends_at: string | null; created_at: string; updated_at: string; brand_color: string | null; whatsapp: string | null; instagram: string | null; subscription_status: string | null; next_billing_date: string | null; mrr: number | null; commission_rate: number | null };
        Insert: { name: string; slug: string; owner_id?: string | null; phone?: string | null; address?: string | null; avatar_url?: string | null; plan?: string; is_active?: boolean; trial_ends_at?: string | null; brand_color?: string | null; whatsapp?: string | null; instagram?: string | null; subscription_status?: string | null; next_billing_date?: string | null; mrr?: number | null; commission_rate?: number | null };
        Update: { name?: string; slug?: string; owner_id?: string | null; phone?: string | null; address?: string | null; avatar_url?: string | null; plan?: string; is_active?: boolean; trial_ends_at?: string | null; brand_color?: string | null; whatsapp?: string | null; instagram?: string | null; subscription_status?: string | null; next_billing_date?: string | null; mrr?: number | null; commission_rate?: number | null };
      };
      salon_settings: {
        Row: { studio_id: string; slot_duration: number; advance_days: number; cancel_hours: number; auto_confirm: boolean; working_hours: Json; blocked_dates: string[]; updated_at: string };
        Insert: { studio_id: string; slot_duration?: number; advance_days?: number; cancel_hours?: number; auto_confirm?: boolean; working_hours?: Json; blocked_dates?: string[] };
        Update: { slot_duration?: number; advance_days?: number; cancel_hours?: number; auto_confirm?: boolean; working_hours?: Json; blocked_dates?: string[] };
      };
      services: {
        Row: { id: string; studio_id: string; name: string; description: string | null; price: number; duration_minutes: number; buffer_minutes: number; category: string | null; is_active: boolean; created_at: string; updated_at: string };
        Insert: { studio_id: string; name: string; price?: number; duration_minutes?: number; buffer_minutes?: number; description?: string | null; category?: string | null; is_active?: boolean };
        Update: { name?: string; price?: number; duration_minutes?: number; buffer_minutes?: number; description?: string | null; category?: string | null; is_active?: boolean };
      };
      clients: {
        Row: { id: string; studio_id: string; name: string; phone: string | null; email: string | null; birth_date: string | null; notes: string | null; source: string | null; is_active: boolean; created_at: string; updated_at: string };
        Insert: { studio_id: string; name: string; phone?: string | null; email?: string | null; birth_date?: string | null; notes?: string | null; source?: string | null; is_active?: boolean };
        Update: { name?: string; phone?: string | null; email?: string | null; birth_date?: string | null; notes?: string | null; is_active?: boolean };
      };
      appointments: {
        Row: { id: string; studio_id: string; client_id: string | null; service_id: string | null; client_name: string; service_name: string; appointment_date: string; duration_minutes: number; price: number; status: string; payment_status: string; notes: string | null; source: string | null; created_at: string; updated_at: string };
        Insert: { studio_id: string; client_id?: string | null; service_id?: string | null; client_name?: string; service_name?: string; appointment_date: string; duration_minutes?: number; price?: number; status?: string; payment_status?: string; notes?: string | null; source?: string | null };
        Update: { status?: string; payment_status?: string; notes?: string | null; appointment_date?: string; client_name?: string; service_name?: string; price?: number };
      };
      plan_prices: {
        Row: { plan: string; price: number; label: string; updated_at: string };
        Insert: { plan: string; price?: number; label: string; updated_at?: string };
        Update: { price?: number; label?: string; updated_at?: string };
      };
    };
  };
}

export type Profile     = Database["public"]["Tables"]["profiles"]["Row"];
export type Studio      = Database["public"]["Tables"]["studios"]["Row"];
export type Service     = Database["public"]["Tables"]["services"]["Row"];
export type Client      = Database["public"]["Tables"]["clients"]["Row"];
export type Appointment = Database["public"]["Tables"]["appointments"]["Row"];
export type SalonSettings = Database["public"]["Tables"]["salon_settings"]["Row"];
export type WorkingHours = Record<string, { is_open: boolean; open: string; close: string }>;
export type PlanPrice = Database["public"]["Tables"]["plan_prices"]["Row"];
