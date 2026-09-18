import { DateTime } from 'luxon'

import { normalizeZone } from './timezones'

export type CivilDate = {
  year: number
  month: number
  day: number
}

export type CivilTime = {
  hour: number
  minute: number
}

export type BirthInstantOption = {
  utc: Date
  utcIso: string
  offsetMinutes: number
}

export type ZonedCivilTimeClassification =
  | { status: 'unambiguous'; option: BirthInstantOption }
  | { status: 'nonexistent' }
  | { status: 'ambiguous'; options: BirthInstantOption[] }

export type PreparedBirthMoment = {
  birthDate: string
  birthTime: string
  timeZone: string
  birthUtcOffsetMinutes: number | null
  instant: BirthInstantOption
}

export type BirthTimeResolutionErrorCode =
  | 'invalid-date'
  | 'invalid-time'
  | 'invalid-zone'
  | 'nonexistent'
  | 'ambiguous'
  | 'invalid-offset'

export class BirthTimeResolutionError extends Error {
  constructor(
    readonly code: BirthTimeResolutionErrorCode,
    message: string
  ) {
    super(message)
    this.name = 'BirthTimeResolutionError'
  }
}

function isInteger(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value)
}

export function isValidCivilDate(value: CivilDate): boolean {
  if (
    !isInteger(value.year) ||
    !isInteger(value.month) ||
    !isInteger(value.day) ||
    value.year < 1 ||
    value.year > 9999 ||
    value.month < 1 ||
    value.month > 12 ||
    value.day < 1 ||
    value.day > 31
  ) {
    return false
  }

  const date = DateTime.fromObject(
    { year: value.year, month: value.month, day: value.day },
    { zone: 'Etc/UTC' }
  )

  return (
    date.isValid &&
    date.year === value.year &&
    date.month === value.month &&
    date.day === value.day
  )
}

export function isValidCivilTime(value: CivilTime): boolean {
  return (
    isInteger(value.hour) &&
    isInteger(value.minute) &&
    value.hour >= 0 &&
    value.hour <= 23 &&
    value.minute >= 0 &&
    value.minute <= 59
  )
}

export function parseCivilDate(value: unknown): CivilDate | null {
  if (typeof value !== 'string') return null

  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value)
  if (!match) return null

  const civilDate = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  }

  return isValidCivilDate(civilDate) ? civilDate : null
}

export function parseCivilTime(value: unknown): CivilTime | null {
  if (typeof value !== 'string') return null

  const match = /^(\d{2}):(\d{2})(?::(\d{2})(?:\.\d{1,6})?)?$/.exec(value)
  if (!match) return null

  const seconds = match[3] == null ? 0 : Number(match[3])
  const civilTime = {
    hour: Number(match[1]),
    minute: Number(match[2]),
  }

  return seconds === 0 && isValidCivilTime(civilTime) ? civilTime : null
}

function pad2(value: number) {
  return String(value).padStart(2, '0')
}

export function serializeCivilDate(value: CivilDate): string {
  if (!isValidCivilDate(value)) {
    throw new BirthTimeResolutionError('invalid-date', 'Enter a valid birth date.')
  }

  return `${String(value.year).padStart(4, '0')}-${pad2(value.month)}-${pad2(value.day)}`
}

export function serializeCivilTime(value: CivilTime): string {
  if (!isValidCivilTime(value)) {
    throw new BirthTimeResolutionError('invalid-time', 'Enter a valid birth time.')
  }

  return `${pad2(value.hour)}:${pad2(value.minute)}:00`
}

export function civilDateFromPicker(value: Date): CivilDate {
  return {
    year: value.getFullYear(),
    month: value.getMonth() + 1,
    day: value.getDate(),
  }
}

export function civilTimeFromPicker(value: Date): CivilTime {
  return {
    hour: value.getHours(),
    minute: value.getMinutes(),
  }
}

export function civilDateToPicker(value: CivilDate): Date {
  if (!isValidCivilDate(value)) {
    throw new BirthTimeResolutionError('invalid-date', 'Enter a valid birth date.')
  }

  const pickerValue = new Date(2000, value.month - 1, value.day, 12, 0, 0, 0)
  pickerValue.setFullYear(value.year)
  return pickerValue
}

export function civilTimeToPicker(value: CivilTime): Date {
  if (!isValidCivilTime(value)) {
    throw new BirthTimeResolutionError('invalid-time', 'Enter a valid birth time.')
  }

  return new Date(2000, 0, 1, value.hour, value.minute, 0, 0)
}

function instantOption(value: DateTime): BirthInstantOption {
  const utc = value.toUTC()
  const utcIso = utc.toISO()
  if (!utcIso) {
    throw new BirthTimeResolutionError(
      'invalid-time',
      'The birth time could not be resolved.'
    )
  }

  return {
    utc: utc.toJSDate(),
    utcIso,
    offsetMinutes: value.offset,
  }
}

export function classifyZonedCivilTime(
  date: CivilDate,
  time: CivilTime,
  ianaZone: string
): ZonedCivilTimeClassification {
  if (!isValidCivilDate(date)) {
    throw new BirthTimeResolutionError('invalid-date', 'Enter a valid birth date.')
  }
  if (!isValidCivilTime(time)) {
    throw new BirthTimeResolutionError('invalid-time', 'Enter a valid birth time.')
  }

  const zone = normalizeZone(ianaZone)
  if (!zone) {
    throw new BirthTimeResolutionError(
      'invalid-zone',
      'Choose a valid IANA time zone.'
    )
  }

  const local = DateTime.fromObject(
    {
      year: date.year,
      month: date.month,
      day: date.day,
      hour: time.hour,
      minute: time.minute,
      second: 0,
      millisecond: 0,
    },
    { zone }
  )

  if (!local.isValid) {
    throw new BirthTimeResolutionError(
      'invalid-time',
      'The birth date and time could not be resolved.'
    )
  }

  if (
    local.year !== date.year ||
    local.month !== date.month ||
    local.day !== date.day ||
    local.hour !== time.hour ||
    local.minute !== time.minute
  ) {
    return { status: 'nonexistent' }
  }

  const possible = local
    .getPossibleOffsets()
    .filter(
      (candidate, index, values) =>
        values.findIndex((other) => other.toMillis() === candidate.toMillis()) === index
    )
    .sort((a, b) => a.toMillis() - b.toMillis())
    .map(instantOption)

  if (possible.length > 1) {
    return { status: 'ambiguous', options: possible }
  }

  return { status: 'unambiguous', option: possible[0] ?? instantOption(local) }
}

export function prepareBirthMoment(
  date: CivilDate,
  time: CivilTime,
  ianaZone: string,
  selectedOffsetMinutes: number | null = null
): PreparedBirthMoment {
  const timeZone = normalizeZone(ianaZone)
  if (!timeZone) {
    throw new BirthTimeResolutionError(
      'invalid-zone',
      'Choose a valid IANA time zone.'
    )
  }

  const classification = classifyZonedCivilTime(date, time, timeZone)
  if (classification.status === 'nonexistent') {
    throw new BirthTimeResolutionError(
      'nonexistent',
      `This local time did not exist in ${timeZone} on that date. Choose a valid time.`
    )
  }

  let instant: BirthInstantOption
  let birthUtcOffsetMinutes: number | null = null

  if (classification.status === 'ambiguous') {
    if (selectedOffsetMinutes == null) {
      throw new BirthTimeResolutionError(
        'ambiguous',
        `This local time occurred twice in ${timeZone}. Choose the earlier or later occurrence.`
      )
    }

    const selected = classification.options.find(
      (option) => option.offsetMinutes === selectedOffsetMinutes
    )
    if (!selected) {
      throw new BirthTimeResolutionError(
        'invalid-offset',
        'The saved birth-time occurrence is not valid for this date and time. Choose it again.'
      )
    }

    instant = selected
    birthUtcOffsetMinutes = selected.offsetMinutes
  } else {
    if (selectedOffsetMinutes != null) {
      throw new BirthTimeResolutionError(
        'invalid-offset',
        'The saved birth-time occurrence is not valid for this date and time.'
      )
    }
    instant = classification.option
  }

  return {
    birthDate: serializeCivilDate(date),
    birthTime: serializeCivilTime(time),
    timeZone,
    birthUtcOffsetMinutes,
    instant,
  }
}

export function resolveStoredBirthMoment(
  date: string,
  time: string,
  ianaZone: string,
  selectedOffsetMinutes: number | null = null
): PreparedBirthMoment {
  const civilDate = parseCivilDate(date)
  if (!civilDate) {
    throw new BirthTimeResolutionError('invalid-date', 'Enter a valid birth date.')
  }

  const civilTime = parseCivilTime(time)
  if (!civilTime) {
    throw new BirthTimeResolutionError('invalid-time', 'Enter a valid birth time.')
  }

  return prepareBirthMoment(
    civilDate,
    civilTime,
    ianaZone,
    selectedOffsetMinutes
  )
}

export function formatUtcOffset(offsetMinutes: number): string {
  const sign = offsetMinutes < 0 ? '−' : '+'
  const absolute = Math.abs(offsetMinutes)
  return `UTC${sign}${pad2(Math.floor(absolute / 60))}:${pad2(absolute % 60)}`
}

export function formatShortTimeFromHHMM(timeStr: string | null | undefined) {
  const time = parseCivilTime(timeStr)
  if (!time) return '—'

  const suffix = time.hour >= 12 ? 'PM' : 'AM'
  const hour = time.hour % 12 || 12
  return `${hour}:${pad2(time.minute)} ${suffix}`
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
]

export function formatBirthDate(value: string | null | undefined): string | null {
  const date = parseCivilDate(value)
  if (!date) return null

  return `${date.day} ${MONTHS[date.month - 1]} ${date.year}`
}

export function formatBirthMoment(
  date: string | null | undefined,
  time: string | null | undefined
): string | null {
  const day = formatBirthDate(date)
  const clock = time ? formatShortTimeFromHHMM(time) : null
  const parts = [day, clock === '—' ? null : clock].filter(Boolean)

  return parts.length ? parts.join(' · ') : null
}
