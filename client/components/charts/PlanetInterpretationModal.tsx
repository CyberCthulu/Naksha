//components/charts/PlanetInterpretationModal.tsx
import React from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native'
import { theme } from '../ui/theme'
import InterpretationCard from './InterpretationCard'
import { Interpretation } from '../../lib/lexicon'

type Block = {
  title?: string
  interpretation?: Interpretation | null
  mode?: 'short' | 'long'
}

type Props = {
  visible: boolean
  title: string
  subtitle?: string | null
  summary?: string | null
  blocks?: Block[]
  onClose: () => void
}

export default function PlanetInterpretationModal({
  visible,
  title,
  subtitle = null,
  summary = null,
  blocks = [],
  onClose,
}: Props) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Pressable style={styles.backdrop} onPress={onClose} />

        <View style={styles.sheet}>
          <View style={styles.headerRow}>
            <View style={styles.headerSpacer} />

            <Text style={styles.headerTitle}>Interpretation</Text>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            <InterpretationCard
              title={title}
              subtitle={subtitle}
              summary={summary}
              blocks={blocks}
            />
          </ScrollView>
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  backdrop: {
    flex: 1,
  },
  sheet: {
    maxHeight: '82%',
    backgroundColor: 'rgba(10,10,10,0.96)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border,
    paddingTop: 10,
    paddingHorizontal: 14,
    paddingBottom: 18,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  headerSpacer: {
    width: 40,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeText: {
    color: theme.colors.text,
    fontSize: 20,
    fontWeight: '700',
  },
  scrollContent: {
    paddingBottom: 12,
  },
})