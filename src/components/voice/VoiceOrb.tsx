'use client'
import React, { useEffect, useRef } from 'react'

export type VoiceOrbStatus = 'idle' | 'listening' | 'thinking' | 'speaking' | 'error'

type VoiceOrbProps = {
  status: VoiceOrbStatus
  size?: number
  color?: string
  secondaryColor?: string
  className?: string
}

const STATUS_CONFIG: Record<VoiceOrbStatus, { pulse: boolean; spin?: boolean; rings: number }> = {
  idle: { pulse: false, rings: 0 },
  listening: { pulse: true, rings: 2 },
  thinking: { pulse: true, rings: 1 },
  speaking: { pulse: true, rings: 3 },
  error: { pulse: true, rings: 0 },
}

export const VoiceOrb = React.memo(function VoiceOrb({
  status,
  size = 64,
  color = '#0f766e',
  secondaryColor = '#14b8a6',
  className = '',
}: VoiceOrbProps) {
  const orbRef = useRef<HTMLDivElement>(null)
  const config = STATUS_CONFIG[status]

  useEffect(() => {
    if (!orbRef.current) return
    const style = orbRef.current.style
    if (status === 'speaking' && config.rings >= 3) {
      style.boxShadow = `0 0 ${size * 0.2}px ${color}, 0 0 ${size * 0.4}px ${secondaryColor}`
    } else if (config.pulse) {
      style.boxShadow = `0 0 ${size * 0.15}px ${color}`
    } else {
      style.boxShadow = 'none'
    }
  }, [status, config, color, secondaryColor, size])

  const ringElements = Array.from({ length: config.rings }).map((_, i) => (
    <span
      key={i}
      className={`absolute inset-0 rounded-full animate-ping opacity-30`}
      style={{
        borderColor: i % 2 === 0 ? color : secondaryColor,
        animationDelay: `${i * 0.3}s`,
      }}
    />
  ))

  return (
    <div
      className={`relative inline-grid place-items-center rounded-full transition-all ${className}`}
      style={{
        width: size,
        height: size,
        background: `linear-gradient(135deg, ${color}, ${secondaryColor})`,
        animation: config.pulse && config.spin ? 'spin 2s linear infinite' : undefined,
      }}
    >
      <div
        ref={orbRef}
        className="rounded-full bg-white transition-all duration-300"
        style={{
          width: size * 0.4,
          height: size * 0.4,
          transform: {
            idle: 'scale(1)',
            listening: 'scale(1.1)',
            thinking: 'scale(0.95)',
            speaking: 'scale(1.15)',
            error: 'scale(1)',
          }[status],
        }}
      />
      {ringElements}
    </div>
  )
})

const styleId = 'voiceorb-animations'
if (typeof document !== 'undefined' && !document.getElementById(styleId)) {
  const style = document.createElement('style')
  style.id = styleId
  style.textContent = `
    @keyframes spin { to { transform: rotate(360deg); } }
  `
  document.head.appendChild(style)
}
