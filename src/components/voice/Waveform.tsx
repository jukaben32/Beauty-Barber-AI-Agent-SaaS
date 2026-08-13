'use client'
import React, { useEffect, useRef } from 'react'

type WaveformProps = {
  /** RMS amplitude from mic (0–1) */
  amplitude: number
  /** bar count */
  bars?: number
  /** bar color */
  color?: string
  /** bar background color */
  bgColor?: string
  width?: number
  height?: number
  className?: string
}

const DEFAULT_BARS = 32

export const Waveform = React.memo(function Waveform({
  amplitude,
  bars = DEFAULT_BARS,
  color = '#0f766e',
  bgColor = 'rgba(21, 57, 142,0.08)',
  width = 320,
  height = 48,
  className = '',
}: WaveformProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const frameRef = useRef<number>(0)

  const barWidth = bars > 1 ? width / bars : width
  const maxHeight = height - 4

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const draw = () => {
      // Limpiar
      ctx.clearRect(0, 0, width, height)
      ctx.fillStyle = bgColor
      ctx.fillRect(0, 0, width, height)

      // Calcular amplitudes (central bar = input, others = decay random)
      const centerIdx = Math.floor(bars / 2)
      const barsData: number[] = []

      for (let i = 0; i < bars; i++) {
        if (i === centerIdx) {
          barsData[i] = amplitude
        } else {
          const distance = Math.abs(i - centerIdx)
          const decay = Math.exp(-distance * 0.3)
          barsData[i] = Math.max(0, amplitude * decay + Math.random() * 0.1)
        }
      }

      // Dibujar barras
      ctx.fillStyle = color
      for (let i = 0; i < bars; i++) {
        const barHeight = barsData[i] * maxHeight
        const x = i * barWidth
        const y = height - barHeight
        ctx.roundRect(x + 1, y, barWidth - 2, Math.max(2, barHeight), 2)
        ctx.fill()
      }

      frameRef.current = requestAnimationFrame(draw)
    }

    frameRef.current = requestAnimationFrame(draw)

    return () => {
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current)
      }
    }
  }, [amplitude, bars, width, height, color, bgColor, barWidth, maxHeight])

  return (
    <canvas
      ref={canvasRef}
      width={width}
      height={height}
      className={`rounded-full ${className}`}
      style={{ display: 'block' }}
    />
  )
})
