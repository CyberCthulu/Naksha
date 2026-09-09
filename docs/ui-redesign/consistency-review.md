# UI consistency review — 2026-09-09

Reviewed the dashboard, guidance, shared UI primitives, authentication and birth
detail forms, charts, saved charts, journal, and profile screens.

| Finding | Correction |
| --- | --- |
| Today's Energy used the raised card color while Weekly Forecast used the standard card color. | Both use the same `GuidanceCard` wrapper and standard surface, with shared title, metadata, and expand/collapse styles. |
| Only twelve faint stars appeared, all in the upper half; cards obscured much of the decoration. | The shared atmospheric background now has 96 deterministic stars across the viewport and gutters, soft violet/blue washes, and small halos on the brightest stars. |
| Reduced motion erased an entirely static background. | Static decoration remains visible without waiting for a motion preference. The explicit flat background is still available. |
| `MutedText` with a typography variant still defaulted to legacy translucent white. | It now uses the shared secondary text color. |
| Date/time selectors, time-zone controls, location suggestions, and setup screens mixed legacy colors and system fonts with the current design. | They use the shared typography, navy input surfaces, semantic text/border colors, and existing form primitives. |
| Login, signup, password recovery, email verification, and profile completion used competing primary-action treatments. | Primary actions consistently use the existing gold button; supporting navigation uses secondary or tertiary buttons. |
| Navigation theme text and accents were hardcoded white. | They use the shared text, accent, and information colors. |

Chart, journal, saved-chart, and profile content already predominantly used the
semantic palette. Planet glyph colors, selection highlights, and raised sheets
remain distinct because they represent different roles.

Follow-up: reading cards now use a 60% opaque navy fill (72% for raised/selected
cards), letting stars show through while keeping text and controls fully opaque.
The initially tested 78% fill was too subtle. Chart interpretation and legend
popups have their own contained sky over a solid base, so chart-page text cannot
show through them.

Nine bright stars have a slow glimmer using one native-driver opacity animation
over a static SVG layer. It stops on hidden routes, app inactivity, reduced
motion, and unmount. The base sky remains visible in every motion mode. Quiet
form backgrounds and contained popup skies remain static. No runtime assets,
blur effects, or dependencies were added.

Validation includes component/screen tests, TypeScript, ESLint, and an offline
Android bundle export. No Android device was connected for an on-device visual
review; SVG previews validate decoration geometry and colors only.
