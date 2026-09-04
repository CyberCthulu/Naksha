import fs from 'fs'
import path from 'path'

const CLIENT = path.resolve(__dirname, '../../..')

describe('Android edge-to-edge configuration', () => {
  const appJson = JSON.parse(
    fs.readFileSync(path.join(CLIENT, 'app.json'), 'utf8')
  )
  const gradleProps = fs.readFileSync(
    path.join(CLIENT, 'android/gradle.properties'),
    'utf8'
  )
  const styles = fs.readFileSync(
    path.join(CLIENT, 'android/app/src/main/res/values/styles.xml'),
    'utf8'
  )

  it('enables edge-to-edge in the Expo config', () => {
    expect(appJson.expo.android.edgeToEdgeEnabled).toBe(true)
  })

  it('agrees with the committed native gradle properties', () => {
    expect(gradleProps).toMatch(/^edgeToEdgeEnabled=true$/m)
    expect(gradleProps).toMatch(/^expo\.edgeToEdgeEnabled=true$/m)
  })

  it('drops the temporary enforcement opt-out', () => {
    expect(styles).not.toContain('windowOptOutEdgeToEdgeEnforcement')
  })

  it('keeps the dark system chrome established earlier', () => {
    expect(appJson.expo.userInterfaceStyle).toBe('dark')
    expect(appJson.expo.androidStatusBar.barStyle).toBe('light-content')
    expect(styles).toContain('<item name="android:windowLightStatusBar">false</item>')
  })

  it('does not change navigation-bar contrast behaviour', () => {
    expect(styles).toContain('android:enforceNavigationBarContrast')
  })
})
