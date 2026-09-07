import { StyleSheet } from 'react-native'

import { AppText } from '../ui/AppText'
import { Button } from '../ui/Button'
import { Card } from '../ui/Card'
import { theme } from '../ui/theme'
import DataPrivacyCard from './DataPrivacyCard'

type Props = {
  onExportData: () => void
  onDeleteAccount: () => void
  onSignOut: () => void
  deletingAccount?: boolean
}

export default function AccountActionsCard({
  onExportData,
  onDeleteAccount,
  onSignOut,
  deletingAccount = false,
}: Props) {
  return (
    <>
      <DataPrivacyCard
        onExportData={onExportData}
        onDeleteAccount={onDeleteAccount}
        deletingAccount={deletingAccount}
      />

      <Card>
        <AppText variant="heading" style={styles.title}>
          Account
        </AppText>

        {/*
          Tertiary, not destructive. Signing out is reversible -- it is a door,
          not a demolition -- and giving it the same weight as account deletion
          two cards above would blunt the one that matters.
        */}
        <Button
          title="Sign out"
          variant="tertiary"
          onPress={onSignOut}
          style={styles.action}
        />
      </Card>
    </>
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
