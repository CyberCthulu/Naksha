import React from 'react'
import TestRenderer from 'react-test-renderer'

import { ScreenHeader } from '../ScreenHeader'
import { theme } from '../theme'

function flattenStyles(style: unknown): Record<string, unknown> {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyles))
  if (typeof style === 'object') return style as Record<string, unknown>
  return {}
}

const { act, create } = TestRenderer

function render(element: React.ReactElement): ReturnType<typeof create> {
  let renderer: ReturnType<typeof create> | null = null
  act(() => {
    renderer = create(element)
  })
  if (!renderer) throw new Error('did not render')
  return renderer
}

function byTestID(screen: ReturnType<typeof create>, testID: string) {
  return screen.root.findAll((n) => n.props?.testID === testID)[0]
}

function titleNode(screen: ReturnType<typeof create>) {
  return screen.root.findAll((n) => String(n.type) === 'Text')[0]
}

beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
})

describe('ScreenHeader title', () => {
  it('renders the title', () => {
    const screen = render(<ScreenHeader title="My Charts" />)
    expect(titleNode(screen).children.join('')).toBe('My Charts')
  })

  it('allows two lines and never forces single-line truncation', () => {
    const node = titleNode(render(<ScreenHeader title="Create Guest Chart" />))

    expect(node.props.numberOfLines).toBe(2)
    expect(node.props.numberOfLines).not.toBe(1)
    expect(node.props.ellipsizeMode).toBeUndefined()
  })

  it('flexes between the controls rather than being absolutely placed', () => {
    const style = flattenStyles(
      titleNode(render(<ScreenHeader title="Complete Profile" />)).props.style
    )

    expect(style.flex).toBe(1)
    expect(style.position).toBeUndefined()
  })

  it('exposes the title as a header to assistive technology', () => {
    expect(
      titleNode(render(<ScreenHeader title="Your Journal" />)).props
        .accessibilityRole
    ).toBe('header')
  })
})

describe('ScreenHeader left control', () => {
  it('renders a labelled 48dp back control and preserves its callback', () => {
    const onBack = jest.fn()
    const screen = render(<ScreenHeader title="x" onBack={onBack} />)
    const back = byTestID(screen, 'screen-header-back')

    expect(back.props.accessibilityRole).toBe('button')
    expect(back.props.accessibilityLabel).toBe('Go back')

    const style = flattenStyles(back.props.style({ pressed: false }))
    expect(style.minWidth).toBe(theme.touchTarget.min)
    expect(style.minHeight).toBe(theme.touchTarget.min)

    act(() => back.props.onPress())
    expect(onBack).toHaveBeenCalledTimes(1)
  })

  it('accepts a screen-specific back label', () => {
    const screen = render(
      <ScreenHeader
        title="Check Email"
        onBack={jest.fn()}
        backAccessibilityLabel="Back to login"
      />
    )

    expect(byTestID(screen, 'screen-header-back').props.accessibilityLabel).toBe(
      'Back to login'
    )
  })

  it('omits the control but keeps the slot when there is no back action', () => {
    const screen = render(<ScreenHeader title="x" />)
    expect(byTestID(screen, 'screen-header-back')).toBeUndefined()
  })
})

describe('ScreenHeader right slot', () => {
  it('renders no action by default', () => {
    expect(
      byTestID(render(<ScreenHeader title="My Charts" />), 'screen-header-action')
    ).toBeUndefined()
  })

  it('renders a labelled 48dp action and preserves its callback', () => {
    const onPress = jest.fn()
    const screen = render(
      <ScreenHeader
        title="My Profile"
        rightAction={{
          label: 'Edit',
          onPress,
          accessibilityLabel: 'Edit profile',
        }}
      />
    )
    const action = byTestID(screen, 'screen-header-action')

    expect(action.props.accessibilityRole).toBe('button')
    expect(action.props.accessibilityLabel).toBe('Edit profile')

    const style = flattenStyles(action.props.style({ pressed: false }))
    expect(style.minWidth).toBe(theme.touchTarget.min)
    expect(style.minHeight).toBe(theme.touchTarget.min)

    act(() => action.props.onPress())
    expect(onPress).toHaveBeenCalledTimes(1)
  })

  it('falls back to the label for its accessibility name', () => {
    const screen = render(
      <ScreenHeader
        title="x"
        rightAction={{ label: 'Save', onPress: jest.fn() }}
      />
    )
    expect(
      byTestID(screen, 'screen-header-action').props.accessibilityLabel
    ).toBe('Save')
  })

  it('shows a spinner and blocks presses while the action is loading', () => {
    const onPress = jest.fn()
    const screen = render(
      <ScreenHeader
        title="Complete Profile"
        rightAction={{ label: 'Save', onPress, loading: true }}
      />
    )
    const action = byTestID(screen, 'screen-header-action')

    expect(byTestID(screen, 'screen-header-action-spinner')).toBeDefined()
    expect(action.props.disabled).toBe(true)
    expect(action.props.accessibilityState).toEqual({
      disabled: true,
      busy: true,
    })
  })
})

describe('ScreenHeader icon usage', () => {
  it('renders the back glyph through the shared Icon primitive', () => {
    // The Icon primitive hides itself from assistive technology; a raw Lucide
    // import would not, and would be announced alongside the control label.
    const host = render(<ScreenHeader title="x" onBack={jest.fn()} />).toJSON()
    const json = JSON.stringify(host)

    expect(json).toContain('"accessibilityElementsHidden":true')
    expect(json).toContain('"importantForAccessibility":"no-hide-descendants"')
  })

  it('applies no safe-area inset of its own', () => {
    // Screens already pad their own top; a second source would double it.
    const style = flattenStyles(
      render(<ScreenHeader title="x" testID="h" />).root.findAll(
        (n) => n.props?.testID === 'h'
      )[0].props.style
    )

    expect(style.paddingTop).toBeUndefined()
    expect(style.marginTop).toBeUndefined()
  })
})
