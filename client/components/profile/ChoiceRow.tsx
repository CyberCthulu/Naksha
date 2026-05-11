import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'

type Props = {
  label: string
  note?: string
  selected: boolean
  onPress?: () => void
  disabled?: boolean
}

export default function ChoiceRow({
  label,
  note,
  selected,
  onPress,
  disabled = false,
}: Props) {
  return (
    <TouchableOpacity
      style={[styles.choiceRow, disabled && styles.choiceRowDisabled]}
      onPress={onPress}
      disabled={disabled}
    >
      <View style={[styles.choiceDot, selected && styles.choiceDotSelected]} />
      <View style={{ flex: 1 }}>
        <Text style={[uiStyles.text, disabled && styles.disabledText]}>
          {label}
        </Text>
        {note ? <Text style={styles.choiceHint}>{note}</Text> : null}
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  choiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
  },
  choiceRowDisabled: {
    opacity: 0.65,
  },
  choiceDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 10,
  },
  choiceDotSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  choiceHint: {
    fontSize: 12,
    color: theme.colors.muted,
    marginTop: 1,
  },
  disabledText: {
    color: theme.colors.muted,
  },
})
