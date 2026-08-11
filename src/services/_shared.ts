import type { SupabaseClient } from '@supabase/supabase-js'

export type DbClient = SupabaseClient<any, any, any, any, any>

export function toNumber(value: unknown, fallback = 0) {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const parsed = Number(value)
    return Number.isFinite(parsed) ? parsed : fallback
  }
  return fallback
}

export function toDate(value: string | Date | null | undefined) {
  if (!value) return null
  const date = value instanceof Date ? value : new Date(value)
  return Number.isNaN(date.getTime()) ? null : date
}

export function formatTimeInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

export function formatDateInTimeZone(date: Date, timeZone: string) {
  return new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'long',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(date)
}

export function getDateKeyInTimeZone(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${map.year}-${map.month}-${map.day}`
}

function getParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  })

  const parts = formatter.formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))

  return {
    year: Number(map.year),
    month: Number(map.month),
    day: Number(map.day),
    hour: Number(map.hour),
    minute: Number(map.minute),
    second: Number(map.second),
  }
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const parts = getParts(date, timeZone)
  const asUtc = Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, parts.second)
  return asUtc - date.getTime()
}

export function zonedTimeToUtc(dateKey: string, timeValue: string, timeZone: string) {
  const [year, month, day] = dateKey.split('-').map(Number)
  const [hour, minute, second = '0'] = timeValue.split(':')
  const desiredUtc = Date.UTC(year, month - 1, day, Number(hour), Number(minute), Number(second))

  let utc = desiredUtc
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = getTimeZoneOffsetMs(new Date(utc), timeZone)
    const corrected = desiredUtc - offset
    if (corrected === utc) break
    utc = corrected
  }

  return new Date(utc)
}

export function utcToZonedTimeKey(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  })
  const parts = formatter.formatToParts(date)
  const map = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return `${map.year}-${map.month}-${map.day}`
}

export function isSameDayInTimeZone(date: Date, targetKey: string, timeZone: string) {
  return utcToZonedTimeKey(date, timeZone) === targetKey
}

export function getDayOfWeekInTimeZone(date: Date, timeZone: string) {
  const weekday = new Intl.DateTimeFormat('en-US', {
    timeZone,
    weekday: 'short',
  }).format(date)

  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  }

  return map[weekday] ?? date.getUTCDay()
}

export function buildTimeLabel(dateKey: string, startTime: string, endTime: string) {
  return `${dateKey} ${startTime} - ${endTime}`
}
