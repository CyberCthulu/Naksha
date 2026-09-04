import React from 'react'
import { StyleSheet } from 'react-native'
import TestRenderer from 'react-test-renderer'

import { ChartAspectDetail } from '../ChartAspectDetail'
import { ChartHero } from '../ChartHero'
import { ChartHouseDetail } from '../ChartHouseDetail'
import { theme } from '../../ui/theme'

const { act, create } = TestRenderer

type Instance = TestRenderer.ReactTestInstance

/**
 * The swapping headline below the wheel is laid out at its container's width.
 *
 * On a device the serif display face carries negative letterSpacing, and a
 * shrink-to-fit paragraph measured for one line can re-wrap inside the box
 * that measurement produced -- dropping the last word into a line the view has
 * no height for. "Jupiter in Aquarius" rendered as "Jupiter in" that way while
 * the longer "Neptune in Capricorn" was fine, so the failure is a rounding
 * accident of the string and cannot be reproduced in this renderer.
 *
 * What can be pinned is the layout contract that removes it: the headline
 * takes its width from the container, stays centred by textAlign rather than
 * by the parent's alignItems, and is never capped to a line count -- capping
 * would ellipsize the sign instead of showing it.
 */
function hostTexts(root: Instance): Instance[] {
  // A host component carries its tag as `type`; the composite AppText that
  // renders one does not, so both would otherwise match by name.
  return root.findAll(
    (node) => typeof node.type === 'string' && (node.type as string) === 'Text'
  )
}

/**
 * The text a Text contributes itself, ignoring nested Texts.
 *
 * The aspect pair interleaves strings with a nested Text for the separator,
 * so its children are a mixed array rather than a single string.
 */
function ownText(node: Instance): string {
  const children = node.props.children
  const parts = Array.isArray(children) ? children : [children]
  return parts.filter((part): part is string => typeof part === 'string').join('')
}

function textContaining(root: Instance, needle: string): Instance {
  const match = hostTexts(root).find((node) => ownText(node).includes(needle))
  if (!match) {
    throw new Error(`no Text rendering ${JSON.stringify(needle)}`)
  }
  return match
}

function styleOf(node: Instance) {
  return StyleSheet.flatten(node.props.style) as Record<string, unknown>
}

describe('the headline below the wheel', () => {
  it('lays the placement title out at the container width', () => {
    let tree!: TestRenderer.ReactTestRenderer
    act(() => {
      tree = create(
        <ChartHero title="Jupiter in Aquarius" planet="Jupiter" house={3} />
      )
    })
    const title = textContaining(tree.root, 'Jupiter in Aquarius')
    const style = styleOf(title)

    expect(style.alignSelf).toBe('stretch')
    expect(style.textAlign).toBe('center')
    expect(title.props.numberOfLines).toBeUndefined()
  })

  it('keeps the display role that makes the shrink-to-fit width fragile', () => {
    let tree!: TestRenderer.ReactTestRenderer
    act(() => {
      tree = create(<ChartHero title="Jupiter in Aquarius" />)
    })
    const style = styleOf(textContaining(tree.root, 'Jupiter in Aquarius'))

    expect(style.fontSize).toBe(theme.typography.display.fontSize)
    expect(style.letterSpacing).toBe(theme.typography.display.letterSpacing)
  })

  it('lays the house title out the same way', () => {
    let tree!: TestRenderer.ReactTestRenderer
    act(() => {
      tree = create(<ChartHouseDetail house={3} signName="Aquarius" />)
    })
    const style = styleOf(textContaining(tree.root, 'House 3'))

    expect(style.alignSelf).toBe('stretch')
    expect(style.textAlign).toBe('center')
  })

  it('lays the aspect pair out the same way', () => {
    let tree!: TestRenderer.ReactTestRenderer
    act(() => {
      tree = create(
        <ChartAspectDetail
          aspect={{ a: 'Sun', b: 'Moon', type: 'opp', orb: 1.42 }}
          label="Opposition"
        />
      )
    })
    const pair = textContaining(tree.root, 'Moon')

    expect(ownText(pair)).toContain('Sun')
    expect(styleOf(pair).alignSelf).toBe('stretch')
    expect(styleOf(pair).textAlign).toBe('center')
  })
})
