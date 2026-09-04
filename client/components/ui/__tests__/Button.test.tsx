import React from 'react'
import TestRenderer from 'react-test-renderer'

import { Button, type ButtonVariant } from '../Button'
import { theme } from '../theme'

function flattenStyles(style: unknown): Record<string, unknown> {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyles))
  if (typeof style === 'object') return style as Record<string, unknown>
  return {}
}

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

function renderButton(element: React.ReactElement): ReturnType<typeof create> {
  act(() => {
    renderer = create(element)
  })
  if (!renderer) throw new Error('Button did not render')
  return renderer
}

function pressable(screen: ReturnType<typeof create>) {
  return screen.root.findAll((n) => String(n.type) === 'View')[0]
}

function surfaceStyle(screen: ReturnType<typeof create>) {
  const views = screen.root.findAll((n) => String(n.type) === 'View')
  return flattenStyles(views[views.length - 1].props.style)
}

function labelStyle(screen: ReturnType<typeof create>) {
  return flattenStyles(
    screen.root.find((n) => String(n.type) === 'Text').props.style
  )
}

describe('Button variants', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    renderer = null
  })

  afterEach(() => {
    if (renderer) {
      const mounted = renderer
      act(() => {
        mounted.unmount()
      })
    }
    renderer = null
  })

  it('renders the primary action in accent with opaque on-accent ink', () => {
    const screen = renderButton(<Button title="View Birth Chart" />)

    expect(surfaceStyle(screen).backgroundColor).toBe(theme.accent.base)
    expect(labelStyle(screen).color).toBe(theme.text.onAccent)
  })

  it('never uses a translucent fill as a label color', () => {
    // Regression guard carried forward from D-02.
    for (const variant of [
      'primary',
      'secondary',
      'tertiary',
      'destructive',
      'destructiveSolid',
      'ghost',
    ] as ButtonVariant[]) {
      const screen = renderButton(<Button title="x" variant={variant} />)
      expect(String(labelStyle(screen).color)).not.toContain('rgba')
      act(() => renderer!.unmount())
      renderer = null
    }
  })

  it('treats ghost as a backward-compatible alias for secondary', () => {
    const ghost = renderButton(<Button title="My Charts" variant="ghost" />)
    const ghostSurface = surfaceStyle(ghost)
    const ghostLabel = labelStyle(ghost)
    act(() => renderer!.unmount())
    renderer = null

    const secondary = renderButton(
      <Button title="My Charts" variant="secondary" />
    )

    expect(surfaceStyle(secondary)).toEqual(ghostSurface)
    expect(labelStyle(secondary)).toEqual(ghostLabel)
  })

  it('styles destructive variants with the danger role', () => {
    const outline = renderButton(
      <Button title="Delete" variant="destructive" />
    )
    expect(labelStyle(outline).color).toBe(theme.state.danger)
    act(() => renderer!.unmount())
    renderer = null

    const solid = renderButton(
      <Button title="Delete" variant="destructiveSolid" />
    )
    expect(surfaceStyle(solid).backgroundColor).toBe(theme.state.danger)
    expect(labelStyle(solid).color).toBe(theme.text.onAccent)
  })

  it('renders tertiary as accent text on no surface', () => {
    const screen = renderButton(<Button title="Retry" variant="tertiary" />)

    expect(surfaceStyle(screen).backgroundColor).toBe('transparent')
    expect(labelStyle(screen).color).toBe(theme.accent.base)
  })
})

describe('Button touch target and behavior', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    renderer = null
  })

  afterEach(() => {
    if (renderer) {
      const mounted = renderer
      act(() => {
        mounted.unmount()
      })
    }
    renderer = null
  })

  it('keeps a 48dp touch area at every size, including the compact one', () => {
    for (const size of ['sm', 'md', 'lg'] as const) {
      const screen = renderButton(<Button title="x" size={size} />)
      const touch = flattenStyles(pressable(screen).props.style)

      expect(touch.minHeight).toBe(theme.touchTarget.min)
      act(() => renderer!.unmount())
      renderer = null
    }
  })

  it('lets the compact size look smaller than its touch area', () => {
    const screen = renderButton(<Button title="x" size="sm" />)

    expect(surfaceStyle(screen).minHeight).toBe(40)
    expect(flattenStyles(pressable(screen).props.style).minHeight).toBe(48)
  })

  it('exposes button semantics and its label to assistive technology', () => {
    const screen = renderButton(<Button title="Save Chart" />)
    const touch = pressable(screen)

    expect(touch.props.accessibilityRole).toBe('button')
    expect(touch.props.accessibilityLabel).toBe('Save Chart')
    expect(touch.props.accessibilityState).toEqual({
      disabled: false,
      busy: false,
    })
  })

  it('preserves disabled behavior', () => {
    const onPress = jest.fn()
    const screen = renderButton(
      <Button title="Disabled" onPress={onPress} disabled />
    )
    const touch = pressable(screen)

    expect(touch.props.accessibilityState.disabled).toBe(true)
    expect(surfaceStyle(screen).opacity).toBe(0.45)

    act(() => {
      touch.props.onClick?.()
    })
    expect(onPress).not.toHaveBeenCalled()
  })

  it('shows a spinner while loading, keeps the label, and blocks presses', () => {
    const onPress = jest.fn()
    const screen = renderButton(
      <Button title="Saving" onPress={onPress} loading />
    )

    expect(
      screen.root.findAll(
        (n) =>
          typeof n.type === 'string' && n.props?.testID === 'button-spinner'
      )
    ).toHaveLength(1)
    expect(
      screen.root.find((n) => String(n.type) === 'Text').children.join('')
    ).toBe('Saving')
    expect(pressable(screen).props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    })
  })

  it('forwards an explicit accessibility label over the title', () => {
    const screen = renderButton(
      <Button title="Delete" accessibilityLabel="Delete Vinal Natal Chart" />
    )

    expect(pressable(screen).props.accessibilityLabel).toBe(
      'Delete Vinal Natal Chart'
    )
  })
})
