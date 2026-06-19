-- Aligns the app with professional booking links, per-professional schedules, and commissions.
-- Safe to run more than once because every schema change is guarded.

alter table public.profiles
  add column if not exists display_name text,
  add column if not exists slug text,
  add column if not exists is_active boolean not null default true,
  add column if not exists commission_rate numeric(5,2),
  add column if not exists specialties text[] not null default '{}';

create unique index if not exists profiles_studio_slug_unique
  on public.profiles(studio_id, slug)
  where slug is not null;

alter table public.appointments
  add column if not exists professional_id uuid references public.profiles(id) on delete set null;

create index if not exists appointments_professional_id_idx
  on public.appointments(professional_id);

create index if not exists appointments_studio_professional_date_idx
  on public.appointments(studio_id, professional_id, appointment_date);

create table if not exists public.professional_availability (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  weekday text not null check (weekday in ('sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday')),
  open_time time not null,
  close_time time not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (professional_id, weekday, open_time, close_time)
);

create index if not exists professional_availability_studio_idx
  on public.professional_availability(studio_id, professional_id, weekday);

create table if not exists public.commission_rules (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  professional_id uuid references public.profiles(id) on delete cascade,
  percent numeric(5,2) not null default 40,
  applies_to text not null default 'all' check (applies_to in ('all', 'service', 'category')),
  service_id uuid references public.services(id) on delete cascade,
  category text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commission_rules_lookup_idx
  on public.commission_rules(studio_id, professional_id, is_active);

create table if not exists public.commission_payouts (
  id uuid primary key default gen_random_uuid(),
  studio_id uuid not null references public.studios(id) on delete cascade,
  professional_id uuid not null references public.profiles(id) on delete cascade,
  period_start date not null,
  period_end date not null,
  gross_amount numeric(12,2) not null default 0,
  commission_amount numeric(12,2) not null default 0,
  adjustments numeric(12,2) not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'paid', 'cancelled')),
  paid_at timestamptz,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists commission_payouts_period_idx
  on public.commission_payouts(studio_id, professional_id, period_start, period_end);

alter table public.professional_availability enable row level security;
alter table public.commission_rules enable row level security;
alter table public.commission_payouts enable row level security;

drop policy if exists "service_role_all_professional_availability" on public.professional_availability;
create policy "service_role_all_professional_availability"
  on public.professional_availability for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_commission_rules" on public.commission_rules;
create policy "service_role_all_commission_rules"
  on public.commission_rules for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "service_role_all_commission_payouts" on public.commission_payouts;
create policy "service_role_all_commission_payouts"
  on public.commission_payouts for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');
