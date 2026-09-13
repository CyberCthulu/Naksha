# Current-sky compass

The dashboard's **Sky Now** card sits above the Today / This Week tabs. It shares the birth chart's interactive zodiac wheel and translucent card surface. Tap a planet or aspect for its readout, pinch to zoom, or expand the planet list for accessible position selection.

Positions are calculated locally for the current instant using Astronomy Engine through `computeTransitPlanets`. The Sun, Moon, and eight planets use geocentric tropical longitudes, matching the birth chart. Aspects compare these current positions to each other. This view requires neither birth details nor location and has no houses or Ascendant.

- The timestamp displays the calculation time in the device's local time zone.
- Calculations refresh every minute, on manual refresh, and immediately when returning to an active dashboard.
- Timers and wheel glow pause when the app or route is inactive. Reduced motion also disables the glow.
- If a refresh fails, the previous positions and timestamp remain visible with an error message and retry action.
- Position labels truncate to arcminutes so a value just below a sign boundary remains in the correct sign.

Main files: `client/components/charts/CurrentSkyCompass.tsx`, `client/hooks/useCurrentSky.ts`, and `client/lib/currentSky.ts`. Refresh cadence is controlled by `SKY_REFRESH_MS`; card translucency uses the shared `theme.cardSurface.base` token.

## Aspect rules and precision

`client/lib/aspects.ts` is the shared source of the medium orb policy. Sky Now retains unrounded numeric longitudes and orbs through classification. `findAspects` in `astro.ts` preserves the existing two-decimal orb representation for saved birth charts.

For normalized longitudes `a` and `b`, calculate `difference = abs(a - b)` and `separation = min(difference, 360 - difference)`. A pair qualifies when `abs(separation - targetAngle) <= allowedOrb`. This is separation in zodiac longitude, not the three-dimensional angular distance between bodies. Each unordered pair is considered once, including pairs across sign boundaries.

| Aspect | Target angle | Allowed orb |
| --- | ---: | ---: |
| Conjunction | 0° | 6° |
| Opposition | 180° | 6° |
| Trine | 120° | 5° |
| Square | 90° | 5° |
| Sextile | 60° | 4° |

These are Naksha's astrological conventions, not universal astronomical thresholds. Being within an orb does not mean an aspect is exact. The selected-aspect readout leads with interpretation and a small orb label. The secondary **Calculation details** disclosure shows the measured separation, distance from the exact angle, allowed orb, every rule, UTC calculation timestamp, and device-clock dependency. Rounding is for presentation only; a positive orb below the display precision is shown as `<0.01°` rather than zero.

## Current-sky interpretations

`client/lib/lexicon/aspects/currentSky.ts` contains authored themes, opportunities, tensions, practices, and reflection questions for all 45 unordered pairs among the ten displayed bodies. The five aspect dynamics provide distinct framing: conjunction concentrates, opposition contrasts, square invites adjustment, trine describes cooperation, and sextile suggests an opening that benefits from participation. Moon–Saturn additionally has a separate meaning and practice for each aspect type.

`getSkyAspectMeaning` combines the pair with its calculated aspect deterministically. Reversing the two bodies returns the same reading. Unknown bodies, repeated bodies, and unsupported aspect types return no interpretation. The reading follows the stable selected aspect key as the snapshot updates and disappears if that aspect leaves the current sky.

These readings extend Naksha's existing planetary and aspect symbolism as reflective editorial content. They do not forecast events or assign natal traits to everyone viewing the sky. Pairings between Jupiter and the slower bodies explicitly describe a longer background theme. Current positions and aspect eligibility remain calculated independently of the prose; no interpretation can create an aspect on the wheel.

The app shows a pair theme, an explanation of the aspect, what the pairing may mean, a practical suggestion, and a reflection. Technical details remain collapsed at the bottom of the card. These entries are for Sky Now; birth-chart interpretations retain their separate context.

Astronomy Engine's stated accuracy target is ±1 arcminute (1/60°); retaining floating-point precision does not imply infinitely precise physical positions. Positions update every minute while active, so they describe the displayed snapshot rather than a continuously changing instant. Values very close to a rule boundary can differ between ephemeris models within their accuracy limits.

## Independent reference check

At **2026-09-13T01:13:00Z** (September 12, 6:13 p.m. PDT), NASA JPL Horizons gives the Moon at **194.0682667°** and Saturn at **12.9207945°**. Their shortest longitude separation is **178.8525278°**, **1.1474722°** from exact opposition. Naksha calculates **178.8490148°**, an orb of **1.1509852°**. Both qualify under the 6° rule; neither is an exact 180° alignment at that timestamp.

The frozen fixture `client/lib/__tests__/fixtures/currentSky-horizons.json` records all ten JPL longitudes, exact request URLs, time, observer and coordinate metadata. Requests use observer center `500@399`, quantity `31` (`ObsEcLon`), apparent IAU76/80 ecliptic-of-date coordinates without atmospheric refraction. The largest difference from Naksha at this timestamp is 12.14 arcseconds (Neptune), below the one-arcminute regression tolerance. JPL and Astronomy Engine use slightly different models and corrections; this is an independent check at one timestamp, not a guarantee for every date.

Tests also cover every rule at and around its threshold, circular wraparound, swapped pairs, invalid inputs, unrounded classification, and equivalent UTC/local timestamps. An earlier September 12 timestamp correctly excludes the Moon–Saturn opposition.

References: [Astronomy Engine coordinates](https://github.com/cosinekitty/astronomy/tree/master/source/js#Ecliptic), [engine accuracy target](https://github.com/cosinekitty/astronomy#readme), [JPL observer quantity 31](https://ssd.jpl.nasa.gov/horizons/manual.html#obsquan), and [astrological orb conventions](https://www.astro.com/astrowiki/en/Orb).
