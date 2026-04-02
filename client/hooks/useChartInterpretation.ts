import { useCallback, useMemo, useState } from 'react'
import type { InterpretationPage } from '../components/charts/interpretationTypes'
import { asPlanetKey, asHouseNumber } from '../lib/chartInterpretation'
import type { PlanetKey, HouseNumber } from '../lib/lexicon'

type FocusTarget =
  | { kind: 'planet'; key: PlanetKey }
  | { kind: 'house'; key: HouseNumber }
  | null

type Args = {
  focusPlanet: (planet: PlanetKey) => void
  planetPages: InterpretationPage[]
  housePages: InterpretationPage[]
}

type Result = {
  interpretationVisible: boolean
  activePages: InterpretationPage[]
  modalHeaderTitle: string
  currentInterpretationIndex: number
  focusedHouse: HouseNumber | null
  openPlanetInterpretation: (planet: PlanetKey) => void
  openHouseInterpretation: (house: HouseNumber) => void
  handleChangeInterpretationIndex: (index: number) => void
  closeInterpretation: () => void
}

export default function useChartInterpretation({
  focusPlanet,
  planetPages,
  housePages,
}: Args): Result {
  const [focusOn, setFocusOn] = useState<FocusTarget>(null)
  const [interpretationVisible, setInterpretationVisible] = useState(false)

  const openPlanetInterpretation = useCallback(
    (planet: PlanetKey) => {
      focusPlanet(planet)
      setFocusOn({ kind: 'planet', key: planet })
      setInterpretationVisible(true)
    },
    [focusPlanet]
  )

  const openHouseInterpretation = useCallback((house: HouseNumber) => {
    setFocusOn({ kind: 'house', key: house })
    setInterpretationVisible(true)
  }, [])

  const closeInterpretation = useCallback(() => {
    setInterpretationVisible(false)
  }, [])

  const activePages = useMemo<InterpretationPage[]>(() => {
    if (!focusOn) return []
    return focusOn.kind === 'planet' ? planetPages : housePages
  }, [focusOn, planetPages, housePages])

  const modalHeaderTitle = useMemo(() => {
    if (!focusOn) return 'Interpretation'
    return focusOn.kind === 'planet'
      ? 'Planet Interpretation'
      : 'House Interpretation'
  }, [focusOn])

  const currentInterpretationIndex = useMemo(() => {
    if (!focusOn) return 0

    if (focusOn.kind === 'planet') {
      const index = planetPages.findIndex((page) => page.key === focusOn.key)
      return index >= 0 ? index : 0
    }

    const index = housePages.findIndex(
      (page) => page.key === `house-${focusOn.key}`
    )
    return index >= 0 ? index : 0
  }, [focusOn, planetPages, housePages])

  const handleChangeInterpretationIndex = useCallback(
    (index: number) => {
      if (!focusOn) return

      if (focusOn.kind === 'planet') {
        const nextPage = planetPages[index]
        if (!nextPage) return

        const nextPlanet = asPlanetKey(nextPage.key)
        if (!nextPlanet) return

        focusPlanet(nextPlanet)
        setFocusOn({ kind: 'planet', key: nextPlanet })
        return
      }

      const nextPage = housePages[index]
      if (!nextPage) return

      const nextHouseNumber = Number(nextPage.key.replace('house-', ''))
      const nextHouse = asHouseNumber(nextHouseNumber)
      if (!nextHouse) return

      setFocusOn({ kind: 'house', key: nextHouse })
    },
    [focusOn, planetPages, housePages, focusPlanet]
  )

  const focusedHouse =
    focusOn?.kind === 'house'
      ? focusOn.key
      : null

  return {
    interpretationVisible,
    activePages,
    modalHeaderTitle,
    currentInterpretationIndex,
    focusedHouse,
    openPlanetInterpretation,
    openHouseInterpretation,
    handleChangeInterpretationIndex,
    closeInterpretation,
  }
}