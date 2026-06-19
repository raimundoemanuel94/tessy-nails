export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: { id: string; name: string; display_name: string | null; slug: string | null; email: string | null; phone: string | null; role: string; studio_id: string | null; avatar_url: string | null; is_active: boolean; commission_rate: number | null; specialties: string[] | null; created_at: string; updated_at: string };
        Insert: { id: string; name?: string; display_name?: string | null; slug?: string | null; email?: string | null; phone?: string | null; role?: string; studio_id?: string | null; avatar_url?: string | null; is_active?: boolean; commission_rate?: number | null; specialties?: string[] | null };
        Update: { name?: string; display_name?: string | null; slug?: string | null; email?: string | null; phone?: string | null; role?: string; studio_id?: string | null; avatar_url?: string | null; is_active?: boolean; commission_rate?: number | null; specialties?: string[] | null };
      };
      studios: {
        Row: { id: string; name: string; slug: string; owner_id: string | null; phone: string | null; address: string | null; avatar_url: string | null; plan: string; is_active: boolean; trial_ends_at: string | null; created_at: string; updated_at: string; brand_color: string | null; whatsapp: string | null; instagram: string | null; subscription_status: string | null; next_billing_date: string | null; mrr: number | null };
        Insert: { name: string; slug: string; owner_id?: string | null; phone?: string | null; address?: string | null; avatar_url?: string | null; plan?: string; is_active?: boolean; trial_ends_at?: string | null; brand_color?: string | null; whatsapp?: string | null; instagram?: string | null; subscription_status?: string | null; next_billing_date?: string | null; mrr?: number | null };
        Update: { name?: string; slug?: string; owner_id?: string | null; phone?: string | null; address?: string | null; avatar_url?: string | null; plan?: string; is_active?: boolean; trial_ends_at?: string | null; brand_color?: string | null; whatsapp?: string | null; instagram?: string | null; subscription_status?: string | null; next_billing_date?: string | null; mrr?: number | null };
      };
      salon_settings: {
        Row: { studio_id: string; slot_duration: number; advance_days: number; cancel_hours: number; auto_confirm: boolean; working_hours: Json; updated_at: string };
        Insert: { studio_id: string; slot_duration?: number; advance_days?: number; cancel_hours?: number; auto_confirm?: boolean; working_hours?: Json };
        Update: { slot_duration?: number; advance_days?: number; cancel_hours?: number; auto_confirm?: boolean; working_hours?: Json };
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
        Row: { id: string; studio_id: string; professional_id: string | null; client_id: string | null; service_id: string | null; client_name: string; service_name: string; appointment_date: string; duration_minutes: number; price: number; status: string; payment_status: string; notes: string | null; source: string | null; created_at: string; updated_at: string };
        Insert: { studio_id: string; professional_id?: string | null; client_id?: string | null; service_id?: string | null; client_name?: string; service_name?: string; appointment_date: string; duration_minutes?: number; price?: number; status?: string; payment_status?: string; notes?: string | null; source?: string | null };
        Update: { professional_id?: string | null; status?: string; payment_status?: string; notes?: string | null; appointment_date?: string; client_name?: string; service_name?: string; price?: number };
      };
      professional_availability: {
        Row: { id: string; studio_id: string; professional_id: string; weekday: string; open_time: string; close_time: string; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; studio_id: string; professional_id: string; weekday: string; open_time: string; close_time: string; is_active?: boolean };
        Update: { studio_id?: string; professional_id?: string; weekday?: string; open_time?: string; close_time?: string; is_active?: boolean };
      };
      commission_rules: {
        Row: { id: string; studio_id: string; professional_id: string | null; percent: number; applies_to: string; service_id: string | null; category: string | null; is_active: boolean; created_at: string; updated_at: string };
        Insert: { id?: string; studio_id: string; professional_id?: string | null; percent?: number; applies_to?: string; service_id?: string | null; category?: string | null; is_active?: boolean };
        Update: { studio_id?: string; professional_id?: string | null; percent?: number; applies_to?: string; service_id?: string | null; category?: string | null; is_active?: boolean };
      };
      commission_payouts: {
        Row: { id: string; studio_id: string; professional_id: string; period_start: string; period_end: string; gross_amount: number; commission_amount: number; adjustments: number; status: string; paid_at: string | null; notes: string | null; created_at: string; updated_at: string };
        Insert: { id?: string; studio_id: string; professional_id: string; period_start: string; period_end: string; gross_amount?: number; commission_amount?: number; adjustments?: number; status?: string; paid_at?: string | null; notes?: string | null };
        Update: { studio_id?: string; professional_id?: string; period_start?: string; period_end?: string; gross_amount?: number; commission_amount?: number; adjustments?: number; status?: string; paid_at?: string | null; notes?: string | null };
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
export type PlanPrice = Database["public"]["Tables"]["plan_prices"]["Row"];
export type ProfessionalAvailability = Database["public"]["Tables"]["professional_availability"]["Row"];
export type CommissionRule = Database["public"]["Tables"]["commission_rules"]["Row"];
export type CommissionPayout = Database["public"]["Tables"]["commission_payouts"]["Row"];
