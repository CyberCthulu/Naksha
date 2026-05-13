const expoConfig = require('eslint-config-expo/flat')
const { defineConfig } = require('eslint/config')
const globals = require('globals')

module.exports = defineConfig([
  {
    ignores: [
      'android/',
      'node_modules/',
      'dist/',
      'build/',
      'coverage/',
      '.expo/',
    ],
  },
  ...expoConfig,
  {
    files: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
    languageOptions: {
      globals: {
        ...globals.jest,
      },
    },
    rules: {
      '@typescript-eslint/no-require-imports': 'off',
      'react/display-name': 'off',
    },
  },
  {
    files: ['*.config.js', 'metro.config.js', 'jest.config.js'],
    languageOptions: {
      globals: {
        ...globals.node,
      },
      sourceType: 'commonjs',
    },
  },
  {
    files: ['components/space/SpaceBackground.tsx'],
    rules: {
      'react/no-unknown-property': 'off',
    },
  },
])
