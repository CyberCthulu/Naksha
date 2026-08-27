import React from 'react'
import {
  Text,
  TextInput,
  TouchableOpacity,
} from 'react-native'
import TestRenderer from 'react-test-renderer'

import JournalEditorScreen from '../JournalEditorScreen'
import { upsertJournal } from '../../lib/journals'

const mockNavigation = {
  goBack: jest.fn(),
  setOptions: jest.fn(),
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
  upsertJournal: jest.fn(),
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

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

function findSaveButton(root: TestRenderer.ReactTestRenderer) {
  const button = root.root.findAllByType(TouchableOpacity).find((node) =>
    node
      .findAllByType(Text)
      .some((text) => textValue(text.props.children) === 'Save')
  )

  if (!button) throw new Error('Could not find journal Save button')
  return button
}

function mockedUpsertJournal() {
  return upsertJournal as jest.MockedFunction<typeof upsertJournal>
}

function renderScreen(params: Record<string, unknown>) {
  mockRouteParams = params

  act(() => {
    renderer = create(<JournalEditorScreen />)
  })

  if (!renderer) throw new Error('JournalEditorScreen did not render')
  return renderer
}

describe('JournalEditorScreen prompt prefill', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    mockRouteParams = {}
    mockedUpsertJournal().mockResolvedValue({ id: 1 } as any)
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
  })

  it('renders fixed guidance context and saves only the user response', async () => {
    const screen = renderScreen({
      id: undefined,
      initialTitle: 'Reflection — Today’s Energy',
      initialContent: '',
      promptTemplateId: 'guidance.prompt.attention',
      promptSource: 'Today’s Energy',
      promptText: 'What needs attention?',
      practiceSummary: 'Pause and choose one grounded response.',
      practiceSteps: ['Name what is present.', 'Choose one next step.'],
    })
    let inputs = screen.root.findAllByType(TextInput)

    expectText(screen, 'Reflect in your own words')
    expectText(screen, 'Today’s Energy')
    expectText(screen, 'Prompt')
    expectText(screen, 'What needs attention?')
    expectText(screen, 'Grounding practice')
    expectText(screen, 'Pause and choose one grounded response.')
    expectText(screen, '1. Name what is present.')
    expectText(screen, '2. Choose one next step.')
    expectText(screen, 'Your reflection')
    expect(inputs[0].props.value).toBe('Reflection — Today’s Energy')
    expect(inputs[1].props.value).toBe('')
    expect(inputs[1].props.value).not.toContain('What needs attention?')
    expect(inputs[1].props.value).not.toContain('Grounding practice')

    act(() => {
      inputs[0].props.onChangeText('My reflection')
      inputs[1].props.onChangeText('A response I want to keep')
    })

    mockRouteParams = {
      ...mockRouteParams,
      initialTitle: 'A later route value',
      initialContent: 'A later route body',
      promptText: 'A later prompt',
    }
    act(() => {
      screen.update(<JournalEditorScreen />)
    })
    inputs = screen.root.findAllByType(TextInput)

    expect(inputs[0].props.value).toBe('My reflection')
    expect(inputs[1].props.value).toBe('A response I want to keep')
    expectText(screen, 'What needs attention?')
    expectNoText(screen, 'A later prompt')

    await act(async () => {
      await findSaveButton(screen).props.onPress()
    })

    expect(mockedUpsertJournal()).toHaveBeenCalledWith({
      id: undefined,
      title: 'My reflection',
      content: 'A response I want to keep',
      prompt_template: 'guidance.prompt.attention',
    })
    expect(mockNavigation.goBack).toHaveBeenCalled()
  })

  it('uses saved entry fields over guidance prefill in edit mode', async () => {
    const savedContent =
      'Prompt:\nLegacy prompt\n\nReflection:\nSaved journal content'
    const screen = renderScreen({
      id: 42,
      title: 'Saved title',
      content: savedContent,
      initialTitle: 'Reflection — Weekly Forecast',
      initialContent: 'Prompt prefill that must not win',
      promptTemplateId: 'guidance.prompt.saved',
      promptSource: 'Weekly Forecast',
      promptText: 'New prompt context that must not render',
      practiceSummary: 'New practice context that must not render',
      practiceSteps: ['A new context step.'],
    })
    const inputs = screen.root.findAllByType(TextInput)

    expect(inputs[0].props.value).toBe('Saved title')
    expect(inputs[1].props.value).toBe(savedContent)
    expectText(screen, 'Something to add?')
    expectNoText(screen, 'Weekly Forecast')
    expectNoText(screen, 'New prompt context that must not render')
    expectNoText(screen, 'New practice context that must not render')

    await act(async () => {
      await findSaveButton(screen).props.onPress()
    })

    expect(mockedUpsertJournal()).toHaveBeenCalledWith({
      id: 42,
      title: 'Saved title',
      content: savedContent,
      prompt_template: 'guidance.prompt.saved',
    })
  })

  it('creates a non-guided journal entry without a context card', async () => {
    const screen = renderScreen({
      id: undefined,
      title: '',
      content: '',
    })
    const inputs = screen.root.findAllByType(TextInput)

    expectText(screen, 'Share your thoughts')
    expectText(screen, 'Entry')
    expectNoText(screen, 'Grounding practice')
    expect(inputs[0].props.value).toBe('')
    expect(inputs[1].props.value).toBe('')

    act(() => {
      inputs[0].props.onChangeText('A free-form note')
      inputs[1].props.onChangeText('Only my own words.')
    })

    await act(async () => {
      await findSaveButton(screen).props.onPress()
    })

    expect(mockedUpsertJournal()).toHaveBeenCalledWith({
      id: undefined,
      title: 'A free-form note',
      content: 'Only my own words.',
      prompt_template: null,
    })
  })
})
