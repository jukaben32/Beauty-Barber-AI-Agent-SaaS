import { NextResponse } from 'next/server'

export function json<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, init)
}

export function apiError(message: string, status = 400, extra: Record<string, unknown> = {}) {
  return NextResponse.json({ error: message, ...extra }, { status })
}

export async function readJson<T>(request: Request): Promise<T> {
  return (await request.json()) as T
}

export function parseSearchParams(input: string | URL | Request) {
  if (input instanceof Request) return new URL(input.url).searchParams
  if (typeof input === 'string') return new URL(input, 'http://localhost').searchParams
  return input.searchParams
}

export function getStringParam(params: URLSearchParams, key: string, fallback = '') {
  return params.get(key)?.trim() || fallback
}

export function getBooleanParam(params: URLSearchParams, key: string) {
  const value = params.get(key)
  return value === '1' || value === 'true'
}
