# Naksha

Naksha is a mobile-first astrology app focused on helping users generate natal charts, explore interpretations, save readings, and journal personal reflections.

The app is built with **Expo + React Native** in the `client/` directory and uses **Supabase** for backend services (auth + database).

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Current Status](#current-status)
3. [Architecture](#architecture)
4. [Tech Stack](#tech-stack)
5. [Repository Structure](#repository-structure)
6. [Features](#features)
7. [Supabase Backend](#supabase-backend)
8. [Environment Variables](#environment-variables)
9. [Getting Started](#getting-started)
10. [Run Commands](#run-commands)
11. [Known Notes](#known-notes)
12. [Roadmap](#roadmap)
13. [License](#license)

---

## Project Overview

**Naksha** (Sanskrit: map / blueprint) is designed to combine traditional astrological structure with modern mobile UX and deterministic interpretation and guided-reflection workflows.

Core product goals:

- Chart generation from birth data
- Visual natal chart exploration
- Interpretive text by sign/house/aspect logic
- Persistent chart history
- Reflective journaling for user growth

---

## Current Status

Updated 25 September 2026 at `70273735`. Core free V1 and the active celestial UI are implemented. R1–R3 release hardening is repository-complete; R4 authentication recovery and Android production identity/security is next. Native candidate acceptance remains outstanding.

- Accounts/profile, natal and guest charts, saved charts, daily/weekly guidance, and journaling.
- Interactive chart wheel, chart tabs, shared starry backgrounds, translucent cards, and celestial loading.
- Sky Now above the dashboard tabs with current positions and authored aspect-pair readings.
- Post-R3 verification: 62 Jest suites / 793 tests, TypeScript, lint, whitespace, clean database replay, upgrade replay, and combined R1/R2/R3 pgTAP pass. These do not qualify a signed store release or prove production deployment.

Start with the [release-hardening plan](docs/release-hardening-plan.md), [feature list](docs/Feature-List.md), and [engineering handoff](docs/naksha-codebase-handoff.md). AI chat, subscriptions, compatibility, notifications, and extra astrology systems are future work.

---

## Architecture

### Frontend (Mobile App)

- Location: `client/`
- Framework: Expo + React Native + TypeScript
- Navigation: React Navigation (native stack)
- UI: Reusable UI and domain components under `components/`
- Domain logic: chart computation/interpretation/time/timezone helpers in `lib/`
- State/hook composition: feature hooks under `hooks/`

### Backend

- Platform: **Supabase**
- Auth: Supabase Auth
- Data: Supabase Postgres tables (e.g. users, charts, journals, subscriptions, purchases)
- Client SDK: `@supabase/supabase-js`
- Supabase client setup: `client/lib/supabase.ts`

---

## Tech Stack

| Layer | Technology |
|------|------------|
| Mobile App | Expo, React Native |
| Language | TypeScript |
| Navigation | React Navigation |
| Backend Services | Supabase |
| Database | Supabase Postgres |
| Auth | Supabase Auth |
| Astro Calculation | `astronomy-engine` + internal helpers |
| Rendering | React Native + SVG |

---

## Repository Structure

```text
/
├─ client/
│  ├─ App.tsx
│  ├─ index.ts
│  ├─ app.json
│  ├─ package.json
│  ├─ tsconfig.json
│  ├─ screens/              # Route-level screens
│  ├─ components/           # Reusable UI + feature components
│  ├─ hooks/                # Feature hooks (chart data, interpretation, etc.)
│  ├─ lib/                  # Domain/business logic + Supabase + helpers
│  ├─ assets/
│  └─ android/
├─ docs/                    # Product, engineering, and release documentation
├─ supabase/                # Local config, forward migrations, functions, and DB tests
├─ package.json             # Repository-local Supabase CLI
├─ README.md
└─ COPYRIGHT.txt
```

## Features
### Authentication
Sign up with email/password

Check-email confirmation flow

Deep-link callback handling for auth completion

Sign in/out session support

### Profile
First/last name, birth date/time/location, timezone

Timezone normalization helpers

Location geocoding (OpenCage)

### Charting
Natal planetary positions

Aspect computation

Whole-sign houses (when location data available)

Interactive chart view + interpretation modal

Save chart data to Supabase

### Journaling
Create/edit/delete journal entries

Journal list with timestamps

Lightweight personal reflection workflow

### Account Area
Profile view/edit routing

Preferences scaffolding (house system/zodiac/orb modes)

Subscription/purchase display scaffolding

## Supabase Backend
Naksha currently relies on Supabase for:

User authentication/session handling

User profile persistence

Saved chart storage

Journal entries

Subscription/purchase records (where available)

Database evolution is source-controlled under `supabase/`, including forward migrations, Edge Functions, local configuration, and pgTAP database tests. Production deployment state must still be verified explicitly; committed migrations alone do not prove the hosted project is current.

## Environment Variables
Set these in your Expo environment for client/:

EXPO_PUBLIC_SUPABASE_URL

EXPO_PUBLIC_SUPABASE_ANON_KEY

EXPO_PUBLIC_OPENCAGE_KEY (for geocoding birth location)

Example (conceptual):

EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_OPENCAGE_KEY=<opencage-key>
## Getting Started
### Prerequisites
Node.js 18+

npm

Expo CLI via npx expo ...

### Install
cd client
npm install
## Run Commands
From client/:

npm run start     # Expo dev server
npm run android   # Android
npm run ios       # iOS
npm run web       # Web
## Known Notes
Some files/modules are placeholders for upcoming features.

Some profile preferences are UI-first scaffolding and may be expanded in later chart engine updates.

Ensure deep-link scheme in Expo config and Supabase redirect URLs match your auth flow.

## Roadmap

The current sequence is R4 authentication recovery and Android identity/security, R5 calculation correctness, R6 remaining engineering readiness, C1–C4 content review, then signed-candidate QA and Play testing. See the [current plan and acceptance gates](docs/release-hardening-plan.md). AI and subscriptions are not V1 release-hardening requirements.

## License
This project is currently closed-source.
All rights reserved to the creators.
No copying, distribution, or commercial use without explicit permission.

