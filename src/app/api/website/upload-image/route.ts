import { randomUUID } from 'node:crypto'
import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { getServerSupabaseAndUser, getBusinessForCurrentUser } from '@/lib/route-helpers'
import { apiError } from '@/lib/api'

const MAX_UPLOAD_BYTES = 8 * 1024 * 1024
const ALLOWED_CONTENT_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif', 'image/svg+xml'])

function sanitizeFolder(folder: FormDataEntryValue | null) {
  const value = typeof folder === 'string' ? folder : 'uploads'
  const cleaned = value.replace(/[^a-zA-Z0-9_-]/g, '')
  return cleaned || 'uploads'
}

export async function POST(request: Request) {
  const { supabase, user } = await getServerSupabaseAndUser()
  if (!user) {
    return apiError('Unauthorized', 401)
  }
  const business = await getBusinessForCurrentUser(supabase, user.id)
  if (!business) {
    return apiError('Business not found', 404)
  }

  const contentType = request.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    const body = await request.json().catch(() => null)
    const imageUrl = body?.imageUrl || body?.url
    if (!imageUrl) {
      return apiError('imageUrl is required', 400)
    }
    return NextResponse.json({ uploaded: false, url: imageUrl })
  }

  if (!contentType.includes('multipart/form-data')) {
    return apiError('Unsupported content type', 415)
  }

  const form = await request.formData()
  const file = form.get('file')
  if (!(file instanceof File)) {
    return apiError('file is required', 400)
  }
  if (!ALLOWED_CONTENT_TYPES.has(file.type)) {
    return apiError('Unsupported file type', 415)
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return apiError('File too large (max 8MB)', 413)
  }

  const bucket = process.env.SUPABASE_STORAGE_BUCKET || 'website-assets'
  const admin = createAdminClient()
  const folder = sanitizeFolder(form.get('folder'))
  const safeFileName = file.name.replace(/[^a-zA-Z0-9_.-]/g, '-')
  const path = `${business.id}/${folder}/${randomUUID()}-${safeFileName}`
  const buffer = Buffer.from(await file.arrayBuffer())

  const { error: uploadError } = await admin.storage.from(bucket).upload(path, buffer, {
    contentType: file.type || 'application/octet-stream',
    upsert: false,
  })

  if (uploadError) {
    return apiError(uploadError.message, 400)
  }

  const { data } = admin.storage.from(bucket).getPublicUrl(path)
  return NextResponse.json({
    uploaded: true,
    bucket,
    path,
    url: data.publicUrl,
  })
}
