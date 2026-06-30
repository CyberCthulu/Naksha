import React from 'react'
import { Text } from 'react-native'
import TestRenderer from 'react-test-renderer'

import ShadowWorkScreen from '../ShadowWorkScreen'

const mockNavigation = {
  navigate: jest.fn(),
}

let mockRouteParams: Record<string, unknown> = {}

jest.mock('@react-navigation/native', () => ({
  useNavigation: () => mockNavigation,
  useRoute: () => ({ params: mockRouteParams }),
}))

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 24, left: 0 }),
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

function expectText(
  root: TestRenderer.ReactTestRenderer,
  expected: string
) {
  expect(
    screenText(root).some((text) => text.includes(expected))
  ).toBe(true)
}

function findPressableByText(
  root: TestRenderer.ReactTestRenderer,
  label: string
) {
  const pressable = root.root
    .findAll(
      (node) =>
        typeof node.props.onPress === 'function' &&
        node
          .findAllByType(Text)
          .some(
            (textNode) =>
              textValue(textNode.props.children) === label
          )
    )[0]

  if (!pressable) throw new Error(`Could not find pressable: ${label}`)
  return pressable
}

function renderScreen(params: Record<string, unknown>) {
  mockRouteParams = params

  act(() => {
    renderer = create(<ShadowWorkScreen />)
  })

  if (!renderer) throw new Error('ShadowWorkScreen did not render')
  return renderer
}

describe('ShadowWorkScreen', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    mockRouteParams = {}
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

  it('renders deterministic guidance and reflective safety framing', () => {
    const screen = renderScreen({
      promptId: 'guidance.prompt.friction-adjustment',
      practiceId: 'guidance.practice.single-task-reset',
    })

    expectText(screen, 'Shadow Work')
    expectText(screen, 'Use this as a reflection prompt, not a diagnosis.')
    expectText(screen, 'Use the friction')
    expectText(
      screen,
      'What recurring point of friction is asking for an adjustment'
    )
    expectText(screen, 'Grounding practice')
    expectText(screen, 'Single-task reset')
    expectText(screen, 'Reduce noise by completing one bounded task.')
    expectText(screen, 'Journal this')
  })

  it('uses stable local fallbacks when route IDs are absent', () => {
    const screen = renderScreen({})

    expectText(screen, 'Name the need')
    expectText(
      screen,
      'What feeling is most present, and what reasonable need may sit beneath it?'
    )
    expectText(screen, 'Five-sense grounding')
  })

  it('opens JournalEditor with the selected prompt and practice', () => {
    const screen = renderScreen({
      promptId: 'guidance.prompt.friction-adjustment',
      practiceId: 'guidance.practice.single-task-reset',
    })

    act(() => {
      findPressableByText(screen, 'Journal this').props.onPress()
    })

    expect(mockNavigation.navigate).toHaveBeenCalledWith(
      'JournalEditor',
      {
        id: undefined,
        initialTitle: 'Shadow Reflection',
        initialContent: [
          'Prompt:',
          'What recurring point of friction is asking for an adjustment rather than more force?',
          '',
          'Practice:',
          'Reduce noise by completing one bounded task.',
          '1. Choose one task that can be advanced in fifteen minutes.',
          '2. Silence avoidable distractions and work only on that task.',
          '',
          'Reflection:',
          '',
        ].join('\n'),
        promptTemplateId: 'guidance.prompt.friction-adjustment',
        promptSource: 'Shadow Work',
      }
    )
  })
})
