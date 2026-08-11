'use client'
import { useCallback, useEffect, useRef, useState } from 'react'

export type RealtimeVoiceStatus = 'idle' | 'initializing' | 'connecting' | 'connected' | 'listening' | 'thinking' | 'speaking' | 'disconnected' | 'error'

export interface RealtimeMessage {
  id: string
  role: 'agent' | 'caller' | 'system'
  content: string
  createdAt: string
}

export interface RealtimeConnectOptions {
  businessSlug: string
  widgetSlug?: string | null
  voice?: string | null
  language?: string | null
  agentId?: string | null
  onToolCall?: (toolName: string, args: Record<string, unknown>) => Promise<unknown>
}

interface RealtimeServerEvent {
  type: string
  item_id?: string
  response_id?: string
  delta?: string
  transcript?: string
  call_id?: string
  name?: string
  arguments?: string
  error?: { message?: string }
}

export interface VoiceSessionPayload {
  business: { id: string; name: string; slug: string; timezone: string }
  widget: { id: string; name: string; slug?: string; greetingMessage?: string }
  session: {
    model: string
    voice?: string
    client_secret?: { value: string; expires_at: number }
  }
  instructions: string
  tools: Array<{
    type: 'function'
    name: string
    description: string
    parameters: Record<string, unknown>
  }>
}

let messageId = 0
const genId = () => `msg_${Date.now()}_${messageId++}`

export function useRealtimeVoice() {
  const [status, setStatus] = useState<RealtimeVoiceStatus>('idle')
  const [messages, setMessages] = useState<RealtimeMessage[]>([])
  const [error, setError] = useState<string | null>(null)
  const [transcript, setTranscript] = useState('')
  const [amplitude, setAmplitude] = useState(0)
  const [session, setSession] = useState<VoiceSessionPayload | null>(null)

  const pcRef = useRef<RTCPeerConnection | null>(null)
  const dcRef = useRef<RTCDataChannel | null>(null)
  const micStreamRef = useRef<MediaStream | null>(null)
  const audioElRef = useRef<HTMLAudioElement | null>(null)
  const partialAgentTextRef = useRef<Record<string, string>>({})
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const amplitudeFrameRef = useRef<number | null>(null)
  const onToolCallRef = useRef<RealtimeConnectOptions['onToolCall']>(undefined)
  const businessSlugRef = useRef<string | null>(null)
  const conversationIdRef = useRef<string | null>(null)
  const callStartedAtRef = useRef<number | null>(null)

  const appendMessage = useCallback((role: RealtimeMessage['role'], content: string) => {
    const trimmed = content.trim()
    if (!trimmed) return
    setMessages((current) => [...current, { id: genId(), role, content: trimmed, createdAt: new Date().toISOString() }])

    const conversationId = conversationIdRef.current
    const businessSlug = businessSlugRef.current
    if (!conversationId || !businessSlug) return
    fetch(`/api/realtime/conversation/${conversationId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessSlug, role, content: trimmed }),
    }).catch(() => {
      // Best-effort transcript logging - never let this break the live call.
    })
  }, [])

  const endConversation = useCallback((patch: { clientId?: string; appointmentId?: string } = {}) => {
    const conversationId = conversationIdRef.current
    const businessSlug = businessSlugRef.current
    if (!conversationId || !businessSlug) return
    const durationSeconds = callStartedAtRef.current ? Math.round((Date.now() - callStartedAtRef.current) / 1000) : undefined
    fetch(`/api/realtime/conversation/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessSlug, durationSeconds, ...patch }),
    }).catch(() => {
      // Best-effort - the call is already ending either way.
    })
    conversationIdRef.current = null
    callStartedAtRef.current = null
  }, [])

  const linkConversation = useCallback((patch: { clientId?: string; appointmentId?: string }) => {
    const conversationId = conversationIdRef.current
    const businessSlug = businessSlugRef.current
    if (!conversationId || !businessSlug || (!patch.clientId && !patch.appointmentId)) return
    fetch(`/api/realtime/conversation/${conversationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ businessSlug, ...patch }),
    }).catch(() => {
      // Best-effort - don't interrupt the call over a logging failure.
    })
  }, [])

  const cleanup = useCallback(() => {
    endConversation()
    dcRef.current?.close()
    dcRef.current = null
    pcRef.current?.getSenders().forEach((sender) => sender.track?.stop())
    pcRef.current?.close()
    pcRef.current = null
    micStreamRef.current?.getTracks().forEach((track) => track.stop())
    micStreamRef.current = null
    if (audioElRef.current) {
      audioElRef.current.srcObject = null
      audioElRef.current.remove()
      audioElRef.current = null
    }
    partialAgentTextRef.current = {}
    if (amplitudeFrameRef.current !== null) {
      cancelAnimationFrame(amplitudeFrameRef.current)
      amplitudeFrameRef.current = null
    }
    analyserRef.current = null
    audioContextRef.current?.close()
    audioContextRef.current = null
    setAmplitude(0)
  }, [endConversation])

  useEffect(() => cleanup, [cleanup])

  const disconnect = useCallback(() => {
    cleanup()
    setStatus('disconnected')
  }, [cleanup])

  const sendToolResult = useCallback((callId: string, output: unknown) => {
    const dc = dcRef.current
    if (!dc || dc.readyState !== 'open') return
    dc.send(
      JSON.stringify({
        type: 'conversation.item.create',
        item: {
          type: 'function_call_output',
          call_id: callId,
          output: JSON.stringify(output ?? {}),
        },
      })
    )
    dc.send(JSON.stringify({ type: 'response.create' }))
  }, [])

  const handleServerEvent = useCallback(
    (event: RealtimeServerEvent) => {
      switch (event.type) {
        case 'response.audio_transcript.delta': {
          const key = event.item_id || event.response_id || 'agent'
          partialAgentTextRef.current[key] = (partialAgentTextRef.current[key] || '') + (event.delta || '')
          setStatus('speaking')
          break
        }
        case 'response.audio_transcript.done': {
          const key = event.item_id || event.response_id || 'agent'
          const text = partialAgentTextRef.current[key] || event.transcript || ''
          delete partialAgentTextRef.current[key]
          appendMessage('agent', text)
          break
        }
        case 'input_audio_buffer.speech_started': {
          setStatus('listening')
          setTranscript('')
          break
        }
        case 'conversation.item.input_audio_transcription.completed': {
          appendMessage('caller', event.transcript || '')
          break
        }
        case 'response.in_progress': {
          setStatus('thinking')
          break
        }
        case 'response.done': {
          setStatus('listening')
          break
        }
        case 'response.function_call_arguments.done': {
          const toolName = event.name || ''
          const callId = event.call_id || ''
          let args: Record<string, unknown> = {}
          try {
            args = event.arguments ? JSON.parse(event.arguments) : {}
          } catch {
            args = {}
          }
          setStatus('thinking')
          void (async () => {
            try {
              const result = onToolCallRef.current ? await onToolCallRef.current(toolName, args) : { ok: true }
              const typedResult = (result as { client?: { id?: string }; appointment?: { id?: string } }) ?? {}
              if (typedResult.client?.id || typedResult.appointment?.id) {
                linkConversation({ clientId: typedResult.client?.id, appointmentId: typedResult.appointment?.id })
              }
              sendToolResult(callId, (result as Record<string, unknown>) ?? { ok: true })
            } catch (toolError) {
              sendToolResult(callId, { error: toolError instanceof Error ? toolError.message : 'Tool call failed' })
            }
          })()
          break
        }
        case 'error': {
          setError(event.error?.message || 'Realtime error')
          break
        }
        default:
          break
      }
    },
    [appendMessage, sendToolResult, linkConversation]
  )

  // Live amplitude readout for the waveform UI, fed from the same mic stream
  // that's already flowing to OpenAI over the WebRTC track below - this only
  // reads the signal, it never sends anything.
  function startAmplitudeMeter(stream: MediaStream) {
    const AudioContextCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext
    const ctx = new AudioContextCtor()
    audioContextRef.current = ctx
    const source = ctx.createMediaStreamSource(stream)
    const analyser = ctx.createAnalyser()
    analyser.fftSize = 256
    source.connect(analyser)
    analyserRef.current = analyser

    const dataArray = new Uint8Array(analyser.frequencyBinCount)
    const tick = () => {
      if (!analyserRef.current) return
      analyserRef.current.getByteFrequencyData(dataArray)
      const avg = dataArray.reduce((a, b) => a + b, 0) / dataArray.length
      setAmplitude(avg / 255)
      amplitudeFrameRef.current = requestAnimationFrame(tick)
    }
    tick()
  }

  const connect = useCallback(
    async (opts: RealtimeConnectOptions) => {
      cleanup()
      setError(null)
      setMessages([])
      setTranscript('')
      onToolCallRef.current = opts.onToolCall
      businessSlugRef.current = opts.businessSlug
      setStatus('connecting')

      try {
        const sessionResponse = await fetch('/api/realtime/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessSlug: opts.businessSlug,
            widgetSlug: opts.widgetSlug ?? undefined,
            voice: opts.voice ?? undefined,
            language: opts.language ?? undefined,
          }),
        })
        if (!sessionResponse.ok) {
          throw new Error(await sessionResponse.text())
        }
        const sessionData: VoiceSessionPayload = await sessionResponse.json()
        setSession(sessionData)

        // Best-effort: the call still works even if Call Log persistence fails.
        try {
          const conversationResponse = await fetch('/api/realtime/conversation', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              businessSlug: opts.businessSlug,
              widgetSlug: opts.widgetSlug ?? undefined,
              agentId: opts.agentId ?? undefined,
            }),
          })
          if (conversationResponse.ok) {
            const { conversationId } = await conversationResponse.json()
            conversationIdRef.current = conversationId
            callStartedAtRef.current = Date.now()
          }
        } catch {
          // Not fatal - proceed without Call Log persistence for this call.
        }

        const micStream = await navigator.mediaDevices.getUserMedia({ audio: true })
        micStreamRef.current = micStream
        startAmplitudeMeter(micStream)

        const pc = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        })
        pcRef.current = pc

        const audioEl = document.createElement('audio')
        audioEl.autoplay = true
        audioElRef.current = audioEl
        pc.ontrack = (event) => {
          audioEl.srcObject = event.streams[0]
        }

        // A single sendrecv audio transceiver: addTrack() below negotiates
        // the outbound (mic) side, and OpenAI attaches its spoken-response
        // track to the same m-line, which fires ontrack above. Adding a
        // second transceiver here would produce a duplicate m=audio section
        // in the SDP offer, which OpenAI's realtime endpoint does not expect.
        micStream.getTracks().forEach((track) => pc.addTrack(track, micStream))

        const dc = pc.createDataChannel('oai-events')
        dcRef.current = dc
        dc.onmessage = (event) => {
          try {
            handleServerEvent(JSON.parse(event.data))
          } catch {
            // Ignore malformed/unrecognized events rather than tearing down the call.
          }
        }
        dc.onopen = () => {
          // GA session shape (nested audio.input/audio.output) - matches
          // buildRealtimeSessionPayload in src/ai/tools.ts. This is a patch
          // on top of the session the client secret already created, mainly
          // so a caller-specified voice can override the business/widget
          // default baked in server-side.
          dc.send(
            JSON.stringify({
              type: 'session.update',
              session: {
                instructions: sessionData.instructions,
                audio: {
                  input: {
                    format: { type: 'audio/pcm', rate: 24000 },
                    transcription: { model: 'whisper-1', language: opts.language || undefined },
                    turn_detection: { type: 'server_vad', threshold: 0.5, prefix_padding_ms: 300, silence_duration_ms: 500 },
                  },
                  output: {
                    format: { type: 'audio/pcm', rate: 24000 },
                    voice: opts.voice || 'alloy',
                  },
                },
                tools: sessionData.tools || [],
                tool_choice: 'auto',
              },
            })
          )
          setStatus('listening')
        }

        const offer = await pc.createOffer()
        await pc.setLocalDescription(offer)

        // SDP exchange via server-side proxy (keeps OPENAI_API_KEY on the server)
        const sdpResponse = await fetch('/api/realtime/sdp', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            businessSlug: opts.businessSlug,
            widgetSlug: opts.widgetSlug ?? undefined,
            language: opts.language ?? 'en',
            sdp: offer.sdp,
          }),
        })
        if (!sdpResponse.ok) {
          const body = await sdpResponse.json().catch(() => null)
          throw new Error(body?.error || `Realtime connection failed (${sdpResponse.status})`)
        }
        const { sdpAnswer } = await sdpResponse.json()
        await pc.setRemoteDescription({ type: 'answer', sdp: sdpAnswer })
      } catch (err) {
        cleanup()
        const message = err instanceof Error ? err.message : 'Failed to start voice call'
        setError(message)
        setStatus('error')
        throw err
      }
    },
    [cleanup, handleServerEvent]
  )

  // The mic track streams continuously over WebRTC once connected; these two
  // just mute/unmute it rather than starting a second capture pipeline.
  const startListening = useCallback(async () => {
    micStreamRef.current?.getTracks().forEach((track) => {
      track.enabled = true
    })
    setStatus('listening')
  }, [])

  const stopListening = useCallback(() => {
    micStreamRef.current?.getTracks().forEach((track) => {
      track.enabled = false
    })
  }, [])

  return {
    status,
    messages,
    error,
    transcript,
    amplitude,
    session,
    connect,
    disconnect,
    startListening,
    stopListening,
    sendToolResult,
    reset: disconnect,
  }
}

export default useRealtimeVoice
