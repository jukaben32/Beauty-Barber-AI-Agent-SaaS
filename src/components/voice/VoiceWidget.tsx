'use client'
import React, { useEffect, useMemo, useState } from 'react'
import {
  Mic,
  MicOff,
  Phone,
  PhoneOff,
  Send,
  Calendar,
  X,
  Bot,
  User,
  Loader2,
} from 'lucide-react'
import { useRealtimeVoice } from '@/hooks/useRealtimeVoice'
import { VoiceOrb } from './VoiceOrb'
import { Waveform } from './Waveform'
import { TranscriptPanel, TranscriptMessage } from './TranscriptPanel'
import { AppointmentConfirmForm } from './AppointmentConfirmForm'
import { VoiceOrbStatus } from './VoiceOrb'

type VoiceWidgetProps = {
  businessSlug: string
  widgetSlug?: string
  primaryColor?: string
  secondaryColor?: string
  theme?: 'light' | 'dark'
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left'
  className?: string
}

type ViewState = 'closed' | 'minimized' | 'open'

export const VoiceWidget: React.FC<VoiceWidgetProps> = ({
  businessSlug,
  widgetSlug,
  primaryColor = '#0f766e',
  secondaryColor = '#14b8a6',
  theme = 'light',
  position = 'bottom-right',
  className = '',
}) => {
  const [viewState, setViewState] = useState<ViewState>('closed')
  const [showAppointmentForm, setShowAppointmentForm] = useState(false)
  const [textInput, setTextInput] = useState('')

  const {
    status,
    session,
    messages,
    transcript,
    amplitude,
    error,
    connect,
    disconnect,
    startListening,
    stopListening,
    reset,
  } = useRealtimeVoice()

  const dark = theme === 'dark'

  // Auto-connect when widget opens
  useEffect(() => {
    if (viewState === 'open' && !session) {
      connect({
        businessSlug,
        widgetSlug,
        onToolCall: async (toolName, args) => {
          const response = await fetch('/api/realtime/tools', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ businessSlug, widgetSlug, toolName, arguments: args }),
          })
          if (!response.ok) {
            throw new Error(await response.text())
          }
          const body = await response.json()
          return body.result
        },
      }).catch(console.error)
    }
  }, [viewState, session, connect, businessSlug, widgetSlug])

  // Handle tool calls that request appointment confirmation
  useEffect(() => {
    const lastMsg = messages[messages.length - 1]
    if (lastMsg?.role === 'system' && lastMsg.content.includes('function_call')) {
      setShowAppointmentForm(true)
    }
  }, [messages])

  const orbStatus: VoiceOrbStatus = useMemo(() => {
    if (status === 'error') return 'error'
    if (status === 'listening') return 'listening'
    if (status === 'thinking') return 'thinking'
    if (status === 'speaking') return 'speaking'
    if (status === 'connecting') return 'thinking'
    return 'idle'
  }, [status])

  const handleToggleListening = async () => {
    if (status === 'listening' || status === 'speaking') {
      await stopListening()
    } else {
      await startListening()
    }
  }

  const handleEndCall = () => {
    disconnect()
    reset()
    setViewState('closed')
    setShowAppointmentForm(false)
  }

  const handleSendMessage = () => {
    if (textInput.trim()) {
      // Simulate user message
      const msg: TranscriptMessage = {
        id: `msg-${Date.now()}`,
        role: 'caller',
        content: textInput.trim(),
        createdAt: new Date().toISOString(),
      }
      // Would send via text channel if supported
      setTextInput('')
    }
  }

  const handleConfirmAppointment = (data: {
    serviceId: string
    slotStart: string
    slotEnd: string
  }) => {
    setShowAppointmentForm(false)
    // The agent would receive this via tool output
    // For now, we just close the form
  }

  // Position styles
  const positionStyles = {
    'bottom-right': { launcher: { right: 16, bottom: 16 }, panel: { right: 16, bottom: 80 } },
    'bottom-left': { launcher: { left: 16, bottom: 16 }, panel: { left: 16, bottom: 80 } },
    'top-right': { launcher: { right: 16, top: 16 }, panel: { right: 16, top: 80 } },
    'top-left': { launcher: { left: 16, top: 16 }, panel: { left: 16, top: 80 } },
  }

  const pos = positionStyles[position]

  if (viewState === 'closed') {
    return (
      <div
        className={`fixed z-[2147483647] ${className}`}
        style={{ ...pos.launcher, color: '#fff' }}
      >
        <button
          onClick={() => setViewState('open')}
          className="grid h-14 w-14 place-items-center rounded-full text-white shadow-lg transition-transform hover:scale-105"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
            boxShadow: `0 18px 40px ${primaryColor}40`,
          }}
        >
          <Phone className="h-6 w-6" />
        </button>
      </div>
    )
  }

  return (
    <div
      className={`fixed z-[2147483647] ${className}`}
      style={pos.panel}
    >
      <div
        className={`flex flex-col overflow-hidden rounded-[28px] border shadow-2xl ${
          dark ? 'border-white/10 bg-[#0f172a]' : 'border-[#e2e8f0] bg-white'
        }`}
        style={{
          width: 380,
          height: 560,
          background: dark
            ? 'linear-gradient(180deg, #1e293b 0%, #0f172a 100%)'
            : 'linear-gradient(180deg, #ffffff 0%, #f8fafc 100%)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between p-4"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})`,
          }}
        >
          <div className="flex items-center gap-3">
            <VoiceOrb status={orbStatus} size={32} color={primaryColor} secondaryColor={secondaryColor} />
            <div>
              <div className="font-semibold text-white">
                {session?.business?.name || 'Clara AI'}
              </div>
              <div className="text-xs text-white/80 capitalize">
                {status === 'listening' ? 'escuchando...' : status === 'speaking' ? 'hablando...' : status === 'thinking' ? 'pensando...' : 'en línea'}
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            {viewState === 'minimized' ? (
              <button
                onClick={() => setViewState('open')}
                className="text-white/70 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            ) : (
              <button
                onClick={() => setViewState('minimized')}
                className="text-white/70 hover:text-white"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
            )}
            <button
              onClick={handleEndCall}
              className="rounded-full p-1 text-white/70 hover:bg-white/20 hover:text-white"
            >
              <PhoneOff className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Waveform / Orb area */}
        <div className="flex justify-center p-4">
          <Waveform amplitude={amplitude} color={primaryColor} bgColor={`${primaryColor}10`} width={220} height={50} />
        </div>

        {/* Appointment confirm form (conditional) */}
        {showAppointmentForm && session && (
          <div className="px-4 py-3 border-t border-[#e2e8f0]">
            <div className="text-xs font-semibold text-[#64748b] mb-2">Confirmar cita</div>
            <AppointmentConfirmForm
              services={[]}
              slots={[]}
              onConfirm={handleConfirmAppointment}
              onCancel={() => setShowAppointmentForm(false)}
            />
          </div>
        )}

        {/* Transcript */}
        <TranscriptPanel messages={messages} isLoading={status === 'thinking'} className="flex-1" />

        {/* Input area */}
        {viewState !== 'minimized' && (
          <div className="flex items-center gap-2 border-t border-[#e2e8f0] p-3">
            <button
              onClick={handleToggleListening}
              disabled={status === 'connecting' || status === 'error'}
              className="grid h-10 w-10 place-items-center rounded-full"
              style={{
                background: status === 'listening' ? '#fee2e2' : `linear-gradient(135deg, ${primaryColor}15, ${secondaryColor}15)`,
                color: status === 'listening' ? '#ef4444' : primaryColor,
              }}
            >
              {status === 'connecting' ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : status === 'listening' ? (
                <MicOff className="h-5 w-5" />
              ) : (
                <Mic className="h-5 w-5" />
              )}
            </button>

            <input
              type="text"
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              placeholder="Mensaje rápido..."
              className="flex-1 rounded-full border border-[#e2e8f0] px-4 py-2 text-sm outline-none focus:border-[#0f766e]"
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            />

            <button
              onClick={handleSendMessage}
              disabled={!textInput.trim()}
              className="grid h-10 w-10 place-items-center rounded-full bg-[#0f766e] text-white disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Error overlay */}
        {error && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="rounded-[20px] bg-white p-6 text-center">
              <div className="mb-2 text-red-500">{error}</div>
              <button
                onClick={() => {
                  reset()
                  connect({ businessSlug, widgetSlug }).catch(console.error)
                }}
                className="rounded-full bg-[#0f766e] px-4 py-2 text-sm text-white"
              >
                Reintentar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default VoiceWidget
