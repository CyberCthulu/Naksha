-- A UTC offset is persisted only when a civil birth time is ambiguous. NULL
-- remains the canonical representation for ordinary times and all legacy rows.
alter table public.users
  add column birth_utc_offset_minutes smallint;

alter table public.users
  add constraint users_birth_utc_offset_minutes_check
  check (
    birth_utc_offset_minutes is null
    or birth_utc_offset_minutes between -840 and 840
  );

alter table public.charts
  add column birth_utc_offset_minutes smallint;

alter table public.charts
  add constraint charts_birth_utc_offset_minutes_check
  check (
    birth_utc_offset_minutes is null
    or birth_utc_offset_minutes between -840 and 840
  );

-- Fold occurrences are distinct chart identities. Because NULLS NOT DISTINCT
-- is retained, unambiguous and legacy rows keep their existing identity.
alter table public.charts
  drop constraint charts_unique_canonical_birth_identity;

create unique index charts_unique_canonical_birth_identity
  on public.charts (
    user_id,
    birth_date,
    birth_time,
    time_zone,
    birth_utc_offset_minutes,
    birth_lat,
    birth_lon
  )
  nulls not distinct;

alter table public.charts
  add constraint charts_unique_canonical_birth_identity
  unique using index charts_unique_canonical_birth_identity;

comment on column public.users.birth_utc_offset_minutes
  is 'Chosen UTC offset for an ambiguous civil birth time; NULL for unambiguous or unresolved legacy values.';

comment on column public.charts.birth_utc_offset_minutes
  is 'Chosen UTC offset for an ambiguous civil birth time; part of canonical chart identity.';

comment on constraint charts_unique_canonical_birth_identity on public.charts
  is 'Canonical chart identity includes a selected DST-fold offset; NULL keeps ordinary and legacy identities stable.';

-- Preserve the signup metadata path for the new nullable fold choice. Invalid
-- metadata remains NULL so it cannot bypass client-side civil-time validation.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_birth_date date;
  v_birth_time time;
  v_birth_utc_offset_minutes smallint;
  v_birth_lat double precision;
  v_birth_lon double precision;
begin
  begin
    v_birth_date := nullif(new.raw_user_meta_data->>'birth_date', '')::date;
  exception when others then
    v_birth_date := null;
  end;

  begin
    v_birth_time := nullif(new.raw_user_meta_data->>'birth_time', '')::time;
  exception when others then
    v_birth_time := null;
  end;

  begin
    v_birth_utc_offset_minutes :=
      nullif(new.raw_user_meta_data->>'birth_utc_offset_minutes', '')::smallint;
    if v_birth_utc_offset_minutes not between -840 and 840 then
      v_birth_utc_offset_minutes := null;
    end if;
  exception when others then
    v_birth_utc_offset_minutes := null;
  end;

  begin
    v_birth_lat := nullif(new.raw_user_meta_data->>'birth_lat', '')::double precision;
  exception when others then
    v_birth_lat := null;
  end;

  begin
    v_birth_lon := nullif(new.raw_user_meta_data->>'birth_lon', '')::double precision;
  exception when others then
    v_birth_lon := null;
  end;

  insert into public.users (
    id,
    email,
    first_name,
    last_name,
    birth_date,
    birth_time,
    birth_utc_offset_minutes,
    birth_location,
    time_zone,
    birth_lat,
    birth_lon,
    created_at,
    updated_at
  )
  values (
    new.id,
    new.email,
    nullif(new.raw_user_meta_data->>'first_name', ''),
    nullif(new.raw_user_meta_data->>'last_name', ''),
    v_birth_date,
    v_birth_time,
    v_birth_utc_offset_minutes,
    nullif(new.raw_user_meta_data->>'birth_location', ''),
    nullif(new.raw_user_meta_data->>'time_zone', ''),
    v_birth_lat,
    v_birth_lon,
    now(),
    now()
  )
  on conflict (id) do update
    set email                    = excluded.email,
        first_name               = coalesce(excluded.first_name, public.users.first_name),
        last_name                = coalesce(excluded.last_name, public.users.last_name),
        birth_date               = coalesce(excluded.birth_date, public.users.birth_date),
        birth_time               = coalesce(excluded.birth_time, public.users.birth_time),
        birth_utc_offset_minutes = coalesce(
          excluded.birth_utc_offset_minutes,
          public.users.birth_utc_offset_minutes
        ),
        birth_location           = coalesce(excluded.birth_location, public.users.birth_location),
        time_zone                = coalesce(excluded.time_zone, public.users.time_zone),
        birth_lat                = coalesce(excluded.birth_lat, public.users.birth_lat),
        birth_lon                = coalesce(excluded.birth_lon, public.users.birth_lon),
        updated_at               = now();

  return new;
end;
$$;
