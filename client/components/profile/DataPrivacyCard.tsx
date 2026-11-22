import { StyleSheet } from 'react-native'

import { AppText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { theme } from '../ui/theme'

type Props = {
  onDeleteAccount: () => void
  deletingAccount?: boolean
}

/**
 * Data and privacy actions.
 *
 * Account deletion remains a destructive button with confirmation. Data export
 * stays hidden until a real export or monitored request destination exists.
 */
export default function DataPrivacyCard({
  onDeleteAccount,
  deletingAccount = false,
}: Props) {
  return (
    <Card>
      <AppText variant="heading" style={styles.title}>
        Data &amp; Privacy
      </AppText>

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
