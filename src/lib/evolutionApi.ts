// Thin REST client for a self-hosted Evolution API instance.
// The dashboard runs on Vercel, while the WhatsApp gateway lives on the
// user's VPS. All calls below require EVOLUTION_API_URL and EVOLUTION_API_KEY.

export class EvolutionApiNotConfiguredError extends Error {
  constructor() {
    super(
      'Evolution API is not configured yet. Add EVOLUTION_API_URL and EVOLUTION_API_KEY to enable WhatsApp.'
    )
    this.name = 'EvolutionApiNotConfiguredError'
  }
}

function baseUrl(): string {
  const url = process.env.EVOLUTION_API_URL
  if (!url) throw new EvolutionApiNotConfiguredError()
  return url.replace(/\/$/, '')
}

function globalApiKey(): string {
  const key = process.env.EVOLUTION_API_KEY
  if (!key) throw new EvolutionApiNotConfiguredError()
  return key
}

async function evolutionFetch(path: string, apiKey: string, init?: RequestInit) {
  const response = await fetch(`${baseUrl()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      apikey: apiKey,
      ...(init?.headers ?? {}),
    },
  })

  if (!response.ok) {
    const detail = await response.text().catch(() => '')
    throw new Error(`Evolution API ${path} -> ${response.status}: ${detail.slice(0, 300)}`)
  }

  return response.json()
}

export async function evolutionCreateInstance(instanceName: string): Promise<{ instanceToken: string | null }> {
  const data = await evolutionFetch('/instance/create', globalApiKey(), {
    method: 'POST',
    body: JSON.stringify({
      instanceName,
      integration: 'WHATSAPP-BAILEYS',
      qrcode: true,
    }),
  })

  const instanceToken: string | null =
    typeof data?.hash === 'string' ? data.hash : (data?.hash?.apikey ?? null)

  return { instanceToken }
}

export async function evolutionGetQrCode(instanceName: string, instanceToken: string): Promise<string | null> {
  const data = await evolutionFetch(`/instance/connect/${instanceName}`, instanceToken, { method: 'GET' })
  return data?.qrcode?.base64 ?? data?.base64 ?? data?.qrcode ?? null
}

export async function evolutionGetConnectionState(
  instanceName: string,
  instanceToken: string
): Promise<'open' | 'close' | 'connecting'> {
  const data = await evolutionFetch(`/instance/connectionState/${instanceName}`, instanceToken, {
    method: 'GET',
  })

  return data?.instance?.state ?? data?.state ?? 'close'
}

export async function evolutionSetWebhook(
  instanceName: string,
  instanceToken: string,
  webhookUrl: string
): Promise<void> {
  await evolutionFetch(`/webhook/set/${instanceName}`, instanceToken, {
    method: 'POST',
    body: JSON.stringify({
      enabled: true,
      url: webhookUrl,
      webhookByEvents: false,
      webhookBase64: false,
      events: ['MESSAGES_UPSERT', 'CONNECTION_UPDATE'],
    }),
  })
}

export async function evolutionSendText(instanceName: string, instanceToken: string, number: string, text: string) {
  await evolutionFetch(`/message/sendText/${instanceName}`, instanceToken, {
    method: 'POST',
    body: JSON.stringify({ number, text }),
  })
}

export async function evolutionDeleteInstance(instanceName: string): Promise<void> {
  await evolutionFetch(`/instance/logout/${instanceName}`, globalApiKey(), { method: 'DELETE' }).catch(() => {
    // A logout can fail if the instance was never fully connected. The delete
    // call below is what matters for cleanup.
  })

  await evolutionFetch(`/instance/delete/${instanceName}`, globalApiKey(), { method: 'DELETE' })
}
