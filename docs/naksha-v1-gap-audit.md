# Naksha V1 Launch Gap Audit

Generated: 2026-06-20
Author: Claude (Opus) — read-only product gap audit
Scope: `docs/Feature-List.md` (claimed product) vs. actual codebase reality.
Method: direct inspection of `client/`, `supabase/`, package manifests, and the existing handoff/review docs. Stub files were opened and byte-counted; claims were not taken on trust.

Verification baseline at audit time: `npm run typecheck`, `npm test` (19 suites / 106 tests), `npm run lint`, and `git diff --check` pass.

---

## Update (2026-06-28) — Naksha Forecast + Guidance Library v1 shipped

**This audit is preserved as written on 2026-06-20 for historical context, but several of its findings are now superseded.** Since this audit, the "Naksha Forecast + Guidance Library v1" plan (`docs/naksha-forecast-guidance-library-plan-claude.md`) was implemented as five reviewed slices (all APPROVE, all committed):

- A deterministic guidance-lexicon content layer (`client/lib/lexicon/guidance/`): transit-planet, natal-target, aspect-dynamic, sign, and house guidance, plus reflection-prompt and suggested-practice libraries.
- A deterministic `DailyGuidance` builder (`client/lib/guidance/dailyGuidance.ts`) — mood / Watch for / opportunity / transit summary / reflection prompt / suggested practice — now rendered on the Dashboard, replacing the old raw three-field Today's Energy card.
- A deterministic `WeeklyForecast` builder (`client/lib/guidance/weeklyForecast.ts`) — Monday-Sunday local week, local-noon DST-safe snapshots, seven daily themes, bounded strongest-transit highlights/weekly themes/prompts/practices — now rendered on the Dashboard via a new `WeeklyForecastCard`.

Current verification baseline: `npm run typecheck`, `npm test` (**22 suites / 129 tests**), `npm run lint`, and `git diff --check` all pass.

**What this changes below:** "Today's Energy" (§3 row 7, §4) moves from PARTIAL to DONE for the deterministic V1 scope. "Weekly forecast" (§3 row 8, §4, §6, §10) moves from MISSING/deferred to DONE — it is no longer an acceptable deferral, it shipped. "Shadow work" (§3 row 12, §4) moves from MISSING to **PARTIAL FOUNDATION** — the reflection-prompt and suggested-practice primitives it would need now exist and are already surfaced through daily/weekly guidance, but there is still no dedicated shadow-work prompt builder, screen, or milestone-tracking workflow. None of the AI/notifications/subscriptions/reports/synastry/data-export/telemetry/CI findings below have changed — those remain exactly as MISSING/PARTIAL/SCAFFOLD ONLY as originally audited. **Do not read this update as AI, notifications, saved guidance history, or multi-system astrology being implemented — none of those changed.** Specific stale lines are annotated in place below rather than silently rewritten.

---

## 1. Executive Summary

**The shipped app and the original V1 feature list were two very different products as of 2026-06-20.** `docs/Feature-List.md` listed AI-powered guidance (GPT-4o chat), smart prompt routing, daily AI guidance, saved AI conversations, weekly forecasts, push notifications, and shadow-work prompts/practices/milestones **inside the "MVP Feature Set (V1.0 Launch)" section**. At that time, none of those existed in the codebase — not partially, not as scaffolding with logic. `ChatScreen.tsx`, `SubscriptionScreen.tsx`, and `lib/{conversations,notifications,reports,subscriptions,usage}.ts` were all **0-byte files**, and there was no LLM dependency anywhere in the repo. **As of 2026-06-28, this is no longer true for daily/weekly guidance specifically** — see the update block above. AI chat, push notifications, and shadow work as a dedicated feature are still 0% implemented; that part of this paragraph still holds.

What **is** built is solid and genuinely usable: a complete email/password auth lifecycle (signup, OTP verify, login, password reset, account deletion with a deployed and QA'd Edge Function), a real natal chart engine (planets, aspects, whole-sign houses), an interactive SVG chart wheel with lexicon-based interpretation, saved charts, one-off guest charts, full journaling (create/edit/delete/list), and — as of 2026-06-28 — a deterministic daily guidance card and weekly forecast (superseding the basic "Today's Energy" transit card described as built in the original 2026-06-20 audit).

**The single most important finding (2026-06-20, still largely true):** if "V1" means the Feature-List MVP as written, the app is **not close** — its headline differentiator (AI astrologer chat) is 0% implemented. If "V1" means "the strong astrology + journaling app that actually exists" (which, as of 2026-06-28, now includes deterministic daily/weekly guidance), it is **near-launchable** with a handful of real gaps (data export stub, no analytics, no crash/error visibility, no CI). The most valuable next action is still a **product decision to pick one of those two definitions**, because they imply completely different amounts of remaining work (weeks vs. months).

This audit recommends **descoping V1 to the built product** and moving AI chat, notifications, and a dedicated shadow-work workflow to a clearly-labeled post-MVP track. *(Weekly forecasts removed from this list on 2026-06-28 — they shipped deterministically and are part of the built product now.)*

---

## 2. Current App Reality (Plain English)

A user can:

- Sign up with email/password, verify via OTP/email link, and log in. Sessions persist via AsyncStorage.
- Complete a profile (name, birth date/time, location with OpenCage geocoding, timezone) stored durably in `public.users`.
- Reset a forgotten password (Login → Forgot Password → email → reset), implemented and manually verified.
- Delete their account from Profile — a deployed `delete-account` Edge Function removes app-owned rows then the auth user; manually QA'd against a disposable account.
- Generate a natal chart from birth data: planetary longitudes, aspects (medium orb), whole-sign houses when coordinates exist.
- View an interactive SVG chart wheel plus list views of placements, houses, and aspects, with paged lexicon interpretations (planet-in-sign, planet-in-house, house, aspect).
- Save their own chart and re-open/delete it from "My Charts."
- Create a one-off guest chart for another person (no persistence/labels).
- **[Updated 2026-06-28]** See structured "Today's Energy" guidance on the Dashboard — mood, "Watch for," opportunity, transit summary, a reflection prompt, and a suggested practice, all deterministically derived from the day's transits (`DailyGuidance`, superseding the old basic three-field card described below in the original 2026-06-20 audit).
- **[Updated 2026-06-28]** See a Dashboard Weekly Forecast — week range, weekly themes, strongest transit highlights, journal prompts, and suggested practices for the current Monday-Sunday local week (`WeeklyForecast`), with a clean fallback when no personal transit is emphasized.
- *(2026-06-20 original finding, now superseded by the two bullets above)* See a basic "Today's Energy" card on the Dashboard (transit Sun/Moon sign + single strongest fast transit-to-natal aspect).
- Write, edit, delete, and list journal entries.
- Set chart preferences in the UI (house system / zodiac / orb), though only Whole Sign / Tropical / medium are actually supported.

A user **cannot** do anything involving AI, chat, notifications, subscriptions/purchases, reports, a dedicated shadow-work workflow, data export, sharing, or compatibility/synastry — those are absent or empty stubs. (Daily and weekly forecasts moved out of this list on 2026-06-28 — see the update block above.)

---

## 3. Feature-List Claims vs. Codebase Reality

| # | Feature-List claim (MVP unless noted) | Evidence in repo | Reality |
|---|---|---|---|
| 1 | Email/password auth + JWT sessions | `lib/auth.ts`, `LoginScreen`, `SignupScreen`, `CheckEmailScreen`, `lib/supabase.ts` | **DONE** |
| 1 | Edit profile (name/DOB/TOB/location/tz) | `CompleteProfileScreen`, `ProfileScreen`, `lib/geocode.ts`, `public.users` | **DONE** |
| 1 | Store preferences (notifications, chart style, zodiac) | `chart_preferences` table + `ChartPreferencesCard`; **notification prefs absent** | **PARTIAL** — chart prefs only; notification preferences do not exist |
| 2 | Password reset | `ForgotPasswordScreen`, `ResetPasswordScreen`, `authCallbackUrl.ts` | **DONE** (manually verified) |
| 2 | Account deletion | `accountDeletion.ts`, `supabase/functions/delete-account/`, deployed + QA'd | **DONE** |
| 3 | Natal chart engine | `lib/astro.ts`, `lib/charts.ts`, `astronomy-engine`, `luxon` | **DONE** (Whole Sign/Tropical/medium only) |
| 4 | Chart wheel + interpretation UX | `components/charts/*` (wheel, lists, `InterpretationModal`, `InterpretationCard`), `lib/lexicon/*` | **DONE** |
| 5 | Saved charts / history | `MyCharts.tsx`, `useChartData.ts`, `charts` table | **DONE** for save/open/delete; **no tag/favorite, no archive-by-topic** |
| 5 | Save and **label** charts, multiple charts | `charts.name` column exists; multiple rows supported | **PARTIAL** — multiple charts yes; explicit labeling UX is thin |
| 6 | Multiple charts / second chart (partner) | `CreateGuestChartScreen` (one-off), `chartMode: 'guest'` | **PARTIAL** — one-off guest chart only; no saved guest profiles, no relationship labels |
| 7 | "Today's Energy" dashboard (mood/warning/opportunity) | `lib/dailyTransits.ts` + `lib/guidance/dailyGuidance.ts` + `lib/lexicon/guidance/*` + `TodayEnergyCard.tsx` | **DONE for deterministic V1** *(updated 2026-06-28 — was PARTIAL)* — mood, "Watch for," opportunity, transit summary, reflection prompt, and suggested practice are all implemented and rendered; not AI-generated |
| 7 | Personalized daily horoscope (Sun/Moon/Rising) | `dailyTransits.ts` (transit-to-natal) + `dailyGuidance.ts` | **PARTIAL** — structured deterministic guidance now exists (see row above); still not a written-prose horoscope and Rising sign is not incorporated |
| 8 | Weekly forecast | `lib/guidance/weeklyForecast.ts`, `WeeklyForecastCard.tsx` | **DONE for deterministic Dashboard V1** *(updated 2026-06-28 — was MISSING)* — Monday-Sunday local week, local-noon DST-safe snapshots, seven daily themes, bounded strongest-transit highlights/weekly themes/prompts/practices, no-aspect fallback; no dedicated weekly screen, no notifications, no saved history |
| 9 | Ask-Astrologer AI chat (GPT-4o) | `ChatScreen.tsx` = **0 bytes**, `lib/conversations.ts` = **0 bytes**, no LLM SDK | **MISSING** |
| 9 | Smart prompt routing / AI daily guidance / transit interpretation by AI | none | **MISSING** |
| 10 | Save/revisit AI conversations | `conversations`/`messages` tables exist; `lib/conversations.ts` = 0 bytes; no UI | **SCAFFOLD ONLY** (DB only) |
| 11 | Journaling (write reflections) | `lib/journals.ts` (78L), `JournalListScreen` (226L), `JournalEditorScreen` (232L), `journals` table | **DONE** |
| 11 | Journal responds to AI prompts; tag/favorite readings | no AI prompts; no tag/favorite | **MISSING** (the AI-linked part) |
| 12 | Shadow work prompts/practices/milestones | `lib/lexicon/guidance/reflectionPrompts.ts`, `practices.ts` exist; no dedicated shadow-work screen/workflow | **PARTIAL FOUNDATION** *(updated 2026-06-28 — was MISSING)* — the reflection-prompt/suggested-practice primitives a shadow-work feature would need now exist and are already surfaced through daily/weekly guidance; no dedicated shadow-work prompt builder, screen, introspection cycle, or milestone tracking exists |
| 13 | Push notifications (forecasts/retrogrades/eclipses) | `notifications` table only; `lib/notifications.ts` = 0 bytes; no `expo-notifications` dep | **MISSING** |
| 14 | Subscription tiers / purchases / cosmetics | `SubscriptionScreen.tsx` = 0 bytes; `lib/subscriptions.ts` = 0 bytes; `SubscriptionCard`/`PurchasesCard` display-only; no IAP SDK | **SCAFFOLD ONLY** |
| 15 | Reports (deep natal, transit timeline) | `lib/reports.ts` = 0 bytes; `reports` table only | **MISSING** (post-MVP per list) |
| 16 | Data export | `ProfileScreen` "Export my data" = stub alert → contact support | **MISSING** |
| 16 | Account/data deletion | deployed + QA'd | **DONE** |
| 16 | Retention policy / billing cancellation/refunds | none | **MISSING** |
| 17 | Analytics / usage metrics | `usage_events` table only; no client writes; no analytics SDK | **MISSING** |
| 18 | Admin tools / bug reports / error logs | none | **MISSING** |
| 19 | CI / schema validation | local `typecheck`/`test`/`lint` pass; no CI workflow; manual `db diff`/`reset` | **PARTIAL** |
| 20 | App Store / privacy / production readiness | account deletion deployed; no privacy policy doc, store assets unevaluated, no crash reporting | **PARTIAL** |

---

## 4. Feature Gap Matrix

| Category | Classification | Blocks V1 (built-product definition)? |
|---|---|---|
| User auth & profiles | DONE | — |
| Password reset & account deletion | DONE | — |
| Natal chart engine | DONE | — |
| Chart wheel & interpretation UX | DONE | — |
| Saved charts / history | DONE (core) | No |
| Guest / multiple charts | PARTIAL | No |
| Daily transits / Today's Energy | **DONE** *(was PARTIAL, updated 2026-06-28)* | — |
| Weekly forecasts | **DONE** *(was MISSING, updated 2026-06-28)* | — |
| AI Ask-Astrologer chat | MISSING | No for built-product V1 / **Yes** for Feature-List V1 |
| Saved AI readings / conversations | SCAFFOLD ONLY | No (defer) |
| Journaling | DONE | — |
| Shadow work / prompts / practices | **PARTIAL FOUNDATION** *(was MISSING, updated 2026-06-28)* | No (defer dedicated workflow) |
| Notifications | MISSING | No (defer) |
| Subscription / purchases | SCAFFOLD ONLY | No (defer) unless V1 must monetize |
| Reports | MISSING | No (post-MVP per list) |
| Data export | MISSING | **Possible** (store/privacy) |
| Retention policy / billing cancel | MISSING | **Possible** (privacy/legal) |
| Analytics / usage | MISSING | No (but strongly recommended) |
| Admin tools / bug reports / logs | MISSING | No (but crash reporting recommended) |
| CI / schema validation | PARTIAL | No (recommended) |
| App Store / privacy / prod readiness | PARTIAL | **Yes** |

---

## 5. V1 Launch Blockers

These assume the recommended **built-product V1** (ship the astrology + journaling app; defer AI). Ranked.

1. **Store/privacy compliance baseline.** Account deletion is in place (good — Apple/Google now require it), but there is no published privacy policy, no documented data-retention statement, and store-listing/privacy-nutrition-label content has not been prepared. App review will require these. *Blocker for actually submitting.*
2. **Crash/error visibility.** There is no crash reporting or error logging (no Sentry/equivalent, no usage_events writes). Launching blind means you cannot tell if real users hit failures in chart generation, auth callbacks, or deletion. Not strictly required by stores, but launching a paid-or-public app with zero production telemetry is a real operational blocker.
3. **Remove or hide dead surfaces.** `ChatScreen` and `SubscriptionScreen` are 0-byte files. Confirm nothing routes to them (they are not registered in `App.tsx` today — good) and that no UI advertises chat/subscriptions to users. Shipping copy that promises AI features the app cannot deliver is a review-rejection and trust risk.
4. **Decide data export.** If the privacy policy or target market (e.g., GDPR/CCPA posture) promises data access/portability, the "Export my data" stub must become real or the copy must stop implying it exists. Otherwise this is a deferral.

If the **Feature-List V1 (as written)** is the real bar, then add the entire **AI Ask-Astrologer chat stack** (LLM integration, prompt routing, conversation persistence/UI), **push notifications**, and a **dedicated shadow-work workflow** as blockers — collectively a multi-month build, not a gap-fill. *(Updated 2026-06-28: weekly forecasts are no longer part of this list — a deterministic weekly forecast shipped and is rendered on the Dashboard. It is not AI-generated, which is the only sense in which the original Feature-List's "weekly forecast" claim remains unmet.)*

---

## 6. V1 Non-Blockers / Acceptable Deferrals

*(Updated 2026-06-28: weekly forecasts and Today's Energy depth are removed from this list — both shipped and are no longer deferrals. See the update block near the top of this document.)*

- **AI chat & saved AI readings** — defer (headline V2 feature; see staleness note).
- **Dedicated shadow-work workflow (prompt builder, screen, milestones)** — defer. *(Updated 2026-06-28: the underlying reflection-prompt/suggested-practice primitives now exist and are surfaced through daily/weekly guidance — see §3 row 12 — but a standalone shadow-work surface is still a deferral.)*
- **Notifications** — defer; requires `expo-notifications` + scheduling backend.
- **Subscriptions/purchases/cosmetics** — defer unless V1 must monetize on day one; if so, this becomes a blocker and needs an IAP SDK (`react-native-iap`/RevenueCat) + store products.
- **Reports** — already labeled post-MVP in the Feature-List itself.
- **Synastry/compatibility** — already labeled post-MVP.
- **Guest chart persistence / relationship labels** — acceptable to ship with one-off guest charts.
- **Journal-prompt handoff** — `DailyGuidance`/`WeeklyForecast` prompts are not yet wired into the journal editor as a seed/prefill; acceptable to defer.
- **CI / schema validation** — strongly recommended but not user-facing; can land immediately after launch.
- **Tag/favorite readings, archive-by-topic** — nice-to-have, defer.

---

## 7. Feature-List Staleness Notes

**[RESOLVED as of 2026-06-28 — preserved for historical context only.]** `docs/Feature-List.md` has since been restructured along almost exactly the lines this section and §9 recommended: it now carries a per-section DONE/PARTIAL/PLANNED/NOT IMPLEMENTED status tag, mentions password reset and account deletion as DONE, has a dedicated "Forecast & Guidance Layer" section marking Daily Guidance and Weekly Forecast as DONE, and correctly keeps AI chat under a separate "AI Features — NOT IMPLEMENTED" section. Re-check `docs/Feature-List.md` directly before relying on the specific complaints below — they describe a version of the file that no longer exists.

`docs/Feature-List.md` **was** (as of 2026-06-20) **materially misleading as a status document** (it read as aspirational scope, not built state). Specific problems at the time:

- It places **AI chat, smart prompt routing, AI daily guidance, saved AI conversations, weekly forecasts, push notifications, and shadow work** under **"MVP Feature Set (V1.0 Launch)."** All are MISSING. This is the biggest discrepancy in the repo.
- It does **not mention** password reset or account deletion at all — two features that **are** fully done. The list under-claims here while over-claiming elsewhere.
- "Store preferences (notifications, chart style, zodiac system)" implies notification preferences exist; only chart preferences do, and only three values are actually supported.
- "Today's Energy dashboard: mood, warning, opportunity" describes a structured output the v1 card does not produce.
- The README is **more honest** than the Feature-List — it explicitly says "Some files/modules are placeholders" and "Expand chat/subscription modules from scaffold to production." The README and Feature-List disagree about maturity; the README is closer to reality.

The Feature-List should either be relabeled as a **product vision/roadmap** (not an MVP checklist) or rewritten to mark actual status per item.

---

## 8. Recommended Next 5 Engineering Slices

*(Updated 2026-06-28: item 1's "forecasts that don't exist" phrasing and original item 5 "Today's Energy polish" are now resolved — deterministic daily/weekly forecasts and richer Today's Energy framing both shipped. The list below has been refreshed accordingly; items 2-4 (telemetry, data export, CI) are unchanged from 2026-06-20 and remain open.)*

Ordered for a **built-product V1** launch (built product now includes the deterministic guidance/forecast layer). None is a rewrite.

1. **Documentation / Feature-List refresh.** Keep `docs/Feature-List.md`, `docs/claudes-review.md`, and this audit in sync with what's actually shipped (this pass did that for the Forecast + Guidance Library v1). Audit in-app copy to ensure nothing promises chat/subscriptions that don't exist — that part of the original launch-compliance slice is still open. Confirm `ChatScreen`/`SubscriptionScreen` remain unrouted. *Files: docs, a copy pass across screens. No engine changes.*
2. **Production telemetry slice.** Add crash reporting (e.g., Sentry) and minimal `usage_events` writes for core funnels (signup complete, chart generated, chart saved, journal saved, account deleted). Gives you eyes post-launch. *Files: a small `lib/usage.ts` implementation + a few call sites + one dependency.*
3. **Data-export decision slice.** Either implement a basic self-serve export (charts + journals as JSON, likely a second Edge Function mirroring the deletion pattern) or change the "Export my data" copy to match reality. Drive this off whatever the privacy policy commits to. *Files: `ProfileScreen`/`DataPrivacyCard`, optional `supabase/functions/export-account/`.*
4. **CI slice.** Add a CI workflow running `typecheck`, `test`, `lint`, and `git diff --check` on PRs, plus a documented `supabase db reset`/`db diff` validation step. Cheap insurance against regression. *Files: CI config, project scripts/docs.*
5. **Pick one product-priority track:**
   - **Journal-prompt handoff** — wire `DailyGuidance.reflectionPrompt`/`WeeklyForecast.journalPrompts` into `JournalEditorScreen` as a seed/prefill. Small, additive, builds on shipped primitives.
   - **Shadow-work prompt builder/surface** — the natal-hard-aspect-sourced shadow prompt library from the original guidance-library plan's §9 was never built; this is the next logical guidance-layer slice if product wants it.
   - **Synastry/relationship foundation** — saved guest profiles + relationship labels, the prerequisite for any compatibility work; still PARTIAL per §3 row 6.
   - **Release/privacy/telemetry/CI hardening** — if none of the above is the priority, fold this into items 2-4 above instead of starting new product surface.

**Explicitly NOT in the next 5:** building the AI chat stack. If product insists AI is V1, that is its own multi-slice epic (LLM provider choice, server-side prompt handling so keys never hit the client, conversation persistence, chat UI, rate limiting, cost controls) and should be planned separately — do not bolt it on under launch pressure.

---

## 9. Recommended Feature-List / README Update Plan

**[Largely done as of 2026-06-28 — preserved for historical context.]** `docs/Feature-List.md` has since been restructured with per-section status tags and now includes password reset, account deletion, and the Forecast + Guidance Library v1 (Daily Guidance and Weekly Forecast both marked DONE) as implemented V1 scope, with AI/notifications/shadow-work/synastry kept in clearly separate planned/not-implemented sections. Re-check the file directly rather than assuming the original recommendation below is still unmet.

(Do **not** edit those files as part of this audit — this is the proposed plan only, as originally written 2026-06-20.)

- **`docs/Feature-List.md`:** Relabel the top section from "MVP Feature Set (V1.0 Launch)" to "Product Vision." Add a status column or tag per line (DONE / PARTIAL / PLANNED). Move AI chat, weekly forecasts, notifications, and shadow work out of the MVP bucket into a clearly-marked "Planned / Post-MVP" bucket. Add the two missing DONE features (password reset, account deletion).
- **`README.md`:** Largely accurate already. Minor: update "Current Status" to mention password reset + account deletion as done, and that Supabase migrations are now committed (the README's "SQL may exist only in your Supabase project" caveat is stale — `supabase/migrations/` exists).
- **Keep a single source of truth.** Right now `claudes-review.md`, `naksha-codebase-handoff.md`, `naksha-decomposition-roadmap.md`, README, and Feature-List all describe status with varying fidelity. Designate the handoff doc as canonical status and have the Feature-List link to it rather than restating maturity.

---

## 10. Risks of Launching Without Each Missing Item

| Missing item | Risk if shipped without it |
|---|---|
| Privacy policy / retention statement | **App Store/Play rejection**; legal exposure in GDPR/CCPA markets. Hard blocker for submission. |
| Crash/error reporting | Production failures (chart gen, auth callback, deletion) are invisible; no way to triage user reports. Operational blindness. |
| Honest copy (no phantom AI/subscription) | Review rejection for unimplemented advertised features; user trust damage; refund/complaint risk. |
| Data export (if promised) | Privacy-policy mismatch → compliance risk; support burden from manual export requests. |
| AI Ask-Astrologer chat | The app's stated headline differentiator is absent. Low risk **if** marketed as a chart/journaling app; high risk if marketed as "AI astrologer." Purely a positioning decision. |
| Weekly forecasts | **[Resolved 2026-06-28]** A deterministic Weekly Forecast shipped and is rendered on the Dashboard; this row no longer applies. (Original 2026-06-20 finding: users expecting ongoing engagement would get only "today." Retention risk, not a blocker.) |
| Notifications | No re-engagement hook → weaker retention/DAU. Growth risk, not a launch blocker. |
| Subscriptions/purchases | No revenue on day one. Business risk; only a blocker if the launch must monetize immediately. |
| Shadow work / prompts | **[Updated 2026-06-28]** The prompt/practice primitives now exist (PARTIAL FOUNDATION, §3 row 12), but no dedicated shadow-work screen/workflow exists. Positioning risk only if shadow work is marketed as its own feature rather than folded into daily/weekly guidance. |
| Analytics | Cannot measure activation/retention/dropoff → flying blind on product decisions. |
| Admin tools / bug reports | Slower incident response; manual DB inspection only. Tolerable at small scale. |
| CI / schema validation | Higher regression risk as velocity increases; migration drift can reach prod unnoticed. |
| Reports / synastry / compatibility | None — already correctly scoped as post-MVP. |

---

### Bottom line

*(Updated 2026-06-28.)* Ship the app that exists — a competent natal-chart, interpretation, saved-chart, journaling product with a complete account lifecycle **and now a deterministic daily/weekly guidance layer** — under an **honest V1 scope**, after clearing the remaining compliance/telemetry/copy blockers in §5 (those are unchanged by this update). Treat AI chat, push notifications, and a dedicated shadow-work workflow as the **V2 roadmap they actually are** — those, and only those, remain unimplemented from the original Feature-List's MVP claims. Daily and weekly forecasts are no longer part of that V2 list; they shipped deterministically. `docs/Feature-List.md` has already been updated to reflect this (see §7, §9) — re-check it directly rather than relying solely on this audit going forward.
