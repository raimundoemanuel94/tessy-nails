alter table public.studios
  add column if not exists brand_color text,
  add column if not exists whatsapp text,
  add column if not exists instagram text,
  add column if not exists subscription_status text default 'trial',
  add column if not exists next_billing_date date,
  add column if not exists mrr numeric(10, 2) default 0;

update public.studios
set subscription_status = coalesce(subscription_status, 'trial'),
    mrr = coalesce(mrr, 0);

create index if not exists studios_subscription_status_idx
  on public.studios (subscription_status);
