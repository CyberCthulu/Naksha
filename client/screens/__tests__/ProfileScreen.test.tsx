import React from 'react'
import { Alert, StyleSheet, Text } from 'react-native'
import TestRenderer from 'react-test-renderer'

import ProfileScreen from '../ProfileScreen'
import { deleteAccount } from '../../lib/accountDeletion'
import { signOut } from '../../lib/auth'
import supabase from '../../lib/supabase'
import type { UserRow } from '../../lib/domainTypes'
import { Button } from '../../components/ui/Button'
import { theme } from '../../components/ui/theme'

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

function hostTexts(screen: TestRenderer.ReactTestRenderer) {
  return screen.root
    .findAll((node) => String(node.type) === 'Text')
    .map((node) => textValue(node.props.children))
}

/**
 * One entry per option.
 *
 * Pressable is a memo around a forwardRef, so a single control surfaces twice
 * in the tree with identical props. Options are deduped by what they announce,
 * which is unique per row.
 */
function radios(screen: TestRenderer.ReactTestRenderer) {
  const seen = new Map<string, TestRenderer.ReactTestInstance>()

  for (const node of screen.root.findAll(
    (n) => typeof n.type !== 'string' && n.props?.accessibilityRole === 'radio'
  )) {
    const label = String(node.props.accessibilityLabel)
    if (!seen.has(label)) seen.set(label, node)
  }

  return [...seen.values()]
}

function flatStyle(node: TestRenderer.ReactTestInstance) {
  return StyleSheet.flatten(
    typeof node.props.style === 'function'
      ? node.props.style({ pressed: false })
      : node.props.style
  ) as Record<string, unknown>
}

describe('ProfileScreen presentation', () => {
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
      const mounted = renderer
      act(() => {
        mounted.unmount()
      })
    }
    renderer = null
    jest.restoreAllMocks()
  })

  it('shows the birth record without the database around it', async () => {
    const screen = await renderScreen()
    const texts = hostTexts(screen)

    // The place and the zone stay: the zone is the one field here that
    // changes what the chart computes.
    expect(texts).toContain('London, UK')
    expect(texts).toContain('Europe/London')

    // Coordinates are still stored and still drive the calculation. They are
    // simply not something a reader needs to see.
    expect(texts.some((t) => t.includes('51.507'))).toBe(false)
    expect(texts.some((t) => t.includes('-0.128'))).toBe(false)
    expect(texts.some((t) => t.includes('0.1276'))).toBe(false)

    // And the date reads as a date, not as a stored field.
    expect(texts.some((t) => t.includes('1815-12-10'))).toBe(false)
    expect(texts).toContain('10 Dec 1815')
  })

  it('gives every preference option a real target and radio semantics', async () => {
    const screen = await renderScreen()
    const options = radios(screen)

    expect(options.length).toBeGreaterThan(0)

    for (const option of options) {
      const style = flatStyle(option)
      expect(style.minHeight).toBeGreaterThanOrEqual(48)
      expect(typeof option.props.accessibilityLabel).toBe('string')
      expect(option.props.accessibilityState).toEqual(
        expect.objectContaining({
          selected: expect.any(Boolean),
          disabled: expect.any(Boolean),
        })
      )
    }
  })

  it('keeps every "Coming soon" option unselectable', async () => {
    const screen = await renderScreen()
    const soon = radios(screen).filter((node) =>
      String(node.props.accessibilityLabel).includes('Coming soon')
    )

    expect(soon.length).toBeGreaterThan(0)

    for (const option of soon) {
      expect(option.props.accessibilityState.disabled).toBe(true)
      expect(option.props.accessibilityState.selected).toBe(false)
      expect(option.props.disabled).toBe(true)
    }
  })

  it('marks exactly one option selected per group', async () => {
    const screen = await renderScreen()
    const selected = radios(screen).filter(
      (node) => node.props.accessibilityState.selected
    )

    // Whole Sign, Tropical, standard orbs -- the three the engine actually
    // uses, and nothing else.
    expect(selected).toHaveLength(3)
  })

  it('carries selection with shape, not colour alone', async () => {
    const screen = await renderScreen()
    const rendered = JSON.stringify(screen.toJSON())

    // A filled core is rendered only for the selected option, so the state
    // survives a monochrome or colour-blind view.
    expect(rendered).not.toContain('#007AFF')
    expect(rendered).toContain(theme.accent.base)
  })

  it('weights the account actions by what they do', async () => {
    const screen = await renderScreen()
    const buttons = screen.root.findAllByType(Button)

    function variantOf(title: string) {
      const match = buttons.find((node) =>
        String(node.props.title).startsWith(title)
      )
      if (!match) throw new Error(`no button titled ${title}`)
      return match.props.variant
    }

    /*
     * All three were bold blue text at roughly a 34dp target -- account
     * deletion, the one irreversible action in the app, styled as a
     * hyperlink. They are Buttons now, which is also what gives them their
     * touch target: Button's own suite owns the 48dp guarantee, so asserting
     * it again here would only test the wrong node.
     */
    expect(variantOf('Export my data')).toBe('tertiary')
    expect(variantOf('Sign out')).toBe('tertiary')
    expect(variantOf('Delete account')).toBe('destructive')
  })

  it('lays labelled facts out without a fixed column', async () => {
    const screen = await renderScreen()
    const rendered = JSON.stringify(screen.toJSON())

    // The 110pt label column clipped as soon as the font scale grew.
    expect(rendered).not.toContain('"width":110')
  })
})
