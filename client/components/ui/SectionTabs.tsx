import {
  Pressable,
  StyleSheet,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native'
import { AppText } from './AppText'
import { theme } from './theme'

type SectionTabsProps<T extends string> = {
  options: readonly { value: T; label: string; testID?: string }[]
  value: T
  onChange: (value: T) => void
  accessibilityLabel?: string
  style?: StyleProp<ViewStyle>
  testID?: string
}

/** Equal-width section selectors with wrapping labels and a visible selection rule. */
export function SectionTabs<T extends string>({
  options,
  value,
  onChange,
  accessibilityLabel,
  style,
  testID,
}: SectionTabsProps<T>) {
  return (
    <View
      accessibilityRole="tablist"
      accessibilityLabel={accessibilityLabel}
      style={[styles.tabs, style]}
      testID={testID}
    >
      {options.map((option) => {
        const selected = option.value === value

        return (
          <Pressable
            key={option.value}
            accessibilityRole="tab"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            onPress={() => onChange(option.value)}
            testID={option.testID}
            style={({ pressed }) => [styles.tab, pressed && styles.tabPressed]}
          >
            <AppText
              variant="subheading"
              style={[styles.tabLabel, selected && styles.tabLabelSelected]}
            >
              {option.label}
            </AppText>
            <View
              style={[
                styles.tabIndicator,
                selected && styles.tabIndicatorSelected,
              ]}
            />
          </Pressable>
        )
      })}
    </View>
  )
}

const styles = StyleSheet.create({
  tabs: {
    flexDirection: 'row',
    columnGap: theme.space.sm,
    marginBottom: theme.space.md,
  },
  tab: {
    flex: 1,
    justifyContent: 'flex-end',
    minHeight: theme.touchTarget.min,
    paddingTop: theme.space.sm,
    rowGap: theme.space.sm,
  },
  tabPressed: {
    opacity: 0.7,
  },
  tabLabel: {
    color: theme.text.tertiary,
    textAlign: 'center',
  },
  tabLabelSelected: {
    color: theme.text.primary,
  },
  tabIndicator: {
    backgroundColor: 'transparent',
    borderRadius: theme.radius.xs,
    height: 2,
    width: '100%',
  },
  tabIndicatorSelected: {
    backgroundColor: theme.accent.base,
  },
})
