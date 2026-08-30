//screens/ChartScreen.tsx
import React, { useLayoutEffect } from 'react'
import { View, Text, Button } from 'react-native'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { normalizeZone } from '../lib/timezones'
import ChartScreenContent from '../components/charts/ChartScreenContent'
import type { RootStackParamList } from '../navigation/types'

// shared UI
import { uiStyles } from '../components/ui/uiStyles'

type ChartScreenProps = NativeStackScreenProps<RootStackParamList, 'Chart'>

export default function ChartScreen({ navigation, route }: ChartScreenProps) {

  useLayoutEffect(() => {
    navigation.setOptions({ headerShown: false })
  }, [navigation])

  const params: RootStackParamList['Chart'] | null | undefined = route.params
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
