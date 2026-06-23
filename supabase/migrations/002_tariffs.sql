-- Subscription plans created and managed by admin.
create table public.tariffs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price numeric(10,2) not null,
  period_months int not null check (period_months between 1 and 12),
  is_active boolean not null default true,
  created_at timestamptz default now()
);
