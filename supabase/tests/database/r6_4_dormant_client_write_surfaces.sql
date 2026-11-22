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

insert into auth.users (id, email, raw_user_meta_data)
values ('60000000-0000-0000-0000-000000000006', 'r6-user@example.invalid', '{}'::jsonb);

insert into public.notifications (id, user_id, type, message)
values (99601, '60000000-0000-0000-0000-000000000006', 'test', 'test notification');

insert into public.purchases (
  id, user_id, product_type, product_id, amount, currency
)
values (
  99602, '60000000-0000-0000-0000-000000000006',
  'test', 'test-product', 1.00, 'USD'
);

insert into public.subscriptions (
  id, user_id, plan, status, start_date
)
values (
  99603, '60000000-0000-0000-0000-000000000006',
  'test', 'active', '2026-09-30'
);

select ok(
  not has_table_privilege(client_role, format('public.%I', table_name), privilege),
  format('%s cannot %s public.%s', client_role, lower(privilege), table_name)
)
from (values ('anon'), ('authenticated')) as roles(client_role)
cross join (values ('notifications'), ('purchases'), ('subscriptions')) as tables(table_name)
cross join (values ('INSERT'), ('UPDATE'), ('DELETE')) as privileges(privilege);

select ok(
  not has_sequence_privilege(client_role, format('public.%I_id_seq', table_name), 'USAGE'),
  format('%s cannot use public.%s_id_seq', client_role, table_name)
)
from (values ('anon'), ('authenticated')) as roles(client_role)
cross join (values ('notifications'), ('purchases'), ('subscriptions')) as tables(table_name);

select is(
  (
    select count(*)::integer
    from pg_policies
    where schemaname = 'public'
      and tablename = 'notifications'
      and policyname = 'Update read status'
  ),
  0,
  'the dormant notification update policy is absent'
);

set local role authenticated;
select set_config(
  'request.jwt.claim.sub',
  '60000000-0000-0000-0000-000000000006',
  true
);

select is(
  (select count(*) from public.notifications),
  1::bigint,
  'authenticated owner can still read notifications'
);
select is(
  (select count(*) from public.purchases),
  1::bigint,
  'authenticated owner can still read purchases'
);
select is(
  (select count(*) from public.subscriptions),
  1::bigint,
  'authenticated owner can still read subscriptions'
);

select ok(
  pg_temp.permission_rejected($$update public.notifications set is_read = true where id = 99601$$),
  'authenticated cannot update notifications'
);
select ok(
  pg_temp.permission_rejected($$insert into public.purchases
    (user_id, product_type, product_id, amount, currency)
    values (
      '60000000-0000-0000-0000-000000000006',
      'test', 'client-product', 2.00, 'USD'
    )$$),
  'authenticated cannot insert purchases'
);
select ok(
  pg_temp.permission_rejected($$delete from public.subscriptions where id = 99603$$),
  'authenticated cannot delete subscriptions'
);

reset role;

select ok(
  has_table_privilege('service_role', format('public.%I', table_name), privilege),
  format('service_role retains %s on public.%s', lower(privilege), table_name)
)
from (values ('notifications'), ('purchases'), ('subscriptions')) as tables(table_name)
cross join (values ('INSERT'), ('UPDATE'), ('DELETE')) as privileges(privilege);

select ok(
  has_sequence_privilege('service_role', format('public.%I_id_seq', table_name), 'USAGE'),
  format('service_role retains public.%s_id_seq usage', table_name)
)
from (values ('notifications'), ('purchases'), ('subscriptions')) as tables(table_name);

set local role service_role;
select lives_ok(
  $$do $service_writes$
  begin
    update public.notifications set is_read = true where id = 99601;
    update public.purchases set amount = 2.00 where id = 99602;
    update public.subscriptions set status = 'cancelled' where id = 99603;
    delete from public.notifications where id = 99601;
    delete from public.purchases where id = 99602;
    delete from public.subscriptions where id = 99603;
  end
  $service_writes$;$$,
  'service_role retains required backend update and delete behavior'
);
reset role;

select * from finish();
rollback;
