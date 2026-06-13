alter table public.plan_prices enable row level security;

drop policy if exists "anyone_can_read_plans" on public.plan_prices;
drop policy if exists "superadmin_can_manage_plans" on public.plan_prices;
drop policy if exists "superadmin_can_update_plans" on public.plan_prices;

create policy "anyone_can_read_plans"
  on public.plan_prices
  for select
  using (true);

create policy "superadmin_can_update_plans"
  on public.plan_prices
  for update
  using (public.is_superadmin())
  with check (public.is_superadmin());
