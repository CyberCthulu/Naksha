import React from 'react'
import { ScrollView, Text } from 'react-native'
import TestRenderer from 'react-test-renderer'

import InterpretationModal, {
  type InterpretationPage,
} from '../InterpretationModal'

function flattenStyles(style: unknown): Record<string, unknown> {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flattenStyles))
  if (typeof style === 'object') return style as Record<string, unknown>
  return {}
}

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 24, left: 0 }),
}))

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

const pages: InterpretationPage[] = [
  {
    key: 'sun',
    title: 'Sun in Aries',
    subtitle: 'Identity',
    summary: 'A bright first page.',
    blocks: [
      {
        title: 'Core',
        interpretation: {
          short: 'Direct spark.',
          long: 'The long Sun interpretation.',
        },
      },
    ],
  },
  {
    key: 'moon',
    title: 'Moon in Taurus',
    subtitle: 'Feeling',
    summary: 'A steady second page.',
    blocks: [
      {
        title: 'Mood',
        interpretation: {
          short: 'Steady feeling.',
          long: 'The long Moon interpretation.',
        },
      },
    ],
  },
  {
    key: 'mars',
    title: 'Mars in Gemini',
    subtitle: 'Action',
    summary: 'A quick third page.',
    blocks: [
      {
        title: 'Drive',
        interpretation: {
          short: 'Quick motion.',
          long: 'The long Mars interpretation.',
        },
      },
    ],
  },
]

async function settleAsyncWork() {
  for (let i = 0; i < 10; i += 1) {
    await Promise.resolve()
  }
}

function renderModal({
  visible = true,
  modalPages = pages,
  currentIndex = 0,
  onChangeIndex = jest.fn(),
  onClose = jest.fn(),
}: {
  visible?: boolean
  modalPages?: InterpretationPage[]
  currentIndex?: number
  onChangeIndex?: jest.Mock
  onClose?: jest.Mock
} = {}) {
  act(() => {
    renderer = create(
      <InterpretationModal
        visible={visible}
        headerTitle="Chart Story"
        pages={modalPages}
        currentIndex={currentIndex}
        onChangeIndex={onChangeIndex}
        onClose={onClose}
      />
    )
  })

  if (!renderer) throw new Error('InterpretationModal did not render')
  return { renderer, onChangeIndex, onClose }
}

async function updateModal(
  props: {
    visible?: boolean
    modalPages?: InterpretationPage[]
    currentIndex?: number
    onChangeIndex?: jest.Mock
    onClose?: jest.Mock
  } = {}
) {
  const {
    visible = true,
    modalPages = pages,
    currentIndex = 0,
    onChangeIndex = jest.fn(),
    onClose = jest.fn(),
  } = props

  if (!renderer) throw new Error('InterpretationModal did not render')

  await act(async () => {
    renderer?.update(
      <InterpretationModal
        visible={visible}
        headerTitle="Chart Story"
        pages={modalPages}
        currentIndex={currentIndex}
        onChangeIndex={onChangeIndex}
        onClose={onClose}
      />
    )
    await settleAsyncWork()
  })
}

function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).join('')
  if (value == null || typeof value === 'boolean') return ''
  return String(value)
}

function hasText(root: TestRenderer.ReactTestRenderer, expected: string) {
  return root.root
    .findAllByType(Text)
    .some((node) => textValue(node.props.children).includes(expected))
}

function findPressableByText(
  root: TestRenderer.ReactTestRenderer,
  label: string
) {
  const pressable = root.root.findAll((node) =>
    typeof node.props?.onPress === 'function' &&
    node
      .findAllByType(Text)
      .some((textNode) => textValue(textNode.props.children).includes(label))
  )

  if (!pressable[0]) throw new Error(`Could not find pressable: ${label}`)
  return pressable[0]
}

function findByTestID(root: TestRenderer.ReactTestRenderer, testID: string) {
  const node = root.root.findAll((item) => item.props.testID === testID)[0]

  if (!node) throw new Error(`Could not find testID: ${testID}`)
  return node
}

async function press(
  root: TestRenderer.ReactTestRenderer,
  label: string
) {
  const pressable = findPressableByText(root, label)

  await act(async () => {
    pressable.props.onPress()
    await settleAsyncWork()
  })
}

describe('InterpretationModal', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
    jest.clearAllMocks()
    jest
      .spyOn(global, 'requestAnimationFrame')
      .mockImplementation((callback: FrameRequestCallback) => {
        callback(0)
        return 1
      })

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

  it('does not render modal content when closed', () => {
    const { renderer: screen } = renderModal({ visible: false })

    expect(hasText(screen, 'Chart Story')).toBe(false)
    expect(hasText(screen, 'Sun in Aries')).toBe(false)
  })

  it('renders one page with disabled previous and next controls', () => {
    const onePage = [pages[0]]
    const { renderer: screen, onChangeIndex } = renderModal({
      modalPages: onePage,
      currentIndex: 0,
    })

    expect(hasText(screen, 'Sun in Aries')).toBe(true)
    expect(hasText(screen, 'A bright first page.')).toBe(true)
    expect(findPressableByText(screen, '‹').props.disabled).toBe(true)
    expect(findPressableByText(screen, '›').props.disabled).toBe(true)
    expect(onChangeIndex).not.toHaveBeenCalled()
  })

  it('renders the active page inside one flex scroll container', () => {
    const { renderer: screen } = renderModal()
    const scrollViews = screen.root.findAllByType(ScrollView)
    const firstScrollView = scrollViews[0]
    const scrollStyle = flattenStyles(firstScrollView.props.style)

    expect(scrollViews).toHaveLength(1)
    expect(scrollStyle?.flex).toBe(1)
  })

  it('positions the sheet absolutely and includes a bottom spacer for safe area', () => {
    const { renderer: screen } = renderModal()
    const sheet = findByTestID(screen, 'interpretation-sheet')
    const sheetStyle = flattenStyles(sheet.props.style)

    expect(sheetStyle?.position).toBe('absolute')
    expect(sheetStyle?.bottom).toBe(0)
    expect(sheetStyle?.left).toBe(0)
    expect(sheetStyle?.right).toBe(0)

    const spacer = findByTestID(screen, 'interpretation-bottom-spacer')
    const spacerStyle = flattenStyles(spacer.props.style)

    // With mocked insets.bottom=24: max(24,16)+40=64. Spacer must clear nav bar.
    expect((spacerStyle?.height as number) ?? 0).toBeGreaterThanOrEqual(56)
  })

  it('calls onChangeIndex from next and previous controls', async () => {
    const { renderer: screen, onChangeIndex } = renderModal({
      currentIndex: 0,
    })

    expect(hasText(screen, 'Sun in Aries')).toBe(true)

    await press(screen, '›')
    expect(onChangeIndex).toHaveBeenLastCalledWith(1)

    await updateModal({
      currentIndex: 1,
      onChangeIndex,
    })

    await press(screen, '‹')
    expect(onChangeIndex).toHaveBeenLastCalledWith(0)
  })

  it('wraps previous before the first page to the last page', async () => {
    const { renderer: screen, onChangeIndex } = renderModal({
      currentIndex: 0,
    })

    await press(screen, '‹')

    expect(onChangeIndex).toHaveBeenCalledWith(2)
  })

  it('wraps next after the last page to the first page', async () => {
    const { renderer: screen, onChangeIndex } = renderModal({
      currentIndex: 2,
    })

    await press(screen, '›')

    expect(onChangeIndex).toHaveBeenCalledWith(0)
  })

  it('renders active page content when currentIndex changes', async () => {
    const { renderer: screen, onChangeIndex } = renderModal({
      currentIndex: 0,
    })

    expect(hasText(screen, 'Sun in Aries')).toBe(true)
    expect(hasText(screen, 'Moon in Taurus')).toBe(false)

    await updateModal({
      currentIndex: 1,
      onChangeIndex,
    })

    expect(hasText(screen, 'Sun in Aries')).toBe(false)
    expect(hasText(screen, 'Moon in Taurus')).toBe(true)
  })

  it('calls onClose from the close control', async () => {
    const { renderer: screen, onClose } = renderModal()

    await press(screen, '✕')

    expect(onClose).toHaveBeenCalled()
  })
})
