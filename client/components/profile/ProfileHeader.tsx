import { StyleSheet, View } from 'react-native'

import { AppText, MutedText } from '../ui/AppText'
import { ScreenHeader } from '../ui/ScreenHeader'
import { theme } from '../ui/theme'

type Props = {
  prettyName: string
  email: string | null | undefined
  onBack: () => void
  onEditProfile: () => void
}

export default function ProfileHeader({
  prettyName,
  email,
  onBack,
  onEditProfile,
}: Props) {
  return (
    <>
      <ScreenHeader
        title="My Profile"
        onBack={onBack}
        rightAction={{
          label: 'Edit',
          onPress: onEditProfile,
          accessibilityLabel: 'Edit profile',
        }}
        style={styles.header}
      />

      {/* The identity block, read as one thing rather than three fragments. */}
      <View accessible style={styles.identity}>
        <View style={styles.avatar}>
          <AppText variant="title" style={styles.avatarText}>
            {prettyName.charAt(0).toUpperCase()}
          </AppText>
        </View>

        <View style={styles.identityText}>
          <AppText variant="title" style={styles.name}>
            {prettyName}
          </AppText>
          <MutedText variant="bodySmall" style={styles.email}>
            {email ?? '—'}
          </MutedText>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    marginBottom: theme.space.lg,
  },
  identity: {
    alignItems: 'center',
    columnGap: theme.space.md,
    flexDirection: 'row',
    marginBottom: theme.space.xl,
  },
  avatar: {
    alignItems: 'center',
    backgroundColor: theme.accent.muted,
    borderColor: theme.accent.border,
    borderRadius: 28,
    borderWidth: 1,
    height: 56,
    justifyContent: 'center',
    width: 56,
  },
  avatarText: {
    color: theme.accent.base,
  },
  identityText: {
    flex: 1,
  },
  name: {
    color: theme.text.primary,
  },
  email: {
    color: theme.text.secondary,
    marginTop: theme.space.hair,
  },
})
