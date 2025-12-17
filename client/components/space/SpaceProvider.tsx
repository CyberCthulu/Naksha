// components/space/SpaceProvider.tsx
import React, { createContext, useCallback, useContext, useMemo, useState } from 'react'

export type PlanetName =
  | 'Sun' | 'Moon' | 'Mercury' | 'Venus' | 'Mars'
  | 'Jupiter' | 'Saturn' | 'Uranus' | 'Neptune' | 'Pluto'

type SpaceState = {
  focusedPlanet: PlanetName | null
  focusPlanet: (p: PlanetName) => void
  clearFocus: () => void
}

const SpaceContext = createContext<SpaceState | null>(null)

export function SpaceProvider({ children }: { children: React.ReactNode }) {
  const [focusedPlanet, setFocusedPlanet] = useState<PlanetName | null>(null)

  // ✅ stable function identities
  const focusPlanet = useCallback((p: PlanetName) => setFocusedPlanet(p), [])
  const clearFocus = useCallback(() => setFocusedPlanet(null), [])

  const value = useMemo(
    () => ({ focusedPlanet, focusPlanet, clearFocus }),
    [focusedPlanet, focusPlanet, clearFocus]
  )

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>
}

export function useSpace() {
  const ctx = useContext(SpaceContext)
  if (!ctx) throw new Error('useSpace must be used inside SpaceProvider')
  return ctx
}
