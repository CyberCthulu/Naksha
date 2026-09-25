import fs from 'fs'
import path from 'path'

const projectRoot = path.resolve(__dirname, '..')
const read = (relativePath: string) =>
  fs.readFileSync(path.join(projectRoot, relativePath), 'utf8')

describe('Android release configuration', () => {
  it('uses the approved identity while preserving Expo linkage and auth scheme', () => {
    const app = JSON.parse(read('app.json')).expo

    expect(app.name).toBe('Naksha')
    expect(app.slug).toBe('client')
    expect(app.scheme).toBe('naksha')
    expect(app.android.package).toBe('com.naksha.app')
    expect(app.android.blockedPermissions).toEqual(
      expect.arrayContaining([
        'android.permission.READ_EXTERNAL_STORAGE',
        'android.permission.WRITE_EXTERNAL_STORAGE',
        'android.permission.SYSTEM_ALERT_WINDOW',
        'android.permission.VIBRATE',
      ])
    )
    expect(app.extra.eas.projectId).toBe('02e47ee9-8b27-4b02-95f3-efc2bece95d7')
  })

  it('keeps the native namespace, application ID, and Kotlin packages aligned', () => {
    const gradle = read('android/app/build.gradle')

    expect(gradle).toContain("namespace 'com.naksha.app'")
    expect(gradle).toContain("applicationId 'com.naksha.app'")
    expect(read('android/app/src/main/java/com/naksha/app/MainActivity.kt')).toMatch(
      /^package com\.naksha\.app/m
    )
    expect(
      read('android/app/src/main/java/com/naksha/app/MainApplication.kt')
    ).toMatch(/^package com\.naksha\.app/m)
    expect(
      fs.existsSync(
        path.join(
          projectRoot,
          'android/app/src/main/java/com/anonymous/client/MainActivity.kt'
        )
      )
    ).toBe(false)
  })

  it('never signs a release with the checked-in debug key', () => {
    const gradle = read('android/app/build.gradle')
    const buildTypes = gradle.slice(gradle.indexOf('buildTypes {'))

    expect(buildTypes).not.toMatch(
      /release\s*\{[\s\S]*?signingConfig signingConfigs\.debug/
    )
    expect(gradle).toContain('releaseSigningConfigured')
    expect(gradle).toContain('NAKSHA_UPLOAD_STORE_FILE')
  })

  it('removes unnecessary release permissions and confines the dev scheme', () => {
    const mainManifest = read('android/app/src/main/AndroidManifest.xml')
    const debugManifest = read('android/app/src/debug/AndroidManifest.xml')

    for (const permission of [
      'READ_EXTERNAL_STORAGE',
      'WRITE_EXTERNAL_STORAGE',
      'SYSTEM_ALERT_WINDOW',
      'VIBRATE',
    ]) {
      expect(mainManifest).toContain(
        `android.permission.${permission}" tools:node="remove"`
      )
    }
    expect(mainManifest).not.toContain('<data android:scheme="exp+client"/>')
    expect(debugManifest).toContain('<data android:scheme="exp+client"/>')
    expect(mainManifest).toContain('<data android:scheme="naksha"/>')
  })

  it('keeps production signing material out of tracked project properties', () => {
    const ignore = read('.gitignore')
    const gradleProperties = read('android/gradle.properties')

    expect(ignore).toMatch(/^\*\.keystore$/m)
    expect(ignore).toMatch(/^!android\/app\/debug\.keystore$/m)
    expect(ignore).toMatch(/^\*\.jks$/m)
    expect(ignore).toMatch(/^credentials\.json$/m)
    expect(gradleProperties).toContain(
      'Never store NAKSHA_UPLOAD_* passwords or production signing material here.'
    )
    expect(fs.existsSync(path.join(projectRoot, 'android/app/debug.keystore'))).toBe(
      true
    )
  })

  it('disables cleartext and backup while excluding AsyncStorage databases', () => {
    const mainManifest = read('android/app/src/main/AndroidManifest.xml')
    const legacyRules = read('android/app/src/main/res/xml/backup_rules.xml')
    const modernRules = read(
      'android/app/src/main/res/xml/data_extraction_rules.xml'
    )

    expect(mainManifest).toContain('android:usesCleartextTraffic="false"')
    expect(mainManifest).toContain('android:allowBackup="false"')
    expect(mainManifest).toContain('android:fullBackupContent="@xml/backup_rules"')
    expect(mainManifest).toContain(
      'android:dataExtractionRules="@xml/data_extraction_rules"'
    )
    expect(legacyRules).toContain('<exclude domain="database" path="."/>')
    expect(modernRules.match(/<exclude domain="database" path="\."\/>/g)).toHaveLength(2)
  })
})
