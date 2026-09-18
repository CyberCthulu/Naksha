import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import * as ts from 'typescript'

type WorkerResult =
  | {
      ok: true
      resolvedZone: string
      deviceOffsetMinutes: number
      stored: string
    }
  | {
      ok: false
      resolvedZone: string
      deviceOffsetMinutes: number
      code: string | null
      message: string
    }

const MODULE_DIRECTORY = path.resolve(__dirname, '..')
const NODE_MODULES = path.resolve(__dirname, '../..', 'node_modules')
const WORKER_SOURCE = `
const {
  civilDateFromPicker,
  civilDateToPicker,
  parseCivilDate,
  serializeCivilDate,
} = require(process.env.CIVIL_TIME_MODULE)

let stored = process.env.CIVIL_DATE

try {
  for (let cycle = 0; cycle < Number(process.env.CIVIL_CYCLES || '1'); cycle += 1) {
    const civil = parseCivilDate(stored)
    if (!civil) throw new Error('Worker received an invalid civil date')
    stored = serializeCivilDate(civilDateFromPicker(civilDateToPicker(civil)))
  }

  process.stdout.write(JSON.stringify({
    ok: true,
    resolvedZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    deviceOffsetMinutes: new Date(1997, 8, 15, 12).getTimezoneOffset(),
    stored,
  }))
} catch (error) {
  process.stdout.write(JSON.stringify({
    ok: false,
    resolvedZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    deviceOffsetMinutes: new Date(1997, 8, 15, 12).getTimezoneOffset(),
    code: error && typeof error === 'object' && 'code' in error ? error.code : null,
    message: error instanceof Error ? error.message : String(error),
  }))
}
`

let compiledDirectory: string

function compileModule(fileName: 'time.ts' | 'timezones.ts') {
  const sourcePath = path.join(MODULE_DIRECTORY, fileName)
  const outputPath = path.join(
    compiledDirectory,
    fileName.replace(/\.ts$/, '.js')
  )
  const output = ts.transpileModule(readFileSync(sourcePath, 'utf8'), {
    fileName: sourcePath,
    compilerOptions: {
      esModuleInterop: true,
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2020,
    },
  })

  writeFileSync(outputPath, output.outputText)
}

function runInDeviceZone(
  timeZone: string,
  civilDate: string,
  cycles = 1
): WorkerResult {
  const result = spawnSync(process.execPath, ['-e', WORKER_SOURCE], {
    encoding: 'utf8',
    env: {
      ...process.env,
      CIVIL_CYCLES: String(cycles),
      CIVIL_DATE: civilDate,
      CIVIL_TIME_MODULE: path.join(compiledDirectory, 'time.js'),
      NODE_PATH: NODE_MODULES,
      TZ: timeZone,
    },
  })

  if (result.error) throw result.error
  if (result.status !== 0 || !result.stdout) {
    throw new Error(result.stderr || `Timezone worker exited ${result.status}`)
  }

  return JSON.parse(result.stdout) as WorkerResult
}

beforeAll(() => {
  compiledDirectory = mkdtempSync(path.join(tmpdir(), 'naksha-civil-time-'))
  compileModule('timezones.ts')
  compileModule('time.ts')
})

afterAll(() => {
  rmSync(compiledDirectory, { force: true, recursive: true })
})

describe('civil picker pipeline in real device time zones', () => {
  it.each([
    ['UTC', ['UTC'], 0],
    ['America/Los_Angeles', ['America/Los_Angeles'], 420],
    ['Asia/Kolkata', ['Asia/Kolkata', 'Asia/Calcutta'], -330],
    ['Pacific/Kiritimati', ['Pacific/Kiritimati'], -840],
  ])(
    'preserves 1997-09-15 when the process starts in %s',
    (timeZone, resolvedZones, deviceOffsetMinutes) => {
      const result = runInDeviceZone(timeZone, '1997-09-15')

      expect(result.ok).toBe(true)
      expect(resolvedZones).toContain(result.resolvedZone)
      expect(result.deviceOffsetMinutes).toBe(deviceOffsetMinutes)
      if (result.ok) expect(result.stored).toBe('1997-09-15')
    }
  )

  it('does not compound date drift through repeated UTC+14 adapter cycles', () => {
    expect(
      runInDeviceZone('Pacific/Kiritimati', '1997-09-15', 5)
    ).toEqual({
      ok: true,
      resolvedZone: 'Pacific/Kiritimati',
      deviceOffsetMinutes: -840,
      stored: '1997-09-15',
    })
  })
})

describe('device-local dates skipped at the international date line', () => {
  it.each(['Pacific/Apia', 'Pacific/Fakaofo'])(
    'rejects 2011-12-30 explicitly in %s',
    (timeZone) => {
      expect(runInDeviceZone(timeZone, '2011-12-30')).toEqual(
        expect.objectContaining({
          ok: false,
          resolvedZone: timeZone,
          code: 'unrepresentable-picker-date',
          message:
            'This date cannot be represented by the device date picker in its current time zone.',
        })
      )
    }
  )

  it.each([
    ['Pacific/Apia', '2011-12-29'],
    ['Pacific/Apia', '2011-12-31'],
    ['Pacific/Fakaofo', '2011-12-29'],
    ['Pacific/Fakaofo', '2011-12-31'],
  ])('preserves nearby valid date %s %s', (timeZone, civilDate) => {
    expect(runInDeviceZone(timeZone, civilDate)).toEqual(
      expect.objectContaining({
        ok: true,
        resolvedZone: timeZone,
        stored: civilDate,
      })
    )
  })
})
