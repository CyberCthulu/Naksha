import React from 'react'
import { Text } from 'react-native'
import TestRenderer from 'react-test-renderer'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'

import { APP_FONTS, FONT_LOAD_TIMEOUT_MS, useAppFonts } from '../useAppFonts'

jest.mock('expo-font', () => ({ useFonts: jest.fn() }))

jest.mock('expo-splash-screen', () => ({
  preventAutoHideAsync: jest.fn(() => Promise.resolve()),
  hideAsync: jest.fn(() => Promise.resolve()),
}))

const { act, create } = TestRenderer

const mockedUseFonts = useFonts as unknown as jest.Mock
const mockedHide = SplashScreen.hideAsync as unknown as jest.Mock

let state: ReturnType<typeof useAppFonts> | null = null

function Probe() {
  state = useAppFonts()
  return <Text>{String(state.ready)}</Text>
}

function renderProbe() {
  let renderer: ReturnType<typeof create> | null = null
  act(() => {
    renderer = create(<Probe />)
  })
  if (!renderer) throw new Error('did not render')
  return renderer!
}

describe('useAppFonts', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.useFakeTimers()
    state = null
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('requests exactly the four approved families', () => {
    expect(Object.keys(APP_FONTS)).toEqual([
      'Inter_400Regular',
      'Inter_500Medium',
      'Inter_600SemiBold',
      'CormorantGaramond_600SemiBold',
    ])
  })

  it('holds the splash while fonts are still loading', () => {
    mockedUseFonts.mockReturnValue([false, null])
    renderProbe()

    expect(state?.ready).toBe(false)
    expect(mockedHide).not.toHaveBeenCalled()
  })

  it('hides the splash once fonts load', async () => {
    mockedUseFonts.mockReturnValue([true, null])
    renderProbe()

    expect(state?.ready).toBe(true)
    expect(state?.fontsLoaded).toBe(true)
    expect(state?.error).toBeNull()
    expect(mockedHide).toHaveBeenCalledTimes(1)
  })

  it('hides the splash and continues when loading fails', () => {
    const error = new Error('font asset missing')
    mockedUseFonts.mockReturnValue([false, error])
    renderProbe()

    // The app must proceed on system fallbacks rather than wait.
    expect(state?.ready).toBe(true)
    expect(state?.fontsLoaded).toBe(false)
    expect(state?.error).toBe(error)
    expect(mockedHide).toHaveBeenCalledTimes(1)
  })

  it('never strands the app: the splash is released on timeout', () => {
    mockedUseFonts.mockReturnValue([false, null])
    renderProbe()

    expect(state?.ready).toBe(false)
    expect(mockedHide).not.toHaveBeenCalled()

    act(() => {
      jest.advanceTimersByTime(FONT_LOAD_TIMEOUT_MS)
    })

    expect(state?.timedOut).toBe(true)
    expect(state?.ready).toBe(true)
    expect(state?.fontsLoaded).toBe(false)
    expect(mockedHide).toHaveBeenCalledTimes(1)
  })

  it('does not start a timeout once loading has settled', () => {
    mockedUseFonts.mockReturnValue([true, null])
    renderProbe()

    act(() => {
      jest.advanceTimersByTime(FONT_LOAD_TIMEOUT_MS * 3)
    })

    expect(state?.timedOut).toBe(false)
    expect(mockedHide).toHaveBeenCalledTimes(1)
  })

  it('clears its timer on unmount', () => {
    mockedUseFonts.mockReturnValue([false, null])
    const renderer: ReturnType<typeof create> = renderProbe()
    const clear = jest.spyOn(global, 'clearTimeout')

    act(() => {
      renderer.unmount()
    })

    expect(clear).toHaveBeenCalled()
    clear.mockRestore()
  })

  it('swallows a splash-hide rejection instead of leaving it unhandled', async () => {
    mockedHide.mockRejectedValueOnce(new Error('already hidden'))
    mockedUseFonts.mockReturnValue([true, null])

    const unhandled = jest.fn()
    process.on('unhandledRejection', unhandled)

    renderProbe()
    await act(async () => {
      await Promise.resolve()
    })

    process.off('unhandledRejection', unhandled)
    expect(unhandled).not.toHaveBeenCalled()
  })
})
