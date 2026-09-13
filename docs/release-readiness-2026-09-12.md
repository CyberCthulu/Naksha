# Naksha release-readiness review and plan

> Historical review. Superseded for execution/status by [release-hardening-plan.md](release-hardening-plan.md), reviewed later on 12 September at `ab9c16c1`. The wheel-test mismatch is resolved; 58 suites / 737 tests and both JS exports now pass; Sky Now has JPL reference checks and pair readings. The new review also reproduces birth-date serialization/DST problems and identifies journal direct-edit-link risk. Its revised gates and estimates supersede the ranges below. Findings here remain evidence of the earlier baseline, not a current sign-off.

Review date: **12 September 2026**  
Reviewed baseline: **06ad5378**, branch **ui/v2-redesign**, plus the observed uncommitted Sky Now work.  
Scope: existing free V1; Google Play and Apple App Store assessed separately.

## 1. Diagnosis

**Naksha has a substantially implemented product and is entering release hardening. It is not ready for public submission to either store today. Android is closer; no native Apple release qualification was documented or returned in the inspected build history.**

The core experience is coherent: create an account, enter birth details, explore a natal chart, read daily/weekly guidance, and save reflections in a private journal. There is enough here for a focused V1. Another broad feature or visual redesign is not the shortest route to release.

The remaining work is consequential: production identity and signing, privacy/support, database integrity, reliable onboarding, dependency triage, production diagnostics, and native release-build QA. Some are observed code defects; others are missing evidence. This distinction matters: an unverified setting is not automatically misconfigured, and a passing component test is not device approval.

| Area | Current assessment | What prevents sign-off |
| --- | --- | --- |
| Core V1 feature loop | Substantially implemented | Edge cases, external-reference calculation checks, and final acceptance |
| UI consistency | Broadly implemented | Final large-text, keyboard, accessibility, contrast and performance review |
| Automated quality | Strong foundation, current gate red | One test mismatch in work in progress; important auth and database integration gaps |
| Auth and account lifecycle | Implemented, needs hardening | Recovery cancellation, exceptional failures, real public email delivery, release-build deletion |
| Backend/data integrity | RLS and migrations exist; one significant source-level defect | Ownership of related records is not enforced consistently |
| Privacy/support | Incomplete visible product behavior | Public policy/support/deletion URLs and a real data-request path |
| Android packaging | Development builds proven | Permanent identity, production signing/artifact inspection, Play delivery |
| Apple packaging | Not qualified | Bundle ID, signing, Xcode/SDK build, TestFlight, iPhone/iPad behavior |
| Operations | Early | Crash visibility, repeatable checks, restore/hotfix/support process |
| Store submission | Not assembled/verified | Listings, disclosures, reviewer access, account eligibility and final binaries |

A single percentage would hide the difference between implemented features and release gates. The more useful milestone is **a stable, supportable release candidate installed through the relevant store testing channel**.

### Planning range

These are engineering estimates, not completion promises. They assume one experienced React Native engineer working consistently, prompt owner decisions, a free V1, access to test devices/accounts, and no major SDK migration or newly discovered calculation defect.

| Milestone | Planning range from a scope freeze | Conditions |
| --- | --- | --- |
| Android build suitable for a small external beta | About 1–2 focused weeks | Critical integrity/onboarding issues fixed; minimum privacy/support and a signed test artifact |
| Android public submission readiness | About 4–7 calendar weeks | Approximately 17–27 engineering days across the work below; testing can overlap |
| Apple submission readiness | About 6–10 calendar weeks | Shared fixes plus roughly 8–15 additional engineering/QA days for iOS, with build/review uncertainty |
| Both stores together | Plan around the Apple range | More device coverage and separate store submissions |

Store-account verification, tester recruitment, external production access and review queues can extend those ranges. If Google's newer-personal-account rule applies, a closed test requires **at least 12 continuously opted-in testers for 14 days**, followed by an application for production access; completing the period is not automatic approval. [Google testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)

## 2. What was actually verified

This was a review, not a remediation or deployment. Existing application edits were preserved. No live user records were inspected, no database mutations were performed, and no new build/submission was started.

The working tree was changing during the review: new Sky Now tests and documentation appeared. Results below describe the commands actually run, not a permanently frozen final candidate.

| Check performed | Result | Interpretation |
| --- | --- | --- |
| TypeScript typecheck | Passed | Compile-time checking of this checkout |
| ESLint | Passed | No reported lint errors |
| Full Jest run | **55 passed / 1 failed suites; 696 passed / 1 failed tests; 697 total** | The current checkout does not satisfy its automated gate |
| Isolated committed-baseline check | ChartScreenContent: **33/33 passed** at 06ad5378 | The failing prop-contract assertion is associated with the uncommitted wheel change |
| Android and iOS Metro/Hermes exports | Both passed | JavaScript/assets can be bundled; this is not native compilation or signing |
| Expo install check | Up to date in offline mode | Offline validation has limits; picker 2.11.3 is intentionally excluded |
| Current Expo Doctor | **17/18** | Native configuration may not sync from app.json because Android sources are checked in |
| Whitespace check | Passed before this report | No whitespace issues in observed application edits |
| npm production-dependency audit | **41 affected package entries: 1 critical, 19 high, 20 moderate, 1 low** | Requires reachability/toolchain triage; not 41 demonstrated mobile exploits |
| EAS build history, read-only | Five returned records, all Android development builds: three finished, two older failures | No production or iOS build was returned for the linked project |
| Latest finished EAS build | c598220c… at a63460f1, completed 7 September | Proven development packaging, not a release candidate |

The single Jest failure is [ChartScreenContent.test.tsx:641](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/charts/__tests__/ChartScreenContent.test.tsx:641). Its exact list of expected wheel props omits the newly passed motionEnabled prop. This is a test/implementation contract mismatch; it is not evidence that natal chart calculations are broken. Resolve it as part of finishing the feature and retain meaningful geometry/behavior assertions. The run also emitted asynchronous act warnings in wheel tests; clean these up so real warnings remain visible.

The [latest EAS development build](https://expo.dev/accounts/cybercthulu/projects/client/builds/c598220c-b918-44db-b306-1fbb1286ba37) can load later compatible JavaScript. Its age alone does not invalidate subsequent visual testing. It still does not establish production signing, standalone startup, or store delivery.

Not verified here: a new physical-device walkthrough; production database state and hosted auth settings; Apple/Play account enrollment or listings; production credentials; email-provider and geocoder contracts; live privacy/support websites; actual release artifact permissions, privacy manifests and native library alignment.

## 3. Existing work that should be retained

- Fourteen registered routes cover account creation/verification/recovery, profile completion, dashboard, charts, saved charts, journal list/editor and profile.
- Tropical calculations, ten natal planets, Whole Sign houses when coordinates exist, five major aspects, saved-chart validation and version compatibility are implemented.
- Self-chart autosave and explicit guest-chart saving are separated; missing-coordinate charts intentionally remain view-only.
- Daily/weekly guidance and authored reflection content connect to a working journal flow.
- Runtime validation, unsupported-version handling, shared hydration, typed navigation, and many stale-operation guards already exist.
- Shared typography, controls, 48 dp targets, safe-area handling, reduced-motion support and route-aware background animation are substantial foundations.
- Account deletion validates the user's JWT on the server, derives the deletion target from it, and keeps service-role access server-side. Historical disposable-account QA is recorded.
- **The picker fix is now device-approved**, superseding the earlier handoff. Preserve picker 2.11.3 and its documented exclusion.
- Saved charts now use a static chart emblem from Slice 9C; the earlier six-mini-wheel story is historical, not the current list implementation.

Sources: [app routing](/home/vinal/Vins-ProjectDirectory/Naksha/client/App.tsx:204), [picker approval](/home/vinal/Vins-ProjectDirectory/Naksha/docs/ui-redesign/redesign-plan.md:171), [Slice 9C](/home/vinal/Vins-ProjectDirectory/Naksha/docs/ui-redesign/redesign-plan.md:548), [account deletion evidence](/home/vinal/Vins-ProjectDirectory/Naksha/docs/naksha-codebase-handoff.md:383).

AI chat, subscriptions, paid reports, synastry, reusable relationship profiles, notifications and additional calculation systems are **not required to finish the existing free V1**. Keep them outside this launch. Sky Now is an explicit scope decision because it is currently changing shared chart components.

## 4. Findings to resolve before release

Priority definitions: **P0** means resolve before external beta because it affects data integrity/security; **P1** means a public-release gate; **P2** means targeted hardening or a documented, bounded deferral. These are review priorities, not claims that every item violates a store rule.

### R01 — P0: related-record ownership can interfere with another user's deletion

**Confirmed in the source-controlled schema; deployed exposure not tested.**

Insert/update policies on conversations, messages, reports and journals check the row's user_id, but do not consistently require that the referenced chart/conversation belongs to the same user. Foreign keys reference parent IDs without matching ownership.

An authenticated user can therefore create an owned conversation/report referencing another user's valid chart ID if the deployed schema matches these migrations. The foreign reference can prevent the chart owner from deleting that chart. Account deletion removes rows matching the account's user_id, so it can leave that foreign-owned reference in place and fail later. This is an integrity/deletion-availability defect; this review did not establish cross-user reading of private content.

Evidence: [ownership policies](/home/vinal/Vins-ProjectDirectory/Naksha/supabase/migrations/20260508015720_remote_schema.sql:602), [parent foreign keys](/home/vinal/Vins-ProjectDirectory/Naksha/supabase/migrations/20260508015720_remote_schema.sql:514), [deletion sequence](/home/vinal/Vins-ProjectDirectory/Naksha/supabase/functions/delete-account/index.ts:70). PostgreSQL's referential-integrity checks bypass row security; SELECT isolation alone does not fix this. [PostgreSQL documentation](https://www.postgresql.org/docs/17/ddl-rowsecurity.html)

**Action:** revoke unused V1 client writes where appropriate and enforce parent ownership for every retained relationship, including journal chart references. Ship an incremental migration, inspect existing invalid relationships safely, and verify two-user insert/update/read/delete isolation against a disposable database. Retest complete deletion after deployment.

### R02 — P1: privacy/support promises are incomplete

**Observed app gap; external website existence unverified.**

“Export my data” currently opens an alert saying the feature is future work and instructing the user to contact unspecified support. It neither exports nor starts a support request. No operative privacy/support links were found in the reviewed signup/Profile flow.

Evidence: [export handler](/home/vinal/Vins-ProjectDirectory/Naksha/client/screens/ProfileScreen.tsx:220), [DataPrivacyCard](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/profile/DataPrivacyCard.tsx:33).

**Action:** publish policy, support and account-deletion pages; link policy/support in the app and make privacy information available before signup. Replace the placeholder with a working export or an accurately named “Request my data” flow with a monitored contact and identity verification. A full automated export system is not universally required merely to have an Apple listing; the actual request process must match promises and target-market obligations.

Apple requires account-deletion initiation inside account-creating apps; Naksha has this implementation and must verify it on the release build. Google additionally requires an accessible web deletion-request path, usable after uninstalling the app. [Apple deletion guidance](https://developer.apple.com/support/offering-account-deletion-in-your-app/), [Google deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en)

### R03 — P1: product identity and native release artifacts are unfinished

**Confirmed configuration and build-evidence gaps.**

The app is still named client, Android uses com.anonymous.client, launcher artwork is the Expo placeholder, and iOS has no configured bundleIdentifier. The local Android release build points to debug signing. EAS may supply remote signing, so the Gradle setting is not proof that an EAS production build would use the debug key.

Evidence: [app.json](/home/vinal/Vins-ProjectDirectory/Naksha/client/app.json:3), [Android application/signing configuration](/home/vinal/Vins-ProjectDirectory/Naksha/client/android/app/build.gradle:90), [EAS profiles](/home/vinal/Vins-ProjectDirectory/Naksha/client/eas.json:6).

**Action:** settle owned permanent identifiers and developer identity before store registration; create approved Naksha icon/adaptive icon/splash assets; synchronize checked-in Android resources and app configuration; configure signing ownership/recovery and versioning. Inspect the installed signed output, not only configuration files.

No tracked ios directory is normal in an Expo-generated workflow. The blockers are missing iOS identity and build/device evidence, not the absence of that directory by itself.

### R04 — P1: public onboarding/backend settings require proof

**Hosted configuration unknown; local defaults are not evidence of production misconfiguration.**

The app uses naksha://auth/callback. The local Supabase configuration contains localhost defaults and commented SMTP examples, but the hosted project's allowlist, SMTP, confirmation settings, limits and templates were not inspected.

**Action:** verify production project selection, migration/function versions, callback allowlist, email templates, OTP behavior, SMTP domain authentication, abuse limits and deliverability. Run signup and recovery with unrelated external email addresses. Supabase's default mail service is intended for testing and has recipient/rate restrictions; success with a developer's account is insufficient proof of public delivery. [Supabase SMTP documentation](https://supabase.com/docs/guides/auth/auth-smtp)

Test cold/warm deep links, expired/reused links, recovery while already signed in, interrupted signup, expired sessions and server outages on the installed candidate.

### R05 — P1: geocoding credential and production service controls need hardening

**Confirmed client-side vendor credential; production entitlement unknown.**

The app embeds EXPO_PUBLIC_OPENCAGE_KEY and calls OpenCage directly. This key is extractable from a distributed client. Autocomplete runs before account creation, so a future proxy cannot simply require an existing signed-in user. Requests lack a deadline and do not opt into no_record.

Evidence: [geocoding helper](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/geocode.ts:2), [autocomplete requests](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/auth/LocationAutocompleteField.tsx:50).

**Action:** use a controlled proxy with appropriate pre-signup abuse protection, bounded request handling, monitoring and key rotation. Verify production entitlement/quota and choose query-log minimization; disclose entered-location processing. OpenCage recommends a backend proxy for mobile clients. Its API documents trial limitations and no_record=1. The risk is quota abuse and reliability, not an assumed surprise usage bill. [OpenCage key guidance](https://opencagedata.com/guides/how-to-protect-your-api-key), [OpenCage API](https://opencagedata.com/api)

Also invalidate autocomplete requests immediately on every query change, selection and unmount: an older response can currently repopulate suggestions after the query is shortened or a location selected.

### R06 — P1: journal discard protection needs the supported native-stack mechanism

**Source-supported risk; not reproduced on a device in this review.**

JournalEditor cancels beforeRemove while the app uses native-stack. The installed navigator warns this approach is not fully supported: native and JavaScript navigation state can disagree. Use the supported prevention hook and verify retention of writing.

Evidence: [JournalEditorScreen](/home/vinal/Vins-ProjectDirectory/Naksha/client/screens/JournalEditorScreen.tsx:153), [native-stack warning](/home/vinal/Vins-ProjectDirectory/Naksha/client/node_modules/@react-navigation/native-stack/src/utils/useDismissedRouteError.tsx:21), [React Navigation guidance](https://reactnavigation.org/docs/preventing-going-back/).

**Action:** preserve one Save and one discard decision; test header back, Android hardware/gesture back, iOS swipe, confirmed discard, failed save and successful save. “Keep editing” must leave the editor and writing intact. A navigation guard does not protect against OS termination; consider draft recovery separately rather than claiming it does.

### R07 — P1: account recovery and exceptional auth failures have gaps

**Observed handling gaps; native consequences need acceptance testing.**

- ResetPassword's “Back to Login” targets Login even though a recovery session can make the app register only its authenticated routes. [ResetPasswordScreen](/home/vinal/Vins-ProjectDirectory/Naksha/client/screens/ResetPasswordScreen.tsx:131)
- Login/Signup/ResetPassword reset submitting after awaited calls without a finally path; a thrown rejection can strand the control. Login and Signup have no dedicated screen tests; ResetPassword's exceptional update/session branches also need coverage.
- App startup has no catch/finally/retry around getSession; an unexpected storage rejection can keep authReady false. [App bootstrap](/home/vinal/Vins-ProjectDirectory/Naksha/client/App.tsx:148)
- Profile ignores resolved signOut errors; catching only thrown errors is insufficient for that helper. [Profile actions](/home/vinal/Vins-ProjectDirectory/Naksha/client/screens/ProfileScreen.tsx:259)

**Action:** define recovery cancellation explicitly, normalize auth errors, recover loading states on every exit, and test validation/success/returned-error/thrown-error/repeated-submit behavior. Verify deletion clears local access even if subsequent remote logout has an error.

### R08 — P1 for Apple: iOS controls and device support are unqualified

The time picker uses an iOS spinner but closes on every value change; editing hour, minute and AM/PM may therefore close it after the first adjustment. The date picker also needs a native interaction review. This is a concrete source risk, not a reported device failure. [TimeField](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/auth/TimeField.tsx:38)

**Action:** test on iPhone and use draft values plus Done/Cancel where necessary. Decide whether iPad ships: supportsTablet is currently true. If supported, include iPad layout/keyboard/picker/gesture QA and required listing assets. If not, intentionally configure the supported device family.

### R09 — P1: dependency audit needs a release disposition

The current npm audit reports 41 affected package entries, including shell-quote at critical severity. Expo/React Native pull build tools into the production dependency graph, so omit=dev does not mean every reported package executes inside the shipped app.

**Action:** trace each high/critical advisory to its actual build/runtime path; update compatible transitive dependencies; remove unused direct dependencies; document unreachable residual findings. Review deep-link parsing as an exposed runtime input. Do not run audit fix --force or upgrade Expo majors indiscriminately: some suggested fixes cross SDK boundaries and require their own migration/QA. Preserve the intentional picker fix.

Release gate: no unresolved exploitable high/critical finding in the app or build pipeline; documented, reviewed dispositions for remaining advisories. Raw package counts alone are neither proof of exploitability nor a sufficient waiver.

Focused triage of this lockfile:

| Package/path | What this review established | Next action |
| --- | --- | --- |
| React Navigation → query-string → decode-uri-component 0.2.2 | External naksha links reach query parsing; a malformed-input decoding advisory is relevant to that runtime boundary. No denial of service was reproduced here | Use a supported fixed path or reviewed bounded/malformed-URL rejection before navigation; add adversarial-link regression coverage |
| React Native → React DevTools → shell-quote 1.8.3 | The critical entry is in developer-tool command handling, not demonstrated production-phone command execution | Apply a compatible patched dependency and verify production exclusion; harden the build/development path |
| Axios 1.13.2 | Installed directly but no app imports found; geocoding uses fetch | Remove it if unused; do not infer mobile SSRF from Node HTTP advisories |
| Nanoid 3.3.11 | Used by navigation, but reviewed call sites use default size rather than attacker-controlled size | Apply a compatible patch; current exploit preconditions were not found |
| ws and build/config parsers | Much of the remaining graph is Node/tooling; Supabase selects the native global WebSocket when available | Patch compatible versions and document actual runtime/build exposure |

Evidence: [decoder lock entry](/home/vinal/Vins-ProjectDirectory/Naksha/client/package-lock.json:6074), [shell-quote lock entry](/home/vinal/Vins-ProjectDirectory/Naksha/client/package-lock.json:13663), [external links](/home/vinal/Vins-ProjectDirectory/Naksha/client/App.tsx:89). The audit-reported advisories are [malformed URI decoding](https://github.com/advisories/GHSA-vcc3-ghjq-m6fr) and [shell-quote command escaping](https://github.com/advisories/GHSA-w7jw-789q-3m8p); exposure classifications above come from the local dependency/call-site review.

### R10 — P1: production reliability and final device QA are incomplete

No configured production crash SDK, centralized error capture, root recovery boundary, CI workflow or native E2E suite was found. Console warnings and component tests cannot provide release incident visibility.

**Action:** add modest, privacy-scrubbed crash/error reporting with symbols/source maps and build IDs; verify delivery using controlled failures in a test environment. Add repeatable lockfile install, typecheck, lint, Jest, exports and migration validation. Record a manual native matrix even if full automation is deferred.

Existing picker, chart and visual device reviews count as useful evidence. They do not close the explicit pending Journal/My Charts/Profile gates or prove the later all-route atmospheric treatment on a release build. [Pending Journal gate](/home/vinal/Vins-ProjectDirectory/Naksha/docs/ui-redesign/redesign-plan.md:506), [pending Slice 9 gate](/home/vinal/Vins-ProjectDirectory/Naksha/docs/ui-redesign/redesign-plan.md:556), [walkthrough scope](/home/vinal/Vins-ProjectDirectory/Naksha/docs/ui-redesign/consistency-review.md:60)

### R11 — P2: correctness, accessibility and scale follow-ups

| Finding | Evidence / impact | Required disposition |
| --- | --- | --- |
| Input labels and error announcements | Email/Password inputs lack explicit accessible label association; password placeholder is bullets | Verify and fix TalkBack/VoiceOver names, focus and announcements |
| Daily guidance refresh | Dashboard rebuilds guidance on focus, without a day-rollover/app-resume contract | Refresh when the relevant date/week changes; test midnight, Monday and travel/time-zone behavior |
| Natal chart animation lifecycle | Selected chart glow can default to motion enabled while hidden/backgrounded | Gate by route/app activity; measure actual battery/frame/memory behavior |
| Profile duplicate loading | Mount and focus both call load | Consolidate loading and guard stale responses |
| Calculation accuracy evidence | astro.ts describes an approximate Ascendant calculation; current tests mostly establish shape/invariants | Add independently sourced numeric fixtures and tolerance policy for planets/house-sign boundaries/time zones; this review found no proven calculation error |
| List growth | Charts fetch complete blobs; journals fetch complete content without pagination | Test realistic long histories and deployed row limits; paginate or state a deliberate small-launch bound |
| Local credentials/backup | Sessions use AsyncStorage; Android allowBackup is true | Choose protected credential storage and backup policy; verify restore/logout behavior. This is not proof of remote compromise |
| Account deletion partial failure | Sequential table requests can partially delete before an error | Make cleanup retryable, test failure injection, document completion/recovery |
| Visible future billing/export | Profile advertises unfinished services | Simplify the free V1 presentation; do not add monetization solely to fill placeholders |
| Sky Now scope | Uncommitted shared-wheel change, active feature work, accessible planets but no equivalent aspect-selection list found | Finish and test it explicitly, including accessible aspect exploration, or leave it for a later release |
| Dormant packages | GL/Three background is unused; other unused imports/dependencies need inventory | Remove only after reference/config checks; rebuild native artifacts afterward |
| Licenses | Font/icon/library notices not visibly assembled | Verify required notices in distributed artifacts and add acknowledgments as needed |

Useful source locations: [auth field](/home/vinal/Vins-ProjectDirectory/Naksha/client/components/auth/PasswordField.tsx:13), [guidance refresh](/home/vinal/Vins-ProjectDirectory/Naksha/client/screens/DashboardScreen.tsx:489), [approximate house calculation](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/astro.ts:198), [calculation tests](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/__tests__/charts.test.ts:107), [chart query](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/charts.ts:188), [journal query](/home/vinal/Vins-ProjectDirectory/Naksha/client/lib/journals.ts:15).

## 5. Store-specific requirements and risks

### Apple App Store

1. **Differentiation is a material review risk.** Guideline 4.3(b) specifically scrutinizes fortune-telling apps that do not offer a meaningfully different or improved experience. Astrology makes this relevant to Naksha, although categorization and acceptance are Apple's decisions. Demonstrate interactive chart exploration, transparent supported calculations and the guidance-to-journal workflow. More decorative effects alone do not establish differentiation. [Apple guideline 4.3](https://developer.apple.com/app-store/review/guidelines/#spam)
2. **Build using the current upload toolchain.** Since 28 April 2026, App Store Connect uploads require Xcode 26 or later and an iOS 26 SDK or later. SDK build requirements do not mean users must all run iOS 26; deployment-target selection is separate. Validate the selected EAS image and archive. [Apple SDK requirements](https://developer.apple.com/news/upcoming-requirements/?id=04282026a)
3. **Create the Apple delivery path.** Confirm developer membership/team access; choose bundle ID; create App Store Connect record; configure signing; upload to TestFlight; test physical iPhone and any supported iPad.
4. **Finish disclosures and native privacy packaging.** Inventory the app and every SDK; complete App Privacy answers; inspect generated required-reason API declarations/privacy manifests and applicable SDK signatures. Missing a checked-in manifest is not proof the generated archive lacks one. [App Privacy](https://developer.apple.com/app-store/app-privacy-details/), [SDK requirements](https://developer.apple.com/support/third-party-SDK-requirements/)
5. **Prepare a reviewable product.** Remove placeholder functionality, provide functioning support/privacy URLs, accurate screenshots/metadata, and a stable reviewer account with useful sample content. Reviewers must be able to exercise the authenticated experience. [Apple completeness guidance](https://developer.apple.com/app-store/review/guidelines/#app-completeness)
6. Keep the current email/password model for the scoped free release. Social login, paid digital features or subscriptions would introduce separate authentication/payment requirements and need a fresh scope assessment.

Suggested positioning to validate with real users: **“Explore your birth chart, understand your daily themes, and keep a private reflection journal.”** This is a proposed description of existing capabilities, not evidence of market uniqueness or an approval guarantee.

### Google Play

1. New phone apps/updates currently need target **Android 16 / API 36**, effective 31 August 2026. Installed React Native configuration already resolves target/compile SDK 36; inspect the final merged manifest/AAB before claiming compliance. [Google target API requirements](https://support.google.com/googleplay/android-developer/answer/11926878?hl=en)
2. Validate production signing, owned application ID, version code and Play App Signing; upload a production AAB to the test track and install the Play-delivered app.
3. Check 16 KB compatibility of all shipped native libraries, archive alignment and actual runtime behavior. Modern RN/AGP versions are favorable but not artifact proof. Follow the current Play Console enforcement notice rather than an old remembered deadline. [Android 16 KB guidance](https://developer.android.com/guide/practices/page-sizes)
4. Complete Data safety, policy URL, deletion URL, app-access instructions, content rating, target-audience and other applicable console declarations. Entered birthplace is data processing even though the app does not request live GPS access. Classify it from its actual use. [Google User Data policy](https://support.google.com/googleplay/android-developer/answer/10144311?hl=en)
5. Inspect the merged release permissions: external storage and SYSTEM_ALERT_WINDOW appear in the source manifest without an evident V1 need. Remove or confine development-only capabilities; do not assume every source permission necessarily survives into the final artifact.
6. Verify developer-account type/creation date and production access. If the newer personal-account testing rule applies, recruit testers early and budget the mandatory closed-test period described above.

## 6. Data and operational contract to finish

This is a data inventory for completing accurate policies and store forms, not a pre-filled legal declaration.

| Data / service | Current path | Decision / verification needed |
| --- | --- | --- |
| Email and identity | Supabase Auth and public profile | Purpose, retention, access and external email delivery |
| Birth date/time/place/coordinates/time zone | Signup auth metadata, public users, saved chart metadata | Explain calculation purpose; include metadata and backups in retention/deletion description |
| Guest birth data | Form and manually saved chart | Minimize collection and explain responsibility when entering another person's details |
| Journal titles/content | Supabase journals | Describe server storage accurately; no end-to-end encryption claim |
| Location searches | Direct OpenCage requests | Proxy, key protection, vendor logs, query minimization and disclosure |
| Sessions | AsyncStorage | Credential protection, logout cleanup, backup/restore and multi-account behavior |
| Diagnostics to be added | Not yet configured | Redact tokens, auth URLs, names, birth details, location query URLs and journal contents |
| Backups/provider logs | Hosted configuration unverified | Retention, restore test, deletion limitations and operator access |

Publish a monitored support destination and establish who handles failed signups, missing journal entries, deletion and data requests. Keep a small incident/runbook record: project owner, signing recovery owner, backup/restore steps, outage communication and release hotfix steps. OTA updates are optional; a reliable store-binary hotfix path is sufficient for V1.

## 7. Execution plan with owners, dependencies and gates

Owner labels describe responsibilities; one person may hold several roles. Estimates are focused working days and overlap where dependencies allow.

| Phase | Work / deliverable | Owner | Effort | Depends on | Exit gate |
| --- | --- | --- | --- | --- | --- |
| A — Freeze scope and evidence | Decide platform order, free V1, target users/regions, iPad, Sky Now inclusion; freeze commit and reconcile release docs | Product owner + engineer | 1–2 days | None | Named candidate scope, accountable owners, clean reviewed baseline |
| B — Data and auth hardening | R01 ownership migration; two-user tests; deletion failure/retry; R04/R05 production onboarding; R07 auth recovery | Backend/mobile engineer | 4–6 days | A; service access | Isolation tests pass; external signup/reset/deletion work; no exposed uncontrolled vendor key |
| C — Product reliability | Journal native guard; iOS picker investigation if shipping Apple; auth semantics/tests; autocomplete race; day refresh; resolve WIP tests | Mobile engineer | 3–5 days | A; can overlap B | Green checks and no known data-loss/navigation blocker |
| D — Privacy and product presentation | Policy/support/deletion pages, data request, free-V1 cleanup, approved identity/artwork, licenses, listing drafts | Owner/design + engineer | 3–5 days | A; coordinate B data contract | Every public/in-app action and disclosure matches real service behavior |
| E — Build and operations | Dependency disposition; config synchronization; signing/versioning; crash reporting; CI; production environment validation | Mobile/release engineer | 3–5 days | A; native choices from D | Reproducible signed candidate, inspected artifact, diagnostics and restore/hotfix owner |
| F — Candidate QA and fixes | Execute matrix below on installed release candidates; fix defects and retest affected flows | QA + mobile/backend | 3–4 days initial pass | B–E | No P0/P1 defects; recorded per-device evidence tied to build/commit |
| G — Store beta/submission | Play testing/production-access process or TestFlight; final screenshots, disclosures and reviewer notes | Release owner + testers | External elapsed time plus follow-up | F; some recruitment/listing prep starts in A | Store test delivery verified; submission packet complete |
| Apple extension | Native iOS build/debug, privacy packaging, iPhone/iPad QA, platform-specific fixes | iOS-capable mobile engineer | Additional 8–15 days | Begin build spike during A/E | Signed TestFlight candidate passes full account/chart/journal matrix |

The shared Android work sums to approximately **17–27 engineering days** before accounting for overlap, extended beta feedback or store waiting. The Apple extension is additional platform effort, not a rewrite of shared product logic.

Owner decisions needed early: store priority; permanent developer/app identity; personal versus organization store accounts and existing production access; launch countries and target audience; iPad support; free-V1 scope; Sky Now inclusion; monitored support address/domain; production Supabase/SMTP/OpenCage arrangements; and available test devices/testers. Budget for these service/account/device costs from current provider quotes. This review did not establish paid-plan entitlements or quote a launch budget.

**Critical path:** scope/identity → secure backend and dependable onboarding → signed candidate → native acceptance → store testing/approval. Start owner/account/SMTP/geocoder decisions and tester recruitment immediately; they can delay engineering that otherwise looks finished.

### Recommended first five working days

- **Day 1:** freeze scope, settle whether Sky Now ships, open the ownership-integrity fix, confirm developer accounts/identifiers/service owners, capture the current failing test and audit baseline.
- **Day 2:** implement and test parent ownership; verify clean migration application and cross-user rejection; test deletion with related records.
- **Day 3:** repair recovery/startup/sign-out failure paths and add Login/Signup coverage; verify external mail delivery and native callback destinations.
- **Day 4:** implement the real privacy/support/data-request path and geocoder protection; settle icon/native identity and final configuration workflow.
- **Day 5:** prepare the first signed candidate after blocking fixes; start the device matrix, investigate journal back and iOS picker behavior; begin tester distribution only once data/privacy gates are safe.

This is a sequencing proposal, not a commitment that every task fits exactly one day. If an iOS-first launch is chosen, move the signed iOS build to the start of the schedule to expose native problems early.

## 8. Release-candidate acceptance matrix

Use invented/disposable accounts and data. Test the final build through Play testing/TestFlight, without Metro. Retest native/config changes on a rebuilt artifact. Record OS, device, navigation mode, font size, commit/build ID, result and evidence.

| Area | Required scenarios | Pass condition |
| --- | --- | --- |
| Installation/startup | Fresh install, update, cold/warm start, no Metro, offline start, font failure, invalid config caught before build | Correct identity; no blank/indefinite startup; controlled failure/retry |
| Auth | Signup, validation, duplicate account, OTP/resend/expiry, login, external email, callback cold/warm, recovery signed in/out, logout failure | Account can be created/recovered reliably; loading clears; routes remain valid |
| Session isolation | Expiry, background/resume, storage failure, account A logout then B login | No stale private data or session crossover |
| Birth forms | Hour/minute/AM-PM, full date changes, long names/locations, slow/reordered suggestions, typed vs selected location, invalid zone | Stored date/time/location match intent; no stale suggestions or picker crash |
| Chart accuracy | Independent numeric references, both hemispheres, east/west longitude, leap day, DST gap/fold policy, sign boundaries, missing coordinates | Defined tolerances/behavior; no silent date shift or incorrect save mode |
| Charts | Self auto-save, guest manual save, saved open/delete, failed save, legacy/current/future/malformed data | Correct persistence and safe, understandable fallback |
| Chart interactions | Cluster selection, pinch/pan/double tap, aspects/houses, pager scroll, hardware/swipe back, screen reader alternatives | Reliable touch arbitration and equivalent accessible information/actions |
| Guidance | No-aspect fallback, local date/week boundary, app resume, collapse/tabs, both reflection handoffs | Current and coherent guidance; original context retained |
| Journal | Create/edit/list/delete; one Save; whitespace; long text; keyboard; all back paths; save/network failures | No unexpected loss of writing; response and Save reachable |
| Profile/data | Long facts, selected/disabled radio states, data-request link, sign out, deletion cancellation/completion | Honest controls, accessible states, correct account cleanup |
| Backend isolation | Two-user reads/writes/foreign references, unauthorized deletion, replay/expired token, partial cleanup retry | Users cannot access or interfere with another account's data |
| Accessibility | TalkBack/VoiceOver, large text, reduced motion, focus order, errors, contrast over moving sky | Labels and actions understandable; no clipped essential controls |
| Performance | Modest Android, prolonged chart/journal use, many records, background animations, minute sky refresh if included | No repeatable ANR/crash, sustained jank, runaway memory/heat |
| Android native | API36 artifact, gesture/3-button nav, edge-to-edge, keyboard, native .so and 16 KB compatibility | Store-delivered build behaves and installs correctly |
| Apple native | Supported iPhone/OS range, iPad if enabled, picker completion, swipe-back, keyboard/safe areas | First-class functioning native experience, not just an iOS JS export |
| Operations | Controlled test crash/error, redaction, symbolication, backup restore rehearsal, support/deletion request | Operators can diagnose and fulfill real user requests |

For small-beta performance acceptance, establish a baseline on named devices and investigate regressions. Do not advertise measured frame rate, crash-free percentage or battery claims without actual data. Set rollout thresholds after observing the beta; a handful of sessions is not a reliable reliability statistic.

## 9. Submission packet and launch decision

Prepare for each platform:

- Permanent app/developer identity, team access and recoverable signing ownership.
- Final version/build number and exact source commit; backend migration/function versions.
- Store-delivered candidate and completed QA record.
- Actual screenshots from the approved build using fictional data; icon and listing artwork.
- Accurate name/subtitle/description/category, support URL, privacy URL and appropriate age/audience declarations.
- Apple privacy answers/native privacy validation and Google Data safety/deletion web path.
- Reviewer access with a working account, sample content, clear navigation to chart/guidance/journal and deletion instructions.
- Honest explanation of supported Tropical/Whole Sign behavior and reflection-oriented guidance; no unimplemented AI, subscription, notification or medical claims.
- Support owner, incident/hotfix process, staged availability decision and a post-launch review schedule.

**Go** only when all P0/P1 findings are closed or replaced by explicit, evidence-backed scope reductions; the frozen candidate passes automated and native gates; production service/disclosure/support behavior is verified; and store account/testing prerequisites are satisfied.

**No-go** for unresolved cross-user integrity issues, unreliable public signup/recovery, loss of journal work, inaccessible required controls, placeholder data/support promises, missing production identity/signing, untriaged exploitable dependencies, or a candidate that has only been tested through Expo Go/development tooling.

CI, a specific crash-vendor SDK, full automated UI coverage, self-service export, an OTA platform and every future feature are not individually mandated by the stores. The release decision should preserve the small V1 while proving the outcomes users need.

## 10. Immediate recommendation

Prioritize **Google Play first**, consistent with the existing product program, while doing an early iOS build spike if Apple is the intended near-term destination. Freeze feature additions, finish integrity/onboarding/privacy work, and produce a signed candidate. Preserve the existing product depth and visual work.

If Apple is the primary goal, treat iOS qualification and differentiation as first-order work now. The shared code is a head start, but Android approval, green JavaScript exports and attractive screens cannot substitute for an iPhone/TestFlight release cycle.
