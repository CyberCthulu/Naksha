import React from 'react'
import TestRenderer from 'react-test-renderer'

import ChartCompass from '../ChartCompass'
import { theme } from '../../ui/theme'

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

function render(element: React.ReactElement): ReturnType<typeof create> {
  act(() => {
    renderer = create(element)
  })
  if (!renderer) throw new Error('did not render')
  return renderer
}

function hostTexts(screen: ReturnType<typeof create>) {
  return screen.root
    .findAll((n) => String(n.type) === 'Text')
    .map((n) => n.children.filter((c) => typeof c === 'string').join(''))
}

function byTestID(screen: ReturnType<typeof create>, testID: string) {
  return screen.root.findAll(
    (n) => typeof n.props?.onPress === 'function' && n.props?.testID === testID
  )
}

function flatten(style: unknown): Record<string, unknown> {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten))
  if (typeof style === 'object') return style as Record<string, unknown>
  return {}
}

beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  renderer = null
})

afterEach(() => {
  if (renderer) {
    const mounted = renderer
    act(() => mounted.unmount())
  }
  renderer = null
})

describe('Glyph Compass', () => {
  it('starts collapsed and exposes its expanded state', () => {
    const screen = render(<ChartCompass />)
    const toggle = byTestID(screen, 'glyph-compass-toggle')[0]

    expect(toggle.props.accessibilityRole).toBe('button')
    expect(toggle.props.accessibilityLabel).toBe('Glyph Compass')
    expect(toggle.props.accessibilityState).toEqual({ expanded: false })
    expect(flatten(toggle.props.style({ pressed: false })).minHeight).toBe(
      theme.touchTarget.min
    )
    expect(hostTexts(screen)).not.toContain('Planets')
  })

  it('expands and collapses without changing what it displays', () => {
    const screen = render(<ChartCompass />)
    const toggle = () => byTestID(screen, 'glyph-compass-toggle')[0]

    act(() => toggle().props.onPress())
    expect(toggle().props.accessibilityState).toEqual({ expanded: true })

    const texts = hostTexts(screen)
    expect(texts).toContain('Planets')
    expect(texts).toContain('Signs')
    expect(texts).toContain('Aspects')
    expect(texts).toContain('Conjunction · 0°')

    act(() => toggle().props.onPress())
    expect(toggle().props.accessibilityState).toEqual({ expanded: false })
    expect(hostTexts(screen)).not.toContain('Planets')
  })

  it('honours an explicit defaultOpen', () => {
    const screen = render(<ChartCompass defaultOpen />)
    expect(
      byTestID(screen, 'glyph-compass-toggle')[0].props.accessibilityState
    ).toEqual({ expanded: true })
  })
})
