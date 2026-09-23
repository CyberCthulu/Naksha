begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

create function pg_temp.permission_rejected(statement text)
returns boolean
language plpgsql
as $$
begin
  execute statement;
  return false;
exception
  when insufficient_privilege then
    return true;
end;
$$;

create function pg_temp.fk_rejected(statement text)
returns boolean
language plpgsql
as $$
begin
  execute statement;
  return false;
exception
  when foreign_key_violation then
    return true;
end;
$$;

insert into auth.users (id, email, raw_user_meta_data)
values
  ('30000000-0000-0000-0000-000000000003', 'r3-user-a@example.invalid', '{}'::jsonb),
  ('40000000-0000-0000-0000-000000000004', 'r3-user-b@example.invalid', '{}'::jsonb);

insert into public.charts (
  id,
  user_id,
  name,
  chart_data,
  birth_date,
  birth_time,
  time_zone,
  birth_lat,
  birth_lon
)
values
  (96001, '30000000-0000-0000-0000-000000000003', 'A seeded chart', '{"owner":"A"}'::jsonb, '1990-01-01', '01:00', 'UTC', 10, 10),
  (96002, '40000000-0000-0000-0000-000000000004', 'B seeded chart', '{"owner":"B"}'::jsonb, '1990-01-02', '02:00', 'UTC', 20, 20);

insert into public.journals (
  id,
  user_id,
  chart_id,
  prompt_template,
  title,
  content,
  created_at
)
values
  (
    97001,
    '30000000-0000-0000-0000-000000000003',
    96001,
    'guidance.prompt.attention',
    'A original title',
    'A original content',
    '2026-09-01T12:00:00Z'
  ),
  (
    97002,
    '40000000-0000-0000-0000-000000000004',
    96002,
    'guidance.prompt.values',
    'B original title',
    'B original content',
    '2026-09-02T12:00:00Z'
  );

-- The grants expose only the columns needed by active PostgREST operations.
select ok(
  has_column_privilege('authenticated', 'public.journals', 'content', 'INSERT'),
  'authenticated may insert journal content'
);
select ok(
  has_column_privilege('authenticated', 'public.journals', 'content', 'UPDATE'),
  'authenticated may update journal content'
);
select ok(
  not has_column_privilege('authenticated', 'public.journals', 'id', 'INSERT'),
  'authenticated may not insert journal ids'
);
select ok(
  not has_column_privilege('authenticated', 'public.journals', 'id', 'UPDATE'),
  'authenticated may not update journal ids'
);
select ok(
  not has_column_privilege('authenticated', 'public.journals', 'user_id', 'UPDATE'),
  'authenticated may not update journal ownership'
);
select ok(
  has_sequence_privilege('authenticated', 'public.journals_id_seq', 'USAGE'),
  'authenticated may use the journal id sequence default'
);
select ok(
  not has_sequence_privilege('authenticated', 'public.journals_id_seq', 'UPDATE'),
  'authenticated cannot alter the journal id sequence'
);
select ok(
  not has_column_privilege('authenticated', 'public.charts', 'id', 'INSERT'),
  'authenticated may not insert chart ids'
);
select ok(
  not has_column_privilege('authenticated', 'public.charts', 'id', 'UPDATE'),
  'authenticated may not update chart ids'
);
select ok(
  has_sequence_privilege('authenticated', 'public.charts_id_seq', 'USAGE'),
  'authenticated may use the chart id sequence default'
);
select ok(
  not has_table_privilege('authenticated', 'public.usage_events', 'INSERT'),
  'authenticated has no usage_events insert privilege'
);
select ok(
  not has_table_privilege('authenticated', 'public.usage_events', 'UPDATE'),
  'authenticated has no usage_events update privilege'
);
select ok(
  not has_table_privilege('authenticated', 'public.usage_events', 'DELETE'),
  'authenticated has no usage_events delete privilege'
);
select ok(
  not has_sequence_privilege('authenticated', 'public.usage_events_id_seq', 'USAGE'),
  'authenticated has no usage_events sequence privilege'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '30000000-0000-0000-0000-000000000003',
  true
);

-- Journal operations execute as the real client database role.
select lives_ok(
  $$insert into public.journals (user_id, chart_id, title, content)
    values (
      '30000000-0000-0000-0000-000000000003',
      96001,
      'A default-id journal',
      'created without id'
    )$$,
  'authenticated normal journal insert without id succeeds'
);
select ok(
  exists (
    select 1
    from public.journals
    where user_id = '30000000-0000-0000-0000-000000000003'
      and title = 'A default-id journal'
      and id is not null
  ),
  'journal sequence/default assigns an id'
);
select ok(
  pg_temp.permission_rejected($$insert into public.journals
    (id, user_id, content)
    values (97999, '30000000-0000-0000-0000-000000000003', 'chosen id')$$),
  'authenticated explicit journal-id insert fails'
);
select ok(
  pg_temp.permission_rejected('update public.journals set id = 97998 where id = 97001'),
  'authenticated journal-id update fails'
);
select lives_ok(
  $$update public.journals
    set content = 'A content-only client edit'
    where id = 97001$$,
  'authenticated normal journal content update succeeds'
);
select ok(
  pg_temp.permission_rejected($$update public.journals
    set user_id = '40000000-0000-0000-0000-000000000004'
    where id = 97001$$),
  'authenticated journal owner manipulation fails'
);
select lives_ok(
  $$update public.journals
    set content = 'attempted cross-user overwrite'
    where id = 97002$$,
  'RLS safely filters an attempted update of another user journal'
);

-- Active chart inserts and the existing canonical-identity upsert remain valid.
select lives_ok(
  $$insert into public.charts (
      user_id, name, chart_data, birth_date, birth_time, time_zone,
      birth_utc_offset_minutes, birth_lat, birth_lon
    ) values (
      '30000000-0000-0000-0000-000000000003',
      'A default-id chart',
      '{"version":1}'::jsonb,
      '1991-03-04',
      '05:06',
      'UTC',
      null,
      30,
      30
    )$$,
  'authenticated normal chart insert without id succeeds'
);
select ok(
  exists (
    select 1
    from public.charts
    where user_id = '30000000-0000-0000-0000-000000000003'
      and name = 'A default-id chart'
      and id is not null
  ),
  'chart sequence/default assigns an id'
);
select ok(
  pg_temp.permission_rejected($$insert into public.charts
    (id, user_id, name, chart_data)
    values (
      96999,
      '30000000-0000-0000-0000-000000000003',
      'chosen id',
      '{}'::jsonb
    )$$),
  'authenticated explicit chart-id insert fails'
);
select ok(
  pg_temp.permission_rejected('update public.charts set id = 96998 where id = 96001'),
  'authenticated chart-id update fails'
);
select lives_ok(
  $$update public.charts
    set name = 'A permitted chart update', chart_data = '{"version":2}'::jsonb
    where id = 96001$$,
  'authenticated normal chart update succeeds'
);
select ok(
  pg_temp.permission_rejected($$update public.charts
    set user_id = '40000000-0000-0000-0000-000000000004'
    where id = 96001$$),
  'chart RLS prevents ownership transfer despite upsert-compatible user_id grant'
);
select lives_ok(
  $$insert into public.charts (
      user_id, name, chart_data, birth_date, birth_time, time_zone,
      birth_utc_offset_minutes, birth_lat, birth_lon
    ) values (
      '30000000-0000-0000-0000-000000000003',
      'A upserted chart',
      '{"version":3}'::jsonb,
      '1991-03-04',
      '05:06',
      'UTC',
      null,
      30,
      30
    )
    on conflict (
      user_id, birth_date, birth_time, time_zone,
      birth_utc_offset_minutes, birth_lat, birth_lon
    )
    do update set
      user_id = excluded.user_id,
      name = excluded.name,
      chart_data = excluded.chart_data,
      birth_date = excluded.birth_date,
      birth_time = excluded.birth_time,
      time_zone = excluded.time_zone,
      birth_utc_offset_minutes = excluded.birth_utc_offset_minutes,
      birth_lat = excluded.birth_lat,
      birth_lon = excluded.birth_lon$$,
  'authenticated canonical chart upsert remains available'
);
select ok(
  pg_temp.fk_rejected($$insert into public.journals
    (user_id, chart_id, content)
    values (
      '30000000-0000-0000-0000-000000000003',
      96002,
      'cross-owner reference'
    )$$),
  'R1 same-owner journal constraint remains enforced'
);
select ok(
  pg_temp.permission_rejected($$insert into public.usage_events
    (user_id, event_type, metadata)
    values (
      '30000000-0000-0000-0000-000000000003',
      'client-write',
      '{}'::jsonb
    )$$),
  'authenticated usage_events insert fails'
);

reset role;

-- Verify effects that user A's RLS view intentionally cannot observe.
select is(
  (select content from public.journals where id = 97001),
  'A content-only client edit'::text,
  'content-only edit changed journal content'
);
select is(
  (select chart_id from public.journals where id = 97001),
  96001,
  'content-only edit preserved journal chart_id'
);
select is(
  (select title from public.journals where id = 97001),
  'A original title'::text,
  'content-only edit preserved journal title'
);
select is(
  (select prompt_template::text from public.journals where id = 97001),
  'guidance.prompt.attention'::text,
  'content-only edit preserved journal prompt_template'
);
select is(
  (select created_at from public.journals where id = 97001),
  '2026-09-01T12:00:00Z'::timestamptz,
  'content-only edit preserved journal created_at'
);
select is(
  (select user_id from public.journals where id = 97001),
  '30000000-0000-0000-0000-000000000003'::uuid,
  'content-only edit preserved journal user_id'
);
select is(
  (select content from public.journals where id = 97002),
  'B original content'::text,
  'User A cannot update User B journal'
);
select is(
  (
    select name::text
    from public.charts
    where user_id = '30000000-0000-0000-0000-000000000003'
      and birth_date = '1991-03-04'
      and birth_time = '05:06'
      and time_zone = 'UTC'
      and birth_utc_offset_minutes is null
      and birth_lat = 30
      and birth_lon = 30
  ),
  'A upserted chart'::text,
  'canonical chart upsert updated the existing identity'
);

-- service_role retains backend writes, including explicit IDs and cleanup.
set local role service_role;
select lives_ok(
  $$insert into public.charts (id, user_id, name, chart_data)
    values (
      96999,
      '30000000-0000-0000-0000-000000000003',
      'service chart',
      '{}'::jsonb
    )$$,
  'service_role may insert an explicit chart id'
);
select lives_ok(
  $$insert into public.journals (id, user_id, chart_id, content)
    values (
      97999,
      '30000000-0000-0000-0000-000000000003',
      96999,
      'service journal'
    )$$,
  'service_role may insert an explicit journal id'
);
select lives_ok(
  $$insert into public.usage_events (id, user_id, event_type, metadata)
    values (
      98999,
      '30000000-0000-0000-0000-000000000003',
      'service-write',
      '{"source":"backend"}'::jsonb
    )$$,
  'service_role may write usage_events'
);
select lives_ok(
  $$do $delete_account$
  begin
    delete from public.messages
      where user_id = '30000000-0000-0000-0000-000000000003';
    delete from public.conversations
      where user_id = '30000000-0000-0000-0000-000000000003';
    delete from public.reports
      where user_id = '30000000-0000-0000-0000-000000000003';
    delete from public.journals
      where user_id = '30000000-0000-0000-0000-000000000003';
    delete from public.notifications
      where user_id = '30000000-0000-0000-0000-000000000003';
    delete from public.purchases
      where user_id = '30000000-0000-0000-0000-000000000003';
    delete from public.subscriptions
      where user_id = '30000000-0000-0000-0000-000000000003';
    delete from public.usage_events
      where user_id = '30000000-0000-0000-0000-000000000003';
    delete from public.charts
      where user_id = '30000000-0000-0000-0000-000000000003';
  end
  $delete_account$;$$,
  'service_role account-deletion table order remains valid'
);

reset role;

select is(
  (select count(*) from public.journals
    where user_id = '30000000-0000-0000-0000-000000000003'),
  0::bigint,
  'service cleanup removed User A journals'
);
select is(
  (select count(*) from public.charts
    where user_id = '30000000-0000-0000-0000-000000000003'),
  0::bigint,
  'service cleanup removed User A charts'
);
select is(
  (select count(*) from public.usage_events
    where user_id = '30000000-0000-0000-0000-000000000003'),
  0::bigint,
  'service cleanup removed User A usage events'
);
select is(
  (select content from public.journals where id = 97002),
  'B original content'::text,
  'service cleanup left User B journal untouched'
);
select is(
  (select name::text from public.charts where id = 96002),
  'B seeded chart'::text,
  'service cleanup left User B chart untouched'
);

select * from finish();
rollback;
