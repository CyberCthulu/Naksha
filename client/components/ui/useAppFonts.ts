import { useEffect, useState } from 'react'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'

// Per-weight subpaths, so only the four required .ttf files are bundled rather
// than every weight the Google Fonts packages ship.
import { Inter_400Regular } from '@expo-google-fonts/inter/400Regular'
import { Inter_500Medium } from '@expo-google-fonts/inter/500Medium'
import { Inter_600SemiBold } from '@expo-google-fonts/inter/600SemiBold'
import { CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond/600SemiBold'

/**
 * Exactly the four approved families. Bundled as local assets, never fetched at
 * runtime, so the app works fully offline.
 */
export const APP_FONTS = {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  CormorantGaramond_600SemiBold,
}

/**
 * A user must never be held on the splash screen by a font. If loading has not
 * settled by this point the app continues on system fallbacks.
 */
export const FONT_LOAD_TIMEOUT_MS = 3000

// Hold the splash from module scope so it is in effect before the first render.
// The catch matters: preventAutoHideAsync rejects if the splash has already
// gone, and an unhandled rejection here would surface as a red-box in dev.
SplashScreen.preventAutoHideAsync().catch(() => {})

export type AppFontsState = {
  /** Safe to reveal the app: fonts loaded, failed, or took too long. */
  ready: boolean
  /** True only when the four families are actually available. */
  fontsLoaded: boolean
  error: Error | null
  timedOut: boolean
}

export function useAppFonts(): AppFontsState {
  const [fontsLoaded, fontError] = useFonts(APP_FONTS)
  const [timedOut, setTimedOut] = useState(false)

  const settled = fontsLoaded || fontError != null
  const ready = settled || timedOut

  useEffect(() => {
    if (settled) return

    const timer = setTimeout(() => setTimedOut(true), FONT_LOAD_TIMEOUT_MS)
    return () => clearTimeout(timer)
  }, [settled])

  useEffect(() => {
    if (!ready) return

    // Hiding an already-hidden splash rejects; the app is up either way, so the
    // failure is swallowed rather than left to become an unhandled rejection.
    SplashScreen.hideAsync().catch(() => {})
  }, [ready])

  return {
    ready,
    fontsLoaded: !!fontsLoaded,
    error: fontError ?? null,
    timedOut,
  }
}
