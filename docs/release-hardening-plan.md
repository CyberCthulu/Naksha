# Naksha release-hardening plan

Reviewed **12 September 2026 (Pacific)**, at commit **`ab9c16c1`**, branch **`ui/v2-redesign`**. This is the current execution plan; [the earlier review](release-readiness-2026-09-12.md) remains historical evidence. Review and documentation only: no application fixes, dependency updates, migrations, deployments, store submissions, or live-user operations were performed.

## Release decision and scope

**Core free V1 and its visual design are substantially implemented. Public release is not approved.** Proceed with targeted correctness, data integrity, reliability, accessibility, and production-delivery work. Android remains first; iOS needs its own native qualification.

Include existing auth/profile flows, Tropical/Whole Sign natal and guest charts, saved charts, daily/weekly guidance, Sky Now with authored aspect readings, and journaling. Preserve the shared atmosphere, translucent surfaces, reduced-motion behavior, and user-approved chart interactions. AI, synastry, notifications, subscriptions, reports, extra astrology systems, and a new redesign are outside this hardening plan.

### Fresh verification

| Check | Current result | Scope of evidence |
| --- | --- | --- |
| `cd client && npm run typecheck` | Passed | Current TypeScript source |
| `cd client && npm run lint` | Passed | Current ESLint checks |
| `cd client && npm test -- --runInBand` | **58 suites / 737 tests passed** | Includes Sky Now, all 45 pair lookups across five aspects, reference positions, and orb boundaries; not backend integration or native QA |
| `CI=1 EXPO_OFFLINE=1 EXPO_NO_DOTENV=1 npx expo export --platform all` | Android and iOS Hermes bundles passed | JavaScript/assets only; no native compilation, signing, store install, or production environment proof |
| Offline `expo install --check` | Passed with limitations | Offline validation is unreliable; picker 2.11.3 deliberately excluded and must be preserved |
| `npm audit --omit=dev --json` | **41 affected package entries: 1 critical, 19 high, 20 moderate, 1 low** | Current npm advisory response, not 41 demonstrated app exploits; build tools appear in this graph |
| Birth date serialization reproduction | **Failed correctness check** | Called current `formatDateForDb` under two device time zones; examples below |
| Nonexistent local birth time reproduction | **Silently shifted by one hour** | Current `birthToUTC`, installed Luxon, Los Angeles DST gap |

The npm query initially failed under restricted networking; a read-only retry succeeded. Review logs are in `/tmp/naksha-release-tests.log`, `/tmp/naksha-release-audit.json`, and `/tmp/naksha-release-export.log`; exports are in `/tmp/naksha-release-review-export`. These are temporary review artifacts, not release records. CI/candidate artifacts should be retained durably with their commit/build IDs.

The earlier wheel prop-contract test failure is resolved. Sky Now now has unrounded aspect classification, explicit rules, independent JPL position fixtures for all ten bodies at one timestamp, and 45 pair themes with five aspect dynamics. Its minute refresh already pauses off-route/inactive; changing that cadence is not a release task. Passing those checks does not establish birth-date input correctness, Ascendant accuracy for all locations, or physical-device accessibility.

Not verified in this review: hosted Supabase policies/data, SMTP/domain configuration, geocoder entitlement, current EAS build history or signing credentials, store accounts/listings, live privacy/support pages, native Android/iOS release artifacts, device performance, backup restore, and production email/deletion behavior. The earlier development-build history and user walkthrough remain historical evidence, not qualification of a new candidate.

## Findings and acceptance criteria

**P0:** resolve before distributing an external beta because another account's data operations may be affected. **P1:** release gate; correctness, account/journal safety, and exposed service/deep-link issues should also be resolved before external beta. **P2:** bounded follow-up that needs an explicit disposition and acceptance evidence. “Confirmed” below means source inspection or the stated local reproduction, not a live exploit.

### RH-01 — P0: enforce ownership of related database records

**Confirmed in committed schema; deployed state unverified.** [Initial migration](../supabase/migrations/20260508015720_remote_schema.sql) policies check the inserted/updated row's `user_id`, while chart/conversation foreign keys reference only parent IDs. Later migrations do not add matching parent ownership. An owned conversation/report can therefore refer to another user's chart if that schema is deployed, potentially blocking that owner's chart/account deletion. This review did not establish cross-user reading. [PostgreSQL documents](https://www.postgresql.org/docs/current/ddl-rowsecurity.html) that referential-integrity checks bypass row security.

Work:

- Revoke unused client write permissions/policies for unshipped features where appropriate; hiding UI does not revoke API access.
- Enforce same-owner parents for every retained relationship on insert and update, including optional journal chart links. Choose constraints and/or policies that also preserve intended deletion behavior.
- Inspect existing invalid relationships safely before adding constraints. Write an incremental migration; do not rewrite migration history or delete unrelated users' records as a cleanup shortcut.
- Exercise [delete-account](../supabase/functions/delete-account/index.ts) through partial failures and retries; keep service credentials server-side and derive identity from the verified JWT.

**Accept:** disposable two-account SQL/integration tests reject foreign parent references and owner reassignment, preserve own reads/writes/deletes, allow nullable links where intended, and prove one user cannot block another's chart/account deletion. Clean migration reset and upgrade both pass. Retest against the deployed candidate backend with disposable accounts.

### RH-02 — P1: preserve birth calendar dates and resolve ambiguous times

**Newly reproduced correctness defect.** [time.ts](../client/lib/time.ts) uses `d.toISOString().split('T')[0]` to save a date selected/displayed in the device's local calendar. It is called from signup, profile editing, and guest-chart creation.

| Device time zone / picker value | Date shown | Date currently serialized |
| --- | --- | --- |
| Asia/Kolkata, 1997-09-15 00:30 | September 15 | **1997-09-14** |
| America/Los_Angeles, 1997-09-15 23:30 | September 15 | **1997-09-16** |

These are local executions of the actual helper, not screenshots or a claim about how often a specific native picker emits these times. The helper's contract is wrong for a calendar date. Existing display-date tests do not cover this save path. Profile hydration at local noon also needs testing in extreme positive offsets.

`birthToUTC('2026-03-08', '02:30:00', 'America/Los_Angeles')` currently resolves to **03:30 -07:00**, although 02:30 did not exist on that day. Repeated fall-back hours also have no explicit user choice. A numerically accurate ephemeris cannot repair a wrong input instant.

**Work/accept:** serialize selected calendar fields without converting them through UTC; validate full date/time components; round-trip local input to catch DST gaps; reject nonexistent times with useful correction guidance and require a choice for ambiguous offsets. Test signup/edit/guest round trips in negative, positive, fractional, and extreme offsets, leap dates, DST gaps/folds, and devices in a different zone from the birthplace. Existing records cannot be safely bulk-shifted without knowing the intended birth date: define a user-confirmed correction path and chart rebuild/version implications. Preserve supported saved-chart compatibility.

### RH-03 — P1: make authentication recover from every failure path

**Confirmed source gaps.** [App startup](../client/App.tsx) awaits `getSession` without a rejection/retry path. [Login](../client/screens/LoginScreen.tsx), [Signup](../client/screens/SignupScreen.tsx), and [ResetPassword](../client/screens/ResetPasswordScreen.tsx) lack complete `try/finally` recovery. Reset's “Back to Login” can target a route absent while a recovery session is authenticated. [Profile](../client/screens/ProfileScreen.tsx) ignores returned `signOut` errors.

**Work/accept:** normalize returned and thrown errors, always clear pending controls, provide a recoverable startup failure, define recovery cancellation/logout semantics, and validate destinations against session state. Add Login/Signup screen tests plus exceptional reset/startup branches. Verify expired/reused links, cold/warm callbacks, repeated submits, session expiry, storage rejection, logout failure, and account A → account B isolation. Deletion must clear local access even if a subsequent remote logout fails. Do not silently skip failed writes during profile bootstrap.

### RH-04 — P1: protect journal edits and validate external navigation

**Source-supported native navigation risk.** [JournalEditor](../client/screens/JournalEditorScreen.tsx) cancels `beforeRemove`; the installed native-stack explicitly warns that this is not fully supported. Adopt the supported [navigation prevention hook](https://reactnavigation.org/docs/preventing-going-back/) and retain a single discard decision.

**Additional source-supported edit risk:** [App linking](../client/App.tsx) exposes `journal/edit/:id?`, but the editor initializes existing content only from route params and does not fetch the owned row by ID. A link containing an ID but no content opens a blank edit state; saving replacement text can overwrite that row. This path was inspected, not exercised against live data.

**Work/accept:** validate external parameter types and lengths; fetch the owned entry before enabling edit/save, or stop exposing unsupported edit links. Missing/deleted/foreign IDs get a safe result. Preserve entry metadata on edits. Test header/system/gesture back, Keep editing, confirmed discard, save failure/success, duplicate saves, and direct links with/without content. Record an explicit draft-recovery decision for OS termination; a navigation guard alone cannot preserve an in-memory draft after process death.

### RH-05 — P1: harden birthplace lookup and its production service

**Confirmed:** [geocode.ts](../client/lib/geocode.ts) embeds `EXPO_PUBLIC_OPENCAGE_KEY`, performs direct vendor requests, and has no request deadline. [Autocomplete](../client/components/auth/LocationAutocompleteField.tsx) invalidates request IDs only when a new request starts, allowing an older response after shortening a query, selection, or unmount.

**Work/accept:** put the vendor credential behind a controlled service, with input/length limits, deadlines, quota/abuse controls, redacted logs, and a key rotation plan. Signup uses this before authentication, so requiring a normal user session alone will break onboarding. Verify the vendor's production allowance, caching/logging terms, and query minimization. OpenCage [recommends a backend proxy for mobile clients](https://opencagedata.com/guides/how-to-protect-your-api-key). Cancel/invalidate lookup work on every query change, selection, and unmount; reject invalid coordinate ranges and malformed responses. Test out-of-order responses, offline/timeout/quota failure, and typed versus selected location semantics. No geocoder secret appears in the release bundle.

### RH-06 — P1: close the accuracy and freshness gaps beyond Sky Now

**Partial validation already exists.** Preserve the [JPL fixtures and rule checks](ui-redesign/current-sky-compass.md). [Whole Sign houses](../client/lib/astro.ts) still use an approximate Ascendant calculation with no comparable independent numerical coverage. [Dashboard guidance](../client/screens/DashboardScreen.tsx) refreshes on navigation focus but has no explicit resume/local-day/week rollover contract. Sky Now's own timer does not refresh the parent guidance.

**Work/accept:** add independent reference fixtures spanning dates, hemispheres, east/west longitude, high latitudes, and Ascendant sign boundaries. Define supported accuracy/range and behavior where a reference cannot be met. If output semantics change, assess `calculation_version` and saved-data handling; never rewrite user charts silently. Rebuild guidance when its relevant local date/week changes or on resume when stale, preserving the existing forecast selection semantics. Test midnight, Monday, DST, and device/profile timezone differences. Validate account-changing requests cannot publish stale results.

### RH-07 — P1: provide equivalent accessible exploration and final UI acceptance

**Confirmed structural gap:** Sky Now exposes accessible planet buttons, but its new aspect readings are selected through chart-line gestures. The SVG is hidden from assistive technology and there is no equivalent aspect-selection list. Add a compact accessible path to select/read each current aspect. [Auth fields](../client/components/auth/EmailField.tsx) also need explicit label association and error announcements verified; visual labels alone do not prove accessibility.

**Accept:** TalkBack can reach every aspect reading and core action; VoiceOver too if Apple ships. Test large text, long readings, empty/error/loading states, keyboard reachability, focus order, reduced motion, contrast over moving skies, and screen reader error recovery on the candidate. Natal chart selection glow still defaults to enabled through [ChartScreenContent](../client/components/charts/ChartScreenContent.tsx): gate it by app/route activity as Sky Now already does. Measure performance on a named modest Android device; do not infer battery/frame-rate claims from desktop timing.

### RH-08 — P1: finish privacy, support, and honest product controls

**Confirmed placeholder:** “Export my data” in [Profile](../client/screens/ProfileScreen.tsx) only displays a future-feature alert and unspecified support instruction. No working policy/support/deletion web path was established. Session tokens use [AsyncStorage](../client/lib/supabase.ts); Android backup is enabled.

**Work/accept:** ship a working export or accurately named data-request flow with a monitored destination and identity verification; link public privacy/support information before signup and in Profile. Inventory account/birth/guest/journal/location data and provider logs/backups; establish retention/deletion behavior without claiming end-to-end encryption. Choose and test credential storage/backup behavior. Hide unimplemented billing/promotional controls. Verify complete account deletion and retry behavior with related records, then handle a real disposable data/support request end to end.

Apple requires in-app deletion initiation for account-creating apps; Google additionally requires a usable web deletion-request resource. Naksha's server deletion implementation is a foundation, not proof of release-build completion. [Apple account deletion](https://developer.apple.com/support/offering-account-deletion-in-your-app/), [Google account deletion](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en). Finalize disclosures against actual behavior and launch markets.

### RH-09 — P1: triage dependencies and deliver the real production identity

**Confirmed:** app name/slug remain `client`; Android application ID/namespace are `com.anonymous.client`; [checked-in Gradle](../client/android/app/build.gradle) uses debug signing for its release build type. [app.json](../client/app.json) has no iOS bundle identifier. Source permissions include external storage and overlay access; generated/merged output must be inspected. EAS may inject signing configuration, so source defaults do not prove what an uninspected remote artifact uses.

**Dependency evidence:** current audit counts are above. `react-native → react-devtools-core → shell-quote@1.8.3` is a build/development path to inspect; [the critical advisory](https://github.com/advisories/GHSA-w7jw-789q-3m8p) is not evidence of a mobile remote-command exploit. `@react-navigation/native → core → query-string → decode-uri-component@0.2.2` is relevant to external link parsing; its [malformed-input advisory](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) needs mitigation and bounded regression tests. No denial of service was attempted. Axios/form-data are installed; no authored Axios imports were found. GL/Three code is dormant but still present. Complete reference/config checks before removing dependencies; `SpaceProvider` remains active.

**Work/accept:** settle owned identifiers and approved icon/splash assets; choose how checked-in Android resources stay synchronized with Expo configuration; manage release/upload signing and recovery ownership. Inventory every high/critical advisory by installed version, parent chain, reachable input, patch or reviewed mitigation; also address the exposed moderate decoder finding. Use compatible upgrades/targeted removal and rebuild. Do not run `audit fix --force` or assume every suggested Expo major upgrade is necessary. Preserve the device-approved picker exclusion until deliberately requalified. Inspect final permissions, signing certificate, package ID, version, assets, and environment from the signed candidate.

### RH-10 — P1: prove production services, diagnostics, and delivery

**Unknown hosted configuration, incomplete repository automation.** No CI workflow or crash-reporting integration was found. Supabase local defaults do not reveal hosted redirect allowlists, SMTP, abuse limits, migrations, or function deployment. The default Supabase mail service has testing restrictions; verify [custom SMTP and public delivery](https://supabase.com/docs/guides/auth/auth-smtp).

**Work/accept:** validate required environment values before building; verify deployed schema/functions and callbacks with disposable external accounts. Add repeatable typecheck/lint/tests, bundle checks, and isolated migration/ownership tests. Choose production crash/error visibility, redact auth URLs/tokens and personal/journal/location data, upload matching symbols/maps, and prove a controlled test event is diagnosable. Assign support, signing recovery, backup restore, and hotfix owners; rehearse a disposable restore and a candidate update. CI and a particular telemetry vendor are engineering choices; the required outcome is repeatable verification and a supportable product.

### RH-11 — Apple gate: qualify native iOS separately

**Source-supported picker risk, native behavior unverified.** [TimeField](../client/components/auth/TimeField.tsx) closes the iOS spinner on each change. Test editing hour/minute/AM-PM and implement draft values plus Done/Cancel if required; review DateField too. Decide whether iPad ships (`supportsTablet` is currently true).

**Accept:** owned bundle ID/team, signed archive using the current required SDK, TestFlight installation, functioning pickers/keyboard/back gestures, VoiceOver, and the complete account/chart/journal matrix on supported iPhone/iPad configurations. Inspect privacy manifests/required-reason APIs and accurate privacy disclosures. An iOS Hermes export is not an archive or a TestFlight qualification.

### RH-12 — P2: bound scale and remove avoidable noise

Charts and journals currently fetch complete lists/content without pagination. Establish a realistic launch-history size and test it; implement pagination or an explicit supported bound before it can silently hide records at server row limits. Consolidate Profile mount/focus loading, clean asynchronous `act` warnings, and inventory unused dependencies/licenses. Draft persistence and longer-history UX require explicit decisions; a stated small-beta bound can be temporary, but inaccessible existing records cannot be waived as cosmetic debt.

## Execution sequence

Owner roles below are responsibilities to assign, not additional staff assumed available. Estimates are focused engineer-days for one experienced engineer with access to devices and service accounts. Keep each package in a reviewable change; deploy database and service changes with their own rollout/rollback checks.

| Order | Package | Findings | Owner | Estimate | Exit condition |
| --- | --- | --- | --- | ---: | --- |
| 0 | Freeze candidate scope; collect identities, service access, support domain, device/tester availability | All | Product/release owner | 0.5–1 day | Free Android V1 including Sky Now fixed; decisions assigned, not silently assumed |
| 1 | Database ownership and deletion integration | RH-01 | Backend | 2–4 days | Clean/reset upgrade tests and two-account isolation pass |
| 2 | Birth date/time correctness and calculation fixtures | RH-02, RH-06 math | Mobile/domain | 2–4 days | Input round trips and documented numerical tolerances pass |
| 3 | Auth, external links, and journal reliability | RH-03, RH-04 | Mobile | 3–5 days | No stranded auth state, unsafe edit link, or broken discard guard |
| 4 | Protected geocoding and verified public onboarding | RH-05, RH-10 services | Backend/mobile | 2–4 days | Reliable pre-signup lookup and independent external-email signup/reset |
| 5 | Accessibility, freshness, and bounded lifecycle/scale fixes | RH-06 UI, RH-07, RH-12 | Mobile/QA | 2–3 days | Current guidance, accessible Sky Now, inactive motion paused |
| 6 | Privacy/support, truthful controls, approved branding | RH-08, RH-09 identity | Owner/design/mobile | 2–4 days | Every visible data/support action works; policy and listing drafts match behavior |
| 7 | Dependency disposition, release configuration, CI and diagnostics | RH-09, RH-10 tooling | Mobile/release | 3–5 days | Reproducible signed candidate with inspected configuration and diagnostic proof |
| 8 | Store-delivered beta, acceptance matrix, fixes, submission packet | All applicable | QA/release | 3–5 days initial cycle | Required gates pass on the exact candidate; no open blocking defects |

**Revised Android planning range: approximately 20–35 focused engineer-days**, plus tester/account/store elapsed time. The earlier 1–2-week beta statement was optimistic for an externally distributed beta that meets these gates; the reproduced date bug and broader correctness checks need space in the schedule. Internal development testing can continue throughout. A public submission window around **5–8 calendar weeks** is a planning assumption with steady availability, overlapping owner tasks, and no major SDK migration; re-estimate after packages 1–4. This is not an approval or delivery promise.

Apple adds native build/device/SDK work, provisionally **8–15 further engineer-days**, and external review time. If Apple becomes first priority, move its signed build/picker spike to package 0 instead of discovering those risks at the end.

**First implementation work:** RH-01 and RH-02, followed by auth/journal failures. Owner/service/account/listing work starts alongside them. Build a signed internal candidate early enough to expose native problems; do not distribute an external beta with known integrity or data-loss defects.

## Current store checks

Rechecked against primary documentation during this review; recheck against the actual console at submission.

- Google phone-app submissions currently require Android 16 / API 36. Installed RN configuration resolves SDK 36; verify the final AAB rather than relying on that source setting. [Google target API policy](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en).
- Inspect all shipped native libraries and test 16 KB page-size compatibility. Follow current Play Console enforcement/extension notices; do not copy an old universal deadline. [Android page-size guidance](https://developer.android.com/guide/practices/page-sizes).
- For applicable personal developer accounts created after November 13, 2023, production access requires a closed test with at least 12 testers continuously opted in for 14 days, followed by the production-access application. Check the owner's account eligibility early. [Google testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en-GB).
- Apple uploads require the iOS/iPadOS 26 SDK or later since April 28, 2026. Verify the selected native build toolchain. [Apple SDK requirement](https://developer.apple.com/news/?id=ueeok6yw).
- Complete accurate listings, privacy/data-safety forms, screenshots from the final build using fictional data, and reviewer access. Apple's 4.3(b) differentiation review is relevant to fortune-telling apps: explain Naksha's actual chart/guidance/journal experience without promising unshipped features or approval. [Apple review guidelines](https://developer.apple.com/app-store/review/guidelines/).

## Candidate acceptance record

For each row record build ID, source commit, backend versions, device/OS, date, tester, result, and evidence. Use disposable data. Test store/internal-release delivery without Metro; a change to native configuration requires a new native artifact.

| Area | Required evidence |
| --- | --- |
| Identity/startup | Owned ID, approved assets, release signing; fresh install/update/cold start; offline/storage/config failure recovers |
| Accounts | External signup/OTP/resend/recovery; expired/reused links; signed-in recovery cancellation; logout and account-switch isolation |
| Birth input/calculation | Same calendar date survives every entry/edit path; DST gap/fold handling; reference planets/Ascendant/house signs within documented tolerances |
| Chart persistence | Self autosave, guest manual save, missing-coordinate view-only, malformed/legacy/future saved data, failed save/delete |
| Guidance/Sky Now | Correct local day/week after resume/rollover; stable selection; inaccessible aspect gap closed; interpretation never alters calculations |
| Journal | Owned entry loaded from ID; preserved metadata; create/edit/delete; all back routes; save failure; long writing and keyboard; draft-loss boundary recorded |
| Backend/deletion | Two-account reads/writes/foreign-parent rejection; unauthorized/expired-token deletion rejection; partial failure/retry; deployed versions match |
| Accessibility/performance | TalkBack/VoiceOver as applicable; large text/contrast/focus; modest device; memory, inactive animations, repeated use, realistic history |
| Data/support | Working policy/support/deletion/data request; tested local credential cleanup/backup choice; no private payloads in diagnostic events |
| Operations | Green automated checks, advisory dispositions, inspected artifact/permissions, diagnosable controlled error, restore/hotfix/support owners |
| Distribution | Play-delivered candidate and account testing prerequisites; TestFlight/native acceptance separately if Apple ships |

**Go/no-go:** release only after P0/P1 items applicable to the chosen platform have passing evidence or a real scope reduction removes the affected feature/exposure. Record P2 deferrals with an owner and limit. Do not treat green unit tests, a smooth development walkthrough, or a successful JS export as substitutes for these gates.

## Decisions that need the owner before their dependent work

Keep Android first and free V1 as the current working scope. Before implementation reaches dependent steps, confirm permanent Android/iOS identifiers and signing owner; launch countries/audience; support address/domain and retention policy; production Supabase/SMTP/geocoder accounts and quotas; available devices/testers/store account access; Apple timing/iPad support; data-export versus verified request flow; and draft-recovery behavior. These are tracked prerequisites, not reasons to delay independent code fixes or require another broad planning round.
