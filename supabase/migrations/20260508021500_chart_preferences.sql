create table public.chart_preferences (
  user_id uuid primary key references public.users(id) on delete cascade,
  house_system text not null default 'whole_sign',
  zodiac_type text not null default 'tropical',
  orb_mode text not null default 'medium',
  show_house_degrees boolean not null default false,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint chart_preferences_house_system_check
    check (house_system in ('whole_sign')),
  constraint chart_preferences_zodiac_type_check
    check (zodiac_type in ('tropical')),
  constraint chart_preferences_orb_mode_check
    check (orb_mode in ('medium'))
);

drop trigger if exists chart_preferences_set_updated_at on public.chart_preferences;

create trigger chart_preferences_set_updated_at
  before update on public.chart_preferences
  for each row
  execute function public.set_updated_at();

alter table public.chart_preferences enable row level security;

create policy "Select own chart preferences"
  on public.chart_preferences
  for select
  to authenticated
  using (user_id = auth.uid());

create policy "Insert own chart preferences"
  on public.chart_preferences
  for insert
  to authenticated
  with check (user_id = auth.uid());

create policy "Update own chart preferences"
  on public.chart_preferences
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

grant select, insert, update on public.chart_preferences to authenticated;
grant all on public.chart_preferences to service_role;
