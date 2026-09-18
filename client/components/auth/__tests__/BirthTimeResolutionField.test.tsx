import React from 'react'
import { Text } from 'react-native'
import TestRenderer from 'react-test-renderer'

import BirthTimeResolutionField from '../BirthTimeResolutionField'

const { act, create } = TestRenderer

function textValue(value: unknown): string {
  if (Array.isArray(value)) return value.map(textValue).join('')
  if (value == null || typeof value === 'boolean') return ''
  return String(value)
}

describe('BirthTimeResolutionField', () => {
  beforeEach(() => {
    ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
  })

  it('shows a factual validation message for a nonexistent local time', () => {
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = create(
        <BirthTimeResolutionField
          birthDate={{ year: 2025, month: 3, day: 9 }}
          birthTime={{ hour: 2, minute: 30 }}
          timeZone="America/Los_Angeles"
          selectedOffsetMinutes={null}
          onSelectOffsetMinutes={jest.fn()}
        />
      )
    })

    const text = renderer!.root
      .findAllByType(Text)
      .map((node) => textValue(node.props.children))
      .join(' ')

    expect(text).toContain('did not exist')
    expect(text).toContain('Choose a valid time')
  })

  it('offers both fold occurrences with offsets and announces selection', () => {
    const onSelect = jest.fn()
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = create(
        <BirthTimeResolutionField
          birthDate={{ year: 2025, month: 11, day: 2 }}
          birthTime={{ hour: 1, minute: 30 }}
          timeZone="America/Los_Angeles"
          selectedOffsetMinutes={-480}
          onSelectOffsetMinutes={onSelect}
        />
      )
    })

    const radio = (label: string) =>
      renderer!.root.findAll(
        (node) =>
          node.props.accessibilityRole === 'radio' &&
          node.props.accessibilityLabel === label &&
          typeof node.props.onPress === 'function'
      )[0]
    const earlier = radio('Earlier occurrence — UTC−07:00')
    const later = radio('Later occurrence — UTC−08:00')

    expect(earlier).toBeDefined()
    expect(later).toBeDefined()
    expect(earlier.props.accessibilityState.selected).toBe(false)
    expect(later.props.accessibilityState.selected).toBe(true)

    act(() => earlier.props.onPress())
    expect(onSelect).toHaveBeenCalledWith(-420)
  })

  it('renders no warning or choice for an ordinary local time', () => {
    let renderer: TestRenderer.ReactTestRenderer
    act(() => {
      renderer = create(
        <BirthTimeResolutionField
          birthDate={{ year: 1997, month: 9, day: 15 }}
          birthTime={{ hour: 13, minute: 55 }}
          timeZone="America/Los_Angeles"
          selectedOffsetMinutes={null}
          onSelectOffsetMinutes={jest.fn()}
        />
      )
    })

    expect(renderer!.toJSON()).toBeNull()
  })
})
