begin;

-- Stop before changing constraints if historical rows are orphaned or point at
-- a parent owned by another user. The migration is intentionally non-repairing:
-- production data must be inspected and resolved through a separately reviewed
-- process before this migration is applied.
do $$
declare
  invalid_conversations bigint;
  invalid_journals bigint;
  invalid_reports bigint;
  invalid_messages bigint;
begin
  select count(*)
    into invalid_conversations
    from public.conversations as child
    left join public.charts as parent on parent.id = child.chart_id
   where child.chart_id is not null
     and (parent.id is null or child.user_id is distinct from parent.user_id);

  select count(*)
    into invalid_journals
    from public.journals as child
    left join public.charts as parent on parent.id = child.chart_id
   where child.chart_id is not null
     and (parent.id is null or child.user_id is distinct from parent.user_id);

  select count(*)
    into invalid_reports
    from public.reports as child
    left join public.charts as parent on parent.id = child.chart_id
   where child.chart_id is not null
     and (parent.id is null or child.user_id is distinct from parent.user_id);

  select count(*)
    into invalid_messages
    from public.messages as child
    left join public.conversations as parent
      on parent.id = child.conversation_id
   where parent.id is null
      or child.user_id is distinct from parent.user_id;

  if invalid_conversations > 0
     or invalid_journals > 0
     or invalid_reports > 0
     or invalid_messages > 0 then
    raise exception using
      errcode = '23514',
      message = format(
        'R1 ownership preflight failed: conversations=%s journals=%s reports=%s messages=%s',
        invalid_conversations,
        invalid_journals,
        invalid_reports,
        invalid_messages
      ),
      hint = 'Inspect and resolve invalid relationships before retrying; this migration does not mutate legacy rows.';
  end if;
end;
$$;

-- Composite foreign keys need an exact unique key on each parent. The existing
-- primary keys still remain the canonical single-column identifiers.
alter table public.charts
  add constraint charts_id_user_id_key unique (id, user_id);

alter table public.conversations
  add constraint conversations_id_user_id_key unique (id, user_id);

-- MATCH SIMPLE preserves optional parent references. PostgreSQL 17's column
-- list on SET NULL is deliberate: deleting a chart clears only chart_id and
-- never attempts to clear a child row's non-null user_id.
alter table public.conversations
  add constraint conversations_chart_owner_fkey
  foreign key (chart_id, user_id)
  references public.charts (id, user_id)
  on delete set null (chart_id);

alter table public.journals
  add constraint journals_chart_owner_fkey
  foreign key (chart_id, user_id)
  references public.charts (id, user_id)
  on delete set null (chart_id);

alter table public.reports
  add constraint reports_chart_owner_fkey
  foreign key (chart_id, user_id)
  references public.charts (id, user_id)
  on delete set null (chart_id);

alter table public.messages
  add constraint messages_conversation_owner_fkey
  foreign key (conversation_id, user_id)
  references public.conversations (id, user_id);

-- The composite constraints subsume the parent-id-only foreign keys. User-id
-- foreign keys remain in place so every child owner must still exist.
alter table public.conversations
  drop constraint conversations_chart_id_fkey;

alter table public.journals
  drop constraint journals_chart_id_fkey;

alter table public.reports
  drop constraint reports_chart_id_fkey;

alter table public.messages
  drop constraint messages_conversation_id_fkey;

-- Conversations, messages, and reports have no active client implementation.
-- Remove their client write surface while retaining SELECT isolation and all
-- service_role privileges used by server-side account deletion.
drop policy if exists "Insert own conversations" on public.conversations;
drop policy if exists "Update own conversations" on public.conversations;
drop policy if exists "Delete own conversations" on public.conversations;

drop policy if exists "Insert own messages" on public.messages;
drop policy if exists "Update own messages" on public.messages;
drop policy if exists "Delete own messages" on public.messages;

drop policy if exists "Insert own reports" on public.reports;

revoke insert, update, delete, truncate, references, trigger
  on table public.conversations, public.messages, public.reports
  from anon, authenticated;

revoke usage, select, update
  on sequence public.conversations_id_seq,
              public.messages_id_seq,
              public.reports_id_seq
  from anon, authenticated;

comment on constraint conversations_chart_owner_fkey on public.conversations
  is 'A conversation may reference only a chart owned by the same user; chart deletion clears only chart_id.';

comment on constraint journals_chart_owner_fkey on public.journals
  is 'A journal may reference only a chart owned by the same user; chart deletion clears only chart_id.';

comment on constraint reports_chart_owner_fkey on public.reports
  is 'A report may reference only a chart owned by the same user; chart deletion clears only chart_id.';

comment on constraint messages_conversation_owner_fkey on public.messages
  is 'A message may reference only a conversation owned by the same user.';

commit;
