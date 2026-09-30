# Naksha release operations

Updated **30 September 2026 (Pacific)** during R6.3. This runbook records the current operational boundary; it does not claim that a release candidate has passed or that external services have been configured.

## Release environments

EAS build profiles select explicit `development`, `preview`, and `production` environments. Each environment must define all three client-visible values before its build starts:

- `EXPO_PUBLIC_SUPABASE_URL`
- `EXPO_PUBLIC_SUPABASE_ANON_KEY`
- `EXPO_PUBLIC_OPENCAGE_KEY`

These values are embedded in the application bundle. The Supabase anon key is designed for client use with RLS and grants; it is not a substitute for a server secret. Never configure a Supabase service-role key, private signing material, or another secret as an `EXPO_PUBLIC_*` value. A local template lives at `client/.env.example`; real values remain untracked.

The repository does not establish that the remote EAS values are populated or that preview and production target different Supabase/OpenCage projects. Before a release build, the release owner must inspect the selected EAS environment without copying values into logs and record the target project identities. A missing Supabase URL or anon key now fails at client initialization with an explicit configuration error. OpenCage already reports its missing public key when location search is used.

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

The in-app **Export my data** action remains a placeholder rather than a working export or monitored request channel. It must be replaced with a real export or accurately named data-request process before release acceptance.

## Release gate ownership

Before a signed candidate is uploaded, assign named owners for:

- EAS/Play signing credentials and recovery copies
- production Supabase backup/restore decisions
- privacy, support, and account-deletion requests
- crash/error monitoring and privacy review
- release rollback and narrow hotfix approval

CI verifies source, migrations, and database policies. It does not prove remote environment values, hosted-service behavior, signed native artifacts, Play delivery, backups, or real-device behavior.
