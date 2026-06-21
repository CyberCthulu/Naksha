# Naksha V1 Product Gap Audit - Codex

Generated: 2026-06-20
Scope: `docs/Feature-List.md` claims compared with the current repository.
Method: read-only inspection of app routes, screens, components, hooks, domain helpers, tests, Supabase migrations/functions, package manifests, release configuration, and current handoff documents.

Baseline supplied for this audit: typecheck, lint, `git diff --check`, and 19 Jest suites / 106 tests pass. The repository contains 19 test-suite files. This audit did not rerun the client verification suite because the requested verification for this documentation pass is the Git diff check.

This is a product and repository readiness audit, not legal advice or an independent review of current App Store or Play Store policy.

## 1. Executive Summary

Naksha currently contains a credible, usable astrology core:

- Complete email/password account lifecycle, including OTP/email verification, password reset, profile completion, sign-out, and deployed account deletion.
- Natal chart generation using `astronomy-engine`, with Tropical positions, fixed medium-orb aspects, and approximate Whole Sign houses when coordinates exist.
- A visual SVG chart wheel, placement/house/aspect lists, and local lexicon-based interpretation pages.
- Saved-chart persistence with open/delete behavior and one-off guest chart creation with manual save when coordinates exist.
- A basic personalized Today's Energy card using current fast transits against natal planets.
- Journal create, edit, list, and delete behavior.

The claimed V1 in `docs/Feature-List.md` is substantially larger than that product. It calls Naksha an AI-powered app and places Ask-Astrologer chat, smart prompt routing, saved AI conversations, weekly forecasts, push notifications, and shadow-work workflows inside the V1 launch scope. None of those systems is implemented. Database tables or comment-only placeholder files do not make those features real.

The most important launch decision is therefore a scope decision:

1. **Recommended:** launch an honest non-AI V1 centered on natal charts, local interpretations, saved/guest charts, Today's Energy v1, and journaling. Move AI, weekly forecasts, notifications, shadow work, reports, and monetization to post-MVP.
2. **Alternative:** keep the "AI-Powered Astrology App" V1 promise. In that case, the missing server-side LLM stack, chat UX, prompt safety, cost/rate controls, and conversation history are true launch blockers and represent a separate multi-slice program, not a small gap fix.

Even under the recommended smaller V1, the repository is not yet demonstrably store-ready. Production identity/signing, privacy/support artifacts, release-build QA, and a repeatable release checklist need attention. CI, schema validation, telemetry, and self-service export are important risk reducers but can be prioritized according to launch size and policy commitments.

## 2. Current App Reality in Plain English

Today a user can:

- Sign up, confirm email by OTP or callback, log in, stay signed in, sign out, and reset a forgotten password.
- Create and edit a durable profile containing name, birth date/time/location, coordinates, and time zone.
- Delete the account through a deployed Supabase Edge Function. Disposable-account QA verified removal from the checked auth/profile/preferences/chart/journal tables and prevented later login.
- Generate a natal chart containing ten planetary longitudes, five major aspect types, and Whole Sign houses when coordinates exist.
- View a chart wheel and tap placement or house list rows to open local interpretation pages in a circular pager modal.
- Save, reopen, and delete charts. Self charts auto-save when possible; guest charts require manual save; charts without coordinates are view-only.
- Create a one-off guest chart by entering another person's birth details.
- See transit Sun/Moon signs and one strongest fast-transit-to-natal aspect on the Dashboard.
- Create, edit, list, and delete free-form journal entries.

Today a user cannot:

- Ask an AI astrologer anything.
- Receive GPT-generated guidance, smart prompt routing, or AI transit interpretation.
- View a weekly forecast or a written daily Sun/Moon/Rising horoscope.
- Save AI conversations, save standalone readings, browse readings by topic, or tag/favorite readings.
- Use guided shadow-work prompts, practices, cycles, or milestones.
- Receive push notifications or configure notification preferences.
- Buy a subscription, complete an in-app purchase, manage external billing, or download a report.
- Export account data through the app; the visible export action currently displays support-oriented placeholder copy.
- Submit an in-app bug report or rely on configured production crash/analytics monitoring.

## 3. Feature-List Claims vs. Codebase Reality

### 1. User Authentication and Profiles

- **Classification:** PARTIAL
- **Feature-list claim:** Email/password signup/login, editable birth profile, and stored notification/chart-style/zodiac preferences.
- **Evidence:** `client/lib/auth.ts`, auth/profile screens, `client/lib/supabase.ts`, `public.users`, `public.chart_preferences`, and `ChartPreferencesCard.tsx`.
- **What works now:** Signup, OTP/callback verification, login/session persistence, profile completion/editing, geocoding, time-zone handling, and durable profile storage. Chart preference rows are created and read.
- **What is missing:** Notification preferences and chart-style preferences do not exist. Only Whole Sign, Tropical, medium orbs, and disabled house-degree display are supported; alternative choices are visibly coming soon.
- **V1 launch blocker:** No for the core profile. Yes only if marketing claims configurable notification/style/zodiac systems.
- **Recommended next action:** Narrow the V1 claim to the supported profile and fixed chart system. Do not present disabled alternatives as delivered features.

### 2. Password Reset and Account Deletion

- **Classification:** DONE
- **Feature-list claim:** Not explicitly listed, but both are expected account-lifecycle capabilities.
- **Evidence:** `ForgotPasswordScreen.tsx`, `ResetPasswordScreen.tsx`, `AuthCallbackScreen.tsx`, `authCallbackUrl.ts`, `accountDeletion.ts`, and `supabase/functions/delete-account/`.
- **What works now:** Forgot-password email flow, recovery deep-link handoff, password update, destructive deletion confirmation, authenticated server-side deletion, and sign-out/account exit.
- **What is missing:** Optional hardening such as transactional deletion, rate limiting, expanded function tests, and production monitoring. These are not part of the verified MVP behavior.
- **V1 launch blocker:** No. The MVP path is implemented, deployed to `ujupnlkobzhpjewruiac`, and manually verified with a disposable account.
- **Recommended next action:** Preserve the security contract and add operational monitoring only as release hardening.

### 3. Natal Chart Engine

- **Classification:** DONE
- **Feature-list claim:** Generate a natal chart from birth data.
- **Evidence:** `client/lib/astro.ts`, `client/lib/charts.ts`, `client/lib/time.ts`, `client/lib/timezones.ts`, and focused chart tests.
- **What works now:** Ten geocentric planetary longitudes, conjunction/opposition/trine/square/sextile detection, birth-time conversion, approximate Ascendant calculation, Whole Sign cusps, and planet-house placement.
- **What is missing:** Placidus, Equal House, Sidereal/Vedic output, custom orb modes, nodes/other points, and broader independent calculation validation. The code explicitly supports only the current Tropical/Whole Sign/medium configuration.
- **V1 launch blocker:** No if V1 is explicitly scoped to the implemented system.
- **Recommended next action:** State the supported calculation model clearly and defer additional systems until math, schema, UI, and tests can ship together.

### 4. Chart Wheel and Chart Interpretation UX

- **Classification:** PARTIAL
- **Feature-list claim:** Interactive visual wheel containing planets, signs, houses, and aspects.
- **Evidence:** `ChartWheel.tsx`, placement/house/aspect list components, `ChartScreenContent.tsx`, `InterpretationModal.tsx`, `InterpretationCard.tsx`, and `client/lib/lexicon/`.
- **What works now:** The SVG wheel renders planets, signs, houses, and aspect lines. Placement and house list rows open local interpretation pages; modal clipping and circular paging are tested and manually verified.
- **What is missing:** The wheel itself has no press handlers, selection, zoom, or direct planet/house/aspect interaction. Aspect rows do not open a dedicated interpretation flow. Interpretation content is static local prose, not AI-generated.
- **V1 launch blocker:** No. It is a useful visual and interpretation experience, but the feature list should not call the wheel itself fully interactive.
- **Recommended next action:** Describe V1 as a visual wheel plus interactive lists. Treat direct wheel interaction as later UX work.

### 5. Saved Charts and Chart History

- **Classification:** PARTIAL
- **Feature-list claim:** Save and label multiple charts; save interpretations/readings and browse history.
- **Evidence:** `client/lib/charts.ts`, `useChartData.ts`, `MyCharts.tsx`, `charts` table, canonical chart identity migration, and chart-data validation.
- **What works now:** Save/upsert, list newest first, open, runtime-validate, and delete multiple chart rows. Chart names come from the self or guest profile name.
- **What is missing:** No rename/custom-label action, folders, favorites, tags, topic/date filters, version history, or separately persisted interpretation snapshot.
- **V1 launch blocker:** No for basic saved charts. It blocks only the stronger archive/label claim.
- **Recommended next action:** Ship basic My Charts honestly; add rename/relationship metadata only after the guest-profile product decision.

### 6. Guest Charts and Multiple Charts

- **Classification:** PARTIAL
- **Feature-list claim:** Create a second chart for another person, with compatibility positioned as post-MVP.
- **Evidence:** `CreateGuestChartScreen.tsx`, `chartMode: 'guest'`, `useChartData.ts`, Dashboard entry point, and guest-chart tests.
- **What works now:** A one-off guest chart can be generated. It never auto-saves; it can be manually saved when coordinates exist. Missing-coordinate guest charts remain view-only.
- **What is missing:** No reusable guest birth-profile library, relationship labels, ownership/type distinction in saved rows, synastry, composite chart, or compatibility report.
- **V1 launch blocker:** No. One-off guest charts are a credible MVP boundary.
- **Recommended next action:** Keep the current flow and defer schema changes until reusable-profile and relationship workflows are defined.

### 7. Daily Transits and Today's Energy

- **Classification:** PARTIAL
- **Feature-list claim:** Personalized daily Sun/Moon/Rising horoscope plus mood, warning, opportunity, and AI transit guidance.
- **Evidence:** `client/lib/dailyTransits.ts`, Dashboard Today’s Energy card, and daily-transit tests.
- **What works now:** Transit Sun/Moon signs and the closest major aspect from fast transit bodies to natal planets, with local short aspect meaning and a no-exact-aspect fallback.
- **What is missing:** No Rising-focused horoscope, written daily forecast, mood/warning/opportunity structure, multi-aspect synthesis, caching, forecast detail view, AI generation, or notification delivery.
- **V1 launch blocker:** No if this remains explicitly "Today's Energy v1." Yes if marketed as the full daily horoscope described in the feature list.
- **Recommended next action:** Keep the card basic for launch and correct the claim before expanding forecast scope.

### 8. Weekly Forecasts

- **Classification:** MISSING
- **Feature-list claim:** Weekly forecast with key themes and suggestions.
- **Evidence:** No weekly forecast screen, helper, persistence model, route, service, or test was found.
- **What works now:** Nothing weekly; only the current-day transit card exists.
- **What is missing:** Forecast generation, date-window transit selection, synthesis, UX, storage/caching, and tests.
- **V1 launch blocker:** Only if weekly forecasts remain a promised V1 feature.
- **Recommended next action:** Move to post-MVP rather than expanding forecast scope under launch pressure.

### 9. AI-Powered Guidance and Ask-Astrologer Chat

- **Classification:** MISSING
- **Feature-list claim:** GPT-4o Ask-Astrologer chat, smart prompt routing, AI daily guidance, and AI transit interpretation.
- **Evidence:** `ChatScreen.tsx` and `client/lib/conversations.ts` contain comments only; they are not routed. No LLM SDK, API client, server function, prompt templates, model configuration, safety layer, or AI tests exist.
- **What works now:** Local deterministic lexicon interpretation only.
- **What is missing:** The entire AI product stack: secure server-side provider calls, prompt/context construction, chat UI, streaming/error states, moderation/safety, privacy disclosure, rate/cost controls, persistence, and tests.
- **V1 launch blocker:** Yes if Naksha launches under the feature list's "AI-Powered" promise. No if AI is removed from V1 positioning.
- **Recommended next action:** Make a product decision first. If retained, plan AI as a dedicated epic and never place provider secrets in the React Native client.

### 10. Saved AI Readings and Conversation History

- **Classification:** SCAFFOLD ONLY
- **Feature-list claim:** Save/revisit AI conversations and readings; browse history by date/topic; tag/favorite items.
- **Evidence:** `conversations` and `messages` tables exist, but the conversation service and chat screen contain comments only. No tag/favorite schema or reading archive UI exists.
- **What works now:** Database shapes and RLS provide early groundwork only.
- **What is missing:** Creation/read APIs, conversation UI, message flow, saved-reading model, date/topic navigation, tags, favorites, deletion behavior, and tests.
- **V1 launch blocker:** Only if AI remains V1. Otherwise it should be deferred with AI chat.
- **Recommended next action:** Do not build history before the primary AI interaction and retention/privacy contract are defined.

### 11. Journaling

- **Classification:** DONE
- **Feature-list claim:** Write reflections or responses to prompts.
- **Evidence:** `client/lib/journals.ts`, `JournalListScreen.tsx`, `JournalEditorScreen.tsx`, `journals` table/RLS, and journal payload tests.
- **What works now:** Create, edit, list, and delete user-owned journal entries with title/content and timestamps. Schema supports optional chart and prompt-template references.
- **What is missing:** No AI-prompt launch path, tag/favorite/search, milestone tracking, export, or focused screen-level test suite.
- **V1 launch blocker:** No for free-form journaling.
- **Recommended next action:** Keep basic journaling in V1; attach prompt or archive enhancements to later concrete features.

### 12. Shadow Work, Prompts, Practices, and Milestones

- **Classification:** SCAFFOLD ONLY
- **Feature-list claim:** AI prompts, daily/weekly introspection cycles, rituals/affirmations/meditations, and completion milestones.
- **Evidence:** `journals.prompt_template` exists, but no shadow-work route, prompt library, scheduler, practice content model, completion state, or milestone UI exists.
- **What works now:** Users can manually write free-form journal entries.
- **What is missing:** Every claimed guided workflow and its persistence/testing.
- **V1 launch blocker:** Only if marketed as a V1 self-development system.
- **Recommended next action:** Move to post-MVP and validate the content/product model before adding schema.

### 13. Notifications

- **Classification:** SCAFFOLD ONLY
- **Feature-list claim:** Push notifications for forecasts, retrogrades, and eclipses plus configurable notification settings.
- **Evidence:** A `notifications` table exists and `client/lib/notifications.ts` contains only a comment. No `expo-notifications` dependency, permission flow, push token storage, scheduler/backend sender, preferences, or UI exists.
- **What works now:** Nothing user-facing.
- **What is missing:** End-to-end notification infrastructure and forecast/event sources.
- **V1 launch blocker:** No for a chart/journal V1; yes only if promised at launch.
- **Recommended next action:** Defer until forecast content and re-engagement strategy are proven.

### 14. Subscription, Purchases, and Monetization

- **Classification:** POST-MVP / SHOULD DEFER
- **Feature-list claim:** Reports, cosmetic upgrades, and Pro/Elite subscription tiers under the post-MVP section.
- **Evidence:** Subscription/purchase tables and read-only Profile cards exist. `SubscriptionScreen.tsx` and `client/lib/subscriptions.ts` contain comments only; no billing SDK or store-product flow exists.
- **What works now:** Existing backend rows could be displayed. The UI otherwise says free plan/coming soon.
- **What is missing:** Product catalog, purchase/restore, entitlement verification, subscription management, external cancellation/refund handling, paywalls, and tests.
- **V1 launch blocker:** No if V1 is free. Yes if revenue is required on day one.
- **Recommended next action:** Keep monetization out of V1 and avoid implying that upgrades are available.

### 15. Reports

- **Classification:** POST-MVP / SHOULD DEFER
- **Feature-list claim:** Downloadable deep natal report and 6-12 month transit timeline.
- **Evidence:** A `reports` table exists; `client/lib/reports.ts` contains only a comment. No report generator, route, viewer, export/download, or tests exist.
- **What works now:** Schema groundwork only.
- **What is missing:** Report content generation, storage lifecycle, rendering, download/share behavior, monetization rules, and QA.
- **V1 launch blocker:** No. The feature list already places reports post-MVP.
- **Recommended next action:** Leave deferred until the underlying forecast/content and monetization models exist.

### 16. Data Privacy: Export, Deletion, Retention, and Billing

- **Classification:** PARTIAL
- **Feature-list claim:** The feature list does not clearly define privacy behavior, but launch readiness requires an accurate account-data contract.
- **Evidence:** Deployed deletion Edge Function and Profile deletion UX are real. The Export action displays future-version/support copy. Existing docs identify no retention policy or external billing cancellation/refund workflow.
- **What works now:** Full account deletion has passed disposable-account QA. Service-role credentials remain server-side.
- **What is missing:** Self-service data export, documented retention/deletion semantics, support process, optional data-only deletion, and future external billing responsibilities.
- **V1 launch blocker:** The absence of an accurate privacy/support/store-disclosure package is a release blocker. Self-service export is conditional on product/legal commitments and target markets; this audit does not assert that it is universally required.
- **Recommended next action:** Define the policy first, then either implement export or make the support-based process explicit and operational.

### 17. Analytics and Usage Events

- **Classification:** SCAFFOLD ONLY
- **Feature-list claim:** Usage metrics for feature use, drop-off, and growth.
- **Evidence:** `usage_events` table exists; `client/lib/usage.ts` contains only a comment. No call sites or analytics dependency were found.
- **What works now:** Nothing records product events from the client.
- **What is missing:** Event taxonomy, consent/privacy approach, client/server writes, dashboards, retention, and tests.
- **V1 launch blocker:** No for a controlled launch, but absence materially weakens product learning.
- **Recommended next action:** Add only a small privacy-aware activation funnel after privacy copy is settled.

### 18. Admin Tools, Bug Reports, and Logs

- **Classification:** MISSING
- **Feature-list claim:** User activity, error logs, bug reports, and AI failure monitoring.
- **Evidence:** No admin route, bug-report flow, crash SDK, remote log service, or AI monitoring exists. The app uses local `console.warn` and user alerts in selected paths.
- **What works now:** Manual Supabase inspection and local logs only.
- **What is missing:** Support intake, crash/error aggregation, release/environment metadata, triage workflow, and any AI-specific monitoring.
- **V1 launch blocker:** Not for a tiny controlled beta; high operational risk for a broad public launch.
- **Recommended next action:** Add lightweight crash reporting and a support/contact route before scaling traffic.

### 19. CI, Release Readiness, and Schema Validation

- **Classification:** PARTIAL
- **Feature-list claim:** Internal infrastructure is implied, while current handoff docs explicitly identify CI/schema validation as open.
- **Evidence:** Local `typecheck`, `test`, and `lint` scripts exist; 19 Jest suites and generated Supabase types exist; migrations are source-controlled. No `.github` workflow or equivalent CI configuration was found. Supabase reset/diff validation remains manual.
- **What works now:** Stronger-than-prototype local verification and focused regression coverage.
- **What is missing:** Automated PR checks, migration reset/diff validation, Edge Function checks, release gates, end-to-end tests, and a documented release checklist.
- **V1 launch blocker:** CI itself is not an absolute blocker if a disciplined manual release checklist exists. An unverified production build and remote schema/config are blockers.
- **Recommended next action:** Add a small CI workflow and a reproducible Supabase validation procedure; do not build a large platform.

### 20. App Store, Privacy, and Production Readiness

- **Classification:** PARTIAL
- **Feature-list claim:** Not detailed in the feature list, but required for an actual V1 launch rather than a development demo.
- **Evidence:** `eas.json` has development/preview/production profiles and an EAS project id exists. `app.json` still uses app name/slug `client`, Android package `com.anonymous.client`, and no iOS bundle identifier. The checked-in Android release build references debug signing. No store metadata, privacy policy, terms/support artifact, screenshot set, or release-build QA record was found in the repository.
- **What works now:** Expo/EAS and Android project scaffolding exist; deep-link scheme `naksha` exists; account lifecycle basics are implemented.
- **What is missing:** Final product identifiers/name, verified production signing and credentials, iOS identifier, store listing assets/metadata, privacy/support URLs and disclosures, production environment validation, and physical-device release-build QA.
- **V1 launch blocker:** Yes for public store submission.
- **Recommended next action:** Complete a focused release-configuration and production-build slice before adding new product features.

## 4. Feature Gap Matrix

| # | Category | Classification | Blocks honest chart/journal V1? | Blocks Feature-List V1 as written? |
|---|---|---|---|---|
| 1 | Authentication and profiles | PARTIAL | No | Yes, for unsupported preferences |
| 2 | Password reset and account deletion | DONE | No | No |
| 3 | Natal chart engine | DONE | No | No |
| 4 | Chart wheel and interpretation UX | PARTIAL | No | Yes, for direct wheel interactivity claim |
| 5 | Saved charts / history | PARTIAL | No | Yes, for labels/readings/archive claim |
| 6 | Guest charts / multiple charts | PARTIAL | No | No; compatibility is post-MVP |
| 7 | Daily transits / Today's Energy | PARTIAL | No | Yes, for full daily horoscope claim |
| 8 | Weekly forecasts | MISSING | No, if deferred | Yes |
| 9 | AI guidance / Ask-Astrologer | MISSING | No, if removed from positioning | Yes, headline blocker |
| 10 | Saved AI readings / conversations | SCAFFOLD ONLY | No, if AI deferred | Yes |
| 11 | Journaling | DONE | No | No for basic journaling |
| 12 | Shadow work / prompts / milestones | SCAFFOLD ONLY | No, if deferred | Yes |
| 13 | Notifications | SCAFFOLD ONLY | No, if deferred | Yes |
| 14 | Subscription / purchases | POST-MVP / SHOULD DEFER | No for free V1 | No; listed post-MVP |
| 15 | Reports | POST-MVP / SHOULD DEFER | No | No; listed post-MVP |
| 16 | Data privacy | PARTIAL | Yes for policy/support readiness; export is conditional | Yes |
| 17 | Analytics / usage | SCAFFOLD ONLY | No for controlled launch | No; operational risk |
| 18 | Admin / bug reports / logs | MISSING | No for controlled beta | No; operational risk |
| 19 | CI / schema validation | PARTIAL | Release verification required; CI can follow manual gates | Same |
| 20 | Store / production readiness | PARTIAL | Yes | Yes |

## 5. V1 Launch Blockers

These blockers assume the recommended honest chart/journal V1, not the much larger feature-list V1.

1. **Lock the V1 promise.** Remove AI-powered, weekly forecast, notification, shadow-work, saved-reading, and configurable-preference claims from V1 materials unless they are actually being built before launch. A product cannot pass a truthful launch review while its headline promise is absent.
2. **Finalize production app identity and signing.** Replace generic app identifiers/name, configure the iOS bundle identifier, verify EAS production credentials, and prove a signed production build on target devices. The checked-in Android release config currently points at debug signing and must not be assumed production-ready.
3. **Complete privacy/support/store disclosures.** Define privacy and retention language, support contact/process, deletion behavior, export availability, and data-use disclosures. Account deletion is ready; the surrounding user contract is not documented in the repo.
4. **Run production-build end-to-end QA.** Verify signup/email callback, login, password recovery, profile/geocoding, self and guest charts, saved-chart open/delete, interpretations, journal CRUD, sign-out, and account deletion on release builds and relevant devices. Current unit/screen tests are valuable but not a release-build substitute.
5. **Verify deployed backend/config as a release unit.** Confirm migrations, RLS, generated types, Edge Function secrets/deployment, auth redirect allowlists, and mobile deep links correspond to the production build. This can be a manual release gate initially, but it must be explicit.

If the feature-list V1 remains authoritative, add AI chat, saved AI conversations, weekly forecasts, notifications, and shadow work to the blocker list. That is a materially larger release plan.

## 6. V1 Non-Blockers and Acceptable Deferrals

- Direct interaction on the chart wheel; the current visual wheel plus tappable lists is sufficient when described honestly.
- Custom chart labels, favorites, folders, and archive filters.
- Reusable guest profiles, relationship labels, synastry, and composite charts.
- Richer daily forecast framing and weekly forecasts.
- AI chat, AI reading history, and shadow-work systems if removed from V1 positioning.
- Push notifications and notification preferences.
- Subscriptions, purchases, cosmetics, reports, and premium gating for a free V1.
- Self-service export if the published policy and support process do not promise it; confirm this separately for target markets.
- Analytics and admin dashboards for a small controlled launch, although basic crash reporting is strongly recommended.
- Additional chart systems and orb modes.
- CI as a tool choice, provided production verification is performed through a disciplined manual release gate until CI lands.

## 7. Feature-List and README Staleness Notes

### Feature list

- The repository tracks `docs/Feature-List.md` with a capital `L`. References to `docs/Feature-list.md` are incorrect on case-sensitive systems.
- The subtitle says "AI-Powered Astrology App," but no AI runtime exists.
- AI chat, smart prompt routing, saved AI conversations, weekly forecasts, notifications, and shadow work are placed under V1 despite being missing or schema-only.
- Password reset and deployed account deletion are complete but absent from the list.
- "Store preferences" overstates current behavior: there are no notification/chart-style preferences, and only the fixed supported chart calculation values work.
- "Interactive chart wheel" overstates the wheel itself; interaction lives in adjacent placement and house lists.
- "Save and label charts" overstates labeling. Names are saved, but there is no rename/custom-label workflow.
- Today's Energy is described as mood/warning/opportunity; the implementation is transit signs plus one strongest aspect.
- The post-MVP placement of compatibility, reports, cosmetics, subscriptions, calendar, community, and spiritual coaching is appropriate and should remain deferred.

### README

- README under-reports completed password reset, account deletion, guest charts, Today's Energy, tests, generated types, and migrations.
- Its statement that SQL may exist only in the remote Supabase project is stale because `supabase/migrations/` is source-controlled.
- Its roadmap still says to add tests and commit migrations, both of which have happened.
- The repository-structure code block appears not to close before the feature prose, which makes the rendered document harder to scan.
- README is more cautious than the feature list about chat/subscription placeholders, but it is no longer a reliable current-status summary.

## 8. Recommended Next 5 Engineering Slices

1. **Production identity and release-build slice.** Finalize app name/slug, Android application id, iOS bundle id, signing/credentials, production environment variables, and deep links. Produce and manually smoke-test signed iOS/Android release builds.
2. **Privacy, support, and export-contract slice.** Write the actual retention/deletion/export/support contract. Either implement a minimal authenticated export or make the support-based process precise and operational. Keep external billing language out until billing exists.
3. **Small CI and schema-validation slice.** Run typecheck, 19-suite Jest tests, lint, and diff checks on changes; document or automate Supabase migration reset/diff and Edge Function validation. Keep it narrow.
4. **Core-flow release QA and UX slice.** Test the full release-build journey on representative devices, fix only discovered defects, and polish the highest-friction Dashboard/chart/guest/journal/profile states. Do not combine this with new astrology systems.
5. **Minimal observability slice.** Add privacy-aware crash/error reporting and a simple support path. Add a small activation event set only after the privacy contract is settled; do not build a large analytics platform.

AI is intentionally not in these five slices. If the product decides AI must define V1, replace this sequence with a separately estimated AI epic and move the launch date accordingly.

## 9. Recommended Feature-List and README Update Plan

Do not edit those files as part of this audit. Recommended follow-up:

1. Split `docs/Feature-List.md` into **Current V1**, **Next**, and **Post-MVP/Vision** sections.
2. Mark every item with DONE, PARTIAL, PLANNED, or DEFERRED and link current-status claims to the handoff/audit.
3. Define Current V1 as account lifecycle, profile, supported natal chart engine, visual chart plus local interpretations, saved/guest charts, Today's Energy v1, and journaling.
4. Move AI, weekly forecasts, saved AI readings, shadow work, and notifications out of Current V1 unless product explicitly funds them before launch.
5. Add password reset and account deletion as DONE.
6. Update README current status, Supabase migration notes, test baseline, and run commands; fix its feature-section formatting.
7. Choose one canonical status document. Keep the feature list as product scope and the handoff/audit as implementation evidence instead of duplicating conflicting status prose everywhere.

## 10. Risks If We Launch Without Each Open Item

| Open item | Risk if launched without it |
|---|---|
| Honest V1 scope | Users and reviewers encounter a product that does not match its AI/forecast claims; trust and launch positioning fail. |
| Production identifiers/signing | Release builds or store submissions may fail, collide with placeholder identity, or use unverified credentials. |
| Privacy/retention/support package | Users cannot understand data handling or obtain reliable support; store review and compliance posture remain uncertain. |
| Production-build QA | Deep links, auth callbacks, native layout, environment configuration, or deletion can fail outside the development runtime. |
| Backend release checklist | Remote schema, RLS, redirects, generated types, and function deployment can drift from the app release. |
| Data export | Support burden and user-trust risk; becomes more serious if policy or market commitments promise portability. |
| Crash/error reporting | Production failures are discovered only through user complaints and are difficult to diagnose. |
| Analytics | Activation and drop-off cannot be measured; prioritization becomes anecdotal. |
| CI/schema automation | Regressions and migration drift depend on humans remembering every command. |
| Direct wheel interactivity | Minor expectation mismatch; users still have list-driven interaction and interpretations. |
| Custom chart labels/history tools | Saved charts become harder to organize as usage grows. |
| Reusable guest profiles | Users must re-enter birth data; acceptable at low usage, frustrating for repeated relationship work. |
| Full daily horoscope | Today's Energy may feel thin relative to the feature-list promise. |
| Weekly forecasts | Less recurring value and retention, but no core chart failure. |
| AI Ask-Astrologer | Catastrophic positioning gap if marketed as AI; no impact if explicitly deferred from V1. |
| Saved AI readings | No impact while AI is deferred; required once chat exists. |
| Shadow-work system | Missing marketed self-development depth; no impact if deferred honestly. |
| Notifications | Lower re-engagement and no event reminders; acceptable for V1. |
| Monetization | No launch revenue; acceptable only for a free V1. |
| Reports | No downloadable premium artifact; already reasonable post-MVP scope. |
| Billing cancellation/refunds | No immediate impact while billing is absent; becomes mandatory product work before monetization. |
| Admin/bug-report tools | Slower incident response and more manual support work. |

## Bottom Line

Naksha is not the AI-heavy V1 described by the feature list. It is a substantially built natal-chart and journaling product with a complete account lifecycle and a useful basic daily-transit surface.

The fastest credible route to launch is to tell the truth about that product, complete production identity/privacy/release QA, and defer the unbuilt AI/forecast/notification/shadow-work scope. Trying to make the existing feature list true before launch would turn a contained release effort into a much larger product program.
