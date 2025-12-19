// components/ChartCompass.tsx
import React, { useMemo, useState } from 'react'
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  Modal,
  Pressable,
  ScrollView,
  TouchableOpacity,
} from 'react-native'
import { theme } from './ui/theme'
import { uiStyles } from './ui/uiStyles'

export const PLANET_GLYPH: Record<string, string> = {
  Sun: '☉',
  Moon: '☽',
  Mercury: '☿',
  Venus: '♀',
  Mars: '♂',
  Jupiter: '♃',
  Saturn: '♄',
  Uranus: '♅',
  Neptune: '♆',
  Pluto: '♇',
}

export const SIGN_INFO = [
  { abbr: 'Ar', name: 'Aries', glyph: '♈︎' },
  { abbr: 'Ta', name: 'Taurus', glyph: '♉︎' },
  { abbr: 'Ge', name: 'Gemini', glyph: '♊︎' },
  { abbr: 'Cn', name: 'Cancer', glyph: '♋︎' },
  { abbr: 'Le', name: 'Leo', glyph: '♌︎' },
  { abbr: 'Vi', name: 'Virgo', glyph: '♍︎' },
  { abbr: 'Li', name: 'Libra', glyph: '♎︎' },
  { abbr: 'Sc', name: 'Scorpio', glyph: '♏︎' },
  { abbr: 'Sg', name: 'Sagittarius', glyph: '♐︎' },
  { abbr: 'Cp', name: 'Capricorn', glyph: '♑︎' },
  { abbr: 'Aq', name: 'Aquarius', glyph: '♒︎' },
  { abbr: 'Pi', name: 'Pisces', glyph: '♓︎' },
] as const

type Props = {
  style?: ViewStyle
  /** optional label for the collapsed trigger */
  triggerLabel?: string
}

type AspectVariant = 'conj' | 'opp' | 'square' | 'trine' | 'sextile'
type LegendLineProps = { label: string; variant?: AspectVariant }

export default function ChartCompass({ style, triggerLabel = 'Glyph Compass' }: Props) {
  const [open, setOpen] = useState(false)

  // Tiny summary string so the collapsed card feels useful
  const summary = useMemo(() => {
    return 'Tap to view planets, signs, and aspect line styles.'
  }, [])

  return (
    <View style={style}>
      {/* Collapsed trigger card */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => setOpen(true)} style={styles.triggerCard}>
        <Text style={styles.triggerTitle}>{triggerLabel}</Text>
        <Text style={styles.triggerSub}>{summary}</Text>
      </TouchableOpacity>

      {/* Popup modal */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        {/* Backdrop */}
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />

        {/* Sheet */}
        <View style={styles.sheetWrap}>
          <View style={styles.sheet}>
            <View style={styles.sheetHeader}>
              <Text style={styles.title}>Glyph Compass</Text>
              <TouchableOpacity onPress={() => setOpen(false)} style={styles.closeBtn}>
                <Text style={styles.closeText}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView
              style={{ maxHeight: 520 }}
              contentContainerStyle={{ paddingBottom: 14 }}
              showsVerticalScrollIndicator={false}
            >
              {/* Planets */}
              <Text style={styles.section}>Planets</Text>
              <View style={styles.grid2}>
                {Object.entries(PLANET_GLYPH).map(([name, glyph]) => (
                  <View key={name} style={styles.row}>
                    <Text style={styles.glyph}>{glyph}</Text>
                    <Text style={styles.label}>{name}</Text>
                  </View>
                ))}
              </View>

              {/* Signs */}
              <Text style={styles.section}>Signs</Text>
              <View style={styles.grid2}>
                {SIGN_INFO.map((s) => (
                  <View key={s.abbr} style={styles.row}>
                    <Text style={styles.glyph}>{s.glyph}</Text>
                    <Text style={styles.label}>{`${s.abbr} · ${s.name}`}</Text>
                  </View>
                ))}
              </View>

              {/* Aspects */}
              <Text style={styles.section}>Aspects</Text>
              <View style={styles.grid2}>
                <LegendLine label="Conjunction · 0°" variant="conj" />
                <LegendLine label="Opposition · 180°" variant="opp" />
                <LegendLine label="Square · 90°" variant="square" />
                <LegendLine label="Trine · 120°" variant="trine" />
                <LegendLine label="Sextile · 60°" variant="sextile" />
              </View>

              <Text style={styles.hint}>
                Tip: Trines are thicker, sextiles are dashed.
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  )
}

function LegendLine({ label, variant = 'conj' }: LegendLineProps) {
  const lineStyle =
    variant === 'sextile'
      ? [styles.line, { borderStyle: 'dashed' as const }]
      : variant === 'trine'
      ? [styles.line, { borderBottomWidth: 2 }]
      : variant === 'square'
      ? [styles.line, { borderBottomWidth: 1.5 }]
      : variant === 'opp'
      ? [styles.line, { opacity: 0.85 }]
      : [styles.line]

  return (
    <View style={styles.row}>
      <View style={lineStyle} />
      <Text style={styles.label}>{label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  // collapsed trigger
  triggerCard: {
    ...uiStyles.card,
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  triggerTitle: {
    color: theme.colors.text,
    fontSize: 15,
    fontWeight: '800',
    textAlign: 'center',
  },
  triggerSub: {
    marginTop: 4,
    color: theme.colors.sub,
    fontSize: 12,
    textAlign: 'center',
  },

  // modal
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheetWrap: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  sheet: {
    borderWidth: 1,
    borderColor: theme.colors.border,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.92)',
    paddingHorizontal: 12,
    paddingTop: 12,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '800',
    textAlign: 'center',
  },
  closeBtn: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.text,
    fontSize: 18,
    fontWeight: '800',
  },

  section: {
    marginTop: 10,
    marginBottom: 6,
    color: theme.colors.sub,
    fontWeight: '800',
  },

  grid2: { flexDirection: 'row', flexWrap: 'wrap' },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '50%',
    paddingVertical: 4,
    paddingRight: 12,
    minWidth: 0,
  },

  glyph: {
    color: theme.colors.text,
    fontSize: 16,
    width: 26,
    textAlign: 'center',
    marginRight: 6,
  },

  label: {
    color: theme.colors.text,
    fontSize: 14,
    flex: 1,
    flexShrink: 1,
    minWidth: 0,
  },

  line: {
    width: 24,
    height: 0,
    borderBottomWidth: 1.2,
    borderColor: 'rgba(255,255,255,0.55)',
    marginRight: 8,
  },

  hint: {
    marginTop: 10,
    color: theme.colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
})
