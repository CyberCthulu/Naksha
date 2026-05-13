import React from 'react'
import { Alert, Text, TextInput } from 'react-native'
import TestRenderer from 'react-test-renderer'

import CreateGuestChartScreen from '../CreateGuestChartScreen'

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  setOptions: jest.fn(),
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}))

jest.mock('../../components/auth/AuthContainer', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}))

jest.mock('../../components/auth/DateField', () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (date: Date) => void }) => {
    const React = require('react')
    const { Pressable, Text } = require('react-native')

    return React.createElement(
      Pressable,
      {
        onPress: () => onChange(new Date('2001-02-03T12:00:00.000Z')),
      },
      React.createElement(Text, null, 'Pick Date')
    )
  },
}))

jest.mock('../../components/auth/TimeField', () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (date: Date) => void }) => {
    const React = require('react')
    const { Pressable, Text } = require('react-native')

    return React.createElement(
      Pressable,
      {
        onPress: () => onChange(new Date(2001, 1, 3, 14, 45, 0)),
      },
      React.createElement(Text, null, 'Pick Time')
    )
  },
}))

jest.mock('../../components/auth/LocationAutocompleteField', () => ({
  __esModule: true,
  default: ({
    value,
    onChange,
    onSelectLocation,
  }: {
    value: string
    onChange: (value: string) => void
    onSelectLocation?: (result: {
      name: string
      lat: number
      lon: number
      timeZone?: string | null
    }) => void
  }) => {
    const React = require('react')
    const { Pressable, Text, TextInput } = require('react-native')

    return React.createElement(
      React.Fragment,
      null,
      React.createElement(TextInput, {
        value,
        onChangeText: onChange,
        placeholder: 'City, State/Country',
      }),
      React.createElement(
        Pressable,
        {
          onPress: () =>
            onSelectLocation?.({
              name: 'London, UK',
              lat: 51.5072,
              lon: -0.1276,
              timeZone: 'Europe/London',
            }),
        },
        React.createElement(Text, null, 'Select Location')
      )
    )
  },
}))

jest.mock('../../components/auth/TimeZonePicker', () => ({
  __esModule: true,
  default: ({ onChange }: { onChange: (value: string) => void }) => {
    const React = require('react')
    const { Pressable, Text } = require('react-native')

    return React.createElement(
      Pressable,
      { onPress: () => onChange('Europe/London') },
      React.createElement(Text, null, 'Set Time Zone')
    )
  },
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

async function settleAsyncWork() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve()
  }
}

async function renderScreen() {
  await act(async () => {
    renderer = create(<CreateGuestChartScreen />)
    await settleAsyncWork()
  })

  if (!renderer) throw new Error('CreateGuestChartScreen did not render')
  return renderer
}

function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).join('')
  if (value == null || typeof value === 'boolean') return ''
  return String(value)
}

function findPressableByText(
  root: TestRenderer.ReactTestRenderer,
  label: string
) {
  const pressable = root.root.findAll(
    (node) =>
      typeof node.props.onPress === 'function' &&
      node.findAllByType(Text).some((textNode) =>
        textValue(textNode.props.children).includes(label)
      )
  )[0]

  if (!pressable) throw new Error(`Could not find pressable: ${label}`)
  return pressable
}

function textInputByPlaceholder(
  root: TestRenderer.ReactTestRenderer,
  placeholder: string
) {
  const input = root.root
    .findAllByType(TextInput)
    .find((node) => node.props.placeholder === placeholder)

  if (!input) throw new Error(`Could not find input: ${placeholder}`)
  return input
}

async function press(root: TestRenderer.ReactTestRenderer, label: string) {
  const target = findPressableByText(root, label)

  await act(async () => {
    target.props.onPress()
    await settleAsyncWork()
  })
}

describe('CreateGuestChartScreen', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    renderer = null
  })

  afterEach(() => {
    if (renderer) {
      const mountedRenderer = renderer
      act(() => {
        mountedRenderer.unmount()
      })
    }
    renderer = null
    jest.restoreAllMocks()
  })

  it('validates missing required fields', async () => {
    const screen = await renderScreen()

    await press(screen, 'Create Chart')

    expect(Alert.alert).toHaveBeenCalledWith(
      'Missing info',
      'Please complete all required fields.'
    )
    expect(mockNavigation.navigate).not.toHaveBeenCalled()
  })

  it('navigates to Chart with guest mode for a resolved location', async () => {
    const screen = await renderScreen()

    await act(async () => {
      textInputByPlaceholder(screen, 'Name').props.onChangeText('Grace Hopper')
      await settleAsyncWork()
    })
    await press(screen, 'Pick Date')
    await press(screen, 'Pick Time')
    await press(screen, 'Select Location')
    await press(screen, 'Create Chart')

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Chart', {
      profile: {
        first_name: 'Grace Hopper',
        last_name: null,
        birth_date: '2001-02-03',
        birth_time: '14:45:00',
        birth_location: 'London, UK',
        time_zone: 'Europe/London',
        birth_lat: 51.5072,
        birth_lon: -0.1276,
      },
      chartMode: 'guest',
    })

    const params = mockNavigation.navigate.mock.calls[0][1]
    expect(params).not.toHaveProperty('fromSaved')
    expect(params).not.toHaveProperty('saved')
  })

  it('allows typed locations without coordinates to open as guest view-only charts', async () => {
    const screen = await renderScreen()

    await act(async () => {
      textInputByPlaceholder(screen, 'Name').props.onChangeText('No Coordinates')
      textInputByPlaceholder(screen, 'City, State/Country').props.onChangeText(
        'Unknown Place'
      )
      await settleAsyncWork()
    })
    await press(screen, 'Pick Date')
    await press(screen, 'Pick Time')
    await press(screen, 'Set Time Zone')
    await press(screen, 'Create Chart')

    expect(mockNavigation.navigate).toHaveBeenCalledWith('Chart', {
      profile: {
        first_name: 'No Coordinates',
        last_name: null,
        birth_date: '2001-02-03',
        birth_time: '14:45:00',
        birth_location: 'Unknown Place',
        time_zone: 'Europe/London',
        birth_lat: null,
        birth_lon: null,
      },
      chartMode: 'guest',
    })
  })
})
