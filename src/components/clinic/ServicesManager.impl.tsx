'use client'

import { useEffect, useState, type FormEvent } from 'react'
import {
  Check,
  GripVertical,
  Loader2,
  PencilLine,
  Plus,
  Search,
  Sparkles,
  Stethoscope,
  Trash2,
} from 'lucide-react'

import { createClient } from '@/lib/supabase/client'
import { cn, slugify } from '@/lib/utils'
import type { ClinicService, ServicePriceType } from '@/types'
import { createClinicService, deleteClinicService, updateClinicService } from '@/services/services'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Toggle from '@/components/ui/Toggle'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { SectionEyebrow, SurfaceCard } from '@/components/clinic/shared'
import {
  SERVICE_CATALOG_CATEGORIES,
  SERVICE_CATALOG_TEMPLATES,
  type ServiceCatalogCategoryKey,
  type ServiceCatalogTemplate,
} from '@/components/clinic/service-catalog'

type ToastTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

type ManagerToast = {
  id: string
  title: string
  message?: string
  tone?: ToastTone
}

type ServicePriceMode = 'fixed' | 'range' | 'starting_at' | 'contact'

type ServiceFormState = {
  name: string
  description: string
  durationMinutes: string
  priceMode: ServicePriceMode
  price: string
  priceMin: string
  priceMax: string
  active: boolean
}

const CATEGORY_ACCENTS: Record<ServiceCatalogCategoryKey, string> = {
  'primary-preventive': '#0f766e',
  'urgent-emergency': '#ea580c',
  'telehealth-virtual': '#14b8a6',
  'diagnostics-lab': '#8b5cf6',
  'mental-health': '#db2777',
  'womens-health': '#ec4899',
  pediatrics: '#f59e0b',
  dental: '#0ea5e9',
  dermatology: '#16a34a',
  'orthopedics-pt': '#10b981',
  'nutrition-wellness': '#22c55e',
  'eye-care': '#3b82f6',
  cardiology: '#ef4444',
}

const PRICE_MODE_OPTIONS: Array<{ value: ServicePriceMode; label: string }> = [
  { value: 'fixed', label: 'Fixed Price' },
  { value: 'range', label: 'Price Range' },
  { value: 'starting_at', label: 'Starting At' },
  { value: 'contact', label: 'Call for Price' },
]

function formatMoney(value: number | null | undefined) {
  if (value == null || Number.isNaN(value)) return ''
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value)
}

function formatServicePrice(priceLike: {
  priceType: ClinicService['priceType']
  price?: number | null
  priceMin?: number | null
  priceMax?: number | null
}) {
  if (priceLike.priceType === 'contact') return 'Call for price'

  if (priceLike.priceMin != null && priceLike.priceMax != null) {
    return `${formatMoney(priceLike.priceMin)} - ${formatMoney(priceLike.priceMax)}`
  }

  if (priceLike.priceType === 'starting_at') {
    return `Starting at ${formatMoney(priceLike.price ?? priceLike.priceMin)}`
  }

  return formatMoney(priceLike.price) || 'Call for price'
}

function normalizeServiceKey(name: string) {
  return slugify(name)
}

function buildServiceInstructions(name: string, description: string) {
  const base = description.trim() || `${name} bookings`
  return `Use this service for ${base.toLowerCase()}. Confirm the reason for visit, preferred timing, and any intake details before finalizing the booking.`
}

function getServicePriceMode(service: ClinicService | null): ServicePriceMode {
  if (!service) return 'fixed'
  if (service.priceType === 'contact') return 'contact'
  if (service.priceMin != null && service.priceMax != null) return 'range'
  if (service.priceType === 'starting_at') return 'starting_at'
  return 'fixed'
}

function createServiceSeed(service: ClinicService | null): ServiceFormState {
  if (!service) {
    return {
      name: '',
      description: '',
      durationMinutes: '30',
      priceMode: 'fixed',
      price: '',
      priceMin: '',
      priceMax: '',
      active: true,
    }
  }

  const priceMode = getServicePriceMode(service)
  return {
    name: service.name,
    description: service.description ?? '',
    durationMinutes: String(service.durationMinutes ?? 30),
    priceMode,
    price: service.price != null ? String(service.price) : '',
    priceMin: service.priceMin != null ? String(service.priceMin) : '',
    priceMax: service.priceMax != null ? String(service.priceMax) : '',
    active: service.active,
  }
}

function sortServices(services: ClinicService[]) {
  return [...services]
}

function ServicesHeader({
  serviceCount,
  activeCount,
  onOpenCreate,
}: {
  serviceCount: number
  activeCount: number
  onOpenCreate: () => void
}) {
  return (
    <SurfaceCard className="overflow-hidden">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-5">
        <div className="max-w-3xl">
          <SectionEyebrow>Services</SectionEyebrow>
          <div className="mt-4">
            <h2 className="font-display text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
              Healthcare services catalog
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
              Manage the services Clara can book, discuss, and surface inside the clinic workflow.
            </p>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
              {serviceCount} services in your catalog
            </Badge>
            <Badge tone="emerald" className="bg-[rgba(15,118,110,0.08)] normal-case tracking-normal">
              {activeCount} active now
            </Badge>
            <Badge tone="blue" className="bg-[rgba(14,165,233,0.08)] normal-case tracking-normal">
              73 catalog templates
            </Badge>
          </div>
        </div>

        <Button onClick={onOpenCreate} className="gap-2">
          <Plus className="h-4 w-4" />
          Custom Service
        </Button>
      </div>
    </SurfaceCard>
  )
}

function ServiceRow({
  service,
  onEdit,
  onDelete,
}: {
  service: ClinicService
  onEdit: () => void
  onDelete: () => void
}) {
  const accent = service.color ?? '#0f766e'
  const isActive = service.active

  return (
    <div className={cn('grid gap-4 px-5 py-4 transition hover:bg-[rgba(15,118,110,0.03)] md:grid-cols-[1.1fr_auto]', !isActive && 'opacity-80')}>
      <div className="flex min-w-0 items-start gap-4">
        <div
          className="mt-0.5 grid h-11 w-11 shrink-0 place-items-center rounded-2xl border border-[rgba(15,118,110,0.14)]"
          style={{
            backgroundColor: `${accent}14`,
            color: accent,
          }}
        >
          <Stethoscope className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <div className="truncate font-semibold text-[var(--text-strong)]">{service.name}</div>
            <Badge tone={isActive ? 'emerald' : 'slate'} className="bg-white/90 normal-case tracking-normal">
              {isActive ? 'Active' : 'Inactive'}
            </Badge>
          </div>
          <div className="mt-1 line-clamp-2 text-sm leading-7 text-[var(--text-muted)]">
            {service.description ?? 'No description yet'}
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-[var(--text-muted)]">
            <span>{service.durationMinutes} min</span>
            <span>•</span>
            <span className="font-semibold text-[var(--text-strong)]">{formatServicePrice(service)}</span>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-strong)] transition hover:bg-[var(--panel-soft)]"
          aria-label={`Edit ${service.name}`}
        >
          <PencilLine className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--coral)] transition hover:bg-[rgba(251,113,133,0.08)]"
          aria-label={`Desactivar ${service.name}`}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

function ServiceFormDialog({
  open,
  mode,
  service,
  businessId,
  sortOrderBase,
  onClose,
  onSaved,
  pushToast,
}: {
  open: boolean
  mode: 'create' | 'edit'
  service: ClinicService | null
  businessId: string
  sortOrderBase: number
  onClose: () => void
  onSaved: (service: ClinicService) => void
  pushToast: (toast: Omit<ManagerToast, 'id'>) => void
}) {
  const [form, setForm] = useState<ServiceFormState>(() => createServiceSeed(service))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!open) return
    setForm(createServiceSeed(service))
    setError(null)
    setSaving(false)
  }, [open, service])

  if (!open) return null

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const name = form.name.trim()
    if (!name) {
      setError('Service name is required')
      return
    }

    const description = form.description.trim()
    const durationMinutes = Number(form.durationMinutes) || 30
    const accent = service?.color ?? '#0f766e'
    const instructions = buildServiceInstructions(name, description)
    const priceValue = form.price.trim()
    const priceMinValue = form.priceMin.trim()
    const priceMaxValue = form.priceMax.trim()
    const priceType: ServicePriceType =
      form.priceMode === 'contact'
        ? 'contact'
        : form.priceMode === 'starting_at' || form.priceMode === 'range'
          ? 'starting_at'
          : 'fixed'
    const price = form.priceMode === 'contact' ? null : priceValue ? Number(priceValue) : null
    const priceMin = form.priceMode === 'range' ? (priceMinValue ? Number(priceMinValue) : null) : null
    const priceMax = form.priceMode === 'range' ? (priceMaxValue ? Number(priceMaxValue) : null) : null

    if (form.priceMode !== 'contact' && form.priceMode !== 'range' && (price == null || Number.isNaN(price))) {
      setError('Please enter a valid price')
      return
    }
    if (form.priceMode === 'range') {
      if (priceMin == null || priceMax == null || Number.isNaN(priceMin) || Number.isNaN(priceMax)) {
        setError('Please enter both minimum and maximum prices')
        return
      }
      if (priceMin > priceMax) {
        setError('Minimum price cannot be greater than maximum price')
        return
      }
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        name,
        description: description || null,
        durationMinutes,
        priceType,
        price: form.priceMode === 'contact' ? null : form.priceMode === 'range' ? priceMin : price,
        priceMin: form.priceMode === 'range' ? priceMin : null,
        priceMax: form.priceMode === 'range' ? priceMax : null,
        currency: service?.currency ?? 'USD',
        active: form.active,
        color: accent,
        instructions,
      }

      const saved =
        mode === 'create'
          ? await createClinicService(supabase, businessId, {
              ...payload,
              sortOrder: sortOrderBase,
            })
          : await updateClinicService(supabase, businessId, service!.id, payload)

      onSaved(saved)
      pushToast({
        title: mode === 'create' ? 'Service added' : 'Service updated',
        message: `${saved.name} is ready in your clinic catalog.`,
        tone: 'emerald',
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the service')
    } finally {
      setSaving(false)
    }
  }

  const title = mode === 'create' ? 'Add Custom Service' : 'Edit Service'
  const buttonLabel = mode === 'create' ? 'Add Service' : 'Save'

  return (
    <Modal open title={title} onClose={onClose} className="max-w-[560px]">
      <form onSubmit={(event) => void handleSubmit(event)} className="space-y-4">
        {error ? (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <Input
          label="Service Name"
          value={form.name}
          onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
          placeholder="General Consultation"
          required
        />

        <Input
          label="Description"
          value={form.description}
          onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
          placeholder="Brief description for patients and Clara."
        />

        <div className="grid gap-4 md:grid-cols-2">
          <Input
            label="Duration (minutes)"
            type="number"
            min={5}
            value={form.durationMinutes}
            onChange={(event) => setForm((current) => ({ ...current, durationMinutes: event.target.value }))}
          />

          <Select
            label="Price Type"
            value={form.priceMode}
            onChange={(event) =>
              setForm((current) => ({
                ...current,
                priceMode: event.target.value as ServicePriceMode,
              }))
            }
          >
            {PRICE_MODE_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </Select>
        </div>

        {form.priceMode === 'range' ? (
          <div className="grid gap-4 md:grid-cols-2">
            <Input
              label="Minimum Price ($)"
              type="number"
              min={0}
              step="0.01"
              value={form.priceMin}
              onChange={(event) => setForm((current) => ({ ...current, priceMin: event.target.value }))}
            />
            <Input
              label="Maximum Price ($)"
              type="number"
              min={0}
              step="0.01"
              value={form.priceMax}
              onChange={(event) => setForm((current) => ({ ...current, priceMax: event.target.value }))}
            />
          </div>
        ) : form.priceMode === 'contact' ? (
          <div className="rounded-[22px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.04)] px-4 py-3 text-sm text-[var(--text-muted)]">
            The price will be hidden and patients will see a contact-for-price prompt.
          </div>
        ) : (
          <Input
            label={form.priceMode === 'starting_at' ? 'Starting Price ($)' : 'Price ($)'}
            type="number"
            min={0}
            step="0.01"
            value={form.price}
            onChange={(event) => setForm((current) => ({ ...current, price: event.target.value }))}
            placeholder="120"
          />
        )}

        <Toggle
          checked={form.active}
          onCheckedChange={(checked) => setForm((current) => ({ ...current, active: checked }))}
          label="Service is active"
        />

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border-soft)] pt-2">
          <Button type="button" variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" disabled={saving} className="min-w-[140px] justify-center">
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              buttonLabel
            )}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function CatalogCard({
  template,
  categoryLabel,
  accent,
  selected,
  added,
  onToggle,
}: {
  template: ServiceCatalogTemplate
  categoryLabel: string
  accent: string
  selected: boolean
  added: boolean
  onToggle: () => void
}) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-pressed={selected}
      className={cn(
        'group flex h-full flex-col rounded-[24px] border p-4 text-left transition hover:-translate-y-0.5',
        selected || added ? 'bg-white shadow-[0_20px_54px_-42px_rgba(15,118,110,0.55)]' : 'bg-white/90 hover:bg-white',
      )}
      style={{
        borderColor: selected || added ? accent : 'var(--border-soft)',
        boxShadow: selected || added ? `0 22px 60px -48px ${accent}` : undefined,
        backgroundColor: selected || added ? `${accent}10` : undefined,
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div
            className="mt-0.5 grid h-10 w-10 shrink-0 place-items-center rounded-2xl border"
            style={{
              borderColor: `${accent}28`,
              backgroundColor: `${accent}12`,
              color: accent,
            }}
          >
            <Stethoscope className="h-4 w-4" />
          </div>
          <div className="min-w-0">
            <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[var(--text-muted)]">{categoryLabel}</div>
            <h3 className="mt-1 line-clamp-2 text-[15px] font-semibold tracking-[-0.02em] text-[var(--text-strong)]">
              {template.name}
            </h3>
          </div>
        </div>
        <span
          className={cn(
            'grid h-6 w-6 shrink-0 place-items-center rounded-full border transition',
            selected || added ? 'border-transparent text-white' : 'border-[var(--border-soft)] bg-white text-[var(--text-muted)]',
          )}
          style={{
            backgroundColor: selected || added ? accent : undefined,
          }}
        >
          <Check className="h-3.5 w-3.5" />
        </span>
      </div>

      <p className="mt-3 line-clamp-2 text-sm leading-7 text-[var(--text-muted)]">{template.description}</p>

      <div className="mt-4 flex items-center justify-between gap-3">
        <div className="font-semibold text-[var(--text-strong)]">{formatServicePrice(template)}</div>
        <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--text-muted)]">
          {template.durationMinutes} min
        </div>
      </div>

      <div
        className="mt-3 text-xs font-semibold"
        style={{
          color: added ? accent : selected ? accent : 'var(--brand-strong)',
        }}
      >
        {added ? 'Added to your catalog' : selected ? 'Selected to add' : 'Click to add'}
      </div>
    </button>
  )
}

function CatalogGroup({
  categoryKey,
  label,
  templates,
  selectedKeys,
  activeTemplateKeys,
  onToggle,
  onSelectAll,
}: {
  categoryKey: ServiceCatalogCategoryKey
  label: string
  templates: ServiceCatalogTemplate[]
  selectedKeys: Set<string>
  activeTemplateKeys: Set<string>
  onToggle: (template: ServiceCatalogTemplate) => void
  onSelectAll: (templates: ServiceCatalogTemplate[]) => void
}) {
  const accent = CATEGORY_ACCENTS[categoryKey]

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className="grid h-9 w-9 place-items-center rounded-2xl"
            style={{
              backgroundColor: `${accent}12`,
              color: accent,
            }}
          >
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-semibold text-[var(--text-strong)]">{label}</h3>
              <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
                {templates.length}
              </Badge>
            </div>
          </div>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="h-9 px-3 py-2 text-xs"
          onClick={() => onSelectAll(templates)}
        >
          Select all
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const selected = selectedKeys.has(template.key)
          const added = activeTemplateKeys.has(template.key)
          return (
            <CatalogCard
              key={template.key}
              template={template}
              categoryLabel={label}
              accent={accent}
              selected={selected}
              added={added}
              onToggle={() => onToggle(template)}
            />
          )
        })}
      </div>
    </div>
  )
}

function SearchField({
  value,
  onChange,
  placeholder,
}: {
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-muted)]" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="input-field w-full pl-10"
      />
    </div>
  )
}

function SelectionBar({
  selectedCount,
  onClear,
  onAddSelected,
  adding,
}: {
  selectedCount: number
  onClear: () => void
  onAddSelected: () => void
  adding: boolean
}) {
  return (
    <div className="sticky bottom-4 z-20 mt-6 rounded-[22px] border border-[rgba(15,118,110,0.16)] bg-[linear-gradient(135deg,#0a3940,#0f5f60)] px-4 py-4 text-white shadow-[0_24px_60px_-40px_rgba(15,118,110,0.7)]">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="mt-0.5 grid h-10 w-10 place-items-center rounded-2xl bg-white/10 text-white">
            <Check className="h-4 w-4" />
          </div>
          <div>
            <div className="text-sm font-semibold">{selectedCount} services selected</div>
            <div className="text-xs text-white/75">Click &quot;Add&quot; to add them to your catalog.</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            onClick={onClear}
            className="h-10 px-4 py-2 text-white hover:bg-white/20 hover:text-white"
          >
            Clear
          </Button>
          <Button
            type="button"
            onClick={onAddSelected}
            disabled={adding || selectedCount === 0}
            className="h-10 gap-2 bg-white/10 px-4 py-2 text-white hover:bg-white/20 disabled:opacity-50"
          >
            {adding ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
            Add All {selectedCount}
          </Button>
        </div>
      </div>
    </div>
  )
}

export function ServicesManager({
  initialServices,
  businessId,
}: {
  initialServices: ClinicService[]
  businessId: string
}) {
  const [services, setServices] = useState(initialServices)
  const [selectedCategory, setSelectedCategory] = useState<'all' | ServiceCatalogCategoryKey>('all')
  const [catalogSearch, setCatalogSearch] = useState('')
  const [selectedTemplateKeys, setSelectedTemplateKeys] = useState<string[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<'create' | 'edit'>('create')
  const [dialogService, setDialogService] = useState<ClinicService | null>(null)
  const [addingSelected, setAddingSelected] = useState(false)
  const [toasts, setToasts] = useState<ManagerToast[]>([])

  const activeTemplateKeys = new Set(services.map((service) => normalizeServiceKey(service.name)))
  const activeCount = services.filter((service) => service.active).length
  const selectedTemplateKeySet = new Set(selectedTemplateKeys)

  const visibleTemplates = SERVICE_CATALOG_TEMPLATES.filter((template) => {
    const search = catalogSearch.trim().toLowerCase()
    const matchesSearch =
      !search ||
      `${template.name} ${template.description}`.toLowerCase().includes(search)
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const visibleGroups = SERVICE_CATALOG_CATEGORIES.filter((category) => category.key !== 'all')
    .map((category) => ({
      ...category,
      templates: visibleTemplates.filter((template) => template.category === category.key),
    }))
    .filter((group) => group.templates.length > 0)

  function pushToast(toast: Omit<ManagerToast, 'id'>) {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, ...toast }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3600)
  }

  function openCreate() {
    setDialogMode('create')
    setDialogService(null)
    setDialogOpen(true)
  }

  function openEdit(service: ClinicService) {
    setDialogMode('edit')
    setDialogService(service)
    setDialogOpen(true)
  }

  async function handleDelete(service: ClinicService) {
    if (!window.confirm(`Desactivar ${service.name}? Esto mantiene el servicio pero lo saca del catalogo activo.`)) return
    const supabase = createClient()
    const updated = await deleteClinicService(supabase, businessId, service.id)
    setServices((current) => current.map((item) => (item.id === updated.id ? updated : item)))
    setSelectedTemplateKeys((current) => current.filter((key) => key !== normalizeServiceKey(service.name)))
    pushToast({
      title: 'Servicio desactivado',
      message: `${service.name} ahora esta inactivo y oculto de los flujos activos de reserva.`,
      tone: 'slate',
    })
  }

  function handleSaved(service: ClinicService) {
    setServices((current) => {
      const exists = current.some((item) => item.id === service.id)
      const next = exists ? current.map((item) => (item.id === service.id ? service : item)) : [...current, service]
      return sortServices(next)
    })
  }

  function toggleTemplate(template: ServiceCatalogTemplate) {
    setSelectedTemplateKeys((current) =>
      current.includes(template.key) ? current.filter((key) => key !== template.key) : [...current, template.key],
    )
  }

  function selectGroup(templates: ServiceCatalogTemplate[]) {
    setSelectedTemplateKeys((current) => {
      const next = new Set(current)
      templates.forEach((template) => next.add(template.key))
      return Array.from(next)
    })
  }

  function clearSelection() {
    setSelectedTemplateKeys([])
  }

  async function addSelectedTemplates() {
    const selectedTemplates = SERVICE_CATALOG_TEMPLATES.filter((template) => selectedTemplateKeySet.has(template.key))
    const templatesToCreate = selectedTemplates.filter((template) => !activeTemplateKeys.has(template.key))

    if (templatesToCreate.length === 0) {
      pushToast({
        title: 'Nothing new to add',
        message: 'The selected services are already in your catalog.',
        tone: 'amber',
      })
      return
    }

    setAddingSelected(true)
    try {
      const supabase = createClient()
      const baseSortOrder = services.length
      const created = await Promise.all(
        templatesToCreate.map((template, index) =>
          createClinicService(supabase, businessId, {
            name: template.name,
            description: template.description,
            durationMinutes: template.durationMinutes,
            priceType: template.priceType,
            price: template.price ?? null,
            priceMin: template.priceMin ?? null,
            priceMax: template.priceMax ?? null,
            currency: 'USD',
            active: true,
            color: CATEGORY_ACCENTS[template.category],
            instructions: buildServiceInstructions(template.name, template.description),
            sortOrder: baseSortOrder + index,
          }),
        ),
      )

      setServices((current) => sortServices([...current, ...created]))
      clearSelection()
      pushToast({
        title: created.length === 1 ? 'Service added' : 'Services added',
        message: `${created.length} service${created.length === 1 ? '' : 's'} added to your catalog.`,
        tone: 'emerald',
      })
    } catch (error) {
      pushToast({
        title: 'Could not add services',
        message: error instanceof Error ? error.message : 'Please try again.',
        tone: 'rose',
      })
    } finally {
      setAddingSelected(false)
    }
  }

  const topSubtitle = `${services.length} services in your catalog`

  return (
    <div className="space-y-8">
      <ServicesHeader
        serviceCount={services.length}
        activeCount={activeCount}
        onOpenCreate={openCreate}
      />

      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-5">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Healthcare Services</div>
            <h3 className="mt-1 text-2xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              {topSubtitle}
            </h3>
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus className="h-4 w-4" />
            Custom Service
          </Button>
        </div>

        <div className="divide-y divide-[var(--border-soft)]">
          {services.length === 0 ? (
            <div className="px-5 py-10">
              <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[rgba(15,118,110,0.04)] px-6 py-8 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[rgba(15,118,110,0.1)] text-[var(--brand-strong)]">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-[var(--text-strong)]">No services yet</h4>
                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                  Add a custom service or choose from the catalog below to start building the booking flow.
                </p>
                <Button onClick={openCreate} className="mt-5 gap-2">
                  <Plus className="h-4 w-4" />
                  Create your first service
                </Button>
              </div>
            </div>
          ) : (
            services.map((service) => (
              <ServiceRow
                key={service.id}
                service={service}
                onEdit={() => openEdit(service)}
                onDelete={() => void handleDelete(service)}
              />
            ))
          )}
        </div>
      </SurfaceCard>

      <SurfaceCard className="overflow-hidden">
        <div className="border-b border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(15,118,110,0.08),rgba(255,255,255,0.92))] px-5 py-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Service Catalog</div>
              <h3 className="mt-1 text-2xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                73 services across 13 specialties
              </h3>
              <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                Click cards to select services, then add them to your clinic catalog in one batch.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
                {selectedTemplateKeys.length} selected
              </Badge>
              <Button
                type="button"
                onClick={addSelectedTemplates}
                disabled={addingSelected || selectedTemplateKeys.length === 0}
                className="gap-2"
              >
                {addingSelected ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                {selectedTemplateKeys.length > 0 ? `Add ${selectedTemplateKeys.length} Selected` : 'Add Selected'}
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-5 px-5 py-5">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto]">
            <SearchField
              value={catalogSearch}
              onChange={setCatalogSearch}
              placeholder="Search services..."
            />
            <Button
              type="button"
              variant="secondary"
              className="h-11 px-4 py-2 text-sm"
              onClick={clearSelection}
              disabled={selectedTemplateKeys.length === 0}
            >
              Clear selection
            </Button>
          </div>

          <div className="flex flex-wrap gap-2">
            {SERVICE_CATALOG_CATEGORIES.map((category) => {
              const active = selectedCategory === category.key
              const count =
                category.key === 'all'
                  ? SERVICE_CATALOG_TEMPLATES.length
                  : SERVICE_CATALOG_TEMPLATES.filter((template) => template.category === category.key).length
              const labelColor =
                category.key === 'all' ? 'var(--brand-strong)' : CATEGORY_ACCENTS[category.key]

              return (
                <button
                  key={category.key}
                  type="button"
                  onClick={() => setSelectedCategory(category.key)}
                  className={cn(
                    'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
                    active ? 'shadow-[0_14px_32px_-24px_rgba(15,118,110,0.5)]' : 'hover:bg-white',
                  )}
                  style={{
                    borderColor: active ? labelColor : 'var(--border-soft)',
                    backgroundColor: active ? `${labelColor}12` : 'rgba(255,255,255,0.88)',
                    color: active ? labelColor : 'var(--text-muted)',
                  }}
                  aria-pressed={active}
                >
                  {category.label}
                  <span className="rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-bold text-[var(--text-strong)]">
                    {count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="space-y-8">
            {visibleGroups.length === 0 ? (
              <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[rgba(15,118,110,0.04)] px-6 py-10 text-center text-sm text-[var(--text-muted)]">
                No services match your search.
              </div>
            ) : (
              visibleGroups.map((group) => (
                <CatalogGroup
                  key={group.key}
                  categoryKey={group.key as ServiceCatalogCategoryKey}
                  label={group.label}
                  templates={group.templates}
                  selectedKeys={selectedTemplateKeySet}
                  activeTemplateKeys={activeTemplateKeys}
                  onToggle={toggleTemplate}
                  onSelectAll={selectGroup}
                />
              ))
            )}
          </div>

          {selectedTemplateKeys.length > 0 ? (
            <SelectionBar
              selectedCount={selectedTemplateKeys.length}
              onClear={clearSelection}
              onAddSelected={() => void addSelectedTemplates()}
              adding={addingSelected}
            />
          ) : null}
        </div>
      </SurfaceCard>

      <ServiceFormDialog
        open={dialogOpen}
        mode={dialogMode}
        service={dialogService}
        businessId={businessId}
        sortOrderBase={services.length}
        onClose={() => setDialogOpen(false)}
        onSaved={handleSaved}
        pushToast={pushToast}
      />

      <div className="fixed bottom-6 right-6 z-50 flex w-[min(380px,calc(100vw-1.5rem))] flex-col gap-3">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            title={toast.title}
            message={toast.message}
            tone={toast.tone ?? 'teal'}
            onClose={() => setToasts((current) => current.filter((item) => item.id !== toast.id))}
          />
        ))}
      </div>
    </div>
  )
}
