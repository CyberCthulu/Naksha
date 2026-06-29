# Naksha Feature List

Personalized astrology, forecasts, journaling, relationship mapping, and future AI-guided spiritual insight.

This document separates implemented V1 functionality from planned roadmap features. It should not be read as a list of completed features unless an item is marked **DONE**.

## Current V1 Scope — Tropical / Western System

### Account & Profile

Status: **DONE**

* Email/password signup and login
* Supabase Auth session persistence
* Email verification / OTP callback flow
* Password reset / forgot-password flow
* Profile completion and editing
* Birth date, birth time, birth location, time zone, latitude, and longitude storage
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
* Compute planetary positions
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

Not yet done:

* Journal handoff from DailyGuidance / WeeklyForecast prompts
* Prompt archive
* Tags/favorites/search
* Shadow-work milestones
* Guided cycles

## Forecast & Guidance Layer

### Guidance Primitives

Status: **DONE**

Implemented deterministic guidance primitives for:

* Transit planet guidance domains
* Natal target planet activation domains
* Aspect dynamics
* Sign guidance
* House guidance
* Reflection prompts
* Suggested practices
* Stable IDs and source IDs
* Coverage and integrity tests

Purpose:

* Power deterministic daily and weekly guidance
* Provide structured grounding for future AI
* Keep astrology logic in Naksha’s codebase instead of relying on generic AI generation

### Daily Guidance / Today’s Energy

Status: **DONE**

Implemented:

* Deterministic DailyGuidance builder
* Mood section
* Watch-for section
* Opportunity section
* Transit summary
* Reflection prompt
* Suggested practice
* No-aspect fallback
* Dashboard Today’s Energy UI powered by DailyGuidance

Current limitations:

* Focused on current supported transit logic
* No AI-generated expansion yet
* No journal handoff yet
* No notifications yet

### Weekly Forecast

Status: **IMPLEMENTED — pending final review/commit if not already committed**

Implemented:

* Deterministic WeeklyForecast builder
* Monday–Sunday local week
* Local-noon daily snapshots
* Time-zone and DST handling
* Seven daily themes
* Weekly themes
* Strongest transit highlights
* Journal prompts
* Suggested practices
* No-aspect fallback
* Dashboard Weekly Forecast UI

Current limitations:

* No dedicated weekly forecast screen yet unless added later
* No notifications
* No saved weekly forecast history
* No AI-generated longform weekly synthesis

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
* Daily and weekly guidance can surface prompts/practices.

Not yet done:

* Dedicated shadow-work prompt builder
* Shadow-work screen
* Daily/weekly introspection cycles
* Milestone tracking
* Completion tracking
* AI-generated shadow-work expansion
* Journal prompt handoff

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

Status: **ACTIVE / IMPROVING**

Current verified direction:

* Typecheck
* Jest tests
* Lint
* `git diff --check`
* Focused regression tests for auth, chart, journal, account deletion, guidance primitives, daily guidance, weekly forecast, and Dashboard guidance rendering

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

**A Western/Tropical astrology app with authenticated profiles, natal chart generation, local interpretations, saved/guest charts, journaling, deterministic daily guidance, and deterministic weekly forecasts.**

Naksha is not yet:

* an AI astrology chat app
* a multi-system astrology platform
* a Vedic astrology app
* a Chinese astrology app
* a synastry/compatibility app
* a subscription/report product

Those are roadmap tracks.
