import { NextResponse } from 'next/server'

export async function GET(request: Request) {
  const url = new URL(request.url)
  return NextResponse.json({
    ok: true,
    message: 'Widget test route is alive',
    businessSlug: url.searchParams.get('businessSlug'),
    widgetSlug: url.searchParams.get('widgetSlug'),
  })
}
