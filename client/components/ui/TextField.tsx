import React from 'react'
import { TextInput, TextInputProps } from 'react-native'
import { theme } from './theme'
import { formStyles } from './formStyles'

export default function TextField(props: TextInputProps) {
  return (
    <TextInput
      {...props}
      placeholderTextColor={theme.colors.muted}
      style={[formStyles.input, props.style]}
    />
  )
}