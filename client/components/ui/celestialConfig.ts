/** Visual tuning for the shared sky. Opacity values range from 0 to 1. */
export const celestialConfig = {
  /** Includes the original 96 stars; additional stars are smaller and dimmer. */
  starCount: 180,
  nebulaOpacity: 0.28,
  hazeOpacity: 0.22,
  glimmerHalfCycleMs: 6000,
  cosmicSky: {
    /** One direction of the drift; the complete cycle takes 48 seconds. */
    halfCycleMs: 24000,
    /** Maximum cloud travel in layout pixels. */
    driftDistance: 24,
    intensity: 0.75,
    quietIntensity: 0.375,
  },
  shootingStar: {
    firstDelayMs: 7000,
    gapsMs: [18000, 26000, 22000],
    durationMs: 1400,
    peakOpacity: 0.65,
  },
} as const
