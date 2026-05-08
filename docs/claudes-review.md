# Claude's Architectural Review — Naksha Codebase

Generated: 2026-05-07 (updated after schema review pass)
Reviewer: Claude (Sonnet 4.6) — senior staff engineer architectural review
Scope: read-only inspection. No code was modified.
Source: `client/` source code + `supabase/migrations/20260508015720_remote_schema.sql`
Verification: `cd client && npx tsc --noEmit` passes.

---

## Pass 1: Frontend-Only Review

*(Summary from prior pass — see findings detail in Pass 2 below)*

Naksha is a mobile-first astrology app (Expo / React Native / TypeScript / Supabase). Auth, chart generation, saved charts, journal entries, and local lexicon-based interpretation all work. Unstable areas: coordinate lifecycle on profile edit, implicit post-verification navigation, chart save semantics, and preferences that are saved but never applied.

---

## Pass 2: Backend/Frontend Consistency Review

The migration file makes several implicit contracts visible for the first time. Several findings from Pass 1 are now confirmed or sharpened with concrete SQL evidence. New critical issues are below.

---

## 1. Highest-Risk Architectural Inconsistencies

### 1.1 — Two contradictory unique constraints on `charts` (CRITICAL)

```sql
-- migration line 444–450
CONSTRAINT "charts_unique_user_dt_tz" UNIQUE ("user_id", "birth_date", "birth_time", "time_zone")
CONSTRAINT "charts_user_birth_unique" UNIQUE ("user_id", "birth_date", "birth_time", "time_zone", "birth_lat", "birth_lon")
```

These two constraints are contradictory and create a silent data mutation bug.

`saveChart` in `lib/charts.ts:113` issues:
```sql
INSERT INTO charts (...) ON CONFLICT (user_id, birth_date, birth_time, time_zone) DO UPDATE SET ...
```

This targets `charts_unique_user_dt_tz` (4 columns). Because that 4-column constraint always fires before the 5-column one on any potential conflict, `charts_user_birth_unique` is **unreachable as a conflict target**. It can never cause a conflict that the upsert doesn't already catch first. It maintains a second B-tree index with zero added uniqueness guarantee.

The real consequence: **the database enforces at most one chart per user per birth date/time/timezone, regardless of location.** A user who enters birth data for "San Francisco" and later corrects it to "New York" will not get a second row — the existing row is silently updated with the new lat/lon on the next save. The 5-column constraint was intended to allow multiple locations but the 4-column constraint prevents it.

Impact on `useChartData.ts:144–164`: The hook queries with lat/lon filters against a table where lat/lon can never distinguish two rows for the same date/time/tz. If a user updated their location and the hook queries with the new coordinates, it will find no match (the existing row has old coordinates), recompute the chart, and trigger another upsert — which silently overwrites the row with new coordinates. This recomputation is unnecessary and produces a chart whose `chart_data.meta` disagrees with the row's top-level `birth_lat`/`birth_lon` during the gap.

**Resolution required**: Drop `charts_user_birth_unique`. Decide: does location change mean a new chart row or an update of the existing one? Document and enforce one rule.

---

### 1.2 — `handle_new_user` trigger omits `birth_lat` and `birth_lon` (HIGH)

```sql
-- migration line 48–87
CREATE OR REPLACE FUNCTION "public"."handle_new_user"() ...
  insert into public.users (
    id, email, first_name, last_name, birth_date, birth_time, birth_location, time_zone, ...
  )
  values (
    new.id, new.email,
    nullif(new.raw_user_meta_data->>'first_name',''), ...
    -- birth_lat and birth_lon are NOT here
  )
```

When a user signs up, Supabase fires this trigger immediately on `auth.users` INSERT. The trigger creates the `public.users` row with all profile fields except coordinates. The frontend then relies on `CheckEmailScreen` to upsert coordinates after OTP verification.

The critical gap: if the user verifies via the **email link** (deep link → `AuthCallbackScreen`) instead of via OTP entry in `CheckEmailScreen`, the `CheckEmailScreen` upsert never runs. The user lands on `DashboardScreen` with a `users` row that has no `birth_lat`/`birth_lon`. `DashboardScreen`'s `needsProfileCompletion` check does not include coordinates, so it does not trigger a merge or redirect to `CompleteProfile`. The user proceeds with no coordinates → no Ascendant → no house cusps → chart shows planets only.

There is no recovery path for this unless the user manually opens "Edit Birth Details."

**Resolution required**: Add `birth_lat` and `birth_lon` to the trigger. Update the ON CONFLICT DO UPDATE to include them with `coalesce(excluded.birth_lat, public.users.birth_lat)` — same pattern as the other fields.

---

### 1.3 — `handle_new_user` casts raw metadata without error handling (MEDIUM)

```sql
nullif(new.raw_user_meta_data->>'birth_date','')::date,
nullif(new.raw_user_meta_data->>'birth_time','')::time,
```

These CAST operations run inside a SECURITY DEFINER trigger with no exception block. If `signup` is called with a malformed `birth_date` (e.g., `"birth_date": "not-a-date"`) — whether by accident, a future API caller, or a malicious client — the CAST raises a Postgres exception. This aborts the `auth.users` INSERT. The account is not created. Supabase returns a cryptic 500 error to the client.

This is a potential signup-blocking attack surface. Any client that can craft a signup request with invalid metadata can prevent legitimate signups from completing for that email address.

**Resolution required**: Wrap the casts in an exception block and fall back to NULL on cast failure, or validate metadata on the client before passing it.

---

### 1.4 — `purchases` INSERT policy allows clients to self-insert purchase records (HIGH SECURITY)

```sql
CREATE POLICY "Insert own purchases" ON "public"."purchases" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));
```

Any authenticated user can run:
```sql
INSERT INTO purchases (user_id, product_type, product_id, amount, currency)
VALUES (auth.uid(), 'premium', 'com.naksha.premium', 0.01, 'USD');
```

This gives every user the ability to write arbitrary purchase records to their own account. If `ProfileScreen` or any future feature gates content based on purchase rows, this is a direct privilege escalation. Purchases must only be written by a trusted backend (server-side webhook from your payment provider). The INSERT policy should be removed and replaced with a service-role-only insert.

---

### 1.5 — `enable_confirmations = false` in local dev config (MEDIUM)

```toml
# config.toml line 225
enable_confirmations = false
```

Email confirmation is disabled in the local Supabase config. In local dev, users sign up and immediately receive a session with no email verification step. The entire `CheckEmailScreen` → OTP → profile upsert flow is untestable locally. Bugs in that flow (like the coordinate gap in §1.2) will only surface in production or staging. This is a testing blind spot by configuration.

**Resolution required**: Set `enable_confirmations = true` in `config.toml` for local dev. Add a local SMTP sink (Inbucket is already configured at port 54324 — it just needs email confirmations enabled to receive them).

---

## 2. Backend/Frontend Contract Mismatches

### 2.1 — `users.email` is `NOT NULL` in DB; frontend treats it as `string | null`

```sql
-- migration line 386
"email" character varying(100) NOT NULL
```

Every frontend upsert path uses:
```ts
{ id: user.id, email: user.email ?? null }
```

If `user.email` is null (edge case with some external auth providers), this sends NULL to a NOT NULL column and throws a Postgres constraint violation. The TypeScript types (`email: string | null`) explicitly model this as possible, but the DB does not allow it.

Additionally, `VARCHAR(100)` caps at 100 characters. RFC 5321 allows email addresses up to 254 characters. Long email addresses from legitimate users could silently fail insertion.

---

### 2.2 — `users.birth_time` is Postgres `time` type; frontend sends `HH:MM:SS` strings

```sql
"birth_time" time without time zone
```

`formatTimeForDb` in `lib/time.ts` formats time as `HH:MM` (hours and minutes only). The Postgres `time` type accepts `HH:MM` and stores it as `HH:MM:00`. The `handle_new_user` trigger casts `raw_user_meta_data->>'birth_time'` to `time`. When the frontend reads `birth_time` back from Supabase, it receives `HH:MM:SS` (the full time format). The frontend then parses this by splitting on `:` in `CompleteProfileScreen.tsx:110–115` — this correctly handles the trailing `:00` seconds. But `formatShortTimeFromHHMM` in `DashboardScreen` only handles `HH:MM` format — it may display incorrectly if the stored value is ever `HH:MM:SS`.

---

### 2.3 — `saveChart`'s `onConflict` target does not match the `charts_user_birth_unique` constraint columns

```ts
// lib/charts.ts:113
onConflict: 'user_id,birth_date,birth_time,time_zone'
```

This targets the 4-column constraint. The 5-column constraint `charts_user_birth_unique` cannot be used as an `onConflict` target by the frontend because Supabase JS `.upsert()` requires you to specify column names, not constraint names. If the intent was for the 5-column constraint to be the upsert identity, the frontend is wrong. If the intent was the 4-column constraint, the 5-column constraint is unnecessary. The two constraints represent two different (incompatible) product decisions in the same table.

---

### 2.4 — `DashboardScreen` chart lookup omits lat/lon; `useChartData` includes them; neither matches the DB's 4-column uniqueness

Three paths query `charts` with different column sets for the same semantic operation ("find this user's chart"):

| Caller | Query columns |
|---|---|
| `DashboardScreen.tsx:177–184` | `user_id, birth_date, birth_time, time_zone` |
| `useChartData.ts:144–164` | `user_id, birth_date, birth_time, time_zone, birth_lat, birth_lon` |
| DB unique constraint | `user_id, birth_date, birth_time, time_zone` (the enforced one) |

The DB guarantees one row per 4-column tuple. `useChartData` queries 6 columns — which means it can return 0 rows for an existing chart if the user's coordinates changed since the chart was saved, causing a spurious recompute + overwrite cycle. Dashboard uses 4 columns — which is correct per the actual DB constraint. The hook's 6-column query is the inconsistency.

---

### 2.5 — `subscriptions` frontend type missing `created_at` but query orders by it

```ts
// ProfileScreen.tsx
type SubscriptionRow = {
  id: number; user_id: string; plan: string; status: string;
  start_date: string; end_date: string | null;
  // created_at is NOT here
}
```

The DB has `"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP` on `subscriptions`. `ProfileScreen` orders by `created_at` in its Supabase query. The query works at runtime because Supabase returns the column regardless of the TypeScript type, but any frontend code that accesses `row.created_at` on a `SubscriptionRow` is a TypeScript error that the type silently misses.

---

### 2.6 — `journals` FK to `charts` is nullable, but `JournalEditorScreen` may set `chart_id`

```sql
"chart_id" integer,  -- nullable FK to charts
```

The frontend can write journal entries linked to a chart. If that chart is later deleted via `deleteChart`, the journal row becomes an orphan (FK not enforced on delete, no ON DELETE behavior defined). `journals.chart_id` will hold a foreign key value pointing to a non-existent chart row. The FK constraint exists but there's no `ON DELETE SET NULL` or `ON DELETE CASCADE` — Postgres will block the chart deletion with a FK violation error.

---

### 2.7 — `conversations` and `messages` tables exist in DB but have zero frontend implementation

The schema has fully defined `conversations` and `messages` tables with FK constraints, PKs, sequences, RLS policies, and grants. The frontend has `lib/conversations.ts` which is a stub (empty). `ChatScreen.tsx` is an empty file. This is the most complete "ghost feature" in the repo — the DB is ready, the frontend is not started.

---

## 3. Security / RLS Concerns

### 3.1 — Purchases INSERT by client is a privilege escalation risk

Covered in §1.4. The "Insert own purchases" policy on `purchases` must be removed. Purchases should only be written by a trusted backend service using the service role.

---

### 3.2 — No UPDATE policy on `subscriptions` from the client

Subscriptions have only a SELECT policy. Users cannot modify their own subscription rows from the client, which is correct — subscription state should be managed by a backend service. This is the right design. Confirm the service role (payment webhook) writes subscriptions via the service role key, not the anon key.

---

### 3.3 — `usage_events.user_id` is nullable, but the INSERT RLS policy requires `user_id = auth.uid()`

```sql
"user_id" "uuid"  -- nullable in schema
CREATE POLICY "Insert own usage events" ON "public"."usage_events" FOR INSERT WITH CHECK (("user_id" = "auth"."uid"()));
```

Anonymous (unauthenticated) usage events cannot be inserted from the client because the RLS check requires a matching auth UID. But the column allows NULL, implying anonymous events were intended. The schema allows what RLS forbids. Decide: either require authentication for usage events (add NOT NULL to `user_id`) or allow anonymous events by using a separate policy or bypassing via service role.

---

### 3.4 — `handle_new_user` is granted EXECUTE to `anon` and `authenticated`

```sql
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
```

Trigger functions should not be directly callable by client roles. While Supabase's PostgREST layer won't expose this function as an RPC endpoint by default (it has no `security definer` RPC designation), the EXECUTE grant is unnecessary and widens the privilege surface. Revoke EXECUTE from `anon` and `authenticated`; keep only `service_role`.

---

### 3.5 — RLS is enabled but `SET row_security = off` at the top of the migration

```sql
-- migration line 13
SET row_security = off;
```

This disables RLS for the duration of the migration session. This is standard Supabase migration practice (it allows the DDL statements to run without hitting RLS). It does NOT affect the live database's RLS enforcement for clients. But if this migration is ever replayed incorrectly in a live production connection, it could temporarily expose all rows. This is a standard pattern but worth understanding.

---

### 3.6 — No INSERT policy on `notifications` for clients

Notifications can only be selected by clients (SELECT policy exists), not inserted. This is correct: notifications should be created server-side. But there's also no DELETE policy for clients — users cannot dismiss/clear their own notifications from the client. The UPDATE policy "Update read status" allows marking as read, but deletion is not possible. This may be intentional (audit trail) but should be confirmed.

---

## 4. Data Consistency Concerns

### 4.1 — `users.updated_at` and `charts.updated_at` never auto-update

```sql
-- Only journals has the trigger:
CREATE OR REPLACE TRIGGER "journals_set_updated_at"
  BEFORE UPDATE ON "public"."journals"
  FOR EACH ROW EXECUTE FUNCTION "public"."set_updated_at"();
```

`users` and `charts` both have `updated_at` columns with `DEFAULT CURRENT_TIMESTAMP`. The `set_updated_at()` function exists but is only triggered on `journals`. When `CompleteProfileScreen` calls `.update({...}).eq('id', user.id)` on `users`, `updated_at` is NOT updated automatically. When `saveChart` upserts a chart row, `updated_at` stays frozen at the original insert time.

The `handle_new_user` ON CONFLICT clause does manually set `updated_at = now()`, but only for the auth-trigger upsert path — not for any subsequent user profile updates.

---

### 4.2 — `charts` timestamps are `WITHOUT TIME ZONE`; `journals` are `WITH TIME ZONE`

```sql
-- charts
"created_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP
"updated_at" timestamp without time zone DEFAULT CURRENT_TIMESTAMP

-- journals
"created_at" timestamp with time zone DEFAULT "now"()
"updated_at" timestamp with time zone DEFAULT "now"()
```

`listCharts` sorts by `created_at`. Without timezone info, ordering is correct only if the DB server timezone stays fixed (Supabase hosted is UTC — fine for now, but not guaranteed). All timestamps should use `TIMESTAMP WITH TIME ZONE` for consistency and correctness. The mismatch also means the `ChartRow.created_at` type on the frontend (`string | null`) might parse differently than `JournalRow.created_at` depending on how Supabase serializes the two types.

---

### 4.3 — Deleting a chart orphans journal entries (FK violation blocks deletion)

```sql
ALTER TABLE ONLY "public"."journals"
    ADD CONSTRAINT "journals_chart_id_fkey" FOREIGN KEY ("chart_id") REFERENCES "public"."charts"("id");
```

No `ON DELETE` behavior is specified. Postgres defaults to `RESTRICT`. If a user tries to delete a chart that has linked journal entries, the database will throw a FK violation and the deletion will fail. `MyCharts.tsx` calls `deleteChart` which issues a simple DELETE — it will silently fail (the Supabase client returns an error) if journals exist for that chart. The same applies to `conversations` → `charts` and `reports` → `charts`.

The frontend likely shows no error to the user in this case (needs verification), but the chart row stays in the table.

---

### 4.4 — Profile data lives in three places with no single source of truth

After a full auth + verification + profile save cycle, profile data exists in:

1. `auth.raw_user_meta_data` — written by `signUpWithEmail` and `supabase.auth.updateUser`
2. `public.users` — written by `handle_new_user` trigger (subset: no lat/lon), `CheckEmailScreen` upsert, `CompleteProfileScreen` update, `DashboardScreen` merge upsert
3. `client-side state` — React state in each screen, not persisted between sessions

The trigger reads from (1) to populate (2) at signup. But (1) and (2) can subsequently diverge:
- `ProfileScreen` updates (1) for preferences but not (2) for profile fields.
- `CompleteProfileScreen` updates both (1) and (2) on save.
- `DashboardScreen` merges (1) → (2) only if (2) is incomplete.

There is no reconciliation in the (2) → (1) direction (except in `CompleteProfileScreen`). If a user's `users` row is manually corrected in the Supabase dashboard, auth metadata won't reflect it.

---

### 4.5 — `useChartData` can recompute and overwrite a chart with different metadata than what was previously saved

When `useChartData` runs its 6-column query and finds no match (because coordinates changed), it calls `buildChartData` and then `saveChart`. The new `buildChartData` call uses the current `profile` params from the route. But `saveChart` upserts on `(user_id, birth_date, birth_time, time_zone)` — so it UPDATES the existing row's `chart_data`, `birth_lat`, and `birth_lon` with values derived from the new coordinates. The old `chart_data` (with old house data) is overwritten without any user confirmation or warning.

---

## 5. Recommended Next Infrastructure Improvements

**Priority order:**

1. **Drop `charts_user_birth_unique`** — it's dead weight. Pick the 4-column constraint as the single identity and document it. This is a single `DROP CONSTRAINT` migration.

2. **Add `birth_lat`/`birth_lon` to `handle_new_user` trigger** — prevents the coordinate gap for email-link verifiers. One migration, low risk.

3. **Remove `purchases` INSERT client policy** — create a service-role-only insert path (Edge Function or server-side webhook). Until a backend exists, add a comment making the intent explicit and remove the client INSERT policy to prevent abuse.

4. **Set `enable_confirmations = true` in `config.toml`** — makes local dev test the actual verification flow. Zero-risk config change.

5. **Add `ON DELETE SET NULL` to `journals.chart_id`, `conversations.chart_id`, `reports.chart_id`** — prevents chart deletion from silently failing. Migration needed.

6. **Add `updated_at` trigger to `users` and `charts`** — one trigger definition, two `CREATE TRIGGER` statements. Makes `updated_at` trustworthy.

7. **Add NOT NULL to `usage_events.user_id`** — align schema intent with RLS. Or add an anonymous INSERT policy and decide whether anonymous tracking is a feature.

---

## 6. Recommended Next Schema Cleanup Tasks

1. **Normalize timestamps to `TIMESTAMP WITH TIME ZONE`** across `charts`, `users`, `conversations`, `messages`, `notifications`, `purchases`, `reports`, `subscriptions`, `usage_events`. Only `journals` is currently correct.

2. **Add explicit indexes on FK columns** that are used in queries but not covered by a unique constraint:
   - `journals(user_id)` — used in every journal list query
   - `conversations(user_id)` — will be used by ChatScreen
   - `messages(conversation_id)` — used in message fetch
   - `messages(user_id)` — used in RLS evaluation

3. **Add `handle_new_user` trigger error handling** — wrap the metadata casts in a `BEGIN ... EXCEPTION WHEN others THEN NULL END` block so a bad cast falls back to NULL rather than blocking account creation.

4. **Add `profile_complete` boolean or equivalent to `users`** — replaces the scattered runtime `needsProfileCompletion` checks. The DB can enforce a computed column or a trigger that sets this flag when all required fields are non-null.

5. **Tighten `users.email` to match realistic constraints** — consider `VARCHAR(254)` per RFC 5321, or move to `TEXT` with a CHECK constraint.

6. **Revoke EXECUTE on `handle_new_user` from `anon` and `authenticated`** — only `service_role` and `postgres` should be able to invoke a SECURITY DEFINER trigger function.

7. **Add `CHECK` constraint on `subscriptions.status`** — constrain to known values (`active`, `canceled`, `past_due`, `trialing`). Currently any string is valid.

8. **Add `CHECK` constraint on `charts.name`** — `VARCHAR(100) NOT NULL` but no minimum length or content check. An empty string is currently valid.

---

## 7. Suggested Long-Term Backend Direction

**Move chart generation server-side**

All chart math currently runs in the React Native client (`lib/astro.ts`). This works for a single-user mobile app, but:
- Calculation results depend on the client's device clock and locale for timezone normalization.
- Updating calculation logic (e.g., switching to Swiss Ephemeris) requires an app store release.
- Server-side generation would allow re-generating charts on profile change without requiring the app to be open.

A Supabase Edge Function (`supabase/functions/generate-chart`) that accepts birth data and returns `ChartData` would decouple calculation from the client and make chart data reproducible.

**Move purchases to a server-side webhook**

Payment providers (RevenueCat, Stripe, Apple IAP) should POST to a Supabase Edge Function or a standalone webhook that writes to `purchases` and `subscriptions` using the service role. The current client INSERT policy on `purchases` must be removed before any purchase-gated content ships.

**Introduce a `chart_preferences` table**

Chart preferences (house system, zodiac type, orb mode) currently live in `auth.user_metadata`. This creates a read path that requires a JWT round-trip on every preference read. A `chart_preferences` table with `user_id PK` would:
- Be readable via standard Supabase query with RLS
- Be writable without touching auth metadata
- Allow server-side chart generation to read preferences without JWT parsing

**Introduce `schema_version` or use Supabase's migration timestamp convention**

There is one migration file named `20260508015720_remote_schema.sql`. This is a full schema dump, not an incremental migration. Future changes should be incremental migrations (`20260510_add_profile_complete.sql`, etc.) so the history is auditable and rollbacks are possible.

**Add an Edge Function for usage event ingestion**

`usage_events` was designed for analytics. Rather than letting clients write directly to the table (with RLS), an Edge Function endpoint (authenticated or anonymous) can validate, enrich, and batch-insert events. This also allows adding server-side context (IP, user agent, feature flags) that the client cannot forge.

---

## Summary Tables

### Schema vs Frontend Mismatches

| # | DB reality | Frontend assumption | Risk |
|---|---|---|---|
| 1 | One chart per user/date/time/tz (4-col unique dominates) | Lat/lon can distinguish two chart rows | Spurious recompute, silent coordinate overwrite |
| 2 | `handle_new_user` omits lat/lon | Coordinates always in `users` after signup | No houses for email-link verifiers |
| 3 | `users.email NOT NULL VARCHAR(100)` | `email: string \| null` | Potential constraint violation |
| 4 | `journals.chart_id` FK has no ON DELETE | Chart delete succeeds silently | Delete fails with FK error; user sees no feedback |
| 5 | `subscriptions.created_at` exists | `SubscriptionRow` type omits it | TypeScript blind spot on `order by created_at` |
| 6 | `charts` uses `timestamp WITHOUT TIME ZONE` | Treated as comparable to `journals` timestamps | Inconsistent serialization across tables |

### RLS Gap Summary

| Table | Missing policy | Risk |
|---|---|---|
| `purchases` | Should NOT have client INSERT | Privilege escalation — users can self-insert purchases |
| `notifications` | No client DELETE | Users cannot clear their own notifications |
| `subscriptions` | No UPDATE/DELETE | Correct — but confirm payment backend uses service role |
| `usage_events` | INSERT requires auth UID but column allows NULL | Schema intent (anonymous events) contradicts RLS |

### Missing DB Infrastructure

| Gap | Tables affected | Fix |
|---|---|---|
| No `updated_at` trigger | `users`, `charts` | Add `BEFORE UPDATE` trigger using existing `set_updated_at()` |
| No FK index | `journals(user_id)`, `conversations(user_id)`, `messages(conversation_id)` | Add `CREATE INDEX` |
| No ON DELETE behavior | `journals→charts`, `conversations→charts`, `reports→charts` | Add `ON DELETE SET NULL` |
| Timestamps inconsistency | `charts`, `users`, `notifications`, etc. | Migrate to `TIMESTAMP WITH TIME ZONE` |
| `enable_confirmations = false` | Local dev only | Set to `true` in `config.toml` |

---

## Agent Instructions for Schema Work

- Schema changes must be **incremental migrations** in `supabase/migrations/` — never edit the `_remote_schema.sql` dump directly.
- Naming convention: `YYYYMMDDHHMMSS_short_description.sql`
- Run `supabase db diff` before and after any schema change to verify intent.
- Every new migration must be tested locally with `supabase db reset` before pushing.
- Do not drop or rename columns without first removing all frontend references. Supabase PostgREST does not warn on unused columns — it will silently omit them from responses.
- Do not add columns to `users` without updating `handle_new_user` trigger to handle them (both INSERT and ON CONFLICT DO UPDATE paths).
- The anon key is a public key — never rely on it for security. All security must be enforced at the RLS level.
