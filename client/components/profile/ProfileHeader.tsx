import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

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
      <View style={styles.topRow}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Text style={styles.backText}>‹</Text>
        </TouchableOpacity>

        <Text style={styles.screenTitle}>My Profile</Text>

        <TouchableOpacity onPress={onEditProfile} style={styles.editBtn}>
          <Text style={styles.link}>Edit</Text>
        </TouchableOpacity>
      </View>

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
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  backBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  backText: {
    color: theme.colors.text,
    fontSize: 28,
    lineHeight: 28,
    marginTop: -2,
  },
  screenTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '700',
  },
  editBtn: { width: 60, alignItems: 'flex-end' },
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
  link: { fontWeight: '700', color: '#007AFF' },
})
