import React, { useEffect, useRef } from 'react'
import {
  Modal,
  View,
  Text,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native'
import PagerView from 'react-native-pager-view'
import { theme } from '../ui/theme'
import InterpretationCard from './InterpretationCard'
import { Interpretation } from '../../lib/lexicon'

type Block = {
  title?: string
  interpretation?: Interpretation | null
  mode?: 'short' | 'long'
}

export type InterpretationPage = {
  key: string
  title: string
  subtitle?: string | null
  summary?: string | null
  blocks?: Block[]
}

type Props = {
  visible: boolean
  pages: InterpretationPage[]
  currentIndex: number
  onChangeIndex: (index: number) => void
  onClose: () => void
}

export default function PlanetInterpretationModal({
  visible,
  pages,
  currentIndex,
  onChangeIndex,
  onClose,
}: Props) {
  const pagerRef = useRef<PagerView>(null)
  const hasMountedRef = useRef(false)

  useEffect(() => {
    if (!visible || !pages.length) return

    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }

    pagerRef.current?.setPageWithoutAnimation(currentIndex)
  }, [visible, currentIndex, pages.length])

  useEffect(() => {
    if (!visible) {
      hasMountedRef.current = false
    }
  }, [visible])

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
            <Pressable
              onPress={() =>
                onChangeIndex(
                  currentIndex === 0 ? pages.length - 1 : currentIndex - 1
                )
              }
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

            <Text style={styles.headerTitle}>Interpretation</Text>

            <View style={styles.headerActions}>
              <Pressable
                onPress={() =>
                  onChangeIndex(
                    currentIndex === pages.length - 1 ? 0 : currentIndex + 1
                  )
                }
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

          {!!pages.length && (
            <>
              <View style={styles.metaRow}>
                <Text style={styles.metaText}>
                  {currentIndex + 1} / {pages.length}
                </Text>
              </View>

              <PagerView
                ref={pagerRef}
                style={styles.pager}
                initialPage={currentIndex}
onPageSelected={(event) => {
  const position = event.nativeEvent.position

  // Normal update
  onChangeIndex(position)

  // Wrap forward (last → first)
  if (position === pages.length - 1 && currentIndex === pages.length - 2) {
    requestAnimationFrame(() => {
      pagerRef.current?.setPageWithoutAnimation(0)
      onChangeIndex(0)
    })
  }

  // Wrap backward (first → last)
  if (position === 0 && currentIndex === 1) {
    requestAnimationFrame(() => {
      pagerRef.current?.setPageWithoutAnimation(pages.length - 1)
      onChangeIndex(pages.length - 1)
    })
  }
}}
              >
                {pages.map((page) => (
                  <View key={page.key} style={styles.page}>
                    <ScrollView
                      contentContainerStyle={styles.scrollContent}
                      showsVerticalScrollIndicator={false}
                    >
                      <InterpretationCard
                        title={page.title}
                        subtitle={page.subtitle}
                        summary={page.summary}
                        blocks={page.blocks}
                      />
                    </ScrollView>
                  </View>
                ))}
              </PagerView>
            </>
          )}
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
    height: '82%',
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
  metaRow: {
    alignItems: 'center',
    marginBottom: 8,
  },
  metaText: {
    color: theme.colors.sub,
    fontSize: 12,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 24,
  },
})