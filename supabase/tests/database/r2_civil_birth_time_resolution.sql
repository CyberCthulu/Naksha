begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

create function pg_temp.unique_rejected(statement text)
returns boolean
language plpgsql
as $$
begin
  execute statement;
  return false;
exception
  when unique_violation then
    return true;
end;
$$;

create function pg_temp.check_rejected(statement text)
returns boolean
language plpgsql
as $$
begin
  execute statement;
  return false;
exception
  when check_violation then
    return true;
end;
$$;

select ok(
  exists (
    select 1
    from pg_attribute
    where attrelid = 'public.users'::regclass
      and attname = 'birth_utc_offset_minutes'
      and not attisdropped
  ),
  'users persists an optional DST-fold offset'
);

select ok(
  exists (
    select 1
    from pg_attribute
    where attrelid = 'public.charts'::regclass
      and attname = 'birth_utc_offset_minutes'
      and not attisdropped
  ),
  'charts persists an optional DST-fold offset'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.users'::regclass
      and conname = 'users_birth_utc_offset_minutes_check'
      and convalidated
  ),
  'users offset range constraint is validated'
);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.charts'::regclass
      and conname = 'charts_birth_utc_offset_minutes_check'
      and convalidated
  ),
  'charts offset range constraint is validated'
);

select ok(
  position(
    'birth_utc_offset_minutes' in pg_get_constraintdef(
      (
        select oid
        from pg_constraint
        where conrelid = 'public.charts'::regclass
          and conname = 'charts_unique_canonical_birth_identity'
      )
    )
  ) > 0,
  'canonical chart identity includes the fold offset'
);

insert into auth.users (id, email, raw_user_meta_data)
values
  (
    '30000000-0000-0000-0000-000000000003',
    'r2-user@example.invalid',
    jsonb_build_object(
      'birth_date', '2025-11-02',
      'birth_time', '01:30:00',
      'birth_utc_offset_minutes', -420,
      'time_zone', 'America/Los_Angeles'
    )
  ),
  (
    '40000000-0000-0000-0000-000000000004',
    'r2-invalid-offset@example.invalid',
    jsonb_build_object('birth_utc_offset_minutes', 900)
  );

select is(
  (
    select birth_utc_offset_minutes
    from public.users
    where id = '30000000-0000-0000-0000-000000000003'
  ),
  (-420)::smallint,
  'signup metadata preserves the selected fold offset'
);

select is(
  (
    select birth_utc_offset_minutes
    from public.users
    where id = '40000000-0000-0000-0000-000000000004'
  ),
  null::smallint,
  'invalid signup offset metadata is not persisted'
);

select ok(
  pg_temp.check_rejected($$update public.users
    set birth_utc_offset_minutes = 900
    where id = '30000000-0000-0000-0000-000000000003'$$),
  'users rejects an out-of-range offset'
);

select lives_ok(
  $$insert into public.charts
    (id, user_id, name, chart_data, birth_date, birth_time, time_zone,
     birth_utc_offset_minutes, birth_lat, birth_lon)
    values
    (96001, '30000000-0000-0000-0000-000000000003', 'Earlier', '{}'::jsonb,
     '2025-11-02', '01:30:00', 'America/Los_Angeles', -420, 34.05, -118.24),
    (96002, '30000000-0000-0000-0000-000000000003', 'Later', '{}'::jsonb,
     '2025-11-02', '01:30:00', 'America/Los_Angeles', -480, 34.05, -118.24)$$,
  'the two fold occurrences are distinct chart identities'
);

select ok(
  pg_temp.unique_rejected($$insert into public.charts
    (id, user_id, name, chart_data, birth_date, birth_time, time_zone,
     birth_utc_offset_minutes, birth_lat, birth_lon)
    values
    (96003, '30000000-0000-0000-0000-000000000003', 'Duplicate earlier', '{}'::jsonb,
     '2025-11-02', '01:30:00', 'America/Los_Angeles', -420, 34.05, -118.24)$$),
  'the same selected fold occurrence cannot be duplicated'
);

select lives_ok(
  $$insert into public.charts
    (id, user_id, name, chart_data, birth_date, birth_time, time_zone,
     birth_utc_offset_minutes, birth_lat, birth_lon)
    values
    (96004, '30000000-0000-0000-0000-000000000003', 'Legacy null', '{}'::jsonb,
     '1997-09-15', '13:55:00', 'America/Los_Angeles', null, 34.05, -118.24)$$,
  'legacy and unambiguous charts retain NULL offset identity'
);

select ok(
  pg_temp.unique_rejected($$insert into public.charts
    (id, user_id, name, chart_data, birth_date, birth_time, time_zone,
     birth_utc_offset_minutes, birth_lat, birth_lon)
    values
    (96005, '30000000-0000-0000-0000-000000000003', 'Duplicate null', '{}'::jsonb,
     '1997-09-15', '13:55:00', 'America/Los_Angeles', null, 34.05, -118.24)$$),
  'NULL offset remains not distinct in canonical chart identity'
);

select * from finish();
rollback;
