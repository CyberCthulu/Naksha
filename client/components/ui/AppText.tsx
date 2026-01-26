// components/ui/AppText.tsx
import React from 'react'
import { Text, StyleSheet, TextProps } from 'react-native'
import { theme } from './theme'

export function AppText(props: TextProps) {
  return <Text {...props} style={[styles.text, props.style]} />
}

export function MutedText(props: TextProps) {
  return <Text {...props} style={[styles.muted, props.style]} />
}

export function TitleText(props: TextProps) {
  return <Text {...props} style={[styles.title, props.style]} />
}

const styles = StyleSheet.create({
  text: {
    color: theme.colors.text,
    fontSize: 14,
  },
  muted: {
    color: theme.colors.muted,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '600',
  },
})
