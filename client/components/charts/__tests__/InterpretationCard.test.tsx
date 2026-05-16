import React from 'react'
import { Text } from 'react-native'
import TestRenderer from 'react-test-renderer'

import InterpretationCard from '../InterpretationCard'

const { act, create } = TestRenderer

let renderer: ReturnType<typeof create> | null = null

function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).join('')
  if (value == null || typeof value === 'boolean') return ''
  return String(value)
}

function renderedTexts(root: TestRenderer.ReactTestRenderer): string[] {
  return root.root
    .findAllByType(Text)
    .map((node) => textValue(node.props.children))
}

describe('InterpretationCard', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
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

  it('renders long content as sentence nodes without dropping final words', () => {
    const content =
      'The first paragraph opens the placement. The final sentence resolves effectively.\n\nDaily work remains sustainable and meaningful.'

    act(() => {
      renderer = create(
        <InterpretationCard
          title="Uranus in House 3"
          blocks={[
            {
              title: 'Placement',
              interpretation: {
                short: 'Quick insight.',
                long: content,
              },
              mode: 'long',
            },
          ]}
        />
      )
    })

    if (!renderer) throw new Error('InterpretationCard did not render')

    const texts = renderedTexts(renderer)

    expect(texts).toContain('The final sentence resolves effectively.')
    expect(texts).toContain('Daily work remains sustainable and meaningful.')
    expect(texts.some((text) => text.includes('effectively.'))).toBe(true)
    expect(texts.some((text) => text.includes('meaningful.'))).toBe(true)
    expect(
      renderer.root.findAllByProps({
        testID: 'interpretation-block-bottom-spacer',
      }).length
    ).toBeGreaterThan(0)
  })
})
