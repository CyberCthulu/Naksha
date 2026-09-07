import { StyleSheet } from 'react-native'

import type { SubscriptionRow } from '../../lib/domainTypes'
import { AppText, MutedText } from '../ui/AppText'
import { Card } from '../ui/Card'
import { theme } from '../ui/theme'
import InfoRow from './InfoRow'

type Props = {
  subscription: SubscriptionRow | null
}

export default function SubscriptionCard({ subscription }: Props) {
  return (
    <Card>
      <AppText variant="heading" style={styles.title}>
        Subscription
      </AppText>

      {subscription ? (
        <>
          <InfoRow label="Plan" value={subscription.plan} />
          <InfoRow label="Status" value={subscription.status} />
          <InfoRow label="Started" value={subscription.start_date} />
          <InfoRow label="Ends" value={subscription.end_date ?? '—'} />
          <MutedText variant="caption" style={styles.hint}>
            Manage or upgrade your plan from the billing portal (coming soon).
          </MutedText>
        </>
      ) : (
        <>
          <AppText variant="body" style={styles.body}>
            You’re currently on the free plan.
          </AppText>
          <MutedText variant="caption" style={styles.hint}>
            In future versions, you’ll see your premium status and manage your
            subscription here.
          </MutedText>
        </>
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  title: {
    color: theme.text.primary,
  },
  body: {
    color: theme.text.primary,
    marginTop: theme.space.md,
  },
  hint: {
    color: theme.text.tertiary,
    marginTop: theme.space.lg,
  },
})
