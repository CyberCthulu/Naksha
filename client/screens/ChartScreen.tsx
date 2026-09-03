//screens/ChartScreen.tsx
import React, { useLayoutEffect } from 'react'
import type { NativeStackScreenProps } from '@react-navigation/native-stack'

import { normalizeZone } from '../lib/timezones'
import ChartScreenContent from '../components/charts/ChartScreenContent'
import type { RootStackParamList } from '../navigation/types'

import { ErrorState } from '../components/ui/ErrorState'

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
      <ErrorState
        testID="chart-missing-birth-data"
        title="Natal Chart"
        description="Missing birth date, time, or time zone. Please complete your profile."
        action={{
          label: 'Back to Dashboard',
          onPress: () => navigation.navigate('Dashboard'),
        }}
      />
    )
  }

  const tz = normalizeZone(profile.time_zone)

  if (!tz) {
    return (
      <ErrorState
        testID="chart-invalid-time-zone"
        title="Natal Chart"
        description={`Your saved time zone isn’t valid. Update it in “Complete Profile”. Current: ${String(
          profile.time_zone
        )}`}
        action={{
          label: 'Complete Profile',
          onPress: () => navigation.navigate('CompleteProfile'),
        }}
        secondaryAction={{
          label: 'Back to Dashboard',
          onPress: () => navigation.navigate('Dashboard'),
        }}
      />
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
