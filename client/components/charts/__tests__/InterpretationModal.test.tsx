import React from 'react'
import { Text, View } from 'react-native'
import TestRenderer from 'react-test-renderer'

import InterpretationModal, {
  type InterpretationPage,
} from '../InterpretationModal'

jest.mock('react-native-pager-view', () => {
  const React = require('react')
  const { View } = require('react-native')

  return {
    __esModule: true,
    default: React.forwardRef(
      (
        props: {
          children?: React.ReactNode
          initialPage?: number
          onPageSelected?: (event: { nativeEvent: { position: number } }) => void
        },
        ref: React.Ref<{ setPageWithoutAnimation: jest.Mock }>
      ) => {
        React.useImperativeHandle(ref, () => ({
          setPageWithoutAnimation: jest.fn(),
        }))

        return (
          <View
            testID="PagerView"
            initialPage={props.initialPage}
            onPageSelected={props.onPageSelected}
          >
            {props.children}
          </View>
        )
      }
    ),
  }
})

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

function pager(root: TestRenderer.ReactTestRenderer) {
  const nodes = root.root.findAll(
    (node) => node.type === View && node.props.testID === 'PagerView'
  )

  if (!nodes[0]) throw new Error('Could not find PagerView')
  return nodes[0]
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

    act(() => {
      pager(screen).props.onPageSelected({ nativeEvent: { position: 0 } })
    })

    expect(onChangeIndex).toHaveBeenCalledWith(0)
  })

  it('calls onChangeIndex from next and previous controls', async () => {
    const { renderer: screen, onChangeIndex } = renderModal({
      currentIndex: 0,
    })

    expect(hasText(screen, 'Sun in Aries')).toBe(true)
    expect(pager(screen).props.initialPage).toBe(1)

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

  it('wraps circular sentinel pager selections to real page indexes', () => {
    const { renderer: screen, onChangeIndex } = renderModal({
      currentIndex: 0,
    })

    act(() => {
      pager(screen).props.onPageSelected({ nativeEvent: { position: 0 } })
    })
    expect(onChangeIndex).toHaveBeenLastCalledWith(2)

    act(() => {
      pager(screen).props.onPageSelected({ nativeEvent: { position: 4 } })
    })
    expect(onChangeIndex).toHaveBeenLastCalledWith(0)
  })

  it('calls onClose from the close control', async () => {
    const { renderer: screen, onClose } = renderModal()

    await press(screen, '✕')

    expect(onClose).toHaveBeenCalled()
  })

  it('resets pager mounting state after close and reopen', async () => {
    const { renderer: screen, onChangeIndex, onClose } = renderModal({
      currentIndex: 2,
    })

    expect(pager(screen).props.initialPage).toBe(3)

    await updateModal({
      visible: false,
      currentIndex: 2,
      onChangeIndex,
      onClose,
    })
    await updateModal({
      visible: true,
      currentIndex: 0,
      onChangeIndex,
      onClose,
    })

    expect(pager(screen).props.initialPage).toBe(1)
  })
})
