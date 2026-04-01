//lib/chartInterpretation.ts
import {
  zodiacNameFromLongitude,
  getPlanetSignMeaning,
  getPlanetHouseMeaning,
  type PlanetKey,
  type HouseNumber,
} from './lexicon'
import type { PlanetHousePlacement } from './astro'

export function asPlanetKey(name: string): PlanetKey | null {
  const allowed: PlanetKey[] = [
    'Sun',
    'Moon',
    'Mercury',
    'Venus',
    'Mars',
    'Jupiter',
    'Saturn',
    'Uranus',
    'Neptune',
    'Pluto',
  ]

  return (allowed as string[]).includes(name) ? (name as PlanetKey) : null
}

export function asHouseNumber(n: number): HouseNumber | null {
  return n >= 1 && n <= 12 ? (n as HouseNumber) : null
}

export function trimPeriod(text: string): string {
  return text.trim().replace(/[.!?]+$/, '')
}

export function toClause(text: string): string {
  const trimmed = trimPeriod(text)

  if (!trimmed) return ''

  if (trimmed.startsWith('Your ')) {
    return `your ${trimmed.slice(5)}`
  }

  if (trimmed.startsWith('You ')) {
    return `you ${trimmed.slice(4)}`
  }

  return trimmed.charAt(0).toLowerCase() + trimmed.slice(1)
}

export function buildPlanetSummary(
  planetName: string,
  lon: number,
  planetHouses: PlanetHousePlacement[] | null
): string {
  const pk = asPlanetKey(planetName)
  if (!pk) return ''

  const signName = zodiacNameFromLongitude(lon)
  const signMeaning = getPlanetSignMeaning(pk, signName)

  const placement = planetHouses?.find((p) => p.name === planetName)
  const houseNumber = placement ? asHouseNumber(placement.house) : null
  const houseMeaning = houseNumber
    ? getPlanetHouseMeaning(pk, houseNumber)
    : null

  if (signMeaning?.short && houseMeaning?.short) {
    const signPart = trimPeriod(signMeaning.short)
    const housePart = toClause(houseMeaning.short)
    return `${signPart}. This tends to show up most clearly when ${housePart}.`
  }

  if (signMeaning?.short) return signMeaning.short
  if (houseMeaning?.short) return houseMeaning.short

  return ''
}