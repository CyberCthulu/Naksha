import { StyleSheet, Text, View } from 'react-native'

import { theme } from '../ui/theme'

type Props = {
  label: string
  value: string
}

export default function InfoRow({ label, value }: Props) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
    gap: 12,
  },
  rowLabel: { color: theme.colors.muted, flexShrink: 0, width: 110 },
  rowValue: {
    color: theme.colors.text,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
})
