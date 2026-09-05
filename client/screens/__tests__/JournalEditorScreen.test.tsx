import React from 'react'
import { Alert, Text, TextInput } from 'react-native'
import TestRenderer from 'react-test-renderer'

import JournalEditorScreen from '../JournalEditorScreen'
import { upsertJournal } from '../../lib/journals'

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

/** Fire the navigator's beforeRemove exactly as a back press would. */
function fireBackAttempt() {
  const action = { type: 'GO_BACK' }
  const event = {
    data: { action },
    preventDefault: jest.fn(),
  }

  if (!beforeRemoveListener) throw new Error('no beforeRemove listener')
  act(() => {
    beforeRemoveListener?.(event)
  })

  return event
}

/** The most recent Alert, as [title, message, buttons]. */
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
  act(() => {
    button.onPress?.()
  })
  return button
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
  const button = root.root.findAll(
    (node) =>
      typeof node.props.onPress === 'function' &&
      node.props.testID === 'screen-header-action'
  )[0]

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
    beforeRemoveListener = null
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
    // The generic "Prompt" heading is gone: the source line names it.
    expectNoText(screen, 'Prompt')
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

it('carries exactly one Save control, and no bottom duplicate', async () => {
    const screen = renderScreen({ id: undefined })
    const saveControls = screen.root.findAll(
      (node) =>
        typeof node.props.onPress === 'function' &&
        (node.props.accessibilityLabel === 'Save entry' ||
          node.findAllByType(Text).some(
            (text) => textValue(text.props.children) === 'Save'
          ))
    )
    const ids = new Set(saveControls.map((node) => node.props.testID))

    expect(ids).toEqual(new Set(['screen-header-action']))
    expectNoText(screen, 'Saving…')
  })

  it('disables Save until the response says something', async () => {
    const screen = renderScreen({ id: undefined })
    const save = () => findSaveButton(screen)

    expect(save().props.accessibilityState.disabled).toBe(true)
    expect(save().props.accessibilityHint).toBe('Write something before saving.')
    expectText(screen, 'Write something before saving.')

    // A title alone is not an entry.
    act(() => {
      screen.root.findAllByType(TextInput)[0].props.onChangeText('Just a title')
    })
    expect(save().props.accessibilityState.disabled).toBe(true)

    // Whitespace is not content either.
    act(() => {
      screen.root.findAllByType(TextInput)[1].props.onChangeText('   ')
    })
    expect(save().props.accessibilityState.disabled).toBe(true)

    act(() => {
      screen.root.findAllByType(TextInput)[1].props.onChangeText('Something real')
    })
    expect(save().props.accessibilityState.disabled).toBe(false)
    expect(save().props.accessibilityHint).toBeUndefined()
    expectNoText(screen, 'Write something before saving.')

    // No alert is raised at any point; the state said it instead.
    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('presents the guidance context as read-only quoted material', async () => {
    const screen = renderScreen({
      id: undefined,
      promptSource: 'Today’s Energy',
      promptText: 'What needs attention?',
      practiceSummary: 'Pause and choose one grounded response.',
      practiceSteps: ['Name what is present.'],
    })

    const context = screen.root.find(
      (node) => node.props?.testID === 'journal-guidance-context'
    )

    // One passage to assistive technology, with nothing to focus inside it.
    expect(context.props.accessible).toBe(true)
    expect(
      context.findAll((node) => typeof node.props.onPress === 'function')
    ).toHaveLength(0)
    expect(context.findAllByType(TextInput)).toHaveLength(0)

    // The subsection label stays; the generic field-style heading does not.
    expectText(screen, 'Grounding practice')
    expectNoText(screen, 'Prompt')
  })

  it('leaves an unchanged entry without asking anything', async () => {
    renderScreen({ id: 7, title: 'Kept', content: 'Body' })

    const event = fireBackAttempt()

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('leaves an untouched new entry without asking anything', async () => {
    renderScreen({ id: undefined })

    const event = fireBackAttempt()

    expect(event.preventDefault).not.toHaveBeenCalled()
    expect(Alert.alert).not.toHaveBeenCalled()
  })

  it('guards a dirty title and a dirty body alike', async () => {
    for (const field of [0, 1]) {
      jest.clearAllMocks()
      const screen = renderScreen({ id: 7, title: 'Kept', content: 'Body' })

      act(() => {
        screen.root.findAllByType(TextInput)[field].props.onChangeText('changed')
      })

      const event = fireBackAttempt()
      expect(event.preventDefault).toHaveBeenCalled()
      expect(lastAlert()[0]).toBe('Discard changes?')
      expect(lastAlert()[1]).toBe('Your unsaved journal changes will be lost.')

      act(() => {
        renderer?.unmount()
      })
      renderer = null
    }
  })

  it('keeps editing on cancel, and discards exactly once on confirm', async () => {
    const screen = renderScreen({ id: 7, title: 'Kept', content: 'Body' })
    act(() => {
      screen.root.findAllByType(TextInput)[1].props.onChangeText('changed')
    })

    fireBackAttempt()
    pressAlertButton('Keep editing')
    expect(mockNavigation.dispatch).not.toHaveBeenCalled()

    // A second attempt still asks -- cancelling did not disarm the guard.
    fireBackAttempt()
    const discard = pressAlertButton('Discard')
    expect(discard.style).toBe('destructive')
    expect(mockNavigation.dispatch).toHaveBeenCalledTimes(1)

    // And once discarded, leaving is not challenged again.
    const event = fireBackAttempt()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('raises one confirmation however many times back is pressed', async () => {
    const screen = renderScreen({ id: 7, title: 'Kept', content: 'Body' })
    act(() => {
      screen.root.findAllByType(TextInput)[1].props.onChangeText('changed')
    })

    fireBackAttempt()
    fireBackAttempt()
    fireBackAttempt()

    expect((Alert.alert as jest.Mock).mock.calls).toHaveLength(1)
  })

  it('lets a successful save leave without a prompt', async () => {
    const screen = renderScreen({ id: 7, title: 'Kept', content: 'Body' })
    act(() => {
      screen.root.findAllByType(TextInput)[1].props.onChangeText('changed')
    })

    await act(async () => {
      await findSaveButton(screen).props.onPress()
    })

    expect(mockNavigation.goBack).toHaveBeenCalled()
    const event = fireBackAttempt()
    expect(event.preventDefault).not.toHaveBeenCalled()
  })

  it('keeps the editor and its changes when saving fails', async () => {
    mockedUpsertJournal().mockRejectedValueOnce(new Error('offline'))
    const screen = renderScreen({ id: 7, title: 'Kept', content: 'Body' })

    act(() => {
      screen.root.findAllByType(TextInput)[1].props.onChangeText('changed')
    })
    await act(async () => {
      await findSaveButton(screen).props.onPress()
    })

    expect(lastAlert()[0]).toBe('Save failed')
    expect(mockNavigation.goBack).not.toHaveBeenCalled()
    expect(screen.root.findAllByType(TextInput)[1].props.value).toBe('changed')

    // Still dirty, so leaving is still challenged.
    const event = fireBackAttempt()
    expect(event.preventDefault).toHaveBeenCalled()
  })

  it('uses one lifecycle for header back and hardware back', async () => {
    renderScreen({ id: 7, title: 'Kept', content: 'Body' })

    // beforeRemove covers both, so there is no competing BackHandler.
    expect(mockNavigation.addListener).toHaveBeenCalledWith(
      'beforeRemove',
      expect.any(Function)
    )
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
