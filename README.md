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
13. [Contributing](#contributing)
14. [License](#license)

---

## Project Overview

**Naksha** (Sanskrit: map / blueprint) is designed to combine traditional astrological structure with modern mobile UX and AI-assisted interpretation workflows.

Core product goals:

- Chart generation from birth data
- Visual natal chart exploration
- Interpretive text by sign/house/aspect logic
- Persistent chart history
- Reflective journaling for user growth

---

## Current Status

Reviewed 12 September 2026 at `ab9c16c1`. Core free V1 and the active celestial UI are implemented; release hardening and native candidate acceptance remain.

- Accounts/profile, natal and guest charts, saved charts, daily/weekly guidance, and journaling.
- Interactive chart wheel, chart tabs, shared starry backgrounds, translucent cards, and celestial loading.
- Sky Now above the dashboard tabs with current positions and authored aspect-pair readings.
- Verification: 58 Jest suites / 737 tests, typecheck, lint, and Android/iOS Hermes exports pass. These do not qualify a signed store release.

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
├─ README.md
└─ COPYRIGHT.txt

Features
Authentication
Sign up with email/password

Check-email confirmation flow

Deep-link callback handling for auth completion

Sign in/out session support

Profile
First/last name, birth date/time/location, timezone

Timezone normalization helpers

Location geocoding (OpenCage)

Charting
Natal planetary positions

Aspect computation

Whole-sign houses (when location data available)

Interactive chart view + interpretation modal

Save chart data to Supabase

Journaling
Create/edit/delete journal entries

Journal list with timestamps

Lightweight personal reflection workflow

Account Area
Profile view/edit routing

Preferences scaffolding (house system/zodiac/orb modes)

Subscription/purchase display scaffolding

Supabase Backend
Naksha currently relies on Supabase for:

User authentication/session handling

User profile persistence

Saved chart storage

Journal entries

Subscription/purchase records (where available)

Suggested backend repo hygiene (recommended)
If you want reproducible DB evolution in Git, add:

supabase/ directory

SQL migrations

seed scripts

RLS policy definitions

Right now, SQL may exist only in your Supabase project unless explicitly checked into this repo.

Environment Variables
Set these in your Expo environment for client/:

EXPO_PUBLIC_SUPABASE_URL

EXPO_PUBLIC_SUPABASE_ANON_KEY

EXPO_PUBLIC_OPENCAGE_KEY (for geocoding birth location)

Example (conceptual):

EXPO_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
EXPO_PUBLIC_OPENCAGE_KEY=<opencage-key>
Getting Started
Prerequisites
Node.js 18+

npm

Expo CLI via npx expo ...

Install
cd client
npm install
Run Commands
From client/:

npm run start     # Expo dev server
npm run android   # Android
npm run ios       # iOS
npm run web       # Web
Known Notes
Some files/modules are placeholders for upcoming features.

Some profile preferences are UI-first scaffolding and may be expanded in later chart engine updates.

Ensure deep-link scheme in Expo config and Supabase redirect URLs match your auth flow.

Roadmap

The active sequence is correctness/data integrity, auth/journal/geocoder reliability, privacy/support, native identity/signing and dependency triage, then signed-candidate QA and store testing. See the [current plan and acceptance gates](docs/release-hardening-plan.md). Migrations, typed navigation, and substantial automated tests already exist; AI and subscriptions are not release-hardening tasks.

License
This project is currently closed-source.
All rights reserved to the creators.
No copying, distribution, or commercial use without explicit permission.

