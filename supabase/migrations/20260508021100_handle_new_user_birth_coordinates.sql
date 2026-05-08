create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_birth_date date;
  v_birth_time time;
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
    nullif(new.raw_user_meta_data->>'birth_location', ''),
    nullif(new.raw_user_meta_data->>'time_zone', ''),
    v_birth_lat,
    v_birth_lon,
    now(),
    now()
  )
  on conflict (id) do update
    set email          = excluded.email,
        first_name     = coalesce(excluded.first_name, public.users.first_name),
        last_name      = coalesce(excluded.last_name, public.users.last_name),
        birth_date     = coalesce(excluded.birth_date, public.users.birth_date),
        birth_time     = coalesce(excluded.birth_time, public.users.birth_time),
        birth_location = coalesce(excluded.birth_location, public.users.birth_location),
        time_zone      = coalesce(excluded.time_zone, public.users.time_zone),
        birth_lat      = coalesce(excluded.birth_lat, public.users.birth_lat),
        birth_lon      = coalesce(excluded.birth_lon, public.users.birth_lon),
        updated_at     = now();

  return new;
end;
$$;
