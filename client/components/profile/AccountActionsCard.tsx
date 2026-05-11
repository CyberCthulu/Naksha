import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'
import DataPrivacyCard from './DataPrivacyCard'

type Props = {
  onExportData: () => void
  onDeleteAccount: () => void
  onSignOut: () => void
}

export default function AccountActionsCard({
  onExportData,
  onDeleteAccount,
  onSignOut,
}: Props) {
  return (
    <>
      <DataPrivacyCard
        onExportData={onExportData}
        onDeleteAccount={onDeleteAccount}
      />

      <View style={uiStyles.card}>
        <Text style={uiStyles.cardTitle}>Account</Text>
        <TouchableOpacity style={styles.actionRow} onPress={onSignOut}>
          <Text style={[styles.link, { color: theme.colors.danger }]}>
            Sign out
          </Text>
        </TouchableOpacity>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  link: { fontWeight: '700', color: '#007AFF' },
  actionRow: {
    paddingVertical: 8,
  },
})
