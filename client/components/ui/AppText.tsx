// components/ui/AppText.tsx
import React from 'react'
import { Text, StyleSheet, TextProps } from 'react-native'
import { theme, type TypographyRole } from './theme'

/**
 * Bound how far a role scales with the device font setting.
 *
 * Each role pairs a scaling fontSize with a fixed lineHeight, so unbounded
 * scaling eventually makes glyphs taller than their own line box -- and with
 * includeFontPadding disabled that clips rather than crowds. The caps come
 * from design-system.md 13.3; the interpretation reading surface is
 * deliberately uncapped.
 */
function variantScaleCap(variant: TypographyRole) {
  return theme.typographyMaxScale[variant]
}

/**
 * `variant` is opt-in and additive.
 *
 * AppText, MutedText and TitleText are used across 11 files. Applying the V2
 * typography roles by default would restyle every one of them the moment this
 * file changed, which is the global repaint the staged migration exists to
 * avoid. Omitting `variant` therefore keeps the exact V1 appearance; passing
 * one opts that single call site into the new system.
 *
 * The prop is named `variant` rather than `role` because React Native's
 * TextProps already defines an ARIA `role`. Intersecting the two would narrow
 * the prop to the accidental overlap of both unions ("button" | "heading") and
 * quietly drop the rest, so a distinct name keeps every existing Text prop --
 * ARIA `role` included -- intact.
 *
 * Screens adopt variants as they migrate, and the V1 defaults are deleted once
 * no caller relies on them.
 */
export type AppTextProps = TextProps & {
  variant?: TypographyRole
}

function variantStyle(variant: TypographyRole) {
  return [theme.typography[variant], styles.variantColor]
}

export function AppText({ variant, style, ...rest }: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={variant ? variantScaleCap(variant) : undefined}
      {...rest}
      style={[variant ? variantStyle(variant) : styles.text, style]}
    />
  )
}

export function MutedText({ variant, style, ...rest }: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={variant ? variantScaleCap(variant) : undefined}
      {...rest}
      style={[variant ? theme.typography[variant] : null, styles.muted, style]}
    />
  )
}

export function TitleText({ variant, style, ...rest }: AppTextProps) {
  return (
    <Text
      maxFontSizeMultiplier={variant ? variantScaleCap(variant) : undefined}
      {...rest}
      style={[variant ? variantStyle(variant) : styles.title, style]}
    />
  )
}

const styles = StyleSheet.create({
  // === V1 defaults — unchanged, applied whenever `role` is omitted ===
  text: {
    color: theme.colors.text,
    fontSize: 14,
  },
  muted: {
    color: theme.colors.muted,
  },
  title: {
    color: theme.colors.text,
    fontSize: 22,
    fontWeight: '600',
  },

  // === V2 ===
  variantColor: {
    color: theme.text.primary,
  },
})
