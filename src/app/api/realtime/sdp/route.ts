// Proxy endpoint: performs OpenAI Realtime WebRTC SDP exchange server-side
import { z } from 'zod'
import { createAdminClient } from '@/lib/supabase/admin'
import { apiError, json, readJson } from '@/lib/api'
import { resolveRealtimeClinicContext } from '@/lib/realtime'
import { realtimeSessionSchema } from '@/validations'

const sdpAnswerSchema = z.object({
  businessSlug: z.string(),
  widgetSlug: z.string().optional(),
  language: z.string().optional(),
  sdp: z.string(),
})

// The old Beta shape (POST /v1/realtime?model=... straight from a request
// holding the real API key) was retired by OpenAI on 2026-05-12 and now
// rejects every call with `beta_api_shape_disabled`. The GA replacement is a
// two-step flow: mint a short-lived client secret bound to the session
// config, then exchange SDP against /v1/realtime/calls using that secret
// instead of the raw API key.
const OPENAI_CLIENT_SECRETS_URL = 'https://api.openai.com/v1/realtime/client_secrets'
const OPENAI_CALLS_URL = 'https://api.openai.com/v1/realtime/calls'

export async function POST(request: Request) {
  const body = await readJson(request)
  const parsed = sdpAnswerSchema.safeParse(body)

  if (!parsed.success) {
    return apiError('Invalid payload for SDP exchange', 400, { issues: parsed.error.flatten() })
  }

  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return apiError('OpenAI API key not configured', 500)
  }

  try {
    const admin = createAdminClient()
    const context = await resolveRealtimeClinicContext(admin, {
      businessSlug: parsed.data.businessSlug,
      widgetSlug: parsed.data.widgetSlug ?? null,
      // Not `?? 'en'`: resolveRealtimeClinicContext falls back to the
      // widget's assigned agent's language before defaulting to English, so
      // forcing 'en' here whenever the caller doesn't pass one would skip
      // that fallback entirely.
      language: parsed.data.language ?? null,
    })

    const secretResponse = await fetch(OPENAI_CLIENT_SECRETS_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ session: context.session }),
    })

    if (!secretResponse.ok) {
      const errorText = await secretResponse.text()
      return apiError(`OpenAI client secret request failed: ${secretResponse.status} ${errorText}`, 502)
    }

    const secretData = await secretResponse.json()
    const ephemeralToken: string | undefined = secretData?.value
    if (!ephemeralToken) {
      return apiError('OpenAI did not return a realtime client secret', 502)
    }

    const response = await fetch(OPENAI_CALLS_URL, {
      method: 'POST',
      body: parsed.data.sdp,
      headers: {
        Authorization: `Bearer ${ephemeralToken}`,
        'Content-Type': 'application/sdp',
      },
    })

    if (!response.ok) {
      const errorText = await response.text()
      return apiError(`OpenAI SDP exchange failed: ${response.status} ${errorText}`, 502)
    }

    const answerSdp = await response.text()

    return json({
      business: context.business,
      widget: context.widget,
      instructions: context.context.instructions,
      session: context.session,
      tools: context.session.tools || [],
      sdpAnswer: answerSdp,
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'SDP exchange failed'
    return apiError(message, 500)
  }
}
