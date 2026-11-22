import React from 'react'
import { Alert, Text, TextInput } from 'react-native'
import TestRenderer from 'react-test-renderer'

import JournalEditorScreen from '../JournalEditorScreen'
import {
  getOwnedJournal,
  insertJournal,
  updateJournal,
  type JournalRow,
} from '../../lib/journals'

let beforeRemoveListener: ((event: any) => void) | null = null

const mockNavigation = {
  goBack: jest.fn(),
  setOptions: jest.fn(),
  dispatch: jest.fn(),
  addListener: jest.fn((event: string, callback: (e: any) => void) => {
    if (event === 'beforeRemove') beforeRemoveListener = callback
    return () => {
      if (event === 'beforeRemove') beforeRemoveListener = null
    }
  }),
}

const EXISTING: JournalRow = {
  id: 42,
  user_id: 'user-1',
  chart_id: 17,
  prompt_template: 'guidance.prompt.saved',
  title: 'Persisted title',
  content: 'Persisted journal content',
  created_at: '2026-09-15T13:55:00.000Z',
  updated_at: '2026-09-16T13:55:00.000Z',
}

let mockRouteParams: Record<string, unknown> = {}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: mockRouteParams }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 24, left: 0 }),
}))

jest.mock('../../lib/journals', () => ({
  getOwnedJournal: jest.fn(),
  insertJournal: jest.fn(),
  updateJournal: jest.fn(),
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

function mockedGet() {
  return getOwnedJournal as jest.MockedFunction<typeof getOwnedJournal>
}

function mockedInsert() {
  return insertJournal as jest.MockedFunction<typeof insertJournal>
}

function mockedUpdate() {
  return updateJournal as jest.MockedFunction<typeof updateJournal>
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

function findSaveButton(root: TestRenderer.ReactTestRenderer) {
  const button = byTestId(root, 'screen-header-action').find(
    (node) => typeof node.props.onPress === 'function'
  )
  if (!button) throw new Error('Could not find journal Save button')
  return button
}

function renderScreen(params: Record<string, unknown> = {}) {
  mockRouteParams = params
  act(() => {
    renderer = create(<JournalEditorScreen />)
  })
  if (!renderer) throw new Error('JournalEditorScreen did not render')
  return renderer
}

async function settle() {
  for (let i = 0; i < 20; i += 1) await Promise.resolve()
}

async function renderLoadedEdit(params: Record<string, unknown> = { id: 42 }) {
  mockRouteParams = params
  await act(async () => {
    renderer = create(<JournalEditorScreen />)
    await settle()
  })
  if (!renderer) throw new Error('JournalEditorScreen did not render')
  return renderer
}

function fireBackAttempt() {
  const event = {
    data: { action: { type: 'GO_BACK' } },
    preventDefault: jest.fn(),
  }
  if (!beforeRemoveListener) throw new Error('no beforeRemove listener')
  act(() => beforeRemoveListener?.(event))
  return event
}

function lastAlert() {
  const calls = (Alert.alert as jest.Mock).mock.calls
  if (calls.length === 0) throw new Error('no Alert was shown')
  return calls[calls.length - 1]
}

describe('JournalEditorScreen', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    beforeRemoveListener = null
    mockRouteParams = {}
    renderer = null
    jest.spyOn(Alert, 'alert').mockImplementation(jest.fn())
    mockedGet().mockResolvedValue(EXISTING)
    mockedInsert().mockResolvedValue(EXISTING)
    mockedUpdate().mockResolvedValue(EXISTING)
  })

  afterEach(() => {
    if (renderer) {
      const mounted = renderer
      act(() => mounted.unmount())
    }
    renderer = null
    jest.restoreAllMocks()
  })

  it('creates a guided entry with fixed context and no client id', async () => {
    const screen = renderScreen({
      initialTitle: 'Reflection — Today’s Energy',
      promptTemplateId: 'guidance.prompt.attention',
      promptSource: 'Today’s Energy',
      promptText: 'What needs attention?',
      practiceSummary: 'Pause and choose one grounded response.',
      practiceSteps: ['Name what is present.', 'Choose one next step.'],
    })
    const inputs = screen.root.findAllByType(TextInput)

    expectText(screen, 'Reflect in your own words')
    expectText(screen, 'What needs attention?')
    expectText(screen, 'Grounding practice')
    expect(inputs[0].props.value).toBe('Reflection — Today’s Energy')
    expect(inputs[1].props.value).toBe('')

    act(() => {
      inputs[0].props.onChangeText('My reflection')
      inputs[1].props.onChangeText('A response I want to keep')
    })
    await act(async () => findSaveButton(screen).props.onPress())

    expect(mockedInsert()).toHaveBeenCalledWith({
      title: 'My reflection',
      content: 'A response I want to keep',
      prompt_template: 'guidance.prompt.attention',
    })
    expect(mockedUpdate()).not.toHaveBeenCalled()
    expect(mockNavigation.goBack).toHaveBeenCalled()
  })

  it('keeps guidance context read-only and exposes one Save control', () => {
    const screen = renderScreen({
      promptSource: 'Today’s Energy',
      promptText: 'What needs attention?',
      practiceSummary: 'Pause.',
      practiceSteps: ['Notice.'],
    })
    const context = screen.root.find(
      (node) => node.props?.testID === 'journal-guidance-context'
    )

    expect(context.props.accessible).toBe(true)
    expect(context.findAllByType(TextInput)).toHaveLength(0)
    const saveControls = screen.root.findAll(
      (node) =>
        typeof node.props.onPress === 'function' &&
        node.props.accessibilityLabel === 'Save entry'
    )
    expect(new Set(saveControls.map((node) => node.props.testID))).toEqual(
      new Set(['screen-header-action'])
    )
    expectNoText(screen, 'Saving…')
  })

  it('disables new-entry Save until content is present', () => {
    const screen = renderScreen()
    const inputs = screen.root.findAllByType(TextInput)

    expect(findSaveButton(screen).props.accessibilityState.disabled).toBe(true)
    expect(findSaveButton(screen).props.accessibilityHint).toBe(
      'Write something before saving.'
    )

    act(() => inputs[1].props.onChangeText('Something real'))

    expect(findSaveButton(screen).props.accessibilityState.disabled).toBe(false)
  })

  it('shows loading and does not trust route content before owned fetch resolves', async () => {
    let resolve: (row: JournalRow | null) => void = () => {}
    mockedGet().mockReturnValue(
      new Promise((next) => {
        resolve = next
      })
    )
    const screen = renderScreen({
      id: 42,
      title: 'Stale route title',
      content: 'Stale route content',
    })

    expectText(screen, 'Loading journal')
    expectNoText(screen, 'Stale route title')
    expectNoText(screen, 'Stale route content')
    expect(screen.root.findAllByType(TextInput)).toHaveLength(0)
    expect(byTestId(screen, 'screen-header-action')).toHaveLength(0)

    await act(async () => {
      resolve(EXISTING)
      await settle()
    })

    const inputs = screen.root.findAllByType(TextInput)
    expect(inputs[0].props.value).toBe('Persisted title')
    expect(inputs[1].props.value).toBe('Persisted journal content')
  })

  it('accepts a numeric deep-link id but loads all content from the database', async () => {
    const screen = await renderLoadedEdit({
      id: '42',
      initialTitle: 'Untrusted route title',
      initialContent: 'Untrusted route content',
      promptText: 'Untrusted prompt',
    })

    expect(mockedGet()).toHaveBeenCalledWith(42)
    const inputs = screen.root.findAllByType(TextInput)
    expect(inputs[0].props.value).toBe(EXISTING.title)
    expect(inputs[1].props.value).toBe(EXISTING.content)
    expectNoText(screen, 'Untrusted prompt')
  })

  it('establishes a clean baseline after load', async () => {
    const screen = await renderLoadedEdit()

    expect(findSaveButton(screen).props.accessibilityState.disabled).toBe(true)
    expect(findSaveButton(screen).props.accessibilityHint).toBe(
      'Make a change before saving.'
    )
    const event = fireBackAttempt()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('updates only content when only content was edited', async () => {
    const screen = await renderLoadedEdit()
    const inputs = screen.root.findAllByType(TextInput)

    act(() => inputs[1].props.onChangeText('Changed body'))
    await act(async () => findSaveButton(screen).props.onPress())

    expect(mockedUpdate()).toHaveBeenCalledWith(42, {
      content: 'Changed body',
    })
    expect(mockedInsert()).not.toHaveBeenCalled()
  })

  it('updates title without resending unchanged content or metadata', async () => {
    const screen = await renderLoadedEdit()
    const inputs = screen.root.findAllByType(TextInput)

    act(() => inputs[0].props.onChangeText('Changed title'))
    await act(async () => findSaveButton(screen).props.onPress())

    expect(mockedUpdate()).toHaveBeenCalledWith(42, {
      title: 'Changed title',
    })
  })

  it.each([
    ['missing', null],
    ['foreign', null],
  ])('keeps a %s id non-editable without disclosing existence', async (_, row) => {
    mockedGet().mockResolvedValue(row)
    const screen = await renderLoadedEdit()

    expectText(screen, 'Journal entry unavailable')
    expectText(screen, 'may be unavailable or you may not have access')
    expect(screen.root.findAllByType(TextInput)).toHaveLength(0)
    expect(byTestId(screen, 'screen-header-action')).toHaveLength(0)
  })

  it('keeps a malformed linked id non-editable without querying', () => {
    const screen = renderScreen({ id: 'not-an-id' })

    expectText(screen, 'Journal entry unavailable')
    expect(screen.root.findAllByType(TextInput)).toHaveLength(0)
    expect(byTestId(screen, 'screen-header-action')).toHaveLength(0)
    expect(mockedGet()).not.toHaveBeenCalled()
  })

  it('preserves typed text and dirty state when the row vanished before save', async () => {
    mockedUpdate().mockRejectedValueOnce(
      new Error('This journal entry is unavailable or you do not have access to it.')
    )
    const screen = await renderLoadedEdit()
    const body = screen.root.findAllByType(TextInput)[1]

    act(() => body.props.onChangeText('Writing that must survive'))
    await act(async () => findSaveButton(screen).props.onPress())

    expect(lastAlert()[0]).toBe('Save failed')
    expect(mockNavigation.goBack).not.toHaveBeenCalled()
    expect(screen.root.findAllByType(TextInput)[1].props.value).toBe(
      'Writing that must survive'
    )
    expect(fireBackAttempt().preventDefault).toHaveBeenCalled()
  })

  it('guards dirty changes and permits a successful save to leave', async () => {
    const screen = await renderLoadedEdit()
    act(() =>
      screen.root.findAllByType(TextInput)[1].props.onChangeText('Changed')
    )

    const dirtyBack = fireBackAttempt()
    expect(dirtyBack.preventDefault).toHaveBeenCalled()
    expect(lastAlert()[0]).toBe('Discard changes?')

    await act(async () => findSaveButton(screen).props.onPress())
    expect(mockNavigation.goBack).toHaveBeenCalled()
    expect(fireBackAttempt().preventDefault).not.toHaveBeenCalled()
  })
})
