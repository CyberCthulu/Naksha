# Current-sky compass

The dashboard's **Sky Now** card sits above the Today / This Week tabs. It shares the birth chart's interactive zodiac wheel and translucent card surface. Tap a planet or aspect for its readout, pinch to zoom, or expand the planet list for accessible position selection.

Positions are calculated locally for the current instant using Astronomy Engine through `computeTransitPlanets`. The Sun, Moon, and eight planets use geocentric tropical longitudes, matching the birth chart. Aspects compare these current positions to each other. This view requires neither birth details nor location and has no houses or Ascendant.

- The timestamp displays the calculation time in the device's local time zone.
- Calculations refresh every minute, on manual refresh, and immediately when returning to an active dashboard.
- Timers and wheel glow pause when the app or route is inactive. Reduced motion also disables the glow.
- If a refresh fails, the previous positions and timestamp remain visible with an error message and retry action.
- Position labels truncate to arcminutes so a value just below a sign boundary remains in the correct sign.

Main files: `client/components/charts/CurrentSkyCompass.tsx`, `client/hooks/useCurrentSky.ts`, and `client/lib/currentSky.ts`. Refresh cadence is controlled by `SKY_REFRESH_MS`; card translucency uses the shared `theme.cardSurface.base` token.

Calculation reference: [Astronomy Engine JavaScript documentation](https://github.com/cosinekitty/astronomy/tree/master/source/js#Ecliptic).
