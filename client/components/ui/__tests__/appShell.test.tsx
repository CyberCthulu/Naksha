import fs from 'fs'
import path from 'path'

const CLIENT = path.resolve(__dirname, '../../..')
const appSource = fs.readFileSync(path.join(CLIENT, 'App.tsx'), 'utf8')

describe('root providers', () => {
  it('mounts ReducedMotionProvider exactly once', () => {
    expect(appSource.match(/<ReducedMotionProvider>/g)).toHaveLength(1)
    expect(appSource.match(/<\/ReducedMotionProvider>/g)).toHaveLength(1)
  })

  it('mounts SafeAreaProvider exactly once', () => {
    expect(appSource.match(/<SafeAreaProvider>/g)).toHaveLength(1)
    expect(appSource.match(/<\/SafeAreaProvider>/g)).toHaveLength(1)
  })

  it('does not gate rendering on the motion preference or fonts', () => {
    // Only the auth bootstrap may hold the tree back.
    expect(appSource).not.toMatch(/if\s*\(\s*!?\s*reduceMotion/)
    expect(appSource).toMatch(/if \(!authReady\)/)
  })

  it('keeps a light status bar in both the boot and main branches', () => {
    expect(appSource.match(/<StatusBar style="light" \/>/g)).toHaveLength(2)
  })

  it('falls back to the V2 environment colour rather than pure black', () => {
    expect(appSource).toContain('backgroundColor: theme.background.base')
    expect(appSource).not.toContain("backgroundColor: '#000'")
  })
})

describe('route background mapping', () => {
  const mapping: Record<string, 'quiet' | 'atmospheric' | 'hero'> = {
    Login: 'quiet',
    Signup: 'quiet',
    CheckEmail: 'quiet',
    ForgotPassword: 'quiet',
    ResetPassword: 'quiet',
    AuthCallback: 'quiet',
    CompleteProfile: 'quiet',
    CreateGuestChart: 'quiet',
    JournalList: 'quiet',
    JournalEditor: 'quiet',
    Dashboard: 'atmospheric',
    MyCharts: 'atmospheric',
    Profile: 'atmospheric',
    Chart: 'hero',
  }

  it.each(Object.entries(mapping))(
    '%s uses the %s background',
    (route, variant) => {
      const declaration = new RegExp(
        `const ${route}Route = withBackground\\(\\w+, '${variant}'\\)`
      )
      expect(appSource).toMatch(declaration)
      expect(appSource).toMatch(
        new RegExp(`name="${route}" component=\\{${route}Route\\}`)
      )
    }
  )

  it('covers all fourteen registered routes', () => {
    expect(appSource.match(/withBackground\(/g)).toHaveLength(
      Object.keys(mapping).length + 1 // + the helper definition itself
    )
  })

  it('wraps each route exactly once, so backgrounds never nest', () => {
    expect(appSource.match(/<Background variant=\{variant\}>/g)).toHaveLength(1)
  })

  it('defines the wrappers at module scope so screens are not remounted', () => {
    const helperIndex = appSource.indexOf('function withBackground')
    const appIndex = appSource.indexOf('export default function App()')
    expect(helperIndex).toBeGreaterThan(-1)
    expect(helperIndex).toBeLessThan(appIndex)
  })
})

describe('navigator configuration', () => {
  it('keeps headers hidden and carries no dead title options', () => {
    expect(appSource).toContain('headerShown: false')
    expect(appSource).not.toMatch(/title: '/)
    expect(appSource).not.toMatch(/headerShown: true/)
  })

  it('leaves the linking config and route names untouched', () => {
    for (const route of [
      'Login',
      'Signup',
      'ForgotPassword',
      'ResetPassword',
      'CheckEmail',
      'Dashboard',
      'CompleteProfile',
      'CreateGuestChart',
      'Chart',
      'MyCharts',
      'AuthCallback',
      'JournalEditor',
      'JournalList',
      'Profile',
    ]) {
      expect(appSource).toMatch(new RegExp(`name="${route}"`))
    }
    expect(appSource).toContain("prefixes: [Linking.createURL('/'), 'naksha://']")
  })
})
