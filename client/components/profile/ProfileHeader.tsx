import { StyleSheet, Text, View } from 'react-native'

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

      <View style={styles.headerRow}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {prettyName.charAt(0).toUpperCase()}
          </Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.name}>{prettyName}</Text>
          <Text style={styles.email}>{email ?? '—'}</Text>
        </View>
      </View>
    </>
  )
}

const styles = StyleSheet.create({
  header: {
    marginBottom: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderWidth: 1,
    borderColor: theme.colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: { color: theme.colors.text, fontSize: 22, fontWeight: '700' },
  name: { fontSize: 20, fontWeight: '700', color: theme.colors.text },
  email: { color: theme.colors.sub, marginTop: 2 },
})
