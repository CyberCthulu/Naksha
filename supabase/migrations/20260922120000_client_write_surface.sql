-- Table-level INSERT/UPDATE grants override column-level restrictions. Remove
-- them before granting only the columns active clients are allowed to write.
revoke insert, update on table public.journals from anon, authenticated;

grant insert (
  user_id,
  chart_id,
  prompt_template,
  title,
  content
) on table public.journals to authenticated;

grant update (
  chart_id,
  prompt_template,
  title,
  content
) on table public.journals to authenticated;

revoke insert, update on table public.charts from anon, authenticated;

grant insert (
  user_id,
  name,
  chart_data,
  birth_date,
  birth_time,
  time_zone,
  birth_utc_offset_minutes,
  birth_lat,
  birth_lon
) on table public.charts to authenticated;

-- saveChart uses INSERT ... ON CONFLICT DO UPDATE. PostgreSQL checks UPDATE
-- privilege for every conflict-assignment column, including user_id from the
-- insert payload. Existing RLS still requires both the old and resulting row
-- to belong to auth.uid(), so this grant cannot transfer chart ownership.
grant update (
  user_id,
  name,
  chart_data,
  birth_date,
  birth_time,
  time_zone,
  birth_utc_offset_minutes,
  birth_lat,
  birth_lon
) on table public.charts to authenticated;

-- Active inserts need nextval(), not direct sequence inspection or setval().
revoke all on sequence public.journals_id_seq, public.charts_id_seq
  from anon, authenticated;
grant usage on sequence public.journals_id_seq, public.charts_id_seq
  to authenticated;

-- usage_events has no V1 client call sites. Close the unused write sink while
-- preserving service_role access for backend cleanup and future reviewed use.
drop policy if exists "Insert own usage events" on public.usage_events;
revoke insert, update, delete on table public.usage_events
  from anon, authenticated;
revoke all on sequence public.usage_events_id_seq from anon, authenticated;
