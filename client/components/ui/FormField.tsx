import React from 'react'
import { View, ViewStyle } from 'react-native'
import { AppText } from './AppText'
import { formStyles } from './formStyles'

type Props = {
  label: string
  children: React.ReactNode
  style?: ViewStyle
}

export default function FormField({ label, children, style }: Props) {
  return (
    <View style={[formStyles.section, style]}>
      <AppText style={formStyles.label}>{label}</AppText>
      {children}
    </View>
  )
}