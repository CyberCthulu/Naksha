alter table public.charts
  drop constraint if exists charts_unique_user_dt_tz;

alter table public.charts
  drop constraint if exists charts_user_birth_unique;

drop index if exists charts_unique_canonical_birth_identity;

create unique index charts_unique_canonical_birth_identity
  on public.charts (user_id, birth_date, birth_time, time_zone, birth_lat, birth_lon)
  nulls not distinct;

alter table public.charts
  add constraint charts_unique_canonical_birth_identity
  unique using index charts_unique_canonical_birth_identity;

comment on constraint charts_unique_canonical_birth_identity on public.charts
  is 'Canonical chart identity: user, birth date, birth time, time zone, and birth coordinates. NULL coordinates are treated as not distinct to prevent duplicate unknown-location charts.';
