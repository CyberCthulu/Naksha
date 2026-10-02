# Naksha release operations

Updated **30 September 2026 (Pacific)** during R6.3. This runbook records the current operational boundary; it does not claim that a release candidate has passed or that external services have been configured.

## Release environments

EAS build profiles select explicit `development`, `preview`, and `production` environments. Each environment must define all three client-visible values before its build starts:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_OPENCAGE_KEY`

These values are embedded in the application bundle. The Supabase anon key is designed for client use with RLS and grants; it is not a substitute for a server secret. Never configure a Supabase service-role key, private signing material, or another secret as an `EXPO_PUBLIC_*` value. A local template lives at `client/.env.example`; real values remain untracked.

The repository does not establish that the remote EAS values are populated or that preview and production target different Supabase/OpenCage projects. Before a release build, the release owner must inspect the selected EAS environment without copying values into logs and record the target project identities. The EAS pre-install hook now stops a build when any required public value is absent and validates the Supabase URL without printing values. Client startup retains the same Supabase validation as defense in depth. OpenCage reports its missing public key when location search is used.

Stable application identity remains:

- Expo name: `Naksha`
- Expo slug: `client`
- Android application ID: `com.naksha.app`
- URI scheme: `naksha`
- EAS project ID: `02e47ee9-8b27-4b02-95f3-efc2bece95d7`

Production EAS builds use remote credentials, remote application-version management, automatic Android `versionCode` increments, and AAB output. Credential ownership, recovery access, certificate inspection, and a signed-candidate build are still external release-candidate gates.

## Database backup and recovery

The R1–R3 production deployment had a one-time logical backup. At that time, physical backup/PITR was not enabled. Platform WAL-G components were observed, but their presence alone does not prove an operator-accessible restore point, its retention, or a tested recovery procedure. The repository contains no scheduled backup, no continuous recovery mechanism, and no verified restore automation.

Before every risky production migration, the release owner must:

1. Confirm the linked project reference and remote migration history.
2. Run the migration's read-only data preflight and record aggregate row counts without exporting private user content into logs.
3. Check the current Supabase backup/PITR entitlement, last recoverable point, retention period, and restore procedure in the project dashboard.
4. Create a fresh timestamped logical backup with the intended schema/data scope, store it encrypted outside the repository, and record its location and accountable owner. Include auth-owned data when recovery of accounts is part of the migration risk; a public-schema-only dump is not a complete account backup.
5. Verify the backup completed, is non-empty, can be read by the expected PostgreSQL tooling, and has a documented clean restoration target. Do not overwrite production to test it.
6. Apply only the reviewed migration set, one migration at a time, stopping at the first error.
7. Recheck migration history, constraints/policies, aggregate row counts, two-account isolation, active PostgREST paths, and account-deletion dependencies.
8. At the declared rollback decision point, choose either a reviewed forward repair or the provider/backup restore path. Never improvise manual production-row repair.

The person authorizing a migration owns the preflight and rollback decision. The person executing it must record the project, migration versions, backup state, start/end time, verification results, and any recovery action. A restore remains unproven until it has been rehearsed against a non-production target.

## Diagnostics and private data

No remote crash reporter or production telemetry service is configured. Current production-visible warnings are local console diagnostics. Authentication warnings use fixed messages; no access token, refresh token, callback code, OTP hash, journal body, full profile, birth payload, service-role key, or environment value is intentionally logged.

Before launch, the owner must either adopt a production diagnostics service with an approved privacy/data-retention configuration or explicitly accept local-only diagnostics. If a service is adopted, send only allowlisted event names and sanitized error codes. Prove a controlled release error can be found without attaching request bodies, route parameters that may contain identifiers, Supabase sessions, profile/chart objects, or journal content.

## External public destinations

The repository currently contains no approved public privacy-policy URL, support URL/contact, or web account-deletion URL. Do not invent them in application or store configuration. Before Google Play submission, the owner must publish and verify all three destinations, link the in-app privacy/support surfaces to the approved destinations, and ensure the web deletion path accurately describes or implements the available deletion request flow.

The unavailable in-app **Export my data** action is hidden. It must remain hidden until a real export or accurately named, monitored data-request process exists.

## Release candidate and production checklist

The repository gate cannot complete these external checks. Record an owner, date, evidence, and result for every item against the exact signed candidate.

### A. EAS and production environment

- Populate and inspect the EAS `production` environment for `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_ANON_KEY`, and `EXPO_PUBLIC_OPENCAGE_KEY` without copying values into logs. The `eas-build-pre-install` hook must pass.
- Confirm the Supabase/OpenCage targets are intentional for production, no service-role or server secret is bundled, and preview/production separation matches the release decision.
- Verify the preserved EAS project, `com.naksha.app`, `naksha://` callback scheme, version, and remote `versionCode` source.

### B. Supabase production configuration

- Confirm remote migration and Edge Function versions. Apply any newly reviewed migration only after its data preflight and recovery checkpoint.
- Verify RLS, grants, two-account isolation, SMTP, redirects, rate/abuse limits, account deletion, and ordinary profile/chart/journal reads and writes through production PostgREST.
- Production currently reports PostgREST 14.5. Re-prove R3 column-grant behavior there: default-generated chart/journal IDs must work, explicit IDs must fail, and the canonical chart `INSERT ... ON CONFLICT DO UPDATE` path must still succeed.

### C. Privacy, support, account deletion, and export

- Publish and verify the real privacy-policy URL, monitored support destination, and public web account-deletion URL; connect only those approved destinations to the app and Play listing.
- Establish a real data-export or monitored data-request process before exposing an in-app export action. The unavailable placeholder is intentionally hidden.
- Complete Data Safety, deletion, retention, diagnostics, and support disclosures from actual production behavior.

### D. Backup and recovery

- Verify the current provider backup/PITR entitlement, retention, last recovery point, and restore permissions.
- Create and validate the scoped pre-deploy logical backup described above, assign the recovery decision owner, and rehearse restoration against a non-production target.

### E. Signing and AAB inspection

- Assign and back up EAS/Play upload-credential ownership and recovery access.
- Produce the signed AAB and record its source commit, certificate fingerprint, package, label, version/versionCode, debuggable state, permissions, backup/data-extraction policy, deep links, and branded assets.

### F. Android accessibility and device acceptance

- Test the signed build on relevant Android sizes and versions: cold/warm auth, callbacks/recovery, account switching/deletion, birth pickers and DST states, chart/guidance/Sky Now, journals, restart/resume, network failure, and local rollover.
- Record TalkBack order/labels/actions, modal focus and Android Back, large text, contrast, reduced motion, inactive-route motion, and launcher/deep-link behavior.

### G. Play closed testing and store submission

- Upload only the inspected AAB to the intended Play testing track, install the Play-delivered artifact, and repeat the affected acceptance checks.
- Satisfy the developer account's current tester/production-access requirements and complete screenshots, feature graphic, description, content rating, target audience, reviewer access, and release notes.

### H. Dependency and artifact verification

- Confirm the shipped bundle does not contain the removed `query-string` / `decode-uri-component` path and that React Navigation deep links still pass on device.
- Inspect whether dev-launcher-only `fast-uri` and other development/build advisories are absent from the release artifact; do not infer artifact reachability from the npm tree alone.
- Record the accepted/remediated state of remaining advisories and decide whether production diagnostics are configured or local-only diagnostics are an explicitly accepted launch limitation.

## Release gate ownership

Before a signed candidate is uploaded, assign named owners for:

- EAS/Play signing credentials and recovery copies
- production Supabase backup/restore decisions
- privacy, support, and account-deletion requests
- crash/error monitoring and privacy review
- release rollback and narrow hotfix approval

CI verifies source, migrations, and database policies. It does not prove remote environment values, hosted-service behavior, signed native artifacts, Play delivery, backups, or real-device behavior.
