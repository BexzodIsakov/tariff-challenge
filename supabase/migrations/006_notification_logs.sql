-- Audit trail for every Telegram message and email attempt.
create table public.notification_logs (
  id uuid primary key default gen_random_uuid(),
  application_id uuid references public.gift_applications(id) on delete set null,
  type text not null,           -- 'telegram' or 'email'
  status text not null,         -- 'sent' or 'failed'
  error_message text,           -- null if successful
  sent_at timestamptz default now()
);
