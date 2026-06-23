-- Mirrors auth.users. Row is auto-created by trigger on signup (see 007_triggers.sql).
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  role text not null default 'user', -- 'user' or 'admin'
  created_at timestamptz default now()
);
