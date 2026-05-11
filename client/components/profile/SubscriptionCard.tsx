import { StyleSheet, Text, View } from 'react-native'

import type { SubscriptionRow } from '../../lib/domainTypes'
import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'
import InfoRow from './InfoRow'

type Props = {
  subscription: SubscriptionRow | null
}

export default function SubscriptionCard({ subscription }: Props) {
  return (
    <View style={uiStyles.card}>
      <Text style={uiStyles.cardTitle}>Subscription</Text>
      {subscription ? (
        <>
          <InfoRow label="Plan" value={subscription.plan} />
          <InfoRow label="Status" value={subscription.status} />
          <InfoRow label="Started" value={subscription.start_date} />
          <InfoRow label="Ends" value={subscription.end_date ?? '—'} />
          <Text style={styles.cardHint}>
            Manage or upgrade your plan from the billing portal (coming soon).
          </Text>
        </>
      ) : (
        <>
          <Text style={uiStyles.text}>You’re currently on the free plan.</Text>
          <Text style={styles.cardHint}>
            In future versions, you’ll see your premium status and manage your subscription here.
          </Text>
        </>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  cardHint: { marginTop: 6, fontSize: 12, color: theme.colors.muted },
})
