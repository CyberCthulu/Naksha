import React from 'react'
import { Text } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { Card } from '../Card'
import { Stack } from '../Stack'
import { ErrorState } from '../ErrorState'
import { EmptyState } from '../EmptyState'
import FormField from '../FormField'
import TextField from '../TextField'
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

function hostByTestID(screen: ReturnType<typeof create>, testID: string) {
  return screen.root.find(
    (n) => typeof n.type === 'string' && n.props?.testID === testID
  )
}

function hostTexts(screen: ReturnType<typeof create>) {
  return screen.root
    .findAll((n) => String(n.type) === 'Text')
    .map((n) => n.children.filter((c) => typeof c === 'string').join(''))
}

beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
})

describe('Card', () => {
  it('uses the opaque default surface with a hairline border', () => {
    const style = flattenStyles(
      hostByTestID(render(
        <Card testID="c">
          <Text>x</Text>
        </Card>
      ), 'c').props.style
    )

    expect(style.backgroundColor).toBe(theme.surface.base)
    expect(style.borderColor).toBe(theme.border.base)
    expect(style.borderRadius).toBe(theme.radius.md)
    expect(String(style.backgroundColor)).not.toContain('rgba')
  })

  it('supports the raised and selected variants', () => {
    const raised = flattenStyles(
      hostByTestID(render(
        <Card testID="c" variant="raised">
          <Text>x</Text>
        </Card>
      ), 'c').props.style
    )
    expect(raised.backgroundColor).toBe(theme.surface.raised)
    expect(raised.borderColor).toBe(theme.border.strong)

    const selected = flattenStyles(
      hostByTestID(render(
        <Card testID="c" variant="selected">
          <Text>x</Text>
        </Card>
      ), 'c').props.style
    )
    expect(selected.borderColor).toBe(theme.border.accent)
  })

  it('renders children and honours a style override', () => {
    const screen = render(
      <Card testID="c" style={{ marginBottom: 0 }}>
        <Text>inside</Text>
      </Card>
    )

    expect(hostTexts(screen)).toContain('inside')
    expect(
      flattenStyles(hostByTestID(screen, 'c').props.style)
        .marginBottom
    ).toBe(0)
  })
})

describe('Stack', () => {
  it('defaults to a column with the md gap token', () => {
    const style = flattenStyles(
      hostByTestID(render(
        <Stack testID="s">
          <Text>a</Text>
        </Stack>
      ), 's').props.style
    )

    expect(style.flexDirection).toBe('column')
    expect(style.gap).toBe(theme.space.md)
  })

  it('accepts a row direction and a semantic gap', () => {
    const style = flattenStyles(
      hostByTestID(render(
        <Stack testID="s" row gap="xl" align="center">
          <Text>a</Text>
        </Stack>
      ), 's').props.style
    )

    expect(style.flexDirection).toBe('row')
    expect(style.gap).toBe(theme.space.xl)
    expect(style.alignItems).toBe('center')
  })
})

describe('ErrorState', () => {
  it('announces itself and renders a recovery action', () => {
    const onPress = jest.fn()
    const screen = render(
      <ErrorState
        testID="e"
        title="Could not load charts"
        description="Check your connection."
        action={{ label: 'Retry', onPress }}
      />
    )
    const container = hostByTestID(screen, 'e')

    expect(container.props.accessibilityRole).toBe('alert')
    expect(container.props.accessibilityLiveRegion).toBe('polite')

    const texts = hostTexts(screen)
    expect(texts).toContain('Could not load charts')
    expect(texts).toContain('Check your connection.')
    expect(texts).toContain('Retry')
  })

  it('supports a secondary action', () => {
    const screen = render(
      <ErrorState
        title="Failed"
        action={{ label: 'Retry', onPress: jest.fn() }}
        secondaryAction={{ label: 'Go Back', onPress: jest.fn() }}
      />
    )

    expect(hostTexts(screen)).toEqual(
      expect.arrayContaining(['Retry', 'Go Back'])
    )
  })

  it('renders without actions or description', () => {
    const screen = render(<ErrorState title="Something went wrong" />)
    expect(hostTexts(screen)).toEqual(['Something went wrong'])
  })
})

describe('EmptyState', () => {
  it('renders title, description and an action', () => {
    const screen = render(
      <EmptyState
        title="No charts yet"
        description="Create one to get started."
        action={{ label: 'Create a guest chart', onPress: jest.fn() }}
      />
    )

    expect(hostTexts(screen)).toEqual([
      'No charts yet',
      'Create one to get started.',
      'Create a guest chart',
    ])
  })

  it('renders a bare title', () => {
    expect(hostTexts(render(<EmptyState title="Nothing here" />))).toEqual([
      'Nothing here',
    ])
  })
})

describe('FormField', () => {
  it('renders the label and its child control', () => {
    const screen = render(
      <FormField label="Email">
        <Text>control</Text>
      </FormField>
    )

    expect(hostTexts(screen)).toEqual(['Email', 'control'])
  })

  it('shows a hint when there is no error', () => {
    const screen = render(
      <FormField label="Email" hint="We never share this.">
        <Text>c</Text>
      </FormField>
    )

    expect(hostTexts(screen)).toContain('We never share this.')
  })

  it('replaces the hint with the error and announces it', () => {
    const screen = render(
      <FormField label="Email" hint="hint" error="Email is required.">
        <Text>c</Text>
      </FormField>
    )

    const texts = hostTexts(screen)
    expect(texts).toContain('Email is required.')
    expect(texts).not.toContain('hint')

    const errorNode = screen.root
      .findAll((n) => String(n.type) === 'Text')
      .find((n) => n.children.join('') === 'Email is required.')
    expect(errorNode?.props.accessibilityLiveRegion).toBe('polite')
    expect(flattenStyles(errorNode?.props.style).color).toBe(theme.state.danger)
  })
})

describe('TextField', () => {
  it('forwards value, callbacks and keyboard configuration', () => {
    const onChangeText = jest.fn()
    const input = render(
      <TextField
        value="a@b.com"
        onChangeText={onChangeText}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        secureTextEntry={false}
        placeholder="you@example.com"
      />
    ).root.find((n) => String(n.type) === 'TextInput')

    expect(input.props.value).toBe('a@b.com')
    expect(input.props.keyboardType).toBe('email-address')
    expect(input.props.autoCapitalize).toBe('none')
    expect(input.props.autoComplete).toBe('email')
    expect(input.props.textContentType).toBe('emailAddress')
    expect(input.props.placeholder).toBe('you@example.com')

    act(() => input.props.onChangeText('x'))
    expect(onChangeText).toHaveBeenCalledWith('x')
  })

  it('preserves secure text entry', () => {
    const input = render(<TextField secureTextEntry />).root.find(
      (n) => String(n.type) === 'TextInput'
    )
    expect(input.props.secureTextEntry).toBe(true)
  })

  it('meets the minimum touch target', () => {
    const input = render(<TextField />).root.find(
      (n) => String(n.type) === 'TextInput'
    )
    expect(flattenStyles(input.props.style).minHeight).toBe(
      theme.touchTarget.min
    )
  })

  it('shows the invalid border in the error state', () => {
    const input = render(<TextField error />).root.find(
      (n) => String(n.type) === 'TextInput'
    )
    expect(flattenStyles(input.props.style).borderColor).toBe(
      theme.state.danger
    )
  })

  it('applies the focus border and restores it on blur', () => {
    const screen = render(<TextField />)
    const find = () => screen.root.find((n) => String(n.type) === 'TextInput')

    expect(flattenStyles(find().props.style).borderColor).toBe(
      theme.border.base
    )

    act(() => find().props.onFocus({} as never))
    expect(flattenStyles(find().props.style).borderColor).toBe(
      theme.border.accent
    )

    act(() => find().props.onBlur({} as never))
    expect(flattenStyles(find().props.style).borderColor).toBe(
      theme.border.base
    )
  })

  it('still calls a caller onFocus and onBlur', () => {
    const onFocus = jest.fn()
    const onBlur = jest.fn()
    const screen = render(<TextField onFocus={onFocus} onBlur={onBlur} />)
    const find = () => screen.root.find((n) => String(n.type) === 'TextInput')

    act(() => find().props.onFocus({} as never))
    act(() => find().props.onBlur({} as never))

    expect(onFocus).toHaveBeenCalledTimes(1)
    expect(onBlur).toHaveBeenCalledTimes(1)
  })

  it('marks a non-editable field as disabled', () => {
    const input = render(<TextField editable={false} />).root.find(
      (n) => String(n.type) === 'TextInput'
    )
    expect(input.props.accessibilityState).toEqual({ disabled: true })
    expect(flattenStyles(input.props.style).color).toBe(theme.text.disabled)
  })
})
