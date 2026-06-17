import React from 'react'
import { Alert, Text } from 'react-native'
import TestRenderer from 'react-test-renderer'

import ProfileScreen from '../ProfileScreen'
import { deleteAccount } from '../../lib/accountDeletion'
import { signOut } from '../../lib/auth'
import supabase from '../../lib/supabase'
import type { UserRow } from '../../lib/domainTypes'

const mockNavigation = {
  goBack: jest.fn(),
  navigate: jest.fn(),
  setOptions: jest.fn(),
}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useFocusEffect: jest.fn(),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 24, left: 0 }),
}))

jest.mock('../../lib/accountDeletion', () => ({
  __esModule: true,
  deleteAccount: jest.fn(),
}))

jest.mock('../../lib/auth', () => ({
  __esModule: true,
  signOut: jest.fn(),
}))

jest.mock('../../lib/supabase', () => ({
  __esModule: true,
  default: {
    auth: {
      getUser: jest.fn(),
    },
    from: jest.fn(),
  },
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

const userRow: UserRow = {
  id: 'user-1',
  email: 'ada@example.com',
  first_name: 'Ada',
  last_name: 'Lovelace',
  birth_date: '1815-12-10',
  birth_time: '12:00:00',
  birth_location: 'London, UK',
  time_zone: 'Europe/London',
  birth_lat: 51.5072,
  birth_lon: -0.1276,
  created_at: null,
  updated_at: null,
}

function mockedSupabase() {
  return supabase as unknown as {
    auth: {
      getUser: jest.Mock
    }
    from: jest.Mock
  }
}

function mockedDeleteAccount() {
  return deleteAccount as jest.MockedFunction<typeof deleteAccount>
}

function mockedSignOut() {
  return signOut as jest.MockedFunction<typeof signOut>
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

async function settleAsyncWork() {
  for (let i = 0; i < 20; i += 1) {
    await Promise.resolve()
  }
}

async function renderScreen() {
  await act(async () => {
    renderer = create(<ProfileScreen />)
    await settleAsyncWork()
  })

  if (!renderer) throw new Error('ProfileScreen did not render')
  return renderer
}

function mockProfileQueries() {
  mockedSupabase().auth.getUser.mockResolvedValue({
    data: {
      user: {
        id: 'user-1',
        email: 'ada@example.com',
      },
    },
    error: null,
  })

  mockedSupabase().from.mockImplementation((table: string) => {
    if (table === 'users') {
      const query: any = {
        select: jest.fn(() => query),
        eq: jest.fn(() => query),
        maybeSingle: jest.fn().mockResolvedValue({
          data: userRow,
          error: null,
        }),
      }
      return query
    }

    if (table === 'chart_preferences') {
      const query: any = {
        select: jest.fn(() => query),
        eq: jest.fn(() => query),
        maybeSingle: jest.fn().mockResolvedValue({
          data: {
            user_id: 'user-1',
            house_system: 'whole_sign',
            zodiac_type: 'tropical',
            orb_mode: 'medium',
            show_house_degrees: false,
          },
          error: null,
        }),
      }
      return query
    }

    if (table === 'subscriptions') {
      const query: any = {
        select: jest.fn(() => query),
        eq: jest.fn(() => query),
        order: jest.fn(() => query),
        limit: jest.fn(() => query),
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: null,
        }),
      }
      return query
    }

    if (table === 'purchases') {
      const query: any = {
        select: jest.fn(() => query),
        eq: jest.fn(() => query),
        order: jest.fn(() => query),
        limit: jest.fn().mockResolvedValue({
          data: [],
          error: null,
        }),
      }
      return query
    }

    throw new Error(`Unexpected table: ${table}`)
  })
}

async function pressDeleteAccount(screen: TestRenderer.ReactTestRenderer) {
  await act(async () => {
    findPressableByText(screen, 'Delete account').props.onPress()
    await settleAsyncWork()
  })
}

function confirmationButtons() {
  const alertCall = (Alert.alert as jest.Mock).mock.calls.find(
    ([title]) => title === 'Delete your account?'
  )

  if (!alertCall) throw new Error('Delete confirmation was not shown')
  return alertCall[2] as { text: string; onPress?: () => void }[]
}

describe('ProfileScreen account deletion', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    renderer = null

    mockProfileQueries()
    mockedDeleteAccount().mockResolvedValue()
    mockedSignOut().mockResolvedValue({ error: null } as any)
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

  it('shows a destructive confirmation before deleting the account', async () => {
    const screen = await renderScreen()

    await pressDeleteAccount(screen)

    expect(Alert.alert).toHaveBeenCalledWith(
      'Delete your account?',
      'This will permanently delete your charts, journals, profile data, and account access. This cannot be undone.',
      expect.arrayContaining([
        expect.objectContaining({ text: 'Cancel', style: 'cancel' }),
        expect.objectContaining({
          text: 'Delete Account',
          style: 'destructive',
        }),
      ])
    )
  })

  it('does not delete when the confirmation is cancelled', async () => {
    const screen = await renderScreen()

    await pressDeleteAccount(screen)
    confirmationButtons()[0].onPress?.()

    expect(mockedDeleteAccount()).not.toHaveBeenCalled()
    expect(mockedSignOut()).not.toHaveBeenCalled()
  })

  it('deletes the account and signs out when confirmed', async () => {
    const screen = await renderScreen()

    await pressDeleteAccount(screen)
    await act(async () => {
      confirmationButtons()[1].onPress?.()
      await settleAsyncWork()
    })

    expect(mockedDeleteAccount()).toHaveBeenCalledTimes(1)
    expect(mockedSignOut()).toHaveBeenCalledTimes(1)
  })

  it('shows a safe error and stays signed in when deletion fails', async () => {
    mockedDeleteAccount().mockRejectedValueOnce(
      new Error('Could not delete account.')
    )
    const screen = await renderScreen()

    await pressDeleteAccount(screen)
    await act(async () => {
      confirmationButtons()[1].onPress?.()
      await settleAsyncWork()
    })

    expect(Alert.alert).toHaveBeenCalledWith(
      'Account deletion failed',
      'Could not delete account.'
    )
    expect(mockedSignOut()).not.toHaveBeenCalled()
  })
})
