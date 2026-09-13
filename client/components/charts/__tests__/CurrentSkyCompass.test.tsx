import React from 'react'
import TestRenderer from 'react-test-renderer'
import { CurrentSkyCompass } from '../CurrentSkyCompass'
import { InteractiveChartWheel } from '../InteractiveChartWheel'
import { useCurrentSky } from '../../../hooks/useCurrentSky'
import { Button } from '../../ui/Button'
import type { CurrentSky } from '../../../lib/currentSky'
import { buildCurrentSky } from '../../../lib/currentSky'

jest.mock('../../../hooks/useCurrentSky', () => ({ useCurrentSky: jest.fn() }))
jest.mock('../InteractiveChartWheel', () => ({
  InteractiveChartWheel: () => null,
}))

const { act, create } = TestRenderer
let renderer: ReturnType<typeof create>
let sky: CurrentSky
let hook: ReturnType<typeof useCurrentSky>
const mockedHook = jest.mocked(useCurrentSky)
const text = () => JSON.stringify(renderer.toJSON())
const wheel = () => renderer.root.findByType(InteractiveChartWheel)
const press = (testID: string) =>
  act(() =>
    renderer.root
      .findAll(
        (node) =>
          node.props.testID === testID &&
          typeof node.props.onPress === 'function'
      )[0]
      .props.onPress()
  )

beforeEach(() => {
  sky = {
    evaluatedAt: new Date('2026-09-12T12:00:00Z'),
    planets: [
      { name: 'Sun', lon: 170 },
      { name: 'Moon', lon: 350 },
      { name: 'Mars', lon: 80 },
    ],
    aspects: [
      { a: 'Sun', b: 'Moon', type: 'opp', orb: 0 },
      { a: 'Sun', b: 'Mars', type: 'square', orb: 0 },
    ],
  }
  hook = { sky, error: false, active: true, refresh: jest.fn() }
  mockedHook.mockImplementation(() => hook)
  act(() => {
    renderer = create(<CurrentSkyCompass />)
  })
})

afterEach(() => act(() => renderer.unmount()))

it('shows the current sky with no natal houses and a dated position readout', () => {
  expect(wheel().props.planets).toBe(sky.planets)
  expect(wheel().props.houses).toBeNull()
  expect(text()).toContain('2026')
  expect(text()).toContain('Sun · 20°00′ Virgo')
  expect(text()).not.toContain('birth')
})

it('exposes exact positions and selects planets through the accessible list', () => {
  press('current-sky-positions-toggle')
  press('current-sky-planet-Moon')
  expect(wheel().props.selection).toEqual({ kind: 'planet', planet: 'Moon' })
  expect(text()).toContain('Moon · 20°00′ Pisces')
  act(() => wheel().props.onSelectPlanet('Mars'))
  expect(text()).toContain('Mars · 20°00′ Gemini')
  press('current-sky-positions-toggle')
  expect(text()).not.toContain('current-sky-planet-Moon')
})

it('preserves the selected aspect across refresh reordering and clears removed aspects', () => {
  act(() => wheel().props.onSelectAspect(0))
  expect(text()).toContain('Opposition')
  hook = { ...hook, sky: { ...sky, aspects: [...sky.aspects].reverse() } }
  act(() => renderer.update(<CurrentSkyCompass />))
  expect(wheel().props.selection).toEqual({ kind: 'aspect', index: 1 })
  expect(text()).toContain('Opposition')
  hook = { ...hook, sky: { ...sky, aspects: [sky.aspects[1]] } }
  act(() => renderer.update(<CurrentSkyCompass />))
  expect(wheel().props.selection).toBeNull()
  expect(text()).toContain('Tap a planet or aspect')
})

it('explains the measured Moon–Saturn opposition and discloses all rules', () => {
  const realSky = buildCurrentSky(new Date('2026-09-13T01:13:00Z'))
  hook = { ...hook, sky: realSky }
  act(() => renderer.update(<CurrentSkyCompass />))
  const index = realSky.aspects.findIndex(
    (aspect) => aspect.a === 'Moon' && aspect.b === 'Saturn'
  )
  act(() => wheel().props.onSelectAspect(index))
  expect(text()).toContain('Opposition · within 6° orb')
  expect(text()).toContain('178.85° zodiac separation')
  expect(text()).toContain('1.15° from exact 180°')
  press('current-sky-rules-toggle')
  expect(text()).toContain('Conjunction: 0° · up to 6° orb')
  expect(text()).toContain('Opposition: 180° · up to 6° orb')
  expect(text()).toContain('Trine: 120° · up to 5° orb')
  expect(text()).toContain('Square: 90° · up to 5° orb')
  expect(text()).toContain('Sextile: 60° · up to 4° orb')
  expect(text()).toContain('2026-09-13T01:13:00.000Z')
  press('current-sky-rules-toggle')
  expect(text()).not.toContain('current-sky-rules\"')
})

it('keeps the snapshot visible if refresh fails and allows a retry', () => {
  hook = { ...hook, error: true }
  act(() => renderer.update(<CurrentSkyCompass />))
  expect(text()).toContain('Showing the last update')
  expect(wheel().props.planets).toBe(sky.planets)
  act(() => renderer.root.findByType(Button).props.onPress())
  expect(hook.refresh).toHaveBeenCalledTimes(1)
})

it('pauses wheel motion while inactive and handles an initial calculation failure', () => {
  hook = { ...hook, active: false }
  act(() => renderer.update(<CurrentSkyCompass />))
  expect(wheel().props.motionEnabled).toBe(false)
  expect(renderer.root.findByType(Button).props.disabled).toBe(true)
  hook = { ...hook, active: true, sky: null, error: true }
  act(() => renderer.update(<CurrentSkyCompass />))
  expect(text()).toContain('Couldn’t calculate the current sky')
  expect(renderer.root.findAllByType(InteractiveChartWheel)).toHaveLength(0)
  expect(renderer.root.findByType(Button).props.title).toBe('Try again')
})
