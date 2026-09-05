import React from 'react'
import { Alert, StyleSheet, Text } from 'react-native'
import TestRenderer from 'react-test-renderer'

import JournalListScreen, {
  formatEntryTimestamp,
} from '../JournalListScreen'
import { listJournals, deleteJournal, type JournalRow } from '../../lib/journals'
import { theme } from '../../components/ui/theme'

const mockNavigation = {
  navigate: jest.fn(),
  goBack: jest.fn(),
  setOptions: jest.fn(),
}

let focusCallback: (() => void) | null = null

jest.mock('@react-navigation/native', () => {
  const React = require('react')

  return {
    useNavigation: () => mockNavigation,
    useFocusEffect: (callback: () => void) => {
      React.useEffect(() => {
        focusCallback = callback
        return callback()
      }, [callback])
    },
  }
})

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 24, left: 0 }),
}))

jest.mock('../../lib/journals', () => ({
  __esModule: true,
  listJournals: jest.fn(),
  deleteJournal: jest.fn(),
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

const ENTRY: JournalRow = {
  id: 1,
  user_id: 'user-1',
  chart_id: null,
  prompt_template: 'guidance.prompt.attention',
  title: 'A settled morning',
  content: 'First line of the entry.\nSecond line.',
  created_at: '2026-09-15T13:55:00.000Z',
  updated_at: null,
}

function makeEntry(overrides: Partial<JournalRow> = {}): JournalRow {
  return { ...ENTRY, ...overrides }
}

function mockedList() {
  return listJournals as jest.MockedFunction<typeof listJournals>
}

function mockedDelete() {
  return deleteJournal as jest.MockedFunction<typeof deleteJournal>
}

function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).join('')
  if (value == null || typeof value === 'boolean') return ''
  return String(value)
}

function screenText(root: TestRenderer.ReactTestRenderer) {
  return root.root
    .findAllByType(Text)
    .map((node) => textValue(node.props.children))
}

function expectText(root: TestRenderer.ReactTestRenderer, expected: string) {
  expect(screenText(root).some((text) => text.includes(expected))).toBe(true)
}

function expectNoText(root: TestRenderer.ReactTestRenderer, expected: string) {
  expect(screenText(root).some((text) => text.includes(expected))).toBe(false)
}

function byTestId(root: TestRenderer.ReactTestRenderer, testID: string) {
  return root.root.findAll((node) => node.props?.testID === testID)
}

function pressable(root: TestRenderer.ReactTestRenderer, testID: string) {
  const found = root.root.findAll(
    (node) =>
      typeof node.props.onPress === 'function' && node.props.testID === testID
  )
  const match = found.find((node) => node.props.accessibilityRole != null)
  if (!match && found.length === 0) {
    throw new Error(`no pressable ${testID}`)
  }
  return match ?? found[0]
}

function lastAlert() {
  const calls = (Alert.alert as jest.Mock).mock.calls
  if (calls.length === 0) throw new Error('no Alert was shown')
  return calls[calls.length - 1]
}

function pressAlertButton(label: string) {
  const buttons = lastAlert()[2] as {
    text: string
    style?: string
    onPress?: () => void
  }[]
  const button = buttons.find((b) => b.text === label)
  if (!button) throw new Error(`no Alert button: ${label}`)
  return button
}

async function settle() {
  for (let i = 0; i < 20; i += 1) await Promise.resolve()
}

async function renderScreen() {
  await act(async () => {
    renderer = create(<JournalListScreen />)
    await settle()
  })
  if (!renderer) throw new Error('JournalListScreen did not render')
  return renderer
}

describe('JournalListScreen', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    focusCallback = null
    renderer = null
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    mockedList().mockResolvedValue([makeEntry()])
    mockedDelete().mockResolvedValue(undefined as any)
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

  it('shows a loading state before the entries arrive', async () => {
    let resolve: (rows: JournalRow[]) => void = () => {}
    mockedList().mockReturnValue(
      new Promise<JournalRow[]>((r) => {
        resolve = r
      })
    )

    await act(async () => {
      renderer = create(<JournalListScreen />)
    })

    expectText(renderer!, 'Loading journals')
    // No way to create an entry until the screen knows what it holds.
    expect(byTestId(renderer!, 'screen-header-action')).toHaveLength(0)

    await act(async () => {
      resolve([makeEntry()])
      await settle()
    })
  })

  it('offers Retry on failure, and no way to create', async () => {
    mockedList().mockRejectedValueOnce(new Error('network down'))
    const screen = await renderScreen()

    expect(byTestId(screen, 'journal-list-error').length).toBeGreaterThan(0)
    expectText(screen, 'network down')
    expectText(screen, 'Retry')
    expect(byTestId(screen, 'screen-header-action')).toHaveLength(0)
    expectNoText(screen, 'New')

    mockedList().mockResolvedValueOnce([makeEntry()])
    const retry = screen.root
      .findAll((node) => typeof node.props.onPress === 'function')
      .find((node) =>
        node
          .findAllByType(Text)
          .some((t) => textValue(t.props.children) === 'Retry')
      )

    await act(async () => {
      retry?.props.onPress()
      await settle()
    })

    expect(byTestId(screen, 'journal-list-error')).toHaveLength(0)
    expectText(screen, 'A settled morning')
  })

  it('invites a first entry when empty, from the empty state alone', async () => {
    mockedList().mockResolvedValue([])
    const screen = await renderScreen()

    expect(byTestId(screen, 'journal-list-empty').length).toBeGreaterThan(0)
    expectText(screen, 'Write your first entry')

    // Exactly one creation action: the header offers none while empty.
    expect(byTestId(screen, 'screen-header-action')).toHaveLength(0)
    expectNoText(screen, 'New')
  })

  it('moves the creation action to the header once entries exist', async () => {
    const screen = await renderScreen()

    expect(byTestId(screen, 'screen-header-action').length).toBeGreaterThan(0)
    expectText(screen, 'New')
    expect(byTestId(screen, 'journal-list-empty')).toHaveLength(0)
    expectNoText(screen, 'Write your first entry')
  })

  it('never shows two creation actions at once', async () => {
    for (const rows of [[], [makeEntry()]]) {
      jest.clearAllMocks()
      mockedList().mockResolvedValue(rows)
      const screen = await renderScreen()

      const creators = screen.root.findAll(
        (node) =>
          typeof node.props.onPress === 'function' &&
          (node.props.accessibilityLabel === 'Write a new entry' ||
            node.props.accessibilityLabel === 'Write your first entry')
      )
      const labels = new Set(creators.map((c) => c.props.accessibilityLabel))
      expect(labels.size).toBe(1)

      act(() => {
        renderer?.unmount()
      })
      renderer = null
    }
  })

  it('routes both creation actions to the same new-entry payload', async () => {
    mockedList().mockResolvedValue([])
    const empty = await renderScreen()
    const emptyAction = empty.root
      .findAll((node) => typeof node.props.onPress === 'function')
      .find((node) => node.props.accessibilityLabel === 'Write your first entry')

    await act(async () => {
      emptyAction?.props.onPress()
    })
    const fromEmpty = mockNavigation.navigate.mock.calls.at(-1)

    act(() => {
      renderer?.unmount()
    })
    renderer = null
    mockNavigation.navigate.mockClear()

    mockedList().mockResolvedValue([makeEntry()])
    const populated = await renderScreen()
    await act(async () => {
      pressable(populated, 'screen-header-action').props.onPress()
    })

    expect(mockNavigation.navigate.mock.calls.at(-1)).toEqual(fromEmpty)
    expect(fromEmpty).toEqual([
      'JournalEditor',
      { id: undefined, title: '', content: '' },
    ])
  })

  it('reloads when the screen regains focus', async () => {
    await renderScreen()

    // Mount fires both the plain effect and the focus effect -- V1 behaviour,
    // preserved here rather than quietly changed. What matters for this test
    // is that regaining focus fetches again.
    const onMount = mockedList().mock.calls.length
    expect(onMount).toBeGreaterThan(0)

    await act(async () => {
      focusCallback?.()
      await settle()
    })

    expect(mockedList().mock.calls.length).toBe(onMount + 1)
  })

  it('opens an entry with the exact navigation payload', async () => {
    const screen = await renderScreen()

    await act(async () => {
      pressable(screen, 'journal-open-1').props.onPress()
    })

    expect(mockNavigation.navigate).toHaveBeenCalledWith('JournalEditor', {
      id: 1,
      title: 'A settled morning',
      content: 'First line of the entry.\nSecond line.',
      promptTemplateId: 'guidance.prompt.attention',
    })
  })

  it('falls back through title, first line, then Untitled entry', async () => {
    mockedList().mockResolvedValue([
      makeEntry({ id: 1, title: 'Has a title' }),
      makeEntry({ id: 2, title: '   ', content: '\n\n  A first line\nmore' }),
      makeEntry({ id: 3, title: null, content: '   \n  \n' }),
    ])
    const screen = await renderScreen()

    expectText(screen, 'Has a title')
    expectText(screen, 'A first line')
    expectText(screen, 'Untitled entry')
  })

  it('says Created or Edited, always with the year', async () => {
    mockedList().mockResolvedValue([
      makeEntry({ id: 1, created_at: '2026-09-15T13:55:00.000Z' }),
      makeEntry({
        id: 2,
        created_at: '2025-11-21T20:19:00.000Z',
        updated_at: '2025-11-22T20:19:00.000Z',
      }),
    ])
    const screen = await renderScreen()
    const dates = screenText(screen).filter(
      (t) => t.startsWith('Created ') || t.startsWith('Edited ')
    )

    expect(dates).toHaveLength(2)
    expect(dates[0]).toMatch(/^Created \d{1,2} \w{3} 2026 · /)
    expect(dates[1]).toMatch(/^Edited \d{1,2} \w{3} 2025 · /)

    // Never the dense machine string it replaced.
    for (const date of dates) {
      expect(date).not.toContain('T')
      expect(date).not.toContain('GMT')
    }
  })

  it('treats an unchanged updated_at as Created, not Edited', async () => {
    mockedList().mockResolvedValue([
      makeEntry({ created_at: ENTRY.created_at, updated_at: ENTRY.created_at }),
    ])
    const screen = await renderScreen()

    expect(
      screenText(screen).some((t) => t.startsWith('Created '))
    ).toBe(true)
    expect(screenText(screen).some((t) => t.startsWith('Edited '))).toBe(false)
  })

  it('degrades safely on an unusable timestamp', async () => {
    expect(formatEntryTimestamp(null)).toBeNull()
    expect(formatEntryTimestamp('')).toBeNull()
    expect(formatEntryTimestamp('not a date')).toBeNull()

    mockedList().mockResolvedValue([
      makeEntry({ created_at: 'not a date', updated_at: null }),
    ])
    const screen = await renderScreen()

    // The row still renders; it simply carries no date line.
    expectText(screen, 'A settled morning')
    expectNoText(screen, 'Invalid Date')
    expectNoText(screen, 'NaN')
  })

  it('lets an entry title wrap rather than clipping it', async () => {
    const screen = await renderScreen()
    const title = pressable(screen, 'journal-open-1')
      .findAllByType(Text)[0]

    expect(title.props.numberOfLines).toBe(2)
  })

  it('caps the preview at three lines', async () => {
    const screen = await renderScreen()
    const previews = pressable(screen, 'journal-open-1')
      .findAllByType(Text)
      .filter((node) => node.props.numberOfLines === 3)

    expect(previews).toHaveLength(1)
  })

  it('announces each row with its title and date', async () => {
    const screen = await renderScreen()
    const row = pressable(screen, 'journal-open-1')

    expect(row.props.accessibilityRole).toBe('button')
    expect(row.props.accessibilityLabel).toContain('A settled morning')
    expect(row.props.accessibilityLabel).toContain('Created')
  })

  it('keeps the open and delete regions siblings, never nested', async () => {
    const screen = await renderScreen()
    const open = pressable(screen, 'journal-open-1')

    // Nesting is the MyCharts defect: the outer press swallows the inner one.
    expect(
      open.findAll((node) => node.props?.testID === 'journal-delete-1')
    ).toHaveLength(0)

    const del = pressable(screen, 'journal-delete-1')
    expect(
      del.findAll((node) => node.props?.testID === 'journal-open-1')
    ).toHaveLength(0)
    expect(del.props.accessibilityRole).toBe('button')
    expect(del.props.accessibilityLabel).toBe('Delete A settled morning')
  })

  it('routes icon, long press and accessibility action to one confirmation', async () => {
    const screen = await renderScreen()

    const invocations: (() => void)[] = [
      () => pressable(screen, 'journal-delete-1').props.onPress(),
      () => pressable(screen, 'journal-open-1').props.onLongPress(),
      () =>
        pressable(screen, 'journal-open-1').props.onAccessibilityAction({
          nativeEvent: { actionName: 'delete' },
        }),
    ]

    for (const invoke of invocations) {
      ;(Alert.alert as jest.Mock).mockClear()
      await act(async () => {
        invoke()
      })

      expect(lastAlert()[0]).toBe('Delete entry?')
      expect(lastAlert()[1]).toBe('A settled morning')
      expect(pressAlertButton('Delete').style).toBe('destructive')
      expect(pressAlertButton('Cancel').style).toBe('cancel')
    }
  })

  it('ignores an unrelated accessibility action', async () => {
    const screen = await renderScreen()

    await act(async () => {
      pressable(screen, 'journal-open-1').props.onAccessibilityAction({
        nativeEvent: { actionName: 'activate' },
      })
    })

    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('removes nothing when the confirmation is cancelled', async () => {
    const screen = await renderScreen()

    await act(async () => {
      pressable(screen, 'journal-delete-1').props.onPress()
    })
    await act(async () => {
      pressAlertButton('Cancel').onPress?.()
      await settle()
    })

    expect(mockedDelete()).not.toHaveBeenCalled()
    expectText(screen, 'A settled morning')
  })

  it('removes the row on confirmation', async () => {
    const screen = await renderScreen()

    await act(async () => {
      pressable(screen, 'journal-delete-1').props.onPress()
    })
    await act(async () => {
      pressAlertButton('Delete').onPress?.()
      await settle()
    })

    expect(mockedDelete()).toHaveBeenCalledWith(1)
    expectNoText(screen, 'A settled morning')
    // The last entry going means the empty invitation comes back.
    expect(byTestId(screen, 'journal-list-empty').length).toBeGreaterThan(0)
  })

  it('keeps the row and reports the failure when deletion fails', async () => {
    mockedDelete().mockRejectedValueOnce(new Error('offline'))
    const screen = await renderScreen()

    await act(async () => {
      pressable(screen, 'journal-delete-1').props.onPress()
    })
    await act(async () => {
      pressAlertButton('Delete').onPress?.()
      await settle()
    })

    expect(lastAlert()[0]).toBe('Delete failed')
    expectText(screen, 'A settled morning')
  })

  it('carries no iOS system blue anywhere', async () => {
    const screen = await renderScreen()

    // Walk the resolved styles rather than serialising the tree: the icon's
    // SVG nodes carry circular fiber references.
    const colours = screen.root
      .findAll(() => true)
      .flatMap((node) => {
        const style = node.props?.style
        const resolved = typeof style === 'function' ? style({}) : style
        const flat = (StyleSheet.flatten(resolved) ?? {}) as Record<string, any>
        return [flat.color, flat.backgroundColor, flat.borderColor, flat.borderLeftColor]
      })
      .concat(
        screen.root.findAll(() => true).map((node) => node.props?.color)
      )
      .filter(Boolean)
      .map(String)

    expect(colours.length).toBeGreaterThan(0)
    expect(colours.some((c) => c.toUpperCase() === '#007AFF')).toBe(false)
    // The delete control is the danger token, not an ad-hoc red.
    expect(colours).toContain(theme.state.danger)
  })
})
