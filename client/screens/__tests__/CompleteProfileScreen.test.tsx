import React from 'react'
import { Alert, Text, TextInput, TouchableOpacity } from 'react-native'
import TestRenderer from 'react-test-renderer'

import CompleteProfileScreen from '../CompleteProfileScreen'
import supabase from '../../lib/supabase'
import { geocodePlace } from '../../lib/geocode'
import type { UserRow } from '../../lib/domainTypes'

const mockNavigation = {
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
}))

jest.mock('../../components/auth/AuthContainer', () => ({
  __esModule: true,
  default: ({ children }: { children: unknown }) => children,
}))

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

jest.mock('@react-native-picker/picker', () => {
  const React = require('react')
  const { View } = require('react-native')

  const Picker = ({ children }: { children: unknown }) =>
    React.createElement(View, null, children)
  Picker.Item = () => null

  return { Picker }
})

jest.mock('../../lib/geocode', () => ({
  __esModule: true,
  geocodePlace: jest.fn(),
}))

jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getUser: jest.fn(),
      updateUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

const completeUser: UserRow = {
  id: 'user-1',
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  birth_date: '1990-01-15',
  birth_time: '09:30:00',
  birth_location: 'London, UK',
  time_zone: 'Europe/London',
  birth_lat: 51.5072,
  birth_lon: -0.1276,
  created_at: null,
  updated_at: null,
}

async function settleAsyncWork() {
  for (let i = 0; i < 20; i += 1) {
    await Promise.resolve()
  }
}

async function renderScreen() {
  await act(async () => {
    renderer = create(<CompleteProfileScreen />)
    await settleAsyncWork()
  })

  if (!renderer) throw new Error('CompleteProfileScreen did not render')
  return renderer
}

function mockedSupabase() {
  return supabase as unknown as {
    auth: {
      getUser: jest.Mock
      updateUser: jest.Mock
    }
    from: jest.Mock
  }
}

function mockedGeocodePlace() {
  return geocodePlace as jest.MockedFunction<typeof geocodePlace>
}

function mockSignedInUser() {
  mockedSupabase().auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: 'user-1',
        email: 'ada@example.com',
      },
    },
    error: null,
  })
}

function mockUsersQuery(userRow: UserRow | null = completeUser) {
  const updateEq = jest.fn().mockResolvedValue({ error: null })
  const update = jest.fn(() => ({ eq: updateEq }))

  const maybeSingle = jest.fn().mockResolvedValue({
    data: userRow,
    error: null,
  })
  const selectQuery: any = {
    eq: jest.fn(() => selectQuery),
    maybeSingle,
  }
  const select = jest.fn(() => selectQuery)
  const upsert = jest.fn().mockResolvedValue({ error: null })
  const query = {
    upsert,
    select,
    update,
  }

  mockedSupabase().from.mockReturnValue(query)

  return {
    query,
    upsert,
    select,
    selectQuery,
    maybeSingle,
    update,
    updateEq,
  }
}

function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).join('')
  if (value == null || typeof value === 'boolean') return ''
  return String(value)
}

function findButtonByText(root: TestRenderer.ReactTestRenderer, label: string) {
  const button = root.root.findAllByType(TouchableOpacity).find((node) =>
    node.findAllByType(Text).some((textNode) =>
      textValue(textNode.props.children).includes(label)
    )
  )

  if (!button) throw new Error(`Could not find button: ${label}`)
  return button
}

function textInputs(root: TestRenderer.ReactTestRenderer) {
  return root.root.findAllByType(TextInput)
}

function firstNameInput(root: TestRenderer.ReactTestRenderer) {
  return textInputs(root).find((node) => node.props.placeholder === 'First name')
}

function locationInput(root: TestRenderer.ReactTestRenderer) {
  return textInputs(root).find(
    (node) => node.props.placeholder === 'City, State/Country'
  )
}

async function pressButton(
  root: TestRenderer.ReactTestRenderer,
  label: string
) {
  const button = findButtonByText(root, label)

  await act(async () => {
    await button.props.onPress()
    await settleAsyncWork()
  })
}

describe('CompleteProfileScreen', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())

    renderer = null

    mockSignedInUser()
    mockUsersQuery(completeUser)
    mockedGeocodePlace().mockResolvedValue([
      {
        name: 'London, England, United Kingdom',
        lat: 51.5072,
        lon: -0.1276,
        timeZone: 'Europe/London',
      },
    ])
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

  it('loads an existing users row into the rendered fields', async () => {
    const screen = await renderScreen()

    expect(mockNavigation.setOptions).toHaveBeenCalledWith({
      headerShown: false,
    })
    expect(firstNameInput(screen)?.props.value).toBe('Ada')
    expect(
      textInputs(screen).find((node) => node.props.placeholder === 'Last name')
        ?.props.value
    ).toBe('Lovelace')
    expect(locationInput(screen)?.props.value).toBe('London, UK')
    expect(
      screen.root.findAllByType(Text).some((node) =>
        textValue(node.props.children).includes(
          'Resolved: London, UK (51.5072, -0.1276)'
        )
      )
    ).toBe(true)
  })

  it('shows validation and does not update users when required fields are missing', async () => {
    const query = mockUsersQuery(completeUser)
    const screen = await renderScreen()

    await act(async () => {
      firstNameInput(screen)?.props.onChangeText('')
      await settleAsyncWork()
    })
    await pressButton(screen, 'Save & Continue')

    expect(Alert.alert).toHaveBeenCalledWith(
      'Missing info',
      'Please complete all fields.'
    )
    expect(query.update).not.toHaveBeenCalled()
    expect(mockNavigation.goBack).not.toHaveBeenCalled()
  })

  it('saves selected-coordinate profile data to public.users without auth metadata writes', async () => {
    const query = mockUsersQuery(completeUser)
    const screen = await renderScreen()

    await pressButton(screen, 'Save & Continue')

    expect(mockedGeocodePlace()).not.toHaveBeenCalled()
    expect(query.update).toHaveBeenCalledWith({
      first_name: 'Ada',
      last_name: 'Lovelace',
      birth_date: '1990-01-15',
      birth_time: '09:30:00',
      birth_location: 'London, UK',
      time_zone: 'Europe/London',
      birth_lat: 51.5072,
      birth_lon: -0.1276,
    })
    expect(query.updateEq).toHaveBeenCalledWith('id', 'user-1')
    expect(mockedSupabase().auth.updateUser).not.toHaveBeenCalled()
    expect(mockNavigation.goBack).toHaveBeenCalled()
  })

  it('geocodes a manually typed location when coordinates are missing', async () => {
    const query = mockUsersQuery({
      ...completeUser,
      birth_lat: null,
      birth_lon: null,
    })
    mockedGeocodePlace().mockResolvedValueOnce([
      {
        name: 'New York, New York, United States',
        lat: 40.7128,
        lon: -74.006,
        timeZone: 'America/New_York',
      },
    ])
    const screen = await renderScreen()

    await act(async () => {
      locationInput(screen)?.props.onChangeText('New York, NY')
      await settleAsyncWork()
    })
    await pressButton(screen, 'Save & Continue')

    expect(mockedGeocodePlace()).toHaveBeenCalledWith('New York, NY')
    expect(query.update).toHaveBeenCalledWith({
      first_name: 'Ada',
      last_name: 'Lovelace',
      birth_date: '1990-01-15',
      birth_time: '09:30:00',
      birth_location: 'New York, NY',
      time_zone: 'America/New_York',
      birth_lat: 40.7128,
      birth_lon: -74.006,
    })
    expect(mockNavigation.goBack).toHaveBeenCalled()
  })

  it('shows the current save failure when manual geocoding cannot resolve coordinates', async () => {
    const query = mockUsersQuery({
      ...completeUser,
      birth_lat: null,
      birth_lon: null,
    })
    mockedGeocodePlace().mockResolvedValueOnce([])
    const screen = await renderScreen()

    await act(async () => {
      locationInput(screen)?.props.onChangeText('Unknown Place')
      await settleAsyncWork()
    })
    await pressButton(screen, 'Save & Continue')

    expect(mockedGeocodePlace()).toHaveBeenCalledWith('Unknown Place')
    expect(Alert.alert).toHaveBeenCalledWith(
      'Save failed',
      'Could not resolve birth location. Please refine it (e.g., "Redwood City, CA").'
    )
    expect(query.update).not.toHaveBeenCalled()
    expect(mockNavigation.goBack).not.toHaveBeenCalled()
  })
})
