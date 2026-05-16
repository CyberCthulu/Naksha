//components/charts/InterpretationModal.tsx
import React, { useEffect, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { theme } from '../ui/theme'
import InterpretationCard from './InterpretationCard'
import { Interpretation } from '../../lib/lexicon'

export type InterpretationBlock = {
  title?: string
  interpretation?: Interpretation | null
  mode?: 'short' | 'long'
}

export type InterpretationPage = {
  key: string
  title: string
  subtitle?: string | null
  summary?: string | null
  blocks?: InterpretationBlock[]
}

type Props = {
  visible: boolean
  headerTitle?: string
  pages: InterpretationPage[]
  currentIndex: number
  onChangeIndex: (index: number) => void
  onClose: () => void
}

export default function InterpretationModal({
  visible,
  headerTitle = 'Interpretation',
  pages,
  currentIndex,
  onChangeIndex,
  onClose,
}: Props) {
  const scrollRef = useRef<ScrollView | null>(null)
  const insets = useSafeAreaInsets()
  const activePage = pages[currentIndex] ?? pages[0]

  // Reset scroll to top whenever the modal opens or the page changes.
  // The ScrollView is also keyed by currentIndex, so index changes mount a
  // fresh instance at y=0 automatically; this effect handles the modal-reopen
  // case where the index is unchanged.
  useEffect(() => {
    if (!visible) return
    requestAnimationFrame(() => {
      scrollRef.current?.scrollTo?.({ y: 0, animated: false })
    })
  }, [visible])

  const handlePrevPress = () => {
    if (!pages.length) return
    onChangeIndex(currentIndex === 0 ? pages.length - 1 : currentIndex - 1)
  }

  const handleNextPress = () => {
    if (!pages.length) return
    onChangeIndex(currentIndex === pages.length - 1 ? 0 : currentIndex + 1)
  }

  // Sheet top: sit just below the status bar with a small gap.
  const sheetTop = insets.top + 52
  // Bottom spacer inside the ScrollView clears the home indicator / nav bar.
  const bottomSpacerHeight = Math.max(insets.bottom, 16) + 40

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      {/* Full-screen backdrop — tap outside the sheet to close */}
      <Pressable
        testID="interpretation-backdrop"
        style={styles.backdrop}
        onPress={onClose}
      />

      {/* Reading sheet — absolutely positioned so its height is never
          derived from a fragile percentage calculation */}
      <View
        testID="interpretation-sheet"
        style={[styles.sheet, { top: sheetTop }]}
      >
        {/* Fixed header row */}
        <View style={styles.headerRow}>
          <Pressable
            onPress={handlePrevPress}
            style={styles.navButton}
            disabled={pages.length <= 1}
          >
            <Text
              style={[
                styles.navText,
                pages.length <= 1 && styles.navTextDisabled,
              ]}
            >
              ‹
            </Text>
          </Pressable>

          <Text style={styles.headerTitle}>{headerTitle}</Text>

          <View style={styles.headerActions}>
            <Pressable
              onPress={handleNextPress}
              style={styles.navButton}
              disabled={pages.length <= 1}
            >
              <Text
                style={[
                  styles.navText,
                  pages.length <= 1 && styles.navTextDisabled,
                ]}
              >
                ›
              </Text>
            </Pressable>

            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeText}>✕</Text>
            </Pressable>
          </View>
        </View>

        {/* Scrollable content — keyed by currentIndex so every navigation
            mounts a fresh ScrollView at y=0, eliminating stale scroll state */}
        <View style={styles.contentArea}>
          {!!activePage && (
            <ScrollView
              key={currentIndex}
              ref={scrollRef}
              testID="interpretation-scroll"
              style={styles.pageScroll}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              <InterpretationCard
                title={activePage.title}
                subtitle={activePage.subtitle}
                summary={activePage.summary}
                blocks={activePage.blocks}
              />
              {/* Explicit spacer so the last text line clears the nav bar */}
              <View
                testID="interpretation-bottom-spacer"
                style={{ height: bottomSpacerHeight }}
              />
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  )
}

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.55)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(10,10,10,0.97)',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.colors.border,
    paddingTop: 10,
    paddingHorizontal: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    color: theme.colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: {
    color: theme.colors.text,
    fontSize: 28,
    fontWeight: '500',
    lineHeight: 28,
  },
  navTextDisabled: {
    opacity: 0.3,
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
  contentArea: {
    flex: 1,
    minHeight: 0,
  },
  pageScroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {},
})
