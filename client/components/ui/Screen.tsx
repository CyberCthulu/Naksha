// components/ui/Screen.tsx
import React from 'react'
import { View, StyleSheet } from 'react-native'

export function Screen({ children }: { children: React.ReactNode }) {
  return <View style={styles.screen}>{children}</View>
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    padding: 20,
    paddingTop: 40,
  },
})
