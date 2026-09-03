//components/charts/InterpretationModal.tsx
import React, { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  Modal,
  View,
  StyleSheet,
  Pressable,
  ScrollView,
} from 'react-native'
import PagerView from 'react-native-pager-view'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { AppText } from '../ui/AppText'
import { Icon } from '../ui/Icon'
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
  /**
   * The pager page we last asked for, if we are still waiting for it.
   *
   * PagerView confirms every page change with onPageSelected, including the
   * ones we command. Tapping next twice quickly issues two commands, and the
   * confirmation for the first arrives after the second has been sent -- so
   * acting on it moved the reader back a page. That is the bouncing. Holding
   * the outstanding target lets a superseded confirmation be recognised and
   * dropped, while a genuine swipe, which has no outstanding target, is still
   * handled normally.
   */
  const pendingPagerIndexRef = useRef<number | null>(null)
  /**
   * The page the pager last told us it is on.
   *
   * Needed because asking for the page it is already showing is a no-op, and
   * a no-op produces no confirmation. Arming the guard for a confirmation that
   * will never arrive leaves it armed forever, and every later swipe then
   * looks superseded and is dropped -- which is how swiping stopped updating
   * the position while the buttons carried on working.
   */
  const currentPagerIndexRef = useRef<number | null>(null)
  const insets = useSafeAreaInsets()

  const normalizedCurrentIndex =
    pages.length > 0
      ? Math.min(Math.max(currentIndex, 0), pages.length - 1)
      : 0

  const pagerPages = useMemo<InterpretationPage[]>(() => {
    if (pages.length <= 1) return pages
    return [pages[pages.length - 1], ...pages, pages[0]]
  }, [pages])

  const toPagerIndex = useCallback(
    (realIndex: number) => {
      if (pages.length <= 1) return 0
      return realIndex + 1
    },
    [pages.length]
  )

  /** Ask the pager for a page and remember that we are expecting it. */
  const commitPage = useCallback((target: number) => {
    if (currentPagerIndexRef.current === target) {
      // Already there. No move, so no confirmation is coming.
      pendingPagerIndexRef.current = null
      return
    }

    pendingPagerIndexRef.current = target
    pagerRef.current?.setPageWithoutAnimation(target)
  }, [])

  /** As above, deferred a frame so a settling swipe is not interrupted. */
  const commitPageNextFrame = useCallback((target: number) => {
    if (currentPagerIndexRef.current === target) {
      pendingPagerIndexRef.current = null
      return
    }

    pendingPagerIndexRef.current = target
    requestAnimationFrame(() => {
      pagerRef.current?.setPageWithoutAnimation(target)
    })
  }, [])

  const toRealIndex = (pagerIndex: number) => {
    if (pages.length <= 1) return 0
    if (pagerIndex === 0) return pages.length - 1
    if (pagerIndex === pagerPages.length - 1) return 0
    return pagerIndex - 1
  }

  useEffect(() => {
    if (!visible || !pages.length) return

    const targetPagerIndex = toPagerIndex(normalizedCurrentIndex)

    if (!hasMountedRef.current) {
      hasMountedRef.current = true

      // The pager mounts on initialPage, so it is already where we want it.
      // Recording that matters: without it the first commit is a silent no-op
      // that arms the guard for a confirmation which never comes, and every
      // subsequent swipe then looks superseded.
      currentPagerIndexRef.current = targetPagerIndex
      commitPageNextFrame(targetPagerIndex)
      return
    }

    commitPage(targetPagerIndex)
  }, [
    visible,
    pages.length,
    normalizedCurrentIndex,
    toPagerIndex,
    commitPage,
    commitPageNextFrame,
  ])

  useEffect(() => {
    if (!visible) {
      hasMountedRef.current = false
      pendingPagerIndexRef.current = null
      currentPagerIndexRef.current = null
    }
  }, [visible])

  const handlePrevPress = () => {
    if (!pages.length) return
    onChangeIndex(
      normalizedCurrentIndex === 0
        ? pages.length - 1
        : normalizedCurrentIndex - 1
    )
  }

  const handleNextPress = () => {
    if (!pages.length) return
    onChangeIndex(
      normalizedCurrentIndex === pages.length - 1
        ? 0
        : normalizedCurrentIndex + 1
    )
  }

  const handlePageSelected = (event: { nativeEvent: { position: number } }) => {
    if (pages.length <= 1) return

    const pagerIndex = event.nativeEvent.position

    // Wherever the pager reports itself, that is where it is -- record it
    // before deciding whether to act on the event.
    currentPagerIndexRef.current = pagerIndex

    const pending = pendingPagerIndexRef.current

    if (pending !== null) {
      // Only the confirmation for the page we actually asked for clears the
      // guard. Anything else is a late confirmation from a command that has
      // since been superseded, and acting on it is what made rapid taps bounce
      // back to the previous page.
      if (pagerIndex === pending) pendingPagerIndexRef.current = null
      return
    }

    if (pagerIndex === 0) {
      onChangeIndex(pages.length - 1)
      commitPageNextFrame(pages.length)
      return
    }

    if (pagerIndex === pagerPages.length - 1) {
      onChangeIndex(0)
      commitPageNextFrame(1)
      return
    }

    onChangeIndex(toRealIndex(pagerIndex))
  }

  // Sheet top: sit just below the status bar with a small gap.
  const sheetTop = insets.top + 52
  // Bottom padding clears the home indicator / Android nav bar without
  // leaving a large void after the final paragraph.
  const scrollBottomPadding = Math.max(insets.bottom, 16) + 8

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
            testID="interpretation-prev"
            accessibilityRole="button"
            accessibilityLabel="Previous interpretation"
            accessibilityState={{ disabled: pages.length <= 1 }}
            onPress={handlePrevPress}
            style={({ pressed }) => [
              styles.navButton,
              pressed && styles.pressed,
              pages.length <= 1 && styles.navDisabled,
            ]}
            disabled={pages.length <= 1}
          >
            <Icon name="chevron-left" size="lg" />
          </Pressable>

          {/* The interpretation type is already the content eyebrow, so the
              chrome shows position only. The type is kept in the accessible
              name so it is still announced without being drawn twice. */}
          <View
            testID="interpretation-position-group"
            accessible
            accessibilityRole="header"
            accessibilityLabel={
              pages.length > 1
                ? `${headerTitle}, ${normalizedCurrentIndex + 1} of ${pages.length}`
                : headerTitle
            }
            style={styles.headerCenter}
          >
            {pages.length > 1 ? (
              <AppText
                testID="interpretation-position"
                variant="numeric"
                style={styles.headerPosition}
              >
                {`${normalizedCurrentIndex + 1} / ${pages.length}`}
              </AppText>
            ) : null}
          </View>

          <View style={styles.headerActions}>
            <Pressable
              testID="interpretation-next"
              accessibilityRole="button"
              accessibilityLabel="Next interpretation"
              accessibilityState={{ disabled: pages.length <= 1 }}
              onPress={handleNextPress}
              style={({ pressed }) => [
                styles.navButton,
                pressed && styles.pressed,
                pages.length <= 1 && styles.navDisabled,
              ]}
              disabled={pages.length <= 1}
            >
              <Icon name="chevron-right" size="lg" />
            </Pressable>

            <Pressable
              testID="interpretation-close"
              accessibilityRole="button"
              accessibilityLabel="Close interpretation"
              onPress={onClose}
              style={({ pressed }) => [
                styles.closeButton,
                pressed && styles.pressed,
              ]}
            >
              <Icon name="close" size="lg" />
            </Pressable>
          </View>
        </View>

        <View style={styles.contentArea}>
          {!!pagerPages.length && (
            <PagerView
              ref={pagerRef}
              testID="interpretation-pager"
              style={styles.pager}
              initialPage={toPagerIndex(normalizedCurrentIndex)}
              onPageSelected={handlePageSelected}
            >
              {pagerPages.map((page, index) => (
                <View key={`${page.key}-${index}`} style={styles.page}>
                  <ScrollView
                    testID="interpretation-scroll"
                    style={styles.pageScroll}
                    contentContainerStyle={[
                      styles.scrollContent,
                      { paddingBottom: scrollBottomPadding },
                    ]}
                    showsVerticalScrollIndicator={false}
                  >
                    <InterpretationCard
                      eyebrow={headerTitle}
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
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.scrim,
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: theme.surface.raised,
    borderTopLeftRadius: theme.radius.xl,
    borderTopRightRadius: theme.radius.xl,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: theme.border.strong,
    paddingTop: theme.space.sm,
    paddingHorizontal: theme.space.lg,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: theme.space.xs,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerPosition: {
    color: theme.accent.base,
    letterSpacing: 0.5,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  navButton: {
    minWidth: theme.touchTarget.min,
    minHeight: theme.touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  navDisabled: {
    opacity: 0.3,
  },
  pressed: {
    opacity: 0.7,
  },
  closeButton: {
    minWidth: theme.touchTarget.min,
    minHeight: theme.touchTarget.min,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentArea: {
    flex: 1,
    minHeight: 0,
  },
  pager: {
    flex: 1,
  },
  page: {
    flex: 1,
  },
  pageScroll: {
    flex: 1,
    minHeight: 0,
  },
  scrollContent: {},
})
