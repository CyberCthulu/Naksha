import { StyleSheet, View } from 'react-native'

import type { PurchaseRow } from '../../lib/domainTypes'
import { AppText, MutedText } from '../ui/AppText'
import { Card } from '../ui/Card'
import { theme } from '../ui/theme'

type Props = {
  purchases: PurchaseRow[]
}

export default function PurchasesCard({ purchases }: Props) {
  return (
    <Card>
      <AppText variant="heading" style={styles.title}>
        Purchases
      </AppText>

      {purchases.length === 0 ? (
        <MutedText variant="body" style={styles.empty}>
          No purchases yet.
        </MutedText>
      ) : (
        purchases.map((p) => (
          <View key={p.id} style={styles.item}>
            <AppText variant="subheading" style={styles.itemTitle}>
              {p.product_type}: {p.product_id}
            </AppText>
            <MutedText variant="bodySmall" style={styles.itemMeta}>
              {p.amount} {p.currency.toUpperCase()}
              {p.purchase_date
                ? ` · ${new Date(p.purchase_date).toLocaleDateString()}`
                : ''}
            </MutedText>
          </View>
        ))
      )}
    </Card>
  )
}

const styles = StyleSheet.create({
  title: {
    color: theme.text.primary,
  },
  empty: {
    color: theme.text.secondary,
    marginTop: theme.space.md,
  },
  item: {
    marginTop: theme.space.md,
  },
  itemTitle: {
    color: theme.text.primary,
  },
  itemMeta: {
    color: theme.text.secondary,
    marginTop: theme.space.hair,
  },
})
