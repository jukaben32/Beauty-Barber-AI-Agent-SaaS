'use client'
import React, { useState } from 'react'
import { CalendarDays, Clock, Check, X } from 'lucide-react'
import Button from '@/components/ui/Button'
import type { AvailableSlot, Service } from '@/types'

type AppointmentConfirmFormProps = {
  services: Service[]
  slots: AvailableSlot[]
  selectedServiceId?: string | null
  onConfirm: (data: { serviceId: string; slotStart: string; slotEnd: string }) => void | Promise<void>
  onCancel: () => void
  isLoading?: boolean
  className?: string
}

export const AppointmentConfirmForm = React.memo(function AppointmentConfirmForm({
  services,
  slots,
  selectedServiceId = null,
  onConfirm,
  onCancel,
  isLoading = false,
  className = '',
}: AppointmentConfirmFormProps) {
  const [serviceId, setServiceId] = useState(selectedServiceId || (services[0]?.id ?? ''))
  const [slotStart, setSlotStart] = useState<string>('')
  const [slotEnd, setSlotEnd] = useState<string>('')

  const handleConfirm = async () => {
    if (!serviceId || !slotStart) return
    await onConfirm({ serviceId, slotStart, slotEnd })
  }

  const selectedService = services.find((s) => s.id === serviceId)
  const todaySlots = slots.filter((s) => {
    const slotDate = new Date(s.startAt)
    const today = new Date()
    return slotDate.toDateString() === today.toDateString()
  })

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Service selector */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Servicio
        </label>
        <div className="mt-2 flex flex-col gap-2">
          {services.map((service) => (
            <label
              key={service.id}
              className={`flex items-center gap-3 rounded-[16px] border p-3 cursor-pointer transition-all ${
                serviceId === service.id
                  ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                  : 'border-[var(--border-soft)] hover:border-[var(--brand)]/30'
              }`}
            >
              <input
                type="radio"
                name="service"
                value={service.id}
                checked={serviceId === service.id}
                onChange={() => setServiceId(service.id)}
                className="hidden"
              />
              <div className="flex-1">
                <div className="font-semibold text-[var(--text-strong)]">{service.name}</div>
                <div className="text-sm text-[var(--text-muted)]">
                  {service.durationMinutes} min · {service.currency} {service.price}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Slot selector */}
      <div>
        <label className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--text-muted)]">
          Hora disponible
        </label>
        <div className="mt-2 space-y-2">
          {todaySlots.length > 0 ? (
            todaySlots.slice(0, 8).map((slot) => (
              <label
                key={slot.startAt}
                className={`flex items-center gap-3 rounded-[16px] border p-3 cursor-pointer transition-all ${
                  slotStart === slot.startAt
                    ? 'border-[var(--brand)] bg-[var(--brand-soft)]'
                    : 'border-[var(--border-soft)] hover:border-[var(--brand)]/30'
                }`}
              >
                <input
                  type="radio"
                  name="slot"
                  value={slot.startAt}
                  checked={slotStart === slot.startAt}
                  onChange={() => {
                    setSlotStart(slot.startAt)
                    setSlotEnd(slot.endAt)
                  }}
                  className="hidden"
                />
                <Clock className="h-4 w-4 text-[var(--brand)]" />
                <div className="flex-1">
                  <div className="font-medium text-[var(--text-strong)]">
                    {new Date(slot.startAt).toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">
                    {slot.label}
                  </div>
                </div>
              </label>
            ))
          ) : (
            <div className="py-4 text-center text-sm text-[var(--text-muted)]">
              No hay horarios disponibles para hoy
            </div>
          )}
        </div>
      </div>

      {/* Actions */}
      {slotStart && (
        <div className="flex items-center justify-between rounded-[20px] border border-[var(--border-soft)] bg-[var(--brand-soft)] p-3">
          <div className="flex items-center gap-2 text-sm">
            <CalendarDays className="h-4 w-4 text-[var(--brand-strong)]" />
            <span className="font-medium text-[var(--brand-strong)]">
              {selectedService?.name} • {new Date(slotStart).toLocaleDateString('es-ES')}
            </span>
          </div>
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <Button variant="secondary" onClick={onCancel} disabled={isLoading} className="flex-1">
          <X className="h-4 w-4 mr-2" />
          Cancelar
        </Button>
        <Button
          onClick={handleConfirm}
          disabled={isLoading || !serviceId || !slotStart}
          className="flex-1"
        >
          {isLoading ? (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2" />
          ) : (
            <Check className="h-4 w-4 mr-2" />
          )}
          Confirmar cita
        </Button>
      </div>
    </div>
  )
})
