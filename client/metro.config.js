// metro.config.js
const { getDefaultConfig } = require('expo/metro-config')

/**
 * Expo's standard Metro configuration, unmodified.
 *
 * This file previously set `resolver.disableHierarchicalLookup = true`,
 * pinned `resolver.nodeModulesPaths` to the project's own node_modules, and
 * aliased `three` and `maath/three` through `extraNodeModules`, all to force
 * a single Three instance for the 3D background.
 *
 * Those overrides were removed because they broke the bundle. Disabling
 * hierarchical lookup stops Metro from resolving a package's own nested
 * dependencies, and react-native-reanimated requires `semver`, which npm
 * installs under `react-native-reanimated/node_modules/semver` rather than at
 * the top level. Metro could not see it and the Android bundle failed.
 *
 * Nothing depended on the overrides any more: the only importer of `three`
 * and `expo-gl` is `components/space/SpaceBackground.tsx`, which has been
 * commented out of `App.tsx` since before this work, and `maath` is not
 * installed at all. Removing them also clears Expo Doctor's long-standing
 * Metro config warning.
 *
 * If the 3D background is ever revived, resolve any duplicate-instance
 * problem then, against the dependency tree that actually exists at the time.
 */
module.exports = getDefaultConfig(__dirname)
