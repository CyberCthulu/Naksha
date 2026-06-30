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

  it('initializes and saves create-mode prompt prefill once', async () => {
    const screen = renderScreen({
      id: undefined,
      initialTitle: 'Reflection — Today’s Energy',
      initialContent:
        'Prompt:\nWhat needs attention?\n\nContext:\nToday’s Energy\n\nReflection:\n',
      promptTemplateId: 'guidance.prompt.attention',
      promptSource: 'Today’s Energy',
    })
    let inputs = screen.root.findAllByType(TextInput)

    expect(inputs[0].props.value).toBe('Reflection — Today’s Energy')
    expect(inputs[1].props.value).toContain('What needs attention?')

    act(() => {
      inputs[0].props.onChangeText('My reflection')
      inputs[1].props.onChangeText('A response I want to keep')
    })

    mockRouteParams = {
      ...mockRouteParams,
      initialTitle: 'A later route value',
      initialContent: 'A later route body',
    }
    act(() => {
      screen.update(<JournalEditorScreen />)
    })
    inputs = screen.root.findAllByType(TextInput)

    expect(inputs[0].props.value).toBe('My reflection')
    expect(inputs[1].props.value).toBe('A response I want to keep')

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

  it('uses saved entry fields over create prefill in edit mode', async () => {
    const screen = renderScreen({
      id: 42,
      title: 'Saved title',
      content: 'Saved journal content',
      initialTitle: 'Reflection — Weekly Forecast',
      initialContent: 'Prompt prefill that must not win',
      promptTemplateId: 'guidance.prompt.saved',
      promptSource: 'Weekly Forecast',
    })
    const inputs = screen.root.findAllByType(TextInput)

    expect(inputs[0].props.value).toBe('Saved title')
    expect(inputs[1].props.value).toBe('Saved journal content')

    await act(async () => {
      await findSaveButton(screen).props.onPress()
    })

    expect(mockedUpsertJournal()).toHaveBeenCalledWith({
      id: 42,
      title: 'Saved title',
      content: 'Saved journal content',
      prompt_template: 'guidance.prompt.saved',
    })
  })
})
