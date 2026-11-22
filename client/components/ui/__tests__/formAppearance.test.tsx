import React from 'react'
import { StyleSheet, Text, TextInput } from 'react-native'
import TestRenderer from 'react-test-renderer'
import { Picker } from '@react-native-picker/picker'

import AuthContainer from '../../auth/AuthContainer'
import DateField from '../../auth/DateField'
import TimeField from '../../auth/TimeField'
import TimeZonePicker from '../../auth/TimeZonePicker'
import FormField from '../FormField'
import TextField from '../TextField'
import { FormAppearanceContext, type FormAppearance } from '../FormAppearance'
import { theme } from '../theme'
import { TIMEZONES } from '../../../lib/timezones'

jest.mock('react-native-safe-area-context', () => ({
  useSafeAreaInsets: () => ({ top: 0, right: 0, bottom: 0, left: 0 }),
}))

jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker')

jest.mock('@react-native-picker/picker', () => {
  const React = require('react')
  const Picker = (props: unknown) => React.createElement('Picker', props)
  Picker.Item = (props: unknown) => React.createElement('PickerItem', props)
  return { Picker }
})

const { act, create } = TestRenderer
let renderer: TestRenderer.ReactTestRenderer | null = null

function render(element: React.ReactElement) {
  act(() => { renderer = create(element) })
  return renderer!
}

function scoped(appearance: FormAppearance, children: React.ReactNode) {
  return (
    <FormAppearanceContext.Provider value={appearance}>
      {children}
    </FormAppearanceContext.Provider>
  )
}

beforeEach(() => {
  ;(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true
})

afterEach(() => {
  if (renderer) act(() => renderer?.unmount())
  renderer = null
})

it('opts in through the container without changing sibling or default fields', () => {
  const screen = render(
    <>
      <TextField testID="outside" />
      <AuthContainer formAppearance="soft">
        <FormField label="Soft label"><TextField testID="soft" /></FormField>
      </AuthContainer>
      <AuthContainer>
        <FormField label="Default label"><TextField testID="default" /></FormField>
      </AuthContainer>
    </>
  )
  const inputStyle = (id: string) => StyleSheet.flatten(
    screen.root.findAllByType(TextInput).find((node) => node.props.testID === id)!.props.style
  )
  expect(inputStyle('soft').backgroundColor).toBe(theme.surface.base)
  expect(inputStyle('outside').backgroundColor).toBe(theme.background.sunken)
  expect(inputStyle('default').backgroundColor).toBe(theme.background.sunken)

  const labelStyle = (label: string) => StyleSheet.flatten(
    screen.root.findAllByType(Text).find((node) => node.props.children === label)!.props.style
  )
  expect(labelStyle('Soft label').color).toBe(theme.text.secondary)
  expect(labelStyle('Default label').color).toBe(theme.text.primary)
})

it('keeps focus, error, disabled semantics and caller callbacks in soft fields', () => {
  const onFocus = jest.fn()
  const onBlur = jest.fn()
  const onChangeText = jest.fn()
  const screen = render(scoped('soft',
    <TextField onFocus={onFocus} onBlur={onBlur} onChangeText={onChangeText} secureTextEntry />
  ))
  const input = () => screen.root.findByType(TextInput)
  const style = () => StyleSheet.flatten(input().props.style)

  act(() => {
    input().props.onFocus({})
    input().props.onChangeText('secret')
  })
  expect(style().borderColor).toBe(theme.border.accent)
  expect(onFocus).toHaveBeenCalledTimes(1)
  expect(onChangeText).toHaveBeenCalledWith('secret')
  expect(input().props.secureTextEntry).toBe(true)

  act(() => input().props.onBlur({}))
  expect(style().borderColor).toBe(theme.border.base)
  expect(onBlur).toHaveBeenCalledTimes(1)

  act(() => screen.update(scoped('soft', <TextField error />)))
  act(() => input().props.onFocus({}))
  expect(style().borderColor).toBe(theme.state.danger)

  act(() => screen.update(scoped('soft', <TextField editable={false} />)))
  expect(input().props.accessibilityState).toEqual({ disabled: true })
  expect(style().color).toBe(theme.text.disabled)
})

it.each<FormAppearance>(['default', 'soft'])(
  'preserves date/time labels, values, touch targets and civil callbacks in %s forms',
  (appearance) => {
    const onDate = jest.fn()
    const onTime = jest.fn()
    const screen = render(scoped(appearance,
      <>
        <DateField label="Birth Date" value={{ year: 2001, month: 2, day: 3 }} onChange={onDate} />
        <TimeField label="Birth Time" value={{ hour: 14, minute: 45 }} onChange={onTime} />
      </>
    ))
    const button = (label: string) => screen.root.findAll((node) =>
      typeof node.props?.onPress === 'function' && node.props?.accessibilityLabel === label
    )[0]
    for (const label of ['Birth Date', 'Birth Time']) {
      expect(button(label).props.accessibilityRole).toBe('button')
      expect(StyleSheet.flatten(button(label).props.style).minHeight).toBe(theme.touchTarget.min)
    }
    expect(button('Birth Date').props.accessibilityValue.text).toBe('2001-02-03')
    expect(button('Birth Time').props.accessibilityValue.text).toBe('2:45 PM')

    act(() => button('Birth Date').props.onPress())
    const datePicker = screen.root.find((node) => String(node.type) === 'DateTimePicker')
    act(() => datePicker.props.onChange({}, new Date(2002, 3, 5, 12)))
    expect(onDate).toHaveBeenCalledWith({ year: 2002, month: 4, day: 5 })

    act(() => button('Birth Time').props.onPress())
    const timePicker = screen.root.find((node) => String(node.type) === 'DateTimePicker')
    act(() => timePicker.props.onChange({}, new Date(2002, 3, 5, 9, 30)))
    expect(onTime).toHaveBeenCalledWith({ hour: 9, minute: 30 })
  }
)

it.each<FormAppearance>(['default', 'soft'])(
  'changes only timezone display labels in %s forms',
  (appearance) => {
    const onChange = jest.fn()
    const screen = render(scoped(appearance,
      <TimeZonePicker value="America/Los_Angeles" onChange={onChange} />
    ))
    const picker = screen.root.findByType(Picker)
    const options = picker.props.children as React.ReactElement<{ value: string; label: string }>[]
    expect(options.map((option) => option.props.value)).toEqual(TIMEZONES)
    expect(options.map((option) => option.key)).toEqual(TIMEZONES)
    expect(picker.props.selectedValue).toBe('America/Los_Angeles')
    expect(picker.props.accessibilityLabel).toBe('Time Zone')
    const label = (zone: string) => options.find((option) => option.props.value === zone)!.props.label
    expect(label('America/Los_Angeles')).toBe(
      appearance === 'soft' ? 'Los Angeles · America' : 'America/Los_Angeles'
    )
    options.filter((option) => option.props.value.startsWith('Etc/')).forEach((option) => {
      expect(option.props.label).toBe(option.props.value)
    })
    act(() => picker.props.onValueChange('Europe/London'))
    expect(onChange).toHaveBeenCalledWith('Europe/London')
  }
)
