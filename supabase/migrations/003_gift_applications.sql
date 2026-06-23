-- Created when a user applies for a free gift.
create table public.gift_applications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  tariff_id uuid not null references public.tariffs(id) on delete cascade,
  status text not null default 'pending', -- 'pending', 'approved', 'rejected'
  activation_code text unique,            -- null until approved
  code_used boolean not null default false,
  applied_at timestamptz default now(),
  expires_at timestamptz                  -- set on approval: approved_at + tariff.period_months
);

-- Safety net for the "no more than one pending application per user" business rule.
-- Enforced in server actions too, but a partial unique index guarantees it at the DB level
-- even if a future code path forgets the check.
create unique index gift_applications_one_pending_per_user
  on public.gift_applications (user_id)
  where (status = 'pending');
