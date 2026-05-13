import { Text, View } from 'react-native'

import type { PurchaseRow } from '../../lib/domainTypes'
import { uiStyles } from '../ui/uiStyles'

type Props = {
  purchases: PurchaseRow[]
}

export default function PurchasesCard({ purchases }: Props) {
  return (
    <View style={uiStyles.card}>
      <Text style={uiStyles.cardTitle}>Purchases</Text>
      {purchases.length === 0 ? (
        <Text style={uiStyles.muted}>No purchases yet.</Text>
      ) : (
        purchases.map((p) => (
          <View key={p.id} style={{ marginBottom: 6 }}>
            <Text style={[uiStyles.text, { fontWeight: '500' }]}>
              {p.product_type}: {p.product_id}
            </Text>
            <Text style={uiStyles.muted}>
              {p.amount} {p.currency.toUpperCase()} ·{' '}
              {p.purchase_date ? new Date(p.purchase_date).toLocaleString() : '—'}
            </Text>
          </View>
        ))
      )}
    </View>
  )
}
