# Naksha release-hardening plan

Updated **30 September 2026 (Pacific)** after R5 completion through **`88c5d2adbc66b945f7e72a773bf969c456acc9ce`**, branch **`ui/v2-redesign`**. This is the canonical current roadmap. The [12 September readiness review](release-readiness-2026-09-12.md) remains a historical snapshot.

## Release decision and scope

Naksha's free V1 feature loop and primary visual design are substantially implemented. Public Android release is not yet approved. Android remains the launch platform; iOS follows after Android launch unless requirements change.

R1–R5 are **repository complete**: their implementation, applicable local database verification, application regression gates, and independent reviews are complete. This does not by itself establish that every reviewed migration is deployed to production or that a store candidate has passed real-device acceptance. Production versions and behavior must be verified during release-candidate work.

The V1 scope remains accounts/profile, Tropical/Whole Sign natal and guest charts, saved charts, daily and weekly guidance, Sky Now, and private journaling. AI, synastry, social features, subscriptions, reports, extra astrology systems, and another UI redesign are outside release hardening.

## Roadmap status

| Slice | Status | Scope |
| --- | --- | --- |
| R1 | ✅ **COMPLETE** | Relational ownership and database integrity |
| R2 | ✅ **COMPLETE** | Civil birth date/time correctness |
| R3 | ✅ **COMPLETE** | Journal and client write-surface integrity |
| R4 | ✅ **COMPLETE** | Authentication recovery and Android security/identity |
| R5 | ✅ **COMPLETE** | Astrology calculation correctness |
| R6 | 🔵 **IN PROGRESS** | Remaining engineering release readiness |

After R6: **C1 → C2 → C3 → C4 → Release Candidate → Play testing → Android launch → stabilization → iOS → post-launch expansion**.

## R1 — Relational ownership and database integrity

**Status: REPOSITORY COMPLETE. Production deployment must be verified before release.**

**Problem.** Row ownership policies verified the child row's `user_id`, while parent foreign keys historically verified only that a parent ID existed. A user-owned child could therefore reference another user's parent and potentially interfere with deletion.

**Completed invariant.** Composite same-owner foreign keys now enforce journals → charts, conversations → charts, reports → charts, and messages → conversations. Optional chart relationships preserve `NULL`; PostgreSQL 17 column-specific `ON DELETE SET NULL (chart_id)` preserves the child's non-null owner. The migration fails on invalid legacy relationships instead of silently deleting, shifting, or reassigning data. Dormant conversations/messages/reports client writes and unnecessary client `TRUNCATE`, `REFERENCES`, and `TRIGGER` privileges were removed; `service_role` behavior remains available.

**Verification.** Clean replay and pre-R1 upgrade replay passed. Two-user pgTAP coverage proved same-owner success, cross-owner insert/update rejection, nullable-parent behavior, deletion isolation, chart/journal survival semantics, dormant-table denial, service behavior, and account-deletion dependency order.

**Review.** Independently reviewed and approved, with non-blocking privilege-hardening notes completed before the R1 commit.

## R2 — Civil birth date/time correctness

**Status: REPOSITORY COMPLETE. Production deployment must be verified before release.**

**Problem.** Civil calendar dates and wall-clock times were carried as JavaScript `Date` instants in parts of the pipeline. UTC conversion could move the stored birth date, malformed values could normalize, and DST gaps/folds were resolved silently.

**Completed invariant.** `CivilDate` and `CivilTime` are the persisted application contract. Validated civil fields serialize directly to `YYYY-MM-DD` and `HH:mm:ss`. One authoritative civil + IANA zone + optional fold offset boundary resolves the exact UTC instant. DST gaps are rejected, fold occurrences require an explicit choice, and `birth_utc_offset_minutes` on users/charts reproduces that choice. Canonical chart identity includes the nullable fold offset with `NULLS NOT DISTINCT`. Legacy rows were preserved without guessed correction. Picker adapters reject device-local skipped calendar dates rather than substituting another date.

**Verification.** Coverage includes negative, positive, fractional, and UTC+14 offsets; leap dates; repeated hydrate/save cycles; real process time-zone changes; DST gaps and folds; invalid values; exact calculation instants; and Pacific/Apia and Pacific/Fakaofo's skipped 2011-12-30. The verified post-R2 application baseline was **62 suites / 784 tests**.

**Review.** Independently reviewed and approved, with skipped-date and real device-time-zone regression notes completed before the R2 commit.

## R3 — Journal and client write-surface integrity

**Status: REPOSITORY COMPLETE. Production deployment must be verified before release.**

**Problem.** A shared journal upsert could turn omitted edit fields into `NULL`, the editor trusted route content before loading an owned row, and broad database grants allowed authenticated clients to choose or update server-generated journal/chart IDs. `usage_events` also retained an unused V1 write surface.

**Completed invariant.** Journal creation, patch update, and owned fetch are separate operations: `insertJournal()`, `updateJournal()`, and `getOwnedJournal()`. Edit links use the ID only to fetch the authoritative owned record. Missing, foreign, malformed, and deleted rows remain non-editable; failed saves preserve typed text and dirty state. Content-only updates omit unrelated metadata. Column-level grants allow only intended journal/chart write columns, prevent client control of primary keys, reduce active sequence access to `USAGE`, remove unused `usage_events` client writes, and preserve `service_role`.

**Verification.** The post-R3 gate passed **62/62 application suites and 793/793 tests**, TypeScript, lint, and `git diff --check`. R3 pgTAP passed **47/47**; combined R1/R2/R3 pgTAP passed **131/131**. Clean replay, pre-R3 → R3 upgrade with representative rows, canonical chart upsert, R1/R2 compatibility, and service-role account deletion all passed.

**Review.** Independent Claude/Opus verdict: **APPROVE WITH NON-BLOCKING NOTES**. Those notes remain R6 defense-in-depth follow-up and are not R3 blockers.

## R4 — Authentication recovery and Android security/identity

**Status: REPOSITORY COMPLETE.** Authentication recovery, Android identity/security configuration, approved branding, and first-run auth/guest-chart polish are committed. Production signing, signed-artifact inspection, and real-device acceptance remain release-candidate gates; repository completion does not claim that those external checks have passed.

### Authentication and recovery

- Make startup `getSession()` rejection resolve into an explicit recoverable state instead of leaving initialization pending.
- Give login, signup, verification, and recovery asynchronous paths reliable `try/catch/finally` behavior, usable retry, and clear session-failure UX.
- Cover CheckEmailScreen's unhandled rejection path.
- Define recovery, logout, reset, account-switching, expired-session, and account A → account B behavior without stale private state.
- After successful account deletion, do not let a later `signOut` failure falsely report that deletion itself failed.
- Remove the navigation reset race that may target Dashboard before the authenticated navigator has registered it.
- Add exceptional-path tests and complete real-device cold/warm callback, retry, cancellation, and network-failure checks.

### Completed repository implementation

- Auth bootstrap has explicit initializing, authenticated, unauthenticated, and recoverable error states. Retry is re-entrant; auth events supersede stale bootstrap results. Authenticated identity changes remount the full `NavigationContainer`, discarding prior route history and parameters; cold-start URLs are consumed once across those remounts while runtime links remain active.
- Login, signup, OTP verification/resend, callback exchange, password recovery/reset, sign-out, and account deletion handle rejected promises without stranded controls. Navigation follows central auth state; recovery carries an explicit callback intent across same-user and cross-account callbacks, CheckEmail does not target an unavailable route, and successful server deletion is distinguished from local sign-out cleanup.
- Sign-out is local to the current installation. A revoked or missing persisted refresh token is cleared locally during bootstrap and resolves to the signed-out app instead of trapping the user in a restore-session error.
- Login, Signup, and Guest Chart use the completed first-run form hierarchy and shared field appearance without changing their data contracts or navigation behavior.
- The owner-approved Android ID is `com.naksha.app`; the visible name is **Naksha**. The `client` Expo slug and existing EAS project ID remain unchanged. The production deep-link scheme remains `naksha`; the `exp+client` scheme is confined to debug manifests.
- Release builds no longer use the checked-in debug key. Local release signing requires all four untracked `NAKSHA_UPLOAD_*` values; EAS production explicitly uses remote credentials and produces an app bundle with remotely managed `versionCode` increments.
- Production config removes legacy storage, overlay, and vibration permissions; permits internet access; disables cleartext traffic and backup; and excludes AsyncStorage databases from both legacy backup and Android 12+ cloud/device-transfer paths.
- Approved Naksha launcher, adaptive foreground, splash, logo, and wordmark assets are present. Expo and checked-in Android resources use the approved navy branding, including the Android 12+ splash background override.

**Current verification.** Focused R4 auth/native-configuration coverage passes. The full application gate passes **68 suites / 839 tests**, TypeScript, lint, and Android JavaScript export. Expo dependency validation is current; Expo Doctor remains 17/18 solely because checked-in native projects and app config make this a non-CNG project. XML parsing and Expo introspection pass, with introspected Android permissions limited to `INTERNET`. A merged native release manifest and signed artifact could not be produced with the installed environment because Android SDK 36/NDK 27 and production signing credentials are unavailable.

### Remaining release-candidate gates

- Establish and back up the EAS/Play upload keystore under an explicitly accountable owner; no production credential was created or inspected during R4 repository verification.
- Build a signed AAB with Android SDK 36/NDK 27 tooling, inspect its certificate, merged manifest, package, label, version code, debuggable flag, links, permissions, backup policy, and assets, then complete R4 real-device auth/deep-link acceptance.

### Android production identity and security

- Replace the current/historical development identity `client` with the production app name **Naksha**.
- Choose and record the final intentional Android package/application ID and production deep-link scheme.
- Configure release/upload signing with documented ownership and recovery.
- Remove unnecessary Android permissions and inspect the merged release manifest.
- Decide and test session-token backup behavior, including `android:allowBackup` and the Android data-extraction policy.
- Verify production build name, package ID, scheme, version, certificate, permissions, environment, and assets.
- Produce and inspect a signed Android AAB. Store delivery belongs to the later RC phase.

**R4 repository exit gate.** Auth failure paths recover without stranded controls or invalid navigation; account deletion messaging reflects the actual result; account switching does not leak state; revoked local sessions recover safely; and checked-in Android identity, links, permissions, backup policy, and branding match the approved configuration. The signed-AAB and device checks above remain mandatory before release. Android remains first; no iOS qualification is required in R4.

## R5 — Astrology calculation correctness

**Status: COMPLETE.** The suspected Ascendant/Descendant branch inversion was confirmed. At sufficiently high absolute latitudes above roughly the polar-circle threshold (~66.56°), the previous algebraic branch could return the western, setting ecliptic-horizon intersection rather than the eastern, rising intersection. The result was approximately 180° wrong and could shift the Whole Sign first house by six signs.

**Completed correction.** The existing Ascendant formula remains in place, followed by an explicit rising-versus-setting classification from the altitude change as local sidereal time advances. A setting result is rotated 180° to the antipodal rising point and normalized. Normal-latitude output is preserved. Independent northern and southern fixtures cover low, mid, high, and inversion-producing latitudes, both sides of branch transitions, rising-versus-setting classification, and sign-boundary behavior.

**Persisted compatibility.** New calculations emit `schema_version: 1` and `calculation_version: 2`. Unversioned ChartData and explicit calculation V1 remain readable as historical persisted results. V1 data with missing houses or planet-house assignments is not hydrated using V2 calculations, so Naksha does not create mixed V1/V2 payloads. Future calculation versions remain unsupported. Existing historical V1 high-latitude charts are not silently recalculated or relabelled; a future explicit recalculation/upgrade path may be considered if product need justifies it.

**Verification and review.** The focused independent-reference matrix and compatibility tests pass, as does the full post-R5 application gate: **69 suites / 843 tests**, TypeScript, lint, and `git diff --check`. R5 was independently reviewed, approved, and committed. Planetary bodies, aspect rules, schema shape, and Whole Sign house policy were not redesigned.

## R6 — Remaining engineering release readiness

**Status: IN PROGRESS.** R6.1 runtime freshness, R6.2 accessibility/motion, and R6.3 release infrastructure are complete. R6.4 final repository hardening is implemented pending independent review and the one repository-wide R6 gate. External production/store work is tracked in the [Release Candidate checklist](release-operations.md#release-candidate-and-production-checklist).

### CI and quality gates

- **R6.3 completed:** `.github/workflows/ci.yml` runs typecheck, lint, Jest, changed-line whitespace validation, clean local migration replay, and all pgTAP suites on pull requests and pushes to the maintained integration branches. It uses locked npm installs and local Docker/Supabase without hosted credentials.
- Keep signed bundle/configuration checks appropriate to a release candidate; source CI does not replace artifact inspection or device acceptance.
- The external Droid audit demonstrated the value of automation, but its claim that committed pre-R3 HEAD contained an `upsertJournal` test/implementation mismatch was incorrect. The actual committed pre-R3 HEAD was independently verified green; do not repeat that claim.

### Supabase and generated types

- **R6.3 completed:** regenerated `client/lib/database.types.ts` from the linked authoritative `public` schema. The generated relationships now describe the R1 composite owner foreign keys, and the R2 columns remain represented.
- Re-run the same linked generation after future production migrations; verify deployed migration/function versions independently because generated types do not prove function deployment or runtime policy behavior.

### Database write-surface follow-up

- **R6.4 implemented, pending review/deployment:** the shipped client only reads subscriptions/purchases and has no direct notification/subscription/purchase mutation path. One forward migration revokes their anon/authenticated DML and sequence access, removes the dormant notification-update policy, preserves owner-scoped reads, and leaves service-role behavior unchanged.
- Users' birth columns still have broad table-level write grants but are self-row scoped by RLS; consider tighter column privileges only if active flows remain compatible.
- `journals.chart_id` currently appears unused by V1 client behavior; confirm its product purpose before retaining or removing client mutation paths.
- Treat these Claude R3 notes as defense in depth, not reopened R3 blockers.

### Hydration and persisted-chart resilience

- Prefer validated `chartData.meta` over caller-supplied fields during hydration where it is the authoritative persisted value.
- Reject or recover clearly from empty `houses` or `planet_houses` arrays rather than hydrating an unusable chart.
- Verify house-ordering assumptions and durable errors for unsupported or malformed saved charts.

### Lifecycle and freshness

- **R6.1 completed:** Dashboard guidance evaluates freshness on focus/resume and at the earlier of one active hour after the last successful Today evaluation or the next profile-local midnight. Weekly guidance changes on its profile-local week key. Timers stop off-screen/in background, guidance-only refresh avoids database/chart work, Current Sky follows a bounded active cadence, and retry/full-load guards prevent competing refreshes.
- Duplicate Profile/Journal list mount-plus-focus fetches remain a bounded follow-up where they are still present.

### Accessibility and motion

- **R6.2 completed at repository level:** Sky Now exposes semantic aspect selection with concise announcements and contextual chart labels; chart motion respects route/app activity; modal semantics and reduced-motion transitions are covered by focused tests.
- TalkBack focus behavior, large text, contrast, Android Back, relevant device sizes, and motion on a signed candidate remain real-device acceptance work.

### Geocoder

- **R6.4 implemented:** OpenCage requests have a bounded timeout, caller cancellation, query-change/unmount invalidation, request-generation stale-response protection, clean network/timeout errors, and silent cancellation. Existing malformed-result filtering and timezone parsing remain intact.
- Choose a production API-key/proxy strategy with quota, abuse, logging, and signup-before-auth constraints accounted for.

### Product correctness and settings

- Stop silently overwriting the `show_house_degrees` preference.
- Avoid ambiguous timezone abbreviations such as IST/CST where a zone identifier or offset is required.
- Provide durable errors for unsupported saved charts and distinguish MyCharts authentication failures from network failures.

### Privacy, support, services, and operations

- The misleading Export My Data placeholder is hidden in R6.4. Expose an action only after a working export or accurately named, monitored data-request flow exists.
- Publish and link accurate privacy, support, and web account-deletion destinations.
- Verify hosted Supabase configuration, redirects, SMTP delivery, rate/abuse limits, reviewed migrations/functions, two-account isolation, and deletion behavior.
- Evaluate verified Android App Links before release as defense against custom-scheme interception. The approved `naksha://` scheme remains in R4; do not treat PKCE code exchange and legacy implicit fragment-token exposure as equivalent.
- No remote crash reporter is currently configured. Decide whether launch will use an approved privacy-scoped service or explicitly accept local-only diagnostics, then prove a controlled event is diagnosable without tokens or private payloads.
- Follow [release-operations.md](release-operations.md) for the current backup limits, pre-migration backup checklist, public environment boundary, missing external destinations, and ownership that must be assigned before release.

### Dependencies and hygiene

- **R6.4 implemented:** a semver-compatible React Navigation core update removes the reachable `query-string` → `decode-uri-component` deep-link path; focused navigation/deep-link tests and signed-artifact confirmation remain required. The `nanoid` precondition does not match its current React Navigation usage. Build/dev-only advisories remain an artifact-verification item rather than a forced-upgrade target.
- Direct `axios` was repository-wide unused and is removed. `zustand` and `expo-file-system` remain installed through active/dormant dependency relationships; Three/Fiber/GL remains referenced by the dormant `SpaceBackground` source and was not removed.
- The root `.gitignore` markdown-fence artifact is fixed. Remove other dormant dependencies, stubs, contexts, or providers only when clearly unused and safe.
- Bound chart/journal history or add pagination before server row limits can hide existing data.

**R6 repository exit gate.** Automated gates are repeatable; schema/types and source-controlled grants are reconciled; active network and hydration paths fail safely; accessibility/lifecycle source checks pass; diagnostics are sanitized; dependency decisions are recorded; and no known source-code release blocker remains. Production environments, public destinations, backups, signing, signed artifacts, device acceptance, and Play delivery remain Release Candidate gates.

## Content phase — required after engineering hardening

Completing R6 does not make Naksha automatically launch-ready. Deterministic astrology content requires a dedicated freeze and review, especially Weekly Forecast composition, which can sound robotic or assembled even when its underlying astrology data is correct. AI is not required.

### C1 — Lexicon completeness

Find missing or inconsistent lexicon entries and prove every supported deterministic combination has an intentional fallback.

### C2 — Editorial quality

Review repetitive or generic phrasing, tonal inconsistency, light/shadow balance, prompt/practice relevance, and Today's Energy repetition.

### C3 — Composition quality

Review how deterministic fragments combine, with particular attention to Weekly Forecast. Target this structure:

**strongest theme → supporting/transitional influence → area of life → tension/opportunity across the week → reflection/practical close**

### C4 — Astrology editorial review

Have an astrology-qualified reviewer check terminology, interpretive coherence, sign/house/aspect emphasis, light/shadow balance, and practical guidance without changing verified calculations casually.

## Release-candidate sequence

### RC1 — freeze and build

- Freeze features and content.
- Verify production Android identity and production Supabase configuration.
- Apply release signing and produce the signed AAB.
- Tie source commit, migration/function versions, configuration, and artifact identity together.

### Real-device acceptance

Test signup, email verification, login, profile, all birth-data flows, natal chart, Sky Now, guidance, saved charts, journals, account deletion, restart/resume, network failure, TalkBack/accessibility, reduced motion, keyboard/back behavior, and relevant Android device sizes. Use disposable accounts and invented data; record build, device, OS, result, and evidence.

### Production backend verification

- Run deployed-data preflights, prepare recovery, and deploy only reviewed migrations.
- Verify RLS/policies, two-account isolation, migration/function versions, SMTP, auth redirects, account deletion, environment configuration, and geocoder configuration.
- Do not infer production state from local replay alone.

### Google Play testing

- Upload the signed AAB to a Play testing track and install the Play-delivered artifact.
- Check the developer account's current production-access and tester requirements at that time.
- Re-run affected acceptance checks against the store-delivered build.

### Store submission

Prepare the final icon, screenshots, feature graphic, description, privacy policy, support information, Data Safety answers, account-deletion disclosure, content rating, target audience, reviewer information, and release notes. All claims must match the candidate and production services.

### Launch and stabilization

Avoid immediate feature expansion. Monitor crashes, authentication, deletion, database behavior, performance, support requests, and reviews. Ship narrow fixes and preserve the ability to roll back or pause rollout.

## Post-launch roadmap

Future scope is separate from V1 release blockers:

**stabilization → iOS → relationships/synastry → deeper transit intelligence → AI assistant if demand supports it → social features only if demand supports them**

iOS requires its own identifiers, signing, native build, TestFlight delivery, picker/gesture/keyboard/device QA, accessibility, and store disclosures. It is not implied by a passing iOS JavaScript export.

Ownership remains private by default. Any future chart sharing or social access must use explicit authorization/sharing records. Do not weaken R1 same-owner constraints to enable cross-user features.

## Release decision

Release only after R1–R6 and C1–C4 are complete, the exact signed candidate passes recorded real-device and production-backend acceptance, and the Play-delivered build satisfies current account-specific testing requirements. Green unit tests or a development walkthrough are necessary evidence, not substitutes for those gates.
