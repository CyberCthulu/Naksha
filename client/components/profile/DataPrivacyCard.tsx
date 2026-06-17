import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'

type Props = {
  onExportData: () => void
  onDeleteAccount: () => void
  deletingAccount?: boolean
}

export default function DataPrivacyCard({
  onExportData,
  onDeleteAccount,
  deletingAccount = false,
}: Props) {
  return (
    <View style={uiStyles.card}>
      <Text style={uiStyles.cardTitle}>Data & Privacy</Text>
      <TouchableOpacity style={styles.actionRow} onPress={onExportData}>
        <Text style={styles.link}>Export my data</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.actionRow}
        onPress={onDeleteAccount}
        disabled={deletingAccount}
      >
        <Text style={[styles.link, { color: theme.colors.danger }]}>
          {deletingAccount ? 'Deleting account…' : 'Delete account'}
        </Text>
      </TouchableOpacity>
    </View>
  )
}

const styles = StyleSheet.create({
  link: { fontWeight: '700', color: '#007AFF' },
  actionRow: {
    paddingVertical: 8,
  },
})
