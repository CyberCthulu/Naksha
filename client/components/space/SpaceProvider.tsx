import React, { createContext, useContext, useMemo, useState } from 'react'

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

  const value = useMemo(
    () => ({
      focusedPlanet,
      focusPlanet: (p: PlanetName) => setFocusedPlanet(p),
      clearFocus: () => setFocusedPlanet(null),
    }),
    [focusedPlanet]
  )

  return <SpaceContext.Provider value={value}>{children}</SpaceContext.Provider>
}

export function useSpace() {
  const ctx = useContext(SpaceContext)
  if (!ctx) throw new Error('useSpace must be used inside SpaceProvider')
  return ctx
}
