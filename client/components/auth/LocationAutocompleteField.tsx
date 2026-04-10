import React, { useEffect, useRef, useState } from 'react'
import {
  View,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
} from 'react-native'

import { geocodePlace, type GeocodeResult } from '../../lib/geocode'
import FormField from '../ui/FormField'
import TextField from '../ui/TextField'
import { AppText, MutedText } from '../ui/AppText'
import { uiStyles } from '../ui/uiStyles'
import { theme } from '../ui/theme'

type Props = {
  label?: string
  value: string
  onChange: (value: string) => void
  onSelectLocation?: (result: GeocodeResult) => void
  placeholder?: string
}

export default function LocationAutocompleteField({
  label = 'Birth Location',
  value,
  onChange,
  onSelectLocation,
  placeholder = 'City, State/Country',
}: Props) {
  const [query, setQuery] = useState(value)
  const [results, setResults] = useState<GeocodeResult[]>([])
  const [loading, setLoading] = useState(false)
  const [showResults, setShowResults] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const requestIdRef = useRef(0)

  useEffect(() => {
    setQuery(value)
  }, [value])

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = query.trim()

    if (trimmed.length < 3) {
      setResults([])
      setLoading(false)
      setError(null)
      return
    }

    debounceRef.current = setTimeout(async () => {
      const requestId = ++requestIdRef.current
      setLoading(true)
      setError(null)

      try {
        const next = await geocodePlace(trimmed)

        if (requestId !== requestIdRef.current) return

        setResults(next)
        setShowResults(true)
      } catch (e: unknown) {
        if (requestId !== requestIdRef.current) return
        setResults([])
        setError('Could not load location suggestions.')
      } finally {
        if (requestId === requestIdRef.current) {
          setLoading(false)
        }
      }
    }, 400)

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current)
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
        placeholder={placeholder}
        autoCorrect={false}
        autoCapitalize="words"
      />

      {loading && (
        <View style={styles.loadingRow}>
          <ActivityIndicator size="small" />
          <MutedText style={styles.loadingText}>Searching locations…</MutedText>
        </View>
      )}

      {!!error && (
        <AppText style={[uiStyles.errorText, styles.errorText]}>{error}</AppText>
      )}

      {showResults && results.length > 0 && (
        <View style={styles.dropdown}>
          {results.map((item, index) => (
            <TouchableOpacity
              key={`${item.name}-${item.lat}-${item.lon}-${index}`}
              onPress={() => handleSelect(item)}
              style={[
                styles.resultRow,
                index < results.length - 1 && styles.resultDivider,
              ]}
            >
              <AppText style={styles.resultTitle}>{item.name}</AppText>
              <MutedText style={styles.resultCoords}>
                {item.lat.toFixed(4)}, {item.lon.toFixed(4)}
              </MutedText>
            </TouchableOpacity>
          ))}
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
    borderColor: theme.colors.border,
    borderRadius: theme.radius.card,
    backgroundColor: theme.colors.cardBg,
    overflow: 'hidden',
  },
  resultRow: {
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  resultDivider: {
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  resultTitle: {
    color: theme.colors.text,
    fontSize: 14,
  },
  resultCoords: {
    marginTop: 4,
    fontSize: 12,
  },
})