//components/charts/InterpretationModal.tsx
import React, { useEffect, useMemo, useRef } from 'react'
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
  const pagerRef = useRef<PagerView>(null)
  const hasMountedRef = useRef(false)
  const isInternalJumpRef = useRef(false)

  const pagerPages = useMemo<InterpretationPage[]>(() => {
    if (pages.length <= 1) return pages
    return [pages[pages.length - 1], ...pages, pages[0]]
  }, [pages])

  const toPagerIndex = (realIndex: number) => {
    if (pages.length <= 1) return 0
    return realIndex + 1
  }

  const toRealIndex = (pagerIndex: number) => {
    if (pages.length <= 1) return 0
    if (pagerIndex === 0) return pages.length - 1
    if (pagerIndex === pagerPages.length - 1) return 0
    return pagerIndex - 1
  }

  useEffect(() => {
    if (!visible || !pages.length) return

    const targetPagerIndex = toPagerIndex(currentIndex)

    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      requestAnimationFrame(() => {
        pagerRef.current?.setPageWithoutAnimation(targetPagerIndex)
      })
      return
    }

    if (isInternalJumpRef.current) {
      isInternalJumpRef.current = false
      return
    }

    pagerRef.current?.setPageWithoutAnimation(targetPagerIndex)
  }, [visible, currentIndex, pages.length])

  useEffect(() => {
    if (!visible) {
      hasMountedRef.current = false
      isInternalJumpRef.current = false
    }
  }, [visible])

  const handlePrevPress = () => {
    if (!pages.length) return
    onChangeIndex(currentIndex === 0 ? pages.length - 1 : currentIndex - 1)
  }

  const handleNextPress = () => {
    if (!pages.length) return
    onChangeIndex(currentIndex === pages.length - 1 ? 0 : currentIndex + 1)
  }

  const handlePageSelected = (event: { nativeEvent: { position: number } }) => {
    if (!pages.length) return

    const pagerIndex = event.nativeEvent.position

    if (pages.length <= 1) {
      onChangeIndex(0)
      return
    }

    if (pagerIndex === 0) {
      isInternalJumpRef.current = true
      onChangeIndex(pages.length - 1)

      requestAnimationFrame(() => {
        pagerRef.current?.setPageWithoutAnimation(pages.length)
      })
      return
    }

    if (pagerIndex === pagerPages.length - 1) {
      isInternalJumpRef.current = true
      onChangeIndex(0)

      requestAnimationFrame(() => {
        pagerRef.current?.setPageWithoutAnimation(1)
      })
      return
    }

    onChangeIndex(toRealIndex(pagerIndex))
  }

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

          {!!pagerPages.length && (
            <PagerView
              ref={pagerRef}
              style={styles.pager}
              initialPage={toPagerIndex(currentIndex)}
              onPageSelected={handlePageSelected}
            >
              {pagerPages.map((page, index) => (
                <View key={`${page.key}-${index}`} style={styles.page}>
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