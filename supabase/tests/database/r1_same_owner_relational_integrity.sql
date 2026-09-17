begin;

create extension if not exists pgtap with schema extensions;
set local search_path = public, extensions;

select no_plan();

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

create function pg_temp.not_null_rejected(statement text)
returns boolean
language plpgsql
as $$
begin
  execute statement;
  return false;
exception
  when not_null_violation then
    return true;
end;
$$;

create function pg_temp.write_rejected(statement text)
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

insert into auth.users (id, email, raw_user_meta_data)
values
  ('10000000-0000-0000-0000-000000000001', 'r1-user-a@example.invalid', '{}'::jsonb),
  ('20000000-0000-0000-0000-000000000002', 'r1-user-b@example.invalid', '{}'::jsonb);

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
  (91001, '10000000-0000-0000-0000-000000000001', 'A primary', '{}'::jsonb, '2000-01-01', '01:00', 'UTC', 1, 1),
  (91002, '20000000-0000-0000-0000-000000000002', 'B primary', '{}'::jsonb, '2000-01-02', '02:00', 'UTC', 2, 2),
  (91003, '10000000-0000-0000-0000-000000000001', 'A journal delete', '{}'::jsonb, '2000-01-03', '03:00', 'UTC', 3, 3),
  (91004, '20000000-0000-0000-0000-000000000002', 'B isolation delete', '{}'::jsonb, '2000-01-04', '04:00', 'UTC', 4, 4),
  (91005, '10000000-0000-0000-0000-000000000001', 'A conversation delete', '{}'::jsonb, '2000-01-05', '05:00', 'UTC', 5, 5),
  (91006, '10000000-0000-0000-0000-000000000001', 'A report delete', '{}'::jsonb, '2000-01-06', '06:00', 'UTC', 6, 6);

select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.conversations'::regclass
      and conname = 'conversations_chart_owner_fkey'
  ),
  'conversation-to-chart ownership constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.journals'::regclass
      and conname = 'journals_chart_owner_fkey'
  ),
  'journal-to-chart ownership constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.reports'::regclass
      and conname = 'reports_chart_owner_fkey'
  ),
  'report-to-chart ownership constraint exists'
);
select ok(
  exists (
    select 1
    from pg_constraint
    where conrelid = 'public.messages'::regclass
      and conname = 'messages_conversation_owner_fkey'
  ),
  'message-to-conversation ownership constraint exists'
);

-- Neither client role needs elevated table privileges. Check the complete
-- current application-table set so partial privilege hardening is visible.
select ok(
  not exists (
    select 1
    from unnest(array[
      'public.chart_preferences', 'public.charts', 'public.conversations',
      'public.journals', 'public.messages', 'public.notifications',
      'public.purchases', 'public.reports', 'public.subscriptions',
      'public.usage_events', 'public.users'
    ]) as application_table(name)
    where has_table_privilege('anon', name, 'TRUNCATE')
  ),
  'anon has no TRUNCATE privilege on application tables'
);
select ok(
  not exists (
    select 1
    from unnest(array[
      'public.chart_preferences', 'public.charts', 'public.conversations',
      'public.journals', 'public.messages', 'public.notifications',
      'public.purchases', 'public.reports', 'public.subscriptions',
      'public.usage_events', 'public.users'
    ]) as application_table(name)
    where has_table_privilege('authenticated', name, 'TRUNCATE')
  ),
  'authenticated has no TRUNCATE privilege on application tables'
);
select ok(
  not exists (
    select 1
    from unnest(array[
      'public.chart_preferences', 'public.charts', 'public.conversations',
      'public.journals', 'public.messages', 'public.notifications',
      'public.purchases', 'public.reports', 'public.subscriptions',
      'public.usage_events', 'public.users'
    ]) as application_table(name)
    where has_table_privilege('anon', name, 'REFERENCES')
  ),
  'anon has no REFERENCES privilege on application tables'
);
select ok(
  not exists (
    select 1
    from unnest(array[
      'public.chart_preferences', 'public.charts', 'public.conversations',
      'public.journals', 'public.messages', 'public.notifications',
      'public.purchases', 'public.reports', 'public.subscriptions',
      'public.usage_events', 'public.users'
    ]) as application_table(name)
    where has_table_privilege('authenticated', name, 'REFERENCES')
  ),
  'authenticated has no REFERENCES privilege on application tables'
);
select ok(
  not exists (
    select 1
    from unnest(array[
      'public.chart_preferences', 'public.charts', 'public.conversations',
      'public.journals', 'public.messages', 'public.notifications',
      'public.purchases', 'public.reports', 'public.subscriptions',
      'public.usage_events', 'public.users'
    ]) as application_table(name)
    where has_table_privilege('anon', name, 'TRIGGER')
  ),
  'anon has no TRIGGER privilege on application tables'
);
select ok(
  not exists (
    select 1
    from unnest(array[
      'public.chart_preferences', 'public.charts', 'public.conversations',
      'public.journals', 'public.messages', 'public.notifications',
      'public.purchases', 'public.reports', 'public.subscriptions',
      'public.usage_events', 'public.users'
    ]) as application_table(name)
    where has_table_privilege('authenticated', name, 'TRIGGER')
  ),
  'authenticated has no TRIGGER privilege on application tables'
);

-- conversations(chart_id, user_id) -> charts(id, user_id)
select lives_ok(
  $$insert into public.conversations (id, user_id, chart_id, title)
    values (92001, '10000000-0000-0000-0000-000000000001', 91001, 'A own chart')$$,
  'conversation A -> chart A succeeds'
);
select ok(
  pg_temp.fk_rejected($$insert into public.conversations (id, user_id, chart_id)
    values (92002, '10000000-0000-0000-0000-000000000001', 91002)$$),
  'conversation A -> chart B fails on insert'
);
select ok(
  pg_temp.fk_rejected($$insert into public.conversations (id, user_id, chart_id)
    values (92003, '20000000-0000-0000-0000-000000000002', 91001)$$),
  'conversation B -> chart A fails on insert'
);
select ok(
  pg_temp.fk_rejected('update public.conversations set chart_id = 91002 where id = 92001'),
  'conversation A cannot update to chart B'
);
select ok(
  pg_temp.fk_rejected($$update public.conversations
    set user_id = '20000000-0000-0000-0000-000000000002'
    where id = 92001$$),
  'conversation owner-only manipulation cannot bypass ownership'
);
select lives_ok(
  $$update public.conversations set title = 'A valid update' where id = 92001$$,
  'valid same-owner conversation update succeeds'
);
select lives_ok(
  $$insert into public.conversations (id, user_id, chart_id, title)
    values (92004, '10000000-0000-0000-0000-000000000001', null, 'No chart')$$,
  'conversation NULL chart remains valid'
);
select lives_ok(
  $$insert into public.conversations (id, user_id, chart_id, title)
    values (92005, '10000000-0000-0000-0000-000000000001', 91005, 'Survives chart delete')$$,
  'conversation for chart-deletion test is valid'
);
select lives_ok(
  'delete from public.charts where id = 91005',
  'user A can delete a chart referenced by a conversation'
);
select is(
  (select chart_id from public.conversations where id = 92005),
  null::integer,
  'chart deletion clears only conversation.chart_id'
);
select is(
  (select user_id from public.conversations where id = 92005),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'chart deletion preserves conversation.user_id'
);

-- journals(chart_id, user_id) -> charts(id, user_id)
select lives_ok(
  $$insert into public.journals (id, user_id, chart_id, content)
    values (93001, '10000000-0000-0000-0000-000000000001', 91001, 'A own chart')$$,
  'journal A -> chart A succeeds'
);
select lives_ok(
  $$insert into public.journals (id, user_id, chart_id, content)
    values (93002, '20000000-0000-0000-0000-000000000002', 91002, 'B own chart')$$,
  'journal B -> chart B succeeds'
);
select ok(
  pg_temp.fk_rejected($$insert into public.journals (id, user_id, chart_id, content)
    values (93003, '10000000-0000-0000-0000-000000000001', 91002, 'invalid')$$),
  'journal A -> chart B fails on insert'
);
select ok(
  pg_temp.fk_rejected($$insert into public.journals (id, user_id, chart_id, content)
    values (93004, '20000000-0000-0000-0000-000000000002', 91001, 'invalid')$$),
  'journal B -> chart A fails on insert'
);
select ok(
  pg_temp.fk_rejected('update public.journals set chart_id = 91002 where id = 93001'),
  'journal A cannot update to chart B'
);
select ok(
  pg_temp.fk_rejected($$update public.journals
    set user_id = '20000000-0000-0000-0000-000000000002'
    where id = 93001$$),
  'journal owner-only manipulation cannot bypass ownership'
);
select lives_ok(
  $$update public.journals set content = 'A valid update' where id = 93001$$,
  'valid same-owner journal update succeeds'
);
select lives_ok(
  $$insert into public.journals (id, user_id, chart_id, content)
    values (93005, '10000000-0000-0000-0000-000000000001', null, 'No chart')$$,
  'journal NULL chart remains valid'
);
select lives_ok(
  $$insert into public.journals (id, user_id, chart_id, content)
    values (93006, '10000000-0000-0000-0000-000000000001', 91003, 'Survives chart delete')$$,
  'journal for chart-deletion test is valid'
);
select lives_ok(
  'delete from public.charts where id = 91003',
  'user A can delete a chart referenced by a journal'
);
select is(
  (select chart_id from public.journals where id = 93006),
  null::integer,
  'chart deletion clears only journal.chart_id'
);
select is(
  (select user_id from public.journals where id = 93006),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'chart deletion preserves journal.user_id'
);
select is(
  (select content from public.journals where id = 93002),
  'B own chart'::text,
  'chart deletion leaves the other user journal untouched'
);

-- reports(chart_id, user_id) -> charts(id, user_id)
select lives_ok(
  $$insert into public.reports (id, user_id, chart_id, report_type, report_data)
    values (94001, '10000000-0000-0000-0000-000000000001', 91001, 'test', '{}'::jsonb)$$,
  'report A -> chart A succeeds'
);
select ok(
  pg_temp.fk_rejected($$insert into public.reports (id, user_id, chart_id, report_type, report_data)
    values (94002, '10000000-0000-0000-0000-000000000001', 91002, 'test', '{}'::jsonb)$$),
  'report A -> chart B fails on insert'
);
select ok(
  pg_temp.fk_rejected($$insert into public.reports (id, user_id, chart_id, report_type, report_data)
    values (94003, '20000000-0000-0000-0000-000000000002', 91001, 'test', '{}'::jsonb)$$),
  'report B -> chart A fails on insert'
);
select ok(
  pg_temp.fk_rejected('update public.reports set chart_id = 91002 where id = 94001'),
  'report A cannot update to chart B'
);
select ok(
  pg_temp.fk_rejected($$update public.reports
    set user_id = '20000000-0000-0000-0000-000000000002'
    where id = 94001$$),
  'report owner-only manipulation cannot bypass ownership'
);
select lives_ok(
  $$update public.reports set report_type = 'updated' where id = 94001$$,
  'valid same-owner report update succeeds'
);
select lives_ok(
  $$insert into public.reports (id, user_id, chart_id, report_type, report_data)
    values (94004, '10000000-0000-0000-0000-000000000001', null, 'test', '{}'::jsonb)$$,
  'report NULL chart remains valid'
);
select lives_ok(
  $$insert into public.reports (id, user_id, chart_id, report_type, report_data)
    values (94005, '10000000-0000-0000-0000-000000000001', 91006, 'test', '{}'::jsonb)$$,
  'report for chart-deletion test is valid'
);
select lives_ok(
  'delete from public.charts where id = 91006',
  'user A can delete a chart referenced by a report'
);
select is(
  (select chart_id from public.reports where id = 94005),
  null::integer,
  'chart deletion clears only report.chart_id'
);
select is(
  (select user_id from public.reports where id = 94005),
  '10000000-0000-0000-0000-000000000001'::uuid,
  'chart deletion preserves report.user_id'
);

-- messages(conversation_id, user_id) -> conversations(id, user_id)
insert into public.conversations (id, user_id, chart_id, title)
values
  (92101, '10000000-0000-0000-0000-000000000001', null, 'A messages'),
  (92102, '20000000-0000-0000-0000-000000000002', null, 'B messages'),
  (92103, '20000000-0000-0000-0000-000000000002', null, 'B isolation delete');

select lives_ok(
  $$insert into public.messages (id, user_id, conversation_id, sender, content)
    values (95001, '10000000-0000-0000-0000-000000000001', 92101, 'user', 'A own conversation')$$,
  'message A -> conversation A succeeds'
);
select lives_ok(
  $$insert into public.messages (id, user_id, conversation_id, sender, content)
    values (95002, '20000000-0000-0000-0000-000000000002', 92102, 'user', 'B own conversation')$$,
  'message B -> conversation B succeeds'
);
select ok(
  pg_temp.fk_rejected($$insert into public.messages (id, user_id, conversation_id, sender, content)
    values (95003, '10000000-0000-0000-0000-000000000001', 92102, 'user', 'invalid')$$),
  'message A -> conversation B fails on insert'
);
select ok(
  pg_temp.fk_rejected($$insert into public.messages (id, user_id, conversation_id, sender, content)
    values (95004, '20000000-0000-0000-0000-000000000002', 92101, 'user', 'invalid')$$),
  'message B -> conversation A fails on insert'
);
select ok(
  pg_temp.fk_rejected('update public.messages set conversation_id = 92102 where id = 95001'),
  'message A cannot update to conversation B'
);
select ok(
  pg_temp.fk_rejected($$update public.messages
    set user_id = '20000000-0000-0000-0000-000000000002'
    where id = 95001$$),
  'message owner-only manipulation cannot bypass ownership'
);
select lives_ok(
  $$update public.messages set content = 'A valid update' where id = 95001$$,
  'valid same-owner message update succeeds'
);
select ok(
  pg_temp.not_null_rejected($$insert into public.messages
    (id, user_id, conversation_id, sender, content)
    values (95005, '10000000-0000-0000-0000-000000000001', null, 'user', 'invalid')$$),
  'message conversation remains required'
);
select ok(
  pg_temp.fk_rejected('delete from public.conversations where id = 92101'),
  'message preserves existing NO ACTION conversation-delete behavior'
);
select lives_ok(
  'delete from public.conversations where id = 92103',
  'failed cross-owner message cannot block the other owner conversation deletion'
);
select is(
  (select content from public.messages where id = 95001),
  'A valid update'::text,
  'deleting the other user conversation leaves user A message untouched'
);

-- A failed cross-owner child cannot block deletion of the intended parent.
select lives_ok(
  'delete from public.charts where id = 91004',
  'failed cross-owner chart references cannot block user B chart deletion'
);
select is(
  (select title::text from public.conversations where id = 92001),
  'A valid update'::text,
  'deleting user B chart leaves user A conversation untouched'
);

-- Client authorization remains separate from relational validity. Journals
-- retain their active write policies; owner transfer is rejected by WITH CHECK.
set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '10000000-0000-0000-0000-000000000001',
  true
);
select ok(
  pg_temp.fk_rejected($$insert into public.journals (id, user_id, chart_id, content)
    values (93901, '10000000-0000-0000-0000-000000000001', 91002, 'blocked')$$),
  'authenticated user A cannot insert an A-owned journal referencing user B chart'
);
select ok(
  pg_temp.write_rejected('truncate table public.journals'),
  'authenticated cannot TRUNCATE journals'
);
select ok(
  pg_temp.write_rejected($$update public.journals
    set user_id = '20000000-0000-0000-0000-000000000002', chart_id = 91002
    where id = 93001$$),
  'journal RLS prevents changing both owner and parent to another user'
);
select lives_ok(
  $$update public.journals set content = 'A authenticated update' where id = 93001$$,
  'journal RLS permits a valid same-owner update'
);
select ok(
  pg_temp.write_rejected($$insert into public.conversations (id, user_id, chart_id)
    values (92901, '10000000-0000-0000-0000-000000000001', 91002)$$),
  'authenticated user A cannot create a dormant conversation referencing user B chart'
);
select ok(
  pg_temp.write_rejected($$insert into public.messages (id, user_id, conversation_id, sender, content)
    values (95901, '10000000-0000-0000-0000-000000000001', 92101, 'user', 'blocked')$$),
  'authenticated client cannot write dormant messages'
);
select ok(
  pg_temp.write_rejected($$insert into public.reports (id, user_id, chart_id, report_type, report_data)
    values (94901, '10000000-0000-0000-0000-000000000001', 91001, 'blocked', '{}'::jsonb)$$),
  'authenticated client cannot write dormant reports'
);
reset role;

-- Match the delete-account function's dependency order. Composite ownership
-- constraints must not obstruct valid same-owner cleanup.
select lives_ok(
  $$do $delete_account$
  begin
    delete from public.messages
      where user_id = '10000000-0000-0000-0000-000000000001';
    delete from public.conversations
      where user_id = '10000000-0000-0000-0000-000000000001';
    delete from public.reports
      where user_id = '10000000-0000-0000-0000-000000000001';
    delete from public.journals
      where user_id = '10000000-0000-0000-0000-000000000001';
    delete from public.charts
      where user_id = '10000000-0000-0000-0000-000000000001';
    delete from auth.users
      where id = '10000000-0000-0000-0000-000000000001';
  end
  $delete_account$;$$,
  'account-deletion dependency order succeeds for user A'
);
select is(
  (select count(*) from public.charts
    where user_id = '10000000-0000-0000-0000-000000000001'),
  0::bigint,
  'account deletion removes user A charts'
);
select is(
  (select count(*) from auth.users
    where id = '10000000-0000-0000-0000-000000000001'),
  0::bigint,
  'account deletion removes user A auth record'
);
select is(
  (select count(*) from public.users
    where id = '10000000-0000-0000-0000-000000000001'),
  0::bigint,
  'account deletion cascades to user A public profile'
);
select is(
  (select count(*) from public.charts
    where user_id = '20000000-0000-0000-0000-000000000002'),
  1::bigint,
  'account deletion leaves user B chart untouched'
);
select is(
  (select count(*) from auth.users
    where id = '20000000-0000-0000-0000-000000000002'),
  1::bigint,
  'account deletion leaves user B auth record untouched'
);
select is(
  (select count(*)
     from public.messages as child
     join public.conversations as parent on parent.id = child.conversation_id
    where child.user_id is distinct from parent.user_id),
  0::bigint,
  'no cross-owner message relationships exist after account deletion'
);

select * from finish();
rollback;
