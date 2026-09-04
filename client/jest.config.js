module.exports = {
  preset: 'jest-expo',
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  maxWorkers: 2,
  moduleNameMapper: {
    // Metro resolves lucide-react-native through its "react-native" export
    // condition, which is ESM-only .mjs. Jest's babel transform matches
    // .[jt]sx? and so cannot process those. The package ships an equivalent
    // CommonJS build, so point Jest at it rather than teaching the transform
    // about .mjs. Runtime behaviour is unchanged; only the test resolver moves.
    '^lucide-react-native/icons/(.*)$':
      '<rootDir>/node_modules/lucide-react-native/dist/cjs/icons/$1.js',
  },
}
