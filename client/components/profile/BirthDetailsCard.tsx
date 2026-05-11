import { StyleSheet, Text, View } from 'react-native'

import type { UserRow } from '../../lib/domainTypes'
import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'
import InfoRow from './InfoRow'

type Props = {
  userProfile: UserRow | null
  prettyBirthTime: string
}

export default function BirthDetailsCard({
  userProfile,
  prettyBirthTime,
}: Props) {
  return (
    <View style={uiStyles.card}>
      <Text style={uiStyles.cardTitle}>Birth Details</Text>
      <InfoRow label="Date" value={userProfile?.birth_date ?? '—'} />
      <InfoRow label="Time" value={prettyBirthTime} />
      <InfoRow label="Location" value={userProfile?.birth_location ?? '—'} />
      <InfoRow label="Time Zone" value={userProfile?.time_zone ?? '—'} />
      {userProfile?.birth_lat != null && userProfile?.birth_lon != null && (
        <InfoRow
          label="Coordinates"
          value={`${userProfile.birth_lat.toFixed(3)}, ${userProfile.birth_lon.toFixed(3)}`}
        />
      )}
      <Text style={styles.cardHint}>
        Edit these details in “Complete Profile” to update your natal chart.
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  cardHint: { marginTop: 6, fontSize: 12, color: theme.colors.muted },
})
