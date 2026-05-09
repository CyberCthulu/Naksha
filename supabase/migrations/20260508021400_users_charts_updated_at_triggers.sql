drop trigger if exists users_set_updated_at on public.users;

create trigger users_set_updated_at
  before update on public.users
  for each row
  execute function public.set_updated_at();

drop trigger if exists charts_set_updated_at on public.charts;

create trigger charts_set_updated_at
  before update on public.charts
  for each row
  execute function public.set_updated_at();
