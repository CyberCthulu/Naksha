-- Android V1 reads subscription and purchase status but has no direct client
-- write path for these tables or notifications. Keep reads governed by the
-- existing owner-scoped RLS policies and reserve every mutation for backend
-- service code.
drop policy if exists "Update read status" on public.notifications;

revoke insert, update, delete
  on table public.notifications,
           public.subscriptions,
           public.purchases
  from anon, authenticated;

-- Client roles cannot create rows, so they do not need defaults backed by
-- these sequences. service_role privileges remain unchanged.
revoke all
  on sequence public.notifications_id_seq,
              public.subscriptions_id_seq,
              public.purchases_id_seq
  from anon, authenticated;
