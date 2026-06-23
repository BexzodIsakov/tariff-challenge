-- A row here means the user has active access. Created on mock payment or gift activation.
create table public.user_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tariff_id uuid not null references public.tariffs(id) on delete cascade,
  source text not null, -- 'payment' or 'gift'
  activated_at timestamptz default now(),
  expires_at timestamptz not null
);
