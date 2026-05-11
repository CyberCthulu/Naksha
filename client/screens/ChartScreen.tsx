//screens/ChartScreen.tsx
import React, { useLayoutEffect } from 'react'
import { View, Text, Button } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { ParamListBase } from '@react-navigation/native'

import type { ChartData } from '../lib/charts'
import { normalizeZone } from '../lib/timezones'
import type { ChartRouteParams } from '../lib/domainTypes'
import ChartScreenContent from '../components/charts/ChartScreenContent'

// shared UI
import { uiStyles } from '../components/ui/uiStyles'

type ChartScreenProps = NativeStackScreenProps<ParamListBase, 'Chart'>

export default function ChartScreen({ route }: ChartScreenProps) {
  const navigation = useNavigation<any>()

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false })
  }, [navigation])

  const params = route.params as ChartRouteParams<ChartData> | null | undefined
  const profile = params?.profile
  const chartMode = params?.chartMode === 'guest' ? 'guest' : 'self'
  const fromSaved = params?.fromSaved
  const saved = params?.saved

  if (!profile?.birth_date || !profile?.birth_time || !profile?.time_zone) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.h1}>Natal Chart</Text>
        <Text style={uiStyles.muted}>
          Missing birth date, time, or time zone. Please complete your profile.
        </Text>
        <View style={{ marginTop: 16 }}>
          <Button
            title="Back to Dashboard"
            onPress={() => navigation.navigate('Dashboard')}
          />
        </View>
      </View>
    )
  }

  const tz = normalizeZone(profile.time_zone)

  if (!tz) {
    return (
      <View style={uiStyles.center}>
        <Text style={uiStyles.h1}>Natal Chart</Text>
        <Text style={uiStyles.muted}>
          Your saved time zone isn’t valid. Update it in “Complete Profile”.
        </Text>
        <Text style={uiStyles.muted}>Current: {String(profile.time_zone)}</Text>
      </View>
    )
  }

  return (
    <ChartScreenContent
      profile={profile}
      chartMode={chartMode}
      fromSaved={fromSaved}
      saved={saved}
      tz={tz}
    />
  )
}
