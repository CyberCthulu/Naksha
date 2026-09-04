import React from 'react'
import TestRenderer from 'react-test-renderer'

import { Icon, ICON_NAMES } from '../Icon'
import { theme } from '../theme'

const { act, create } = TestRenderer

function render(element: React.ReactElement): ReturnType<typeof create> {
  let renderer: ReturnType<typeof create> | null = null
  act(() => {
    renderer = create(element)
  })
  if (!renderer) throw new Error('did not render')
  return renderer
}

describe('Icon', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  })

  it('covers the approved functional set', () => {
    expect(ICON_NAMES.sort()).toEqual(
      [
        'account',
        'add',
        'back',
        'calendar',
        'chevron-left',
        'chevron-right',
        'close',
        'collapse',
        'delete',
        'edit',
        'expand',
        'journal',
        'location',
        'save',
        'visibility',
        'visibility-off',
      ].sort()
    )
  })

  it('renders every name without throwing', () => {
    for (const name of ICON_NAMES) {
      expect(() => render(<Icon name={name} />)).not.toThrow()
    }
  })

  it('defaults to the md size token, primary ink and its stroke width', () => {
    const host = render(<Icon name="back" />).toJSON() as any

    expect(host.props.width).toBe(theme.icon.md)
    expect(host.props.height).toBe(theme.icon.md)
    expect(host.props.stroke).toBe(theme.text.primary)
    expect(host.props.strokeWidth).toBe(theme.icon.stroke.md)
  })

  it('maps each semantic size to its token and approved stroke', () => {
    for (const size of ['sm', 'md', 'lg', 'xl'] as const) {
      const host = render(<Icon name="close" size={size} />).toJSON() as any

      expect(host.props.width).toBe(theme.icon[size])
      expect(host.props.strokeWidth).toBe(theme.icon.stroke[size])
    }

    // Thinner strokes at larger sizes keep optical weight even.
    expect(theme.icon.stroke.sm).toBeGreaterThan(theme.icon.stroke.xl)
  })

  it('accepts a semantic color', () => {
    const host = render(
      <Icon name="delete" color={theme.state.danger} />
    ).toJSON() as any

    expect(host.props.stroke).toBe(theme.state.danger)
  })

  it('is hidden from assistive technology by default', () => {
    const host = render(<Icon name="save" />).toJSON() as any

    expect(host.props.accessible).toBe(false)
    expect(host.props.accessibilityElementsHidden).toBe(true)
    expect(host.props.importantForAccessibility).toBe('no-hide-descendants')
  })

  it('exposes no touch handling of its own', () => {
    const host = render(<Icon name="edit" />).toJSON() as any

    expect(host.props.onPress).toBeUndefined()
    expect(host.props.onStartShouldSetResponder).toBeUndefined()
    expect(host.props.accessibilityRole).toBeUndefined()
    expect(host.props.focusable).toBe(false)
  })

  it('reuses one glyph across semantic aliases', () => {
    const back = JSON.stringify(render(<Icon name="back" />).toJSON())
    const chevron = JSON.stringify(
      render(<Icon name="chevron-left" />).toJSON()
    )

    expect(back).toBe(chevron)
  })
})
