# Naksha V1 Launch Gap Audit

Generated: 2026-06-20
Author: Claude (Opus) — read-only product gap audit
Scope: `docs/Feature-List.md` (claimed product) vs. actual codebase reality.
Method: direct inspection of `client/`, `supabase/`, package manifests, and the existing handoff/review docs. Stub files were opened and byte-counted; claims were not taken on trust.

Verification baseline at audit time: `npm run typecheck`, `npm test` (19 suites / 106 tests), `npm run lint`, and `git diff --check` pass.

---

## 1. Executive Summary

**The shipped app and the V1 feature list are two very different products.** `docs/Feature-List.md` lists AI-powered guidance (GPT-4o chat), smart prompt routing, daily AI guidance, saved AI conversations, weekly forecasts, push notifications, and shadow-work prompts/practices/milestones **inside the "MVP Feature Set (V1.0 Launch)" section**. None of those exist in the codebase — not partially, not as scaffolding with logic. `ChatScreen.tsx`, `SubscriptionScreen.tsx`, and `lib/{conversations,notifications,reports,subscriptions,usage}.ts` are all **0-byte files**. There is no LLM dependency (no OpenAI/Anthropic SDK, no API client, no prompt code) anywhere in the repo.

What **is** built is solid and genuinely usable: a complete email/password auth lifecycle (signup, OTP verify, login, password reset, account deletion with a deployed and QA'd Edge Function), a real natal chart engine (planets, aspects, whole-sign houses), an interactive SVG chart wheel with lexicon-based interpretation, saved charts, one-off guest charts, a basic "Today's Energy" transit card, and full journaling (create/edit/delete/list).

**The single most important finding:** if "V1" means the Feature-List MVP as written, the app is **not close** — its headline differentiator (AI astrologer chat) is 0% implemented. If "V1" means "the strong astrology + journaling app that actually exists," it is **near-launchable** with a handful of real gaps (data export stub, no analytics, no crash/error visibility, no CI). The most valuable next action is a **product decision to pick one of those two definitions**, because they imply completely different amounts of remaining work (weeks vs. months).

This audit recommends **descoping V1 to the built product** and moving AI chat, weekly forecasts, notifications, and shadow work to a clearly-labeled post-MVP track.

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
- See a basic "Today's Energy" card on the Dashboard (transit Sun/Moon sign + single strongest fast transit-to-natal aspect).
- Write, edit, delete, and list journal entries.
- Set chart preferences in the UI (house system / zodiac / orb), though only Whole Sign / Tropical / medium are actually supported.

A user **cannot** do anything involving AI, chat, forecasts beyond today, notifications, subscriptions/purchases, reports, shadow-work prompts, data export, sharing, or compatibility/synastry — those are absent or empty stubs.

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
| 7 | "Today's Energy" dashboard (mood/warning/opportunity) | `lib/dailyTransits.ts`, Dashboard card | **PARTIAL** — transit Sun/Moon + 1 aspect; no mood/warning/opportunity framing |
| 7 | Personalized daily horoscope (Sun/Moon/Rising) | `dailyTransits.ts` (transit-to-natal) | **PARTIAL** — basic v1, not a written horoscope |
| 8 | Weekly forecast | none (grep: no matches) | **MISSING** |
| 9 | Ask-Astrologer AI chat (GPT-4o) | `ChatScreen.tsx` = **0 bytes**, `lib/conversations.ts` = **0 bytes**, no LLM SDK | **MISSING** |
| 9 | Smart prompt routing / AI daily guidance / transit interpretation by AI | none | **MISSING** |
| 10 | Save/revisit AI conversations | `conversations`/`messages` tables exist; `lib/conversations.ts` = 0 bytes; no UI | **SCAFFOLD ONLY** (DB only) |
| 11 | Journaling (write reflections) | `lib/journals.ts` (78L), `JournalListScreen` (226L), `JournalEditorScreen` (232L), `journals` table | **DONE** |
| 11 | Journal responds to AI prompts; tag/favorite readings | no AI prompts; no tag/favorite | **MISSING** (the AI-linked part) |
| 12 | Shadow work prompts/practices/milestones | none | **MISSING** |
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
| Daily transits / Today's Energy | PARTIAL | No |
| Weekly forecasts | MISSING | No (defer) |
| AI Ask-Astrologer chat | MISSING | No for built-product V1 / **Yes** for Feature-List V1 |
| Saved AI readings / conversations | SCAFFOLD ONLY | No (defer) |
| Journaling | DONE | — |
| Shadow work / prompts / practices | MISSING | No (defer) |
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

If the **Feature-List V1 (as written)** is the real bar, then add the entire **AI Ask-Astrologer chat stack** (LLM integration, prompt routing, conversation persistence/UI), **weekly forecasts**, **push notifications**, and **shadow-work prompts** as blockers — collectively a multi-month build, not a gap-fill.

---

## 6. V1 Non-Blockers / Acceptable Deferrals

- **Weekly forecasts** — net-new feature; defer to post-MVP.
- **AI chat & saved AI readings** — defer (headline V2 feature; see staleness note).
- **Shadow work prompts/practices/milestones** — defer.
- **Notifications** — defer; requires `expo-notifications` + scheduling backend.
- **Subscriptions/purchases/cosmetics** — defer unless V1 must monetize on day one; if so, this becomes a blocker and needs an IAP SDK (`react-native-iap`/RevenueCat) + store products.
- **Reports** — already labeled post-MVP in the Feature-List itself.
- **Synastry/compatibility** — already labeled post-MVP.
- **Guest chart persistence / relationship labels** — acceptable to ship with one-off guest charts.
- **Today's Energy depth (mood/warning/opportunity)** — current v1 is acceptable; richer framing is polish.
- **CI / schema validation** — strongly recommended but not user-facing; can land immediately after launch.
- **Tag/favorite readings, archive-by-topic** — nice-to-have, defer.

---

## 7. Feature-List Staleness Notes

`docs/Feature-List.md` is **materially misleading as a status document** (it reads as aspirational scope, not built state). Specific problems:

- It places **AI chat, smart prompt routing, AI daily guidance, saved AI conversations, weekly forecasts, push notifications, and shadow work** under **"MVP Feature Set (V1.0 Launch)."** All are MISSING. This is the biggest discrepancy in the repo.
- It does **not mention** password reset or account deletion at all — two features that **are** fully done. The list under-claims here while over-claiming elsewhere.
- "Store preferences (notifications, chart style, zodiac system)" implies notification preferences exist; only chart preferences do, and only three values are actually supported.
- "Today's Energy dashboard: mood, warning, opportunity" describes a structured output the v1 card does not produce.
- The README is **more honest** than the Feature-List — it explicitly says "Some files/modules are placeholders" and "Expand chat/subscription modules from scaffold to production." The README and Feature-List disagree about maturity; the README is closer to reality.

The Feature-List should either be relabeled as a **product vision/roadmap** (not an MVP checklist) or rewritten to mark actual status per item.

---

## 8. Recommended Next 5 Engineering Slices

Ordered for a **built-product V1** launch. None is a rewrite.

1. **Launch-compliance slice (docs + copy).** Write a privacy policy + data-retention statement, prepare store privacy-label content, and audit all in-app copy to ensure nothing promises chat/subscriptions/forecasts that don't exist. Confirm `ChatScreen`/`SubscriptionScreen` remain unrouted. *Files: docs, store assets, a copy pass across screens. No engine changes.*
2. **Production telemetry slice.** Add crash reporting (e.g., Sentry) and minimal `usage_events` writes for core funnels (signup complete, chart generated, chart saved, journal saved, account deleted). Gives you eyes post-launch. *Files: a small `lib/usage.ts` implementation + a few call sites + one dependency.*
3. **Data-export decision slice.** Either implement a basic self-serve export (charts + journals as JSON, likely a second Edge Function mirroring the deletion pattern) or change the "Export my data" copy to match reality. Drive this off whatever the privacy policy commits to. *Files: `ProfileScreen`/`DataPrivacyCard`, optional `supabase/functions/export-account/`.*
4. **CI slice.** Add a CI workflow running `typecheck`, `test`, `lint`, and `git diff --check` on PRs, plus a documented `supabase db reset`/`db diff` validation step. Cheap insurance against regression. *Files: CI config, project scripts/docs.*
5. **Today's Energy polish OR guest-chart persistence** (pick one based on product priority). Both are contained, additive, and already have clean seams (`dailyTransits.ts`; `CreateGuestChartScreen` + a future `birth_profiles` table). Neither is required for launch.

**Explicitly NOT in the next 5:** building the AI chat stack. If product insists AI is V1, that is its own multi-slice epic (LLM provider choice, server-side prompt handling so keys never hit the client, conversation persistence, chat UI, rate limiting, cost controls) and should be planned separately — do not bolt it on under launch pressure.

---

## 9. Recommended Feature-List / README Update Plan

(Do **not** edit those files as part of this audit — this is the proposed plan only.)

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
| Weekly forecasts | Minor; users expecting ongoing engagement get only "today." Retention risk, not a blocker. |
| Notifications | No re-engagement hook → weaker retention/DAU. Growth risk, not a launch blocker. |
| Subscriptions/purchases | No revenue on day one. Business risk; only a blocker if the launch must monetize immediately. |
| Shadow work / prompts | Missing a marketed depth feature; positioning risk only. |
| Analytics | Cannot measure activation/retention/dropoff → flying blind on product decisions. |
| Admin tools / bug reports | Slower incident response; manual DB inspection only. Tolerable at small scale. |
| CI / schema validation | Higher regression risk as velocity increases; migration drift can reach prod unnoticed. |
| Reports / synastry / compatibility | None — already correctly scoped as post-MVP. |

---

### Bottom line

Ship the app that exists — a competent natal-chart, interpretation, saved-chart, and journaling product with a complete account lifecycle — under an **honest V1 scope**, after clearing the compliance/telemetry/copy blockers in §5. Treat the AI/forecast/notification/shadow-work features in the Feature-List as the **V2 roadmap they actually are**, and fix the Feature-List so it stops describing them as shipped MVP scope.
