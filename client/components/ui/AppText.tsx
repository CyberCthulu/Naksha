// components/ui/AppText.tsx
import React from 'react'
import { Text, StyleSheet, TextProps } from 'react-native'

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
    color: '#fff',
    fontSize: 14,
  },
  muted: {
    color: 'rgba(255,255,255,0.75)',
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
  },
})
