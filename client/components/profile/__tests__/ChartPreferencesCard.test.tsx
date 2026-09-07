import React from 'react'
import TestRenderer from 'react-test-renderer'

import ChartPreferencesCard from '../ChartPreferencesCard'
import { theme } from '../../ui/theme'

const { act, create } = TestRenderer

const PREFS = {
  house_system: 'whole_sign' as const,
  zodiac_type: 'tropical' as const,
  orb_mode: 'medium' as const,
  show_house_degrees: false,
}

function render(showHouseDegrees: boolean, savingPrefs = false) {
  let renderer: ReturnType<typeof create> | null = null
  act(() => {
    renderer = create(
      <ChartPreferencesCard
        prefs={{ ...PREFS, show_house_degrees: showHouseDegrees }}
        savingPrefs={savingPrefs}
        onUpdatePrefs={jest.fn()}
      />
    )
  })
  if (!renderer) throw new Error('did not render')
  return renderer as unknown as ReturnType<typeof create>
}

describe('ChartPreferencesCard', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  })

  /*
   * Both switch positions, deliberately.
   *
   * The screen-level test only ever rendered the off state, and the stray iOS
   * blue lived on the *on* branch -- so a colour assertion made against the
   * default fixture passed while the blue was still in the file.
   */
  it.each([true, false])('uses no iOS system blue with the switch %s', (on) => {
    const rendered = JSON.stringify(render(on).toJSON())

    expect(rendered).not.toContain('#007AFF')
    expect(rendered).not.toContain('rgba(0,122,255')
    expect(rendered).not.toContain('#999')
  })

  it('tints the switch from the accent palette in either position', () => {
    const on = render(true).root.findByProps({
      accessibilityLabel: 'Show house degrees',
    })
    const off = render(false).root.findByProps({
      accessibilityLabel: 'Show house degrees',
    })

    expect(on.props.thumbColor).toBe(theme.accent.base)
    expect(off.props.thumbColor).toBe(theme.text.disabled)
    expect(on.props.trackColor).toEqual({
      false: theme.border.base,
      true: theme.accent.muted,
    })
  })

  it('keeps the unreleased switch inert and says so to assistive tech', () => {
    const control = render(false).root.findByProps({
      accessibilityLabel: 'Show house degrees',
    })

    expect(control.props.disabled).toBe(true)
    expect(control.props.accessibilityState).toEqual({
      disabled: true,
      checked: false,
    })
  })

  it('groups the options so they are announced as sets', () => {
    const groups = render(false).root.findAll(
      (node) =>
        typeof node.type === 'string' &&
        node.props?.accessibilityRole === 'radiogroup'
    )

    // House system, zodiac, aspect orbs.
    expect(groups).toHaveLength(3)
  })

  it('announces saving politely, and only while it is saving', () => {
    const quiet = JSON.stringify(render(false, false).toJSON())
    expect(quiet).not.toContain('Saving preferences')

    const busy = render(false, true).root.findByProps({
      accessibilityLiveRegion: 'polite',
    })
    expect(busy).toBeTruthy()
  })
})
