import React from 'react'
import { ScrollView } from 'react-native'
import TestRenderer from 'react-test-renderer'

import InterpretationModal from '../InterpretationModal'
import InterpretationCard from '../InterpretationCard'
import type { InterpretationPage } from '../interpretationTypes'
import { theme } from '../../ui/theme'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 24, right: 0, bottom: 48, left: 0 }),
}))

jest.mock('react-native-pager-view', () => {
  const React = require('react')
  const { View } = require('react-native')

  return {
    __esModule: true,
    default: React.forwardRef((props: any, ref: any) => {
      React.useImperativeHandle(ref, () => ({
        setPageWithoutAnimation: jest.fn(),
      }))
      return (
        <View testID={props.testID} style={props.style}>
          {props.children}
        </View>
      )
    }),
  }
})

const { act, create } = TestRenderer

const PAGES: InterpretationPage[] = [
  {
    key: 'Sun',
    title: 'Sun',
    subtitle: 'Virgo · House 10',
    summary: 'Your core self is analytical.',
    blocks: [
      {
        title: 'Sun in Virgo',
        interpretation: { short: 'short a', long: 'Long body A.' },
        mode: 'long',
      },
      {
        title: 'Sun in House 10',
        interpretation: { short: 'short b', long: 'Long body B.' },
        mode: 'long',
      },
    ],
  },
  { key: 'Moon', title: 'Moon', subtitle: 'Pisces · House 4', summary: null },
]

let renderer: ReturnType<typeof create> | null = null

function render(element: React.ReactElement): ReturnType<typeof create> {
  act(() => {
    renderer = create(element)
  })
  if (!renderer) throw new Error('did not render')
  return renderer
}

function hostTexts(screen: ReturnType<typeof create>) {
  return screen.root
    .findAll((n) => String(n.type) === 'Text')
    .map((n) => n.children.filter((c) => typeof c === 'string').join(''))
}

function byTestID(screen: ReturnType<typeof create>, testID: string) {
  return screen.root.findAll(
    (n) => typeof n.props?.onPress === 'function' && n.props?.testID === testID
  )
}

function flatten(style: unknown): Record<string, unknown> {
  if (!style) return {}
  if (Array.isArray(style)) return Object.assign({}, ...style.map(flatten))
  if (typeof style === 'object') return style as Record<string, unknown>
  return {}
}

beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  renderer = null
})

afterEach(() => {
  if (renderer) {
    const mounted = renderer
    act(() => mounted.unmount())
  }
  renderer = null
})

describe('Interpretation reading order', () => {
  it('renders one continuous column in the approved order', () => {
    const texts = hostTexts(
      render(
        <InterpretationCard
          eyebrow="Planet Interpretation"
          title="Sun"
          subtitle="Virgo · House 10"
          summary="Your core self is analytical."
          blocks={PAGES[0].blocks}
        />
      )
    )

    const order = [
      'Planet Interpretation',
      'Sun',
      'Virgo · House 10',
      'Your core self is analytical.',
      'Sun in Virgo',
      'Long body A.',
      'Sun in House 10',
      'Long body B.',
    ]
    const indexes = order.map((t) => texts.indexOf(t))

    expect(indexes.every((i) => i >= 0)).toBe(true)
    expect(indexes).toEqual([...indexes].sort((a, b) => a - b))
  })

  it('omits sections whose data does not exist', () => {
    const texts = hostTexts(render(<InterpretationCard title="Moon" />))

    expect(texts).toEqual(['Moon'])
  })

  it('renders no tabbed section controls', () => {
    const screen = render(
      <InterpretationModal
        visible
        headerTitle="Planet Interpretation"
        pages={PAGES}
        currentIndex={0}
        onChangeIndex={jest.fn()}
        onClose={jest.fn()}
      />
    )
    const texts = hostTexts(screen).map((t) => t.toLowerCase())

    for (const tab of ['overview', 'strengths', 'growth', 'advice']) {
      expect(texts).not.toContain(tab)
    }
  })
})

describe('Interpretation modal chrome', () => {
  function renderModal(overrides: Record<string, unknown> = {}) {
    return render(
      <InterpretationModal
        visible
        headerTitle="Planet Interpretation"
        pages={PAGES}
        currentIndex={0}
        onChangeIndex={jest.fn()}
        onClose={jest.fn()}
        {...overrides}
      />
    )
  }

  it('gives previous, next and close real 48dp targets with labels', () => {
    const screen = renderModal()

    const expected: Record<string, string> = {
      'interpretation-prev': 'Previous interpretation',
      'interpretation-next': 'Next interpretation',
      'interpretation-close': 'Close interpretation',
    }

    for (const [testID, label] of Object.entries(expected)) {
      const control = byTestID(screen, testID)[0]
      expect(control).toBeDefined()
      expect(control.props.accessibilityRole).toBe('button')
      expect(control.props.accessibilityLabel).toBe(label)

      const style = flatten(control.props.style({ pressed: false }))
      expect(style.minWidth).toBe(theme.touchTarget.min)
      expect(style.minHeight).toBe(theme.touchTarget.min)
    }
  })

  it('renders its controls through the shared Icon primitive', () => {
    const json = JSON.stringify(renderModal().toJSON())

    // Icon hides itself from assistive technology; a raw Lucide import
    // would not, and would be announced beside the control label.
    expect(json).toContain('"accessibilityElementsHidden":true')
    expect(json).toContain('"importantForAccessibility":"no-hide-descendants"')
  })

  it('exposes the current position without fragmenting the content', () => {
    const screen = renderModal({ currentIndex: 1 })
    expect(hostTexts(screen)).toContain('2 / 2')
  })

  it('keeps the whole interpretation scrollable with no fixed height', () => {
    const screen = renderModal()
    const scrolls = screen.root.findAllByType(ScrollView)

    expect(scrolls.length).toBeGreaterThan(0)
    for (const scroll of scrolls) {
      const style = flatten(scroll.props.style)
      expect(style.height).toBeUndefined()
      expect(style.maxHeight).toBeUndefined()
    }

    const sheet = screen.root.findAll(
      (n) => n.props?.testID === 'interpretation-sheet'
    )[0]
    expect(flatten(sheet.props.style).height).toBeUndefined()
  })

  it('respects the bottom safe area in its scroll padding', () => {
    const screen = renderModal()
    const content = flatten(
      screen.root.findAllByType(ScrollView)[0].props.contentContainerStyle
    )

    expect(typeof content.paddingBottom).toBe('number')
    expect(content.paddingBottom as number).toBeGreaterThan(0)
  })

  it('preserves slide animation and close semantics', () => {
    const onClose = jest.fn()
    const screen = renderModal({ onClose })
    const modal = screen.root.findAll(
      (n) => String(n.type) === 'Modal' || n.props?.animationType
    )[0]

    expect(modal.props.animationType).toBe('slide')
    expect(typeof modal.props.onRequestClose).toBe('function')

    act(() => modal.props.onRequestClose())
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
