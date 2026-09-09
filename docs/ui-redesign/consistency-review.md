# UI consistency review — 2026-09-09

Reviewed the dashboard, guidance, shared UI primitives, authentication and birth
detail forms, charts, saved charts, journal, and profile screens.

| Finding | Correction |
| --- | --- |
| Today's Energy used the raised card color while Weekly Forecast used the standard card color. | Both use the same `GuidanceCard` wrapper and standard surface, with shared title, metadata, and expand/collapse styles. |
| Only twelve faint stars appeared, all in the upper half; cards obscured much of the decoration. | The shared atmospheric background now has 180 deterministic ambient stars, 15 catalog stars from Cassiopeia and central Orion shown as standalone points without connecting lines, violet/blue washes, and small halos on the brightest stars. |
| Guest chart creation looked flat beside the dashboard. | Its route now uses the same atmospheric background, visible through the form's transparent containers. |
| Journal list and editor still used the quiet background without stars. | Both routes now use the full atmospheric sky. List cards retain the shared 30% fill, and the editor's large writing field uses that fill so stars remain visible while writing. |
| Background colors felt static and the constellation fragments were invented. | All screen variants except the explicit flat fallback share slow violet/blue/teal cloud motion (softer on forms). Star groups retain verified catalog coordinates and uniform scaling, with halos but no connecting lines. Their independent placements are decorative, not a sky map. |
| Reduced motion erased an entirely static background. | Static decoration remains visible without waiting for a motion preference. The explicit flat background is still available. |
| `MutedText` with a typography variant still defaulted to legacy translucent white. | It now uses the shared secondary text color. |
| Date/time selectors, time-zone controls, location suggestions, and setup screens mixed legacy colors and system fonts with the current design. | They use the shared typography, navy input surfaces, semantic text/border colors, and existing form primitives. |
| Login, signup, password recovery, email verification, and profile completion used competing primary-action treatments. | Primary actions consistently use the existing gold button; supporting navigation uses secondary or tertiary buttons. |
| Navigation theme text and accents were hardcoded white. | They use the shared text, accent, and information colors. |

Chart, journal, saved-chart, and profile content already predominantly used the
semantic palette. Planet glyph colors, selection highlights, and raised sheets
remain distinct because they represent different roles.

Follow-up: reading cards now use the reader-tuned 30% opaque navy fill (72% for raised/selected
cards), letting stars show through while keeping text and controls fully opaque.
The initially tested 78% fill was too subtle. Chart interpretation and legend
popups have their own contained sky over a solid base, so chart-page text cannot
show through them.

Nine bright stars have a slow glimmer using one native-driver opacity animation
over a static SVG layer. Occasional shooting stars cross the sky using one small
native-animated sprite, with long pauses between flights. Two static cloud
textures share another native phase to move and crossfade over 48 seconds.
All effects stop on hidden routes, app inactivity, reduced motion, and unmount.
The base sky remains visible in every motion mode. Quiet form backgrounds use
half-strength cloud motion; contained popup skies remain static. No runtime
assets, blur effects, or dependencies were added.

Cloud intensity is capped by the chosen default of 0.75 (0.375 for quiet
screens), and tertiary text is lifted to soft slate `#929FBD`. Gradient-only
SVG samples at the beginning, middle and end of the cycle keep the dimmest
text above 4.5:1 on the open sky and 5.1:1 on 30% cards. Those checks exclude
tiny star cores and do not replace native visual review.

Small sun and lunar-cycle marks accompany the guidance headings. Orbital,
house-wheel, and connected-star marks accompany chart section headings. These
fixed ornaments do not imply live moon phases or chart data and are hidden from
screen readers. Sky tuning is centralized in `components/ui/celestialConfig.ts`.

Validation includes component/screen tests, TypeScript, ESLint, and an offline
Android bundle export. No Android device was connected for an on-device visual
review; SVG previews validate decoration geometry and colors only.
