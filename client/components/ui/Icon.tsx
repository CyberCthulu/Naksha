import React from 'react'
import type { ColorValue } from 'react-native'

// Individual imports, not the barrel: the root entry pulls the whole icon set
// into the bundle. This file is the only place Lucide may be imported from.
import Calendar from 'lucide-react-native/icons/calendar'
import Check from 'lucide-react-native/icons/check'
import ChevronDown from 'lucide-react-native/icons/chevron-down'
import ChevronLeft from 'lucide-react-native/icons/chevron-left'
import ChevronRight from 'lucide-react-native/icons/chevron-right'
import ChevronUp from 'lucide-react-native/icons/chevron-up'
import Eye from 'lucide-react-native/icons/eye'
import EyeOff from 'lucide-react-native/icons/eye-off'
import MapPin from 'lucide-react-native/icons/map-pin'
import NotebookPen from 'lucide-react-native/icons/notebook-pen'
import Pencil from 'lucide-react-native/icons/pencil'
import Plus from 'lucide-react-native/icons/plus'
import Trash2 from 'lucide-react-native/icons/trash-2'
import UserRound from 'lucide-react-native/icons/user-round'
import X from 'lucide-react-native/icons/x'

import { theme } from './theme'

/**
 * The curated functional set. Icons are addressed by what they do, not by the
 * Lucide glyph they happen to use, so swapping a glyph never touches a screen.
 *
 * Astrological and zodiac glyphs are content, not chrome, and are deliberately
 * absent: they carry meaning and have no Lucide equivalent.
 */
const ICONS = {
  back: ChevronLeft,
  'chevron-left': ChevronLeft,
  'chevron-right': ChevronRight,
  collapse: ChevronUp,
  expand: ChevronDown,
  close: X,
  edit: Pencil,
  save: Check,
  delete: Trash2,
  journal: NotebookPen,
  account: UserRound,
  calendar: Calendar,
  visibility: Eye,
  'visibility-off': EyeOff,
  add: Plus,
  location: MapPin,
} as const

export type IconName = keyof typeof ICONS
export type IconSize = keyof typeof theme.icon.stroke

export const ICON_NAMES = Object.keys(ICONS) as IconName[]

export type IconProps = {
  name: IconName
  /** Semantic size token. Defaults to `md` (20). */
  size?: IconSize
  /** Semantic color. Defaults to primary ink. */
  color?: ColorValue
  testID?: string
}

/**
 * Icons are decorative and silent by default: the meaning of a control belongs
 * to the enclosing Pressable or Button, which carries the accessibility label.
 * Labelling the glyph as well would announce it twice.
 *
 * Icon renders no touch target of its own. Sizing the tap area is the
 * responsibility of the control that wraps it.
 */
export function Icon({
  name,
  size = 'md',
  color = theme.text.primary,
  testID,
}: IconProps) {
  const Glyph = ICONS[name]

  return (
    <Glyph
      testID={testID}
      size={theme.icon[size]}
      color={color}
      strokeWidth={theme.icon.stroke[size]}
      accessible={false}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    />
  )
}
