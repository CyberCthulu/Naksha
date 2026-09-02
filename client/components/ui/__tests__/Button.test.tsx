import React from 'react'
import TestRenderer from 'react-test-renderer'

import { Button } from '../Button'
import { theme } from '../theme'

function flattenStyles(style: unknown): Record<string, unknown> {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyles))
  if (typeof style === 'object') return style as Record<string, unknown>
  return {}
}

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

function renderButton(element: React.ReactElement) {
  act(() => {
    renderer = create(element)
  })

  if (!renderer) throw new Error('Button did not render')
  return renderer
}

function surfaceStyle(screen: ReturnType<typeof create>) {
  return flattenStyles(screen.root.find((n) => String(n.type) === 'View').props.style)
}

function labelStyle(screen: ReturnType<typeof create>) {
  return flattenStyles(screen.root.find((n) => String(n.type) === 'Text').props.style)
}

describe('Button contrast', () => {
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

  it('renders the primary label in an opaque dark color on its light surface', () => {
    const screen = renderButton(<Button title="View Birth Chart" />)

    expect(surfaceStyle(screen).backgroundColor).toBe(theme.colors.text)
    expect(labelStyle(screen).color).toBe(theme.colors.textOnLight)
  })

  it('never uses the translucent surface fill as the primary label color', () => {
    const screen = renderButton(
      <Button title="Create Chart" variant="primary" />
    )

    // Regression guard for D-02. cardBg is rgba(0,0,0,0.35), a surface fill;
    // as text on the white primary surface it rendered at roughly 2.4:1.
    expect(labelStyle(screen).color).not.toBe(theme.colors.cardBg)
    expect(String(labelStyle(screen).color)).not.toContain('rgba')
  })

  it('leaves the ghost variant unchanged', () => {
    const screen = renderButton(<Button title="My Charts" variant="ghost" />)

    expect(surfaceStyle(screen).backgroundColor).toBe('transparent')
    expect(surfaceStyle(screen).borderColor).toBe(theme.colors.border)
    expect(labelStyle(screen).color).toBe(theme.colors.text)
  })

  it('preserves dimensions and disabled behavior', () => {
    const screen = renderButton(<Button title="Disabled" disabled />)

    expect(surfaceStyle(screen).minHeight).toBe(44)
    expect(surfaceStyle(screen).opacity).toBe(0.5)
    expect(
      screen.root.find((n) => String(n.type) === 'View').props.accessibilityState
    ).toEqual({ disabled: true })
  })
})
