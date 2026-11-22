import { StyleSheet } from 'react-native'

import type { UserRow } from '../../lib/domainTypes'
import { formatBirthDate } from '../../lib/time'
import { AppText, MutedText } from '../ui/AppText'
import { Card } from '../ui/Card'
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
    <Card>
      <AppText variant="heading" style={styles.title}>
        Birth Details
      </AppText>

      {/*
        Coordinates are gone from the presentation, not from the record. They
        are still stored and still drive every calculation; three decimal
        places of latitude simply tell a reader nothing their birth place does
        not. The time zone stays, as secondary birth information: it is the
        one field here that changes what the chart computes.
      */}
      <InfoRow
        label="Date"
        value={formatBirthDate(userProfile?.birth_date) ?? '—'}
      />
      <InfoRow label="Time" value={prettyBirthTime} />
      <InfoRow label="Location" value={userProfile?.birth_location ?? '—'} />
      <InfoRow label="Time zone" value={userProfile?.time_zone ?? '—'} />

      <MutedText variant="caption" style={styles.hint}>
        Edit these details in “Complete Profile” to update your natal chart.
      </MutedText>
    </Card>
  )
}

const styles = StyleSheet.create({
  title: {
    color: theme.text.primary,
  },
  hint: {
    color: theme.text.tertiary,
    marginTop: theme.space.lg,
  },
})
