-- Single-row table storing the Telegram bot settings.
create table public.telegram_config (
  id uuid primary key default gen_random_uuid(),
  bot_token text not null,
  approver_chat_id bigint,   -- set automatically when admin presses Start on the bot
  is_active boolean not null default false,
  created_at timestamptz default now()
);
