import React, { useEffect, useLayoutEffect, useState } from 'react'
import { Alert, StyleSheet, View } from 'react-native'
import { useNavigation } from '@react-navigation/native'

import AuthContainer from '../components/auth/AuthContainer'
import DateField from '../components/auth/DateField'
import LocationAutocompleteField from '../components/auth/LocationAutocompleteField'
import TimeField from '../components/auth/TimeField'
import TimeZonePicker from '../components/auth/TimeZonePicker'
import { AppText, MutedText, TitleText } from '../components/ui/AppText'
import { Button } from '../components/ui/Button'
import FormField from '../components/ui/FormField'
import TextField from '../components/ui/TextField'
import { uiStyles } from '../components/ui/uiStyles'
import { formatDateForDb, formatTimeForDb } from '../lib/time'
import { getDeviceTimeZoneNormalized, normalizeZone } from '../lib/timezones'
import type { ChartProfile, ChartRouteParams } from '../lib/domainTypes'

export default function CreateGuestChartScreen() {
  const navigation = useNavigation<any>()

  useLayoutEffect(() => {
    navigation.setOptions?.({ headerShown: false })
  }, [navigation])

  const [name, setName] = useState('')
  const [birthDate, setBirthDate] = useState<Date | null>(null)
  const [birthTime, setBirthTime] = useState<Date | null>(null)
  const [birthLocation, setBirthLocation] = useState('')
  const [timeZone, setTimeZone] = useState('Etc/UTC')
  const [birthLat, setBirthLat] = useState<number | null>(null)
  const [birthLon, setBirthLon] = useState<number | null>(null)

  useEffect(() => {
    setTimeZone(getDeviceTimeZoneNormalized())
  }, [])

  const onCreateChart = () => {
    if (
      !name.trim() ||
      !birthDate ||
      !birthTime ||
      !birthLocation.trim()
    ) {
      Alert.alert('Missing info', 'Please complete all required fields.')
      return
    }

    const normalizedZone = normalizeZone(timeZone)
    if (!normalizedZone) {
      Alert.alert('Invalid Time Zone', 'Please pick a valid time zone.')
      return
    }

    const profile: ChartProfile = {
      first_name: name.trim(),
      last_name: null,
      birth_date: formatDateForDb(birthDate),
      birth_time: formatTimeForDb(birthTime),
      birth_location: birthLocation.trim(),
      time_zone: normalizedZone,
      birth_lat: birthLat,
      birth_lon: birthLon,
    }

    const params: ChartRouteParams = {
      profile,
      chartMode: 'guest',
    }

    navigation.navigate('Chart', params)
  }

  return (
    <AuthContainer>
      <TitleText>Create Guest Chart</TitleText>
      <MutedText style={styles.subtitle}>
        Enter another person{"'"}s birth details to view their chart.
      </MutedText>

      <FormField label="Name">
        <TextField
          value={name}
          onChangeText={setName}
          placeholder="Name"
          autoCapitalize="words"
        />
      </FormField>

      <DateField
        label="Birth Date"
        value={birthDate}
        onChange={setBirthDate}
      />

      <TimeField
        label="Birth Time"
        value={birthTime}
        onChange={setBirthTime}
      />

      <LocationAutocompleteField
        value={birthLocation}
        onChange={(next) => {
          setBirthLocation(next)
          setBirthLat(null)
          setBirthLon(null)
        }}
        onSelectLocation={(result) => {
          setBirthLocation(result.name)
          setBirthLat(result.lat)
          setBirthLon(result.lon)

          const normalized = normalizeZone(result.timeZone)
          if (normalized) setTimeZone(normalized)
        }}
      />

      {birthLat != null && birthLon != null && (
        <AppText style={[uiStyles.muted, styles.resolvedText]}>
          Resolved: {birthLocation} ({birthLat.toFixed(4)}, {birthLon.toFixed(4)})
        </AppText>
      )}

      <TimeZonePicker value={timeZone} onChange={setTimeZone} />

      <View style={styles.actions}>
        <Button title="Create Chart" onPress={onCreateChart} />
        <Button
          title="Cancel"
          variant="ghost"
          onPress={() => navigation.goBack()}
          style={styles.cancelButton}
        />
      </View>
    </AuthContainer>
  )
}

const styles = StyleSheet.create({
  subtitle: {
    marginTop: 6,
    marginBottom: 18,
  },
  resolvedText: {
    marginBottom: 16,
  },
  actions: {
    marginTop: 18,
  },
  cancelButton: {
    marginTop: 10,
  },
})
