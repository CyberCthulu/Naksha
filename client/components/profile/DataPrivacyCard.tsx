import { StyleSheet } from 'react-native'

import { AppText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { theme } from '../ui/theme'

type Props = {
  onExportData: () => void
  onDeleteAccount: () => void
  deletingAccount?: boolean
}

/**
 * Data and privacy actions.
 *
 * Both used to be bold blue text at roughly a 34dp target -- account deletion,
 * the one irreversible action in the app, styled as a hyperlink. They are
 * buttons now, and deletion carries the destructive variant so its weight
 * matches what it does. The confirmation behind it is unchanged.
 */
export default function DataPrivacyCard({
  onExportData,
  onDeleteAccount,
  deletingAccount = false,
}: Props) {
  return (
    <Card>
      <AppText variant="heading" style={styles.title}>
        Data &amp; Privacy
      </AppText>

      <Button
        title="Export my data"
        variant="tertiary"
        onPress={onExportData}
        style={styles.action}
      />

      <Button
        title={deletingAccount ? 'Deleting account…' : 'Delete account'}
        variant="destructive"
        onPress={onDeleteAccount}
        disabled={deletingAccount}
        loading={deletingAccount}
        style={styles.action}
      />
    </Card>
  )
}

const styles = StyleSheet.create({
  title: {
    color: theme.text.primary,
    marginBottom: theme.space.sm,
  },
  action: {
    marginTop: theme.space.sm,
  },
})
