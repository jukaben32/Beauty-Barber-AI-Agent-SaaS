import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function safeJsonParse<T>(value: string | null | undefined, fallback: T): T {
  if (!value) return fallback
  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

export function toTitleCase(value: string) {
  return value
    .split(/[\s_-]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join(' ')
}

// Crypto/stablecoin tickers this app deals with aren't valid ISO-4217 codes,
// so `Intl.NumberFormat({ style: 'currency' })` throws for them at
// construction time (verified: `new Intl.NumberFormat('en-US', { style:
// 'currency', currency: 'USDC' })` throws `RangeError: Invalid currency
// code`). USDC is this app's own default currency (see DEFAULT_CURRENCY),
// so every price/payment amount hit this path. Handle known non-ISO tickers
// explicitly instead of relying on a thrown-exception fallback.
const NON_ISO_CURRENCY_SUFFIXES = new Set(['USDC', 'USDT', 'MATIC', 'ETH'])

function formatPlainAmount(amount: number) {
  const maximumFractionDigits = amount % 1 === 0 ? 0 : 2
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: maximumFractionDigits,
    maximumFractionDigits,
  }).format(amount)
}

export function formatCurrency(amount: number | null | undefined, currency = 'USD') {
  if (amount == null || Number.isNaN(amount)) return ''

  const normalizedCurrency = currency.toUpperCase()
  if (NON_ISO_CURRENCY_SUFFIXES.has(normalizedCurrency)) {
    return `${formatPlainAmount(amount)} ${normalizedCurrency}`
  }

  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: normalizedCurrency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount)
  } catch {
    return `${formatPlainAmount(amount)} ${currency}`
  }
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

// Supabase/Postgrest errors are plain objects ({ message, code, details,
// hint }), not `Error` instances — `err instanceof Error` misses them and
// falls back to a useless "Unknown error". This reads `.message` off
// anything that has one before giving up.
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message
  if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
    return (err as { message: string }).message
  }
  if (typeof err === 'string') return err
  return 'Unknown error'
}
