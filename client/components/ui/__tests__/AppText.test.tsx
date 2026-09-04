import React from 'react'
import TestRenderer from 'react-test-renderer'

import { AppText, MutedText, TitleText } from '../AppText'
import { theme } from '../theme'

function flattenStyles(style: unknown): Record<string, unknown> {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyles))
  if (typeof style === 'object') return style as Record<string, unknown>
  return {}
}

const { act, create } = TestRenderer

function render(element: React.ReactElement) {
  let renderer: ReturnType<typeof create> | null = null
  act(() => {
    renderer = create(element)
  })
  if (!renderer) throw new Error('did not render')
  return renderer!
}

function hostText(renderer: ReturnType<typeof create>) {
  return renderer.root.find((node) => String(node.type) === 'Text')
}

function styleOf(renderer: ReturnType<typeof create>) {
  return flattenStyles(hostText(renderer).props.style)
}

describe('AppText V1 compatibility', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  })

  it('keeps the V1 appearance when no variant is given', () => {
    expect(styleOf(render(<AppText>hi</AppText>))).toEqual({
      color: theme.colors.text,
      fontSize: 14,
    })
  })

  it('keeps the MutedText contract', () => {
    expect(styleOf(render(<MutedText>hi</MutedText>))).toEqual({
      color: theme.colors.muted,
    })
  })

  it('keeps the TitleText contract', () => {
    expect(styleOf(render(<TitleText>hi</TitleText>))).toEqual({
      color: theme.colors.text,
      fontSize: 22,
      fontWeight: '600',
    })
  })

  it('never applies a V2 font family unless a variant is requested', () => {
    for (const el of [
      <AppText key="a">a</AppText>,
      <MutedText key="b">b</MutedText>,
      <TitleText key="c">c</TitleText>,
    ]) {
      expect(styleOf(render(el)).fontFamily).toBeUndefined()
    }
  })

  it('lets a caller style override the default, as before', () => {
    const style = styleOf(
      render(<AppText style={{ color: 'red', fontSize: 99 }}>hi</AppText>)
    )
    expect(style.color).toBe('red')
    expect(style.fontSize).toBe(99)
  })

  it('leaves font scaling enabled and adds no truncation defaults', () => {
    const text = hostText(render(<AppText>hi</AppText>))

    expect(text.props.allowFontScaling).toBeUndefined()
    expect(text.props.numberOfLines).toBeUndefined()
    expect(text.props.ellipsizeMode).toBeUndefined()
  })

  it('forwards allowFontScaling and other Text props unchanged', () => {
    const text = hostText(
      render(
        <AppText allowFontScaling={false} numberOfLines={2} testID="t">
          hi
        </AppText>
      )
    )

    expect(text.props.allowFontScaling).toBe(false)
    expect(text.props.numberOfLines).toBe(2)
    expect(text.props.testID).toBe('t')
  })

  it('still accepts the React Native ARIA role prop', () => {
    // The typography prop is `variant` precisely so this keeps working.
    const text = hostText(render(<AppText role="heading">hi</AppText>))
    expect(text.props.role).toBe('heading')
  })
})

describe('AppText semantic variants', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  })

  it('applies the requested typography role and V2 ink', () => {
    const style = styleOf(render(<AppText variant="bodyLarge">hi</AppText>))

    expect(style).toMatchObject({
      ...theme.typography.bodyLarge,
      color: theme.text.primary,
    })
  })

  it('applies the serif title role through TitleText', () => {
    const style = styleOf(render(<TitleText variant="title">hi</TitleText>))

    expect(style.fontFamily).toBe('CormorantGaramond_600SemiBold')
    expect(style.fontSize).toBe(26)
    expect(style.lineHeight).toBe(32)
    expect(style.color).toBe(theme.text.primary)
    // The V1 fontWeight must not survive alongside a weight-specific family.
    expect(style.fontWeight).toBeUndefined()
  })

  it('keeps MutedText secondary-coloured when given a variant', () => {
    const style = styleOf(
      render(<MutedText variant="bodySmall">hi</MutedText>)
    )

    expect(style.fontSize).toBe(13)
    expect(style.lineHeight).toBe(20)
    expect(style.color).toBe(theme.colors.muted)
  })

  it('lets a caller style still override a variant', () => {
    const style = styleOf(
      render(
        <AppText variant="caption" style={{ fontSize: 40, color: 'red' }}>
          hi
        </AppText>
      )
    )

    expect(style.fontSize).toBe(40)
    expect(style.color).toBe('red')
    expect(style.fontFamily).toBe('Inter_400Regular')
  })

  it('supports every role without throwing', () => {
    for (const variant of Object.keys(theme.typography) as (keyof typeof theme.typography)[]) {
      const style = styleOf(render(<AppText variant={variant}>x</AppText>))
      expect(style.fontFamily).toBeDefined()
    }
  })
})
