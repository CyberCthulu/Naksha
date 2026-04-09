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

This project is actively in development and already includes a functioning mobile app with:

- Email/password auth flow
- Profile completion (birth details + timezone + location geocoding)
- Natal chart generation and display
- Saved charts list with delete/open
- Journal list and editor
- Profile settings and preferences scaffolding

Some modules are intentionally still in-progress or placeholder-only.

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