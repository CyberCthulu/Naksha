# Naksha Feature List

Personalized astrology, deterministic forecasts, journaling, and guided reflection. Naksha is a functioning V1 application with comprehensive natal charts, daily and weekly transit guidance with transit-house personalization, and journaling.

This document separates implemented V1 functionality from planned roadmap features. It should not be read as a list of completed features unless an item is marked **DONE**. Last reviewed for accuracy: 2026-08-29 (V1 Architecture Pass D0–D6.3 complete, feature freeze for UI/UX redesign and Android production hardening).

## Status Overview

A quick index of every section below, grouped into four buckets. Each section still carries its own detailed status — this is a map, not a replacement for the detail.

**Current V1 Implemented** (Architecture Pass D0–D6.3 Complete)

* Account & Profile (email/password, OTP verification, password reset, account deletion, profile completion)
* Natal Chart Engine (Tropical / Western / Whole Sign houses)
* Chart Calculation Preferences (Tropical/Whole Sign/medium orbs; only current defaults supported)
* Saved Charts & Guest Chart Creation
* Chart Wheel, Positions, Houses, Aspects UI & Interpretation
* Journaling with Guided Reflection (reflection prompts, suggested practices, journal entries)
* Deterministic Guidance Primitives (transit planets, natal targets, aspects, signs, houses)
* Daily Guidance / Today's Energy (timezone-aware, deterministic, with transit-house personalization)
* Weekly Forecast (Monday–Sunday local weeks, seven snapshots, DST-aware, with transit-house context)
* Typed Navigation and Chart Versioning (backward-compatible schema with legacy support)
* Comprehensive Test Suite (25 suites, 183 tests covering all core flows)

**Current Phase: UI/UX Redesign & Android Production Hardening**

* Visual Design System (premium/celestial direction, Android-first)
* Screen Refinement and Component Polish
* Android Release Configuration and Production Build
* Privacy Policy and Support Documentation
* Post-Redesign: iOS and Post-V1 Features

**Partial / Foundation**

* Saved Charts & Guest Chart Persistence (one-off guest charts only; reusable guest profile library not implemented)
* Shadow Work & Self-Development (prompt/practice primitives exist; dedicated workflow not implemented)
* Data Privacy & Account Controls (deletion done; data export/retention policy open)
* Chart Data Import/Export (not implemented)

**Planned Roadmap (Post-V1)**

* AI Features — Ask-Astrologer Chat
* Saved AI Conversations / Readings
* Relationship / Synastry
* Notifications and Forecast Alerts
* Analytics / Usage Events
* Admin / Support Tools
* Additional Astrology Systems (Vedic, Chinese)
* Advanced House Systems (Placidus, Equal House, etc.)
* Advanced Forecasting and Transit Calendar

**Post-MVP / Long-term Platform**

* Reports and Report Generation
* Monetization & Subscriptions
* Multi-User Accounts and Relationship Profiles
* Advanced Forecasting and Milestones

## Current V1 Scope — Tropical / Western System

### Account & Profile

Status: **DONE**

* Email/password signup and login
* Supabase Auth session persistence
* Email verification / OTP callback flow
* Password reset / forgot-password flow
* Profile completion and editing
* Birth date, birth time, birth location, time zone, latitude, and longitude storage
* Invalid non-empty stored time zones route to profile correction rather than silently falling back to UTC
* Account deletion through deployed Supabase Edge Function
* Destructive confirmation before account deletion

### Chart Preferences

Status: **PARTIAL**

* Store chart calculation preferences in `public.chart_preferences`
* Current supported calculation mode:

  * Tropical zodiac
  * Whole Sign houses
  * Medium orbs
* Unsupported systems/options remain disabled or future-facing

Not yet done:

* Notification preferences
* Multiple house systems
* Sidereal / Vedic calculation mode
* Custom orb presets beyond the currently supported path
* User-facing multi-system astrology selector

### Natal Chart Engine

Status: **DONE for current Tropical/Whole Sign V1**

* Generate natal chart from user birth data
* Compute ten planetary positions: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Uranus, Neptune, Pluto
* Compute major aspects
* Compute Whole Sign houses when coordinates are available
* Assign planets to houses
* Validate persisted chart data before hydration
* Support self-chart auto-save when coordinates are available
* Support view-only charts when coordinates are missing

Current limitations:

* Tropical only
* Whole Sign only
* Medium-orb aspect mode only
* No Vedic, Chinese, Hellenistic timing, astrocartography, or other systems yet

### Chart UI & Interpretation

Status: **DONE / PARTIAL**

Implemented:

* Visual SVG astrology chart wheel
* Zodiac signs, houses, planets, and aspect lines
* Placement list
* House list
* Aspect list
* Interpretation modal
* Local deterministic lexicon interpretations
* Planet-in-sign interpretations
* Planet-in-house interpretations
* House meanings
* House-sign meanings
* Generic aspect meanings

Partial / future:

* Direct wheel tap/selection behavior
* Dedicated aspect interpretation pages by planet pair
* Zoom or advanced wheel interaction
* Custom chart themes / skins

### Saved Charts & Guest Charts

Status: **PARTIAL**

Implemented:

* Save, reopen, and delete charts
* Support multiple saved chart rows
* Guest chart creation v1
* Manual save for guest charts when coordinates exist
* Dashboard entry point to create someone else’s chart

Not yet done:

* Reusable guest profile library
* Relationship labels such as romantic partner, friend, family, coworker
* Rename/custom-label workflow
* Favorites/tags/folders
* Synastry or compatibility reports
* Composite charts

### Journaling

Status: **DONE for basic journaling**

Implemented:

* Create journal entries
* Edit journal entries
* Delete journal entries
* List journal entries
* Optional chart association support in schema
* Guidance-to-journal handoff from Today’s Energy and Weekly Forecast
* Fixed read-only source, prompt, and practice context in guided create mode
* Editable response-only content for guided entries
* Stable `prompt_template` persistence for selected guidance prompts
* Existing saved journal content takes precedence in edit mode

Not yet done:

* Prompt archive
* Tags/favorites/search
* Shadow-work milestones
* Guided cycles

## Forecast & Guidance Layer

### Guidance Primitives

Status: **DONE**

Implemented deterministic guidance primitives for:

* 7 transit-planet guidance records: Moon, Sun, Mercury, Venus, Mars, Jupiter, Saturn
* 10 natal-target activation records: Sun through Pluto
* 5 aspect-dynamic records: conjunction, opposition, square, trine, sextile
* Canonical aspect tones, including opposition as integrative and square as challenging
* 12 sign guidance records
* 12 house guidance records
* 34 reflection prompts
* 24 suggested practices
* Stable IDs and source IDs
* Coverage and integrity tests

Purpose:

* Power deterministic daily and weekly guidance
* Provide structured grounding for future AI
* Keep astrology logic in Naksha’s codebase instead of relying on generic AI generation

### Daily Guidance / Today’s Energy

Status: **DONE for deterministic V1**

Implemented:

* Timezone-aware deterministic DailyGuidance builder (uses local date semantics for consistent seed-based selection)
* Mood section (strongest aspect or no-aspect fallback)
* Warning section (with updated prose for opposition aspects)
* Opportunity section (with same-planet conjunction handling)
* Transit summary (brief narrative)
* Reflection prompt (deterministically selected from 34 prompts)
* Suggested practice (deterministically selected from 24 practices)
* No-aspect fallback (complete daily guidance without active transits)
* Transit-house personalization (resolves transiting planet’s house through natal Whole Sign cusps)
* Expanded `Life area` context showing the current transiting planet’s natal Whole Sign house and canonical house focus when available
* Dashboard Today’s Energy UI with compact and expanded states
* One coherent reflection/practice CTA into the fixed-context JournalEditor flow

Current limitations:

* No AI-generated expansion yet
* No saved guidance history yet
* No notifications yet

### Weekly Forecast

Status: **DONE for deterministic Dashboard V1**

Implemented:

* Deterministic WeeklyForecast builder (timezone-aware, DST-handling)
* Monday–Sunday local week (using ISO 8601 week logic in provided timezone)
* Seven local-noon daily snapshots in the supplied time zone
* Seven-day Daily Rhythm with weekday, primary theme, concise summary, and optional day-specific `House N · focus`
* Weekly event candidates: Moon, Sun, Mercury, Venus, Mars, Jupiter, and Saturn
* Deterministic event ranking using planet relevance, aspect relevance, sampled orb closeness, and sampled `activeDays`
* Up to five deduplicated strongest transit highlights, with no more than one Moon highlight and no more than two highlights per other moving planet
* Up to three weekly patterns derived from the strongest ranked events
* Representative prompt and practice selected from the highest-ranked weekly pattern; background weeks use deterministic frequency-based selection
* Day-specific transit-house personalization from each local-noon DailyGuidance snapshot
* Aggregated weekly transit highlights remain house-neutral to avoid implying one house across a multi-day event
* No-aspect fallback (complete weekly forecast when no personal aspects found)
* Collapsible Dashboard Weekly Forecast card with sampled persistence labels and one weekly reflection CTA
* Jupiter and Saturn are weekly-only moving transit candidates and do not affect Today’s Energy

Current limitations:

* No dedicated weekly forecast screen (Dashboard integration only)
* No notifications or scheduled alerts
* No saved weekly forecast history
* No AI-generated longform weekly synthesis
* No multi-week or monthly forecasting yet

## AI Features

### Ask-Astrologer Chat

Status: **NOT IMPLEMENTED**

Planned:

* Ask-Astrologer chat interface
* Server-side LLM integration
* Smart prompt routing
* Natal reading questions
* Daily and weekly guidance questions
* Shadow-work questions
* Love / relationship questions
* Life-purpose questions

Important architecture rule:

* AI must not compute astrology directly.
* AI should consume Naksha-generated structured context:

  * natal placements
  * daily guidance
  * weekly forecast
  * relevant lexicon entries
  * relationship/synastry context when available
* Provider API keys must stay server-side.
* No LLM provider key should be exposed in React Native or `EXPO_PUBLIC_*`.

### Saved AI Conversations / Readings

Status: **SCAFFOLD ONLY / NOT IMPLEMENTED**

Existing groundwork:

* Conversation/message tables may exist in schema.

Not yet done:

* Chat UI
* Conversation service
* Message persistence flow
* Saved readings archive
* Topic/date browsing
* Tags/favorites
* AI retention/privacy policy

## Shadow Work & Self-Development

Status: **PARTIAL FOUNDATION / NOT FULLY IMPLEMENTED**

Implemented foundation:

* Reflection prompts and suggested practices exist in the deterministic guidance layer.
* Daily and weekly guidance surface one coherent prompt/practice reflection section.
* Reflection handoff opens JournalEditor with fixed source, prompt, and practice context.
* Safety framing presents this as reflection, not diagnosis or therapy.

Not yet done:

* Dedicated shadow-work prompt builder
* Shadow-work screen
* Daily/weekly introspection cycles
* Milestone tracking
* Completion tracking
* AI-generated shadow-work expansion

## Relationship / Synastry Roadmap

Status: **PLANNED**

Planned after forecast/guidance stabilization:

* Saved guest profiles
* Relationship labels:

  * romantic
  * friendship
  * family
  * coworker
* Synastry aspect engine
* Relationship/friendship interpretation primitives
* Harmony points
* Friction points
* Communication style
* Emotional compatibility
* Attraction/chemistry
* Growth edge
* Relationship reflection prompts
* Future AI interpretation of relationship dynamics

Post-MVP / later:

* Composite charts
* Compatibility reports
* Relationship history/archive
* Shareable relationship insights

## Notifications

Status: **NOT IMPLEMENTED**

Planned:

* Daily forecast notifications
* Weekly forecast notifications
* Transit alerts
* Retrograde alerts
* Eclipse alerts
* Notification preferences by planet/sign/intensity

Not yet done:

* Push notification dependency
* Permission flow
* Push token storage
* Notification scheduling
* Notification settings UI

## Reports, Monetization & Subscriptions

Status: **POST-MVP / NOT IMPLEMENTED**

Planned:

* Deep natal report
* Longform downloadable report
* Personalized transit timeline
* Premium relationship report
* Cosmetic chart themes
* Subscription tiers
* Purchase/restore flow
* Entitlement verification
* Billing cancellation/refund support

Current state:

* Subscription/purchase/report areas remain placeholder or future-facing.
* No production monetization flow should be advertised as live.

## Calendar & Advanced Forecasting

Status: **POST-MVP**

Planned:

* Transit calendar
* Upcoming aspects
* Retrogrades
* Eclipses
* Calendar sync
* Longer-range forecasts
* 6–12 month transit timeline

Not yet done:

* Retrograde engine
* Moon phase engine
* Applying/separating aspects
* Exact transit perfection solver
* Calendar integrations

## Multi-System Astrology Roadmap

Status: **LONG-TERM PLATFORM VISION**

Current implemented system:

* Western / Tropical / Whole Sign

Future systems:

### Vedic / Jyotish

Potential Vedic v1:

* Sidereal zodiac
* Lahiri ayanamsa
* Rashi / D1 chart
* Lagna
* Grahas including Rahu and Ketu
* Nakshatras
* Moon nakshatra
* Basic Vimshottari dasha

Later Vedic:

* Vargas / divisional charts
* Yogas
* Ashtakavarga
* Shadbala
* Jaimini
* Muhurta
* Prashna
* Vedic compatibility

### Chinese / East Asian Astrology

Potential Chinese v1:

* Chinese zodiac
* Five Elements
* Yin/Yang polarity
* Heavenly stems
* Earthly branches
* BaZi / Four Pillars

Later:

* Zi Wei Dou Shu
* Nine Star Ki
* East Asian compatibility/timing systems

### Other Long-Term Systems

Potential future expansions:

* Hellenistic / Traditional Western
* Astrocartography
* Tibetan astrology
* Mayan / Mesoamerican systems
* Numerology-adjacent systems
* Human Design-adjacent systems

## Data Privacy & Account Controls

Status: **PARTIAL**

Implemented:

* Account deletion
* Server-side authenticated delete flow
* App-owned row deletion before auth-user deletion
* Manual disposable-account QA completed

Not yet done:

* Data export
* Retention policy
* External billing cancellation/refund policy
* Delete-data-without-deleting-account flow
* Privacy/support documentation finalization

## Internal / Infrastructure

### Testing

Status: **ACTIVE**

Current verified baseline:

* Typecheck passes
* Jest passes: 25 suites / 183 tests
* Lint passes
* `git diff --check` passes
* Focused regression coverage includes auth, chart persistence and hydration, ChartData compatibility, typed navigation flows, journals, account deletion, guidance primitives, daily guidance, weekly forecast, transit-house resolution, and Dashboard rendering/error behavior

### CI / Release Readiness

Status: **NOT COMPLETE**

Not yet done:

* CI workflow
* Automated schema reset/diff validation
* Release checklist
* Production build QA record
* Store metadata
* Privacy policy and support URLs
* Crash/error telemetry

### Analytics / Usage Events

Status: **NOT IMPLEMENTED**

Planned:

* Privacy-aware usage events
* Activation funnel
* Feature usage metrics
* Drop-off analysis

### Admin / Support Tools

Status: **NOT IMPLEMENTED**

Planned:

* Bug report intake
* Error logs
* Support workflow
* AI failure monitoring after AI exists

## Current Product Definition

Naksha V1 is currently best described as:

**A functioning Western/Tropical astrology application with authenticated profiles, natal chart generation, local interpretations, saved and guest charts, deterministic daily and weekly transit guidance, transit-house personalization, guided reflection, and journaling.**

The D0–D6.3 V1 depth and architecture pass is complete. The application is entering final UI/UX redesign and Android production hardening; it is not yet production-ready or released.

Naksha is not yet:

* an AI astrology chat app
* a multi-system astrology platform
* a Vedic astrology app
* a Chinese astrology app
* a synastry/compatibility app
* a subscription/report product

Those are roadmap tracks.

## Immediate Android Release Path

The remaining V1 work is release work, not another major feature program:

1. Controlled UI/UX redesign while preserving the tested product loops
2. Android production identity, configuration, and signing
3. Signed release build and release-candidate QA on representative devices
4. Privacy, retention, support, and store-listing requirements
5. Google Play testing tracks and submission

iOS is intentionally later. Synastry, AI chat, notifications, additional astrology systems, outer planets as moving transit candidates, retrogrades, and lunar phases are post-V1 possibilities rather than Android V1 blockers.
