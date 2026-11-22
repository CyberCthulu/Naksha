import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  TouchableOpacity,
  StyleSheet,
} from 'react-native'

import { geocodePlace, type GeocodeResult } from '../../lib/geocode'
import FormField from '../ui/FormField'
import TextField from '../ui/TextField'
import { AppText, MutedText } from '../ui/AppText'
import { CelestialLoader } from '../ui/CelestialLoader'
import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'
import { useFormAppearance } from '../ui/FormAppearance'

type Props = {
  label?: string
  value: string
  onChange: (value: string) => void
  onSelectLocation?: (result: GeocodeResult) => void
  placeholder?: string
}

function formatCoords(lat: unknown, lon: unknown): string | null {
  if (typeof lat !== 'number' || typeof lon !== 'number') return null
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null
  return `${lat.toFixed(4)}, ${lon.toFixed(4)}`
}

export default function LocationAutocompleteField({
  label = 'Birth Location',
  value,
  onChange,
  onSelectLocation,
  placeholder,
}: Props) {
  const soft = useFormAppearance() === 'soft'
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const requestIdRef = useRef(0)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    const requestId = ++requestIdRef.current
    const trimmed = query.trim()
    let controller: AbortController | null = null

    setResults([])
    setLoading(false)

    if (trimmed.length < 3) {
      setError(null)
      setShowResults(false)
      return
    }

    const debounce = setTimeout(async () => {
      controller = new AbortController()
      setLoading(true)
      setError(null)

      try {
        const next = await geocodePlace(trimmed, {
          signal: controller.signal,
        })

        if (requestId !== requestIdRef.current) return

        setResults(next)
        setShowResults(true)
      } catch {
        if (controller.signal.aborted || requestId !== requestIdRef.current) return
        setResults([])
        setError('Could not load location suggestions. Please try again.')
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }, 400)

    return () => {
      clearTimeout(debounce)
      controller?.abort()
      if (requestId === requestIdRef.current) {
        requestIdRef.current += 1
      }
    }
  }, [query])

  const handleChangeText = (text: string) => {
    setQuery(text)
    onChange(text)
    setShowResults(true)
  }

  const handleSelect = (item: GeocodeResult) => {
    setQuery(item.name)
    onChange(item.name)
    onSelectLocation?.(item)
    setResults([])
    setShowResults(false)
  }

  return (
    <FormField label={label}>
      <TextField
        value={query}
        onChangeText={handleChangeText}
        placeholder={
          placeholder ?? (soft ? 'Search city or birthplace' : 'City, State/Country')
        }
        autoCorrect={false}
        autoCapitalize="words"
      />

      {loading && (
        <View
          style={styles.loadingRow}
          accessible
          accessibilityRole="progressbar"
          accessibilityLabel="Searching locations…"
          accessibilityState={{ busy: true }}
        >
          <CelestialLoader size={20} color={theme.accent.base} />
          <MutedText variant="bodySmall" style={styles.loadingText}>
            Searching locations…
          </MutedText>
        </View>
      )}

      {!!error && (
        <AppText variant="bodySmall" style={[uiStyles.errorText, styles.errorText]}>
          {error}
        </AppText>
      )}

      {showResults && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((item, index) => {
            const coords = formatCoords(item.lat, item.lon)

            return (
              <TouchableOpacity
                key={`${item.name}-${item.lat}-${item.lon}-${index}`}
                onPress={() => handleSelect(item)}
                style={[
                  styles.resultRow,
                  index < results.length - 1 && styles.resultDivider,
                ]}
              >
                <AppText variant="body">{item.name}</AppText>
                {!!coords && !soft && (
                  <MutedText variant="caption" style={styles.resultCoords}>
                    {coords}
                  </MutedText>
                )}
              </TouchableOpacity>
            )
          })}
        </View>
      )}
    </FormField>
  )
}

const styles = StyleSheet.create({
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  loadingText: {
    marginLeft: 8,
  },
  errorText: {
    marginTop: 8,
    marginBottom: 0,
    textAlign: 'left',
  },
  dropdown: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: theme.border.strong,
    borderRadius: theme.radius.sm,
    backgroundColor: theme.surface.raised,
    overflow: 'hidden',
  },
  resultRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  resultDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.border.base,
  },
  resultCoords: {
    marginTop: 4,
  },
})
