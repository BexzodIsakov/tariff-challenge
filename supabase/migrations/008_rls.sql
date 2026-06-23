-- Helper: checks if the current authenticated user is an admin.
-- security definer so it bypasses RLS on profiles when called from other tables' policies
-- (avoids recursive RLS evaluation and an extra round trip per check).
create function public.is_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

-- profiles
alter table public.profiles enable row level security;

create policy "profiles_select_own_or_admin"
  on public.profiles for select
  using (id = auth.uid() or public.is_admin());

-- tariffs
alter table public.tariffs enable row level security;

create policy "tariffs_select_active_public"
  on public.tariffs for select
  using (is_active = true);

create policy "tariffs_select_all_admin"
  on public.tariffs for select
  using (public.is_admin());

create policy "tariffs_insert_admin"
  on public.tariffs for insert
  with check (public.is_admin());

create policy "tariffs_update_admin"
  on public.tariffs for update
  using (public.is_admin());

-- gift_applications
alter table public.gift_applications enable row level security;

create policy "gift_applications_select_own_or_admin"
  on public.gift_applications for select
  using (user_id = auth.uid() or public.is_admin());

create policy "gift_applications_insert_own"
  on public.gift_applications for insert
  with check (user_id = auth.uid());

create policy "gift_applications_update_own_or_admin"
  on public.gift_applications for update
  using (user_id = auth.uid() or public.is_admin());

-- user_access
alter table public.user_access enable row level security;

create policy "user_access_select_own_or_admin"
  on public.user_access for select
  using (user_id = auth.uid() or public.is_admin());

create policy "user_access_insert_own"
  on public.user_access for insert
  with check (user_id = auth.uid());

-- telegram_config
alter table public.telegram_config enable row level security;

create policy "telegram_config_select_admin"
  on public.telegram_config for select
  using (public.is_admin());

create policy "telegram_config_insert_admin"
  on public.telegram_config for insert
  with check (public.is_admin());

create policy "telegram_config_update_admin"
  on public.telegram_config for update
  using (public.is_admin());

-- notification_logs
-- No insert policy for regular users/admin sessions: rows are written via the
-- service-role key from the Telegram webhook and system-level server actions,
-- which bypasses RLS entirely. Only a read policy is needed here.
alter table public.notification_logs enable row level security;

create policy "notification_logs_select_admin"
  on public.notification_logs for select
  using (public.is_admin());
