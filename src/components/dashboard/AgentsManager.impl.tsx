'use client'

import { useEffect, useState } from 'react'
import {
  Activity,
  ArrowRight,
  Bot,
  Check,
  Eye,
  Loader2,
  PauseCircle,
  PencilLine,
  Plus,
  Play,
  Sparkles,
  Scissors,
  Trash2,
  WandSparkles,
} from 'lucide-react'

import { DEFAULT_WELCOME_MESSAGE } from '@/constants'
import { createClient } from '@/lib/supabase/client'
import { cn, formatCurrency, toTitleCase } from '@/lib/utils'
import type { AiAgent, Service } from '@/types'
import { createAgent, deleteAgent, setAgentStatus, updateAgent } from '@/services/agents'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Toast from '@/components/ui/Toast'
import { MetricCard, SectionEyebrow, SectionHeading, StatusBadge, SurfaceCard } from '@/components/dashboard/shared'
import {
  AGENT_TEMPLATES,
  DEFAULT_AGENT_PROMPT,
  PERSONALITY_OPTIONS,
  SENSITIVITY_OPTIONS,
  TEMPLATE_FILTERS,
  VOICE_OPTIONS,
  getTemplateCategoryLabel,
  matchTemplateServiceIds,
  type AgentSensitivityPreset,
  type AgentTemplate,
  type AgentTemplateCategory,
} from '@/components/dashboard/agent-templates'

type ToastTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

type ManagerToast = {
  id: string
  title: string
  message?: string
  tone?: ToastTone
}

type WizardFormState = {
  name: string
  title: string
  specialty: string
  voice: string
  personality: string
  sensitivity: AgentSensitivityPreset
  greetingMessage: string
  systemPrompt: string
  templateKey: string | null
}

const STATUS_TONE: Record<AiAgent['status'], 'emerald' | 'amber' | 'slate'> = {
  live: 'emerald',
  paused: 'amber',
  draft: 'slate',
}

const STATUS_LABEL: Record<AiAgent['status'], string> = {
  live: 'Active',
  paused: 'Paused',
  draft: 'Draft',
}

const STATUS_PRIORITY: Record<AiAgent['status'], number> = {
  live: 0,
  paused: 1,
  draft: 2,
}

function getAgentServiceNames(agent: AiAgent, services: Service[]) {
  const map = new Map(services.map((service) => [service.id, service] as const))
  const labels = (agent.assignedServiceIds ?? [])
    .map((serviceId) => map.get(serviceId))
    .filter((service): service is Service => Boolean(service))
    .map((service) => service.name)

  return labels
}

function getVoiceLabel(value: string) {
  return VOICE_OPTIONS.find((option) => option.value === value)?.label ?? toTitleCase(value)
}

function getSensitivityNumeric(preset: AgentSensitivityPreset) {
  return SENSITIVITY_OPTIONS.find((option) => option.value === preset)?.numeric ?? 0.5
}

function getSensitivityLabel(preset: AgentSensitivityPreset) {
  return SENSITIVITY_OPTIONS.find((option) => option.value === preset)?.label ?? 'Medium - Balanced'
}

function pickSensitivityPreset(value: number) {
  if (value <= 0.33) return 'gentle'
  if (value >= 0.66) return 'decisive'
  return 'balanced'
}

function sortAgents(agents: AiAgent[]) {
  return [...agents].sort((a, b) => {
    const statusDiff = STATUS_PRIORITY[a.status] - STATUS_PRIORITY[b.status]
    if (statusDiff !== 0) return statusDiff
    return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
  })
}

function createWizardSeed(agent: AiAgent | null, template: AgentTemplate | null) {
  if (agent) {
    return {
      name: agent.name,
      title: agent.title ?? '',
      specialty: agent.specialty ?? '',
      voice: agent.voice,
      personality: agent.personality,
      sensitivity: pickSensitivityPreset(agent.sensitivity),
      greetingMessage: agent.greetingMessage,
      systemPrompt: agent.systemPrompt || DEFAULT_AGENT_PROMPT,
      templateKey: agent.templateKey ?? null,
    } satisfies WizardFormState
  }

  if (template) {
    return {
      name: `${template.name} - ${template.title}`,
      title: template.title,
      specialty: template.specialty,
      voice: template.voice,
      personality: template.personality,
      sensitivity: template.sensitivity,
      greetingMessage: template.greetingMessage,
      systemPrompt: template.systemPrompt,
      templateKey: template.key,
    } satisfies WizardFormState
  }

  return {
    name: '',
    title: 'Front Desk Receptionist',
    specialty: 'General Practice',
    voice: 'nova',
    personality: 'Professional',
    sensitivity: 'balanced',
    greetingMessage: DEFAULT_WELCOME_MESSAGE,
    systemPrompt: DEFAULT_AGENT_PROMPT,
    templateKey: null,
  } satisfies WizardFormState
}

function TemplateBadge({ template }: { template: AgentTemplate }) {
  return (
    <Badge tone={template.badgeTone} className="bg-white/85 text-[10px] tracking-[0.22em]">
      {template.badge}
    </Badge>
  )
}

function AgentPreviewModal({
  template,
  alreadyActive,
  onClose,
  onActivate,
}: {
  template: AgentTemplate | null
  alreadyActive: boolean
  onClose: () => void
  onActivate: () => void
}) {
  if (!template) return null

  return (
    <Modal
      open
      onClose={onClose}
      title={`${template.name} - ${template.title}`}
      description={`${template.specialty} • ${getTemplateCategoryLabel(template.category)}`}
      className="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="rounded-[24px] border border-[var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(247,240,231,0.76))] p-5">
          <div className="flex flex-wrap items-center gap-2">
            <TemplateBadge template={template} />
            {alreadyActive ? <StatusBadge tone="emerald">Already Active</StatusBadge> : <StatusBadge tone="slate">Template Preview</StatusBadge>}
          </div>

          <div className="mt-5 rounded-[22px] border border-[var(--border-soft)] bg-white/85 p-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Opening Greeting</div>
            <p className="mt-3 text-sm leading-7 text-[var(--text-strong)]">{template.greetingMessage}</p>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <SurfaceCard className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Capabilities</div>
            <div className="mt-4 flex flex-wrap gap-2">
              {template.capabilities.map((capability) => (
                <Badge key={capability} tone="slate" className="bg-[rgba(15,118,110,0.06)] normal-case tracking-normal">
                  {capability}
                </Badge>
              ))}
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Voice Settings</div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)]">Voice</span>
                <span className="font-semibold text-[var(--text-strong)]">{getVoiceLabel(template.voice)}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)]">Personality</span>
                <span className="font-semibold text-[var(--text-strong)]">{template.personality}</span>
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="text-[var(--text-muted)]">Sensitivity</span>
                <span className="font-semibold text-[var(--text-strong)]">{getSensitivityLabel(template.sensitivity)}</span>
              </div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="p-5">
          <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Best For</div>
          <div className="mt-4 flex flex-wrap gap-2">
            {template.bestFor.map((item) => (
              <Badge key={item} tone="teal" className="bg-[rgba(15,118,110,0.08)] normal-case tracking-normal">
                {item}
              </Badge>
            ))}
          </div>
        </SurfaceCard>

        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border-soft)] pt-2">
          <Button variant="secondary" onClick={onClose}>
            Close
          </Button>
          <Button
            onClick={onActivate}
            disabled={alreadyActive}
            className={cn(
              'min-w-[180px]',
              alreadyActive && 'cursor-not-allowed opacity-60 hover:translate-y-0',
            )}
            style={{
              background: alreadyActive ? 'rgba(15,118,110,0.15)' : template.accent,
              color: alreadyActive ? 'var(--brand-strong)' : 'white',
            }}
          >
            {alreadyActive ? 'Already Active' : 'Activate This Agent'}
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function AgentWizardModal({
  open,
  mode,
  agent,
  template,
  services,
  businessId,
  onClose,
  onSaved,
  pushToast,
}: {
  open: boolean
  mode: 'create' | 'edit'
  agent: AiAgent | null
  template: AgentTemplate | null
  services: Service[]
  businessId: string
  onClose: () => void
  onSaved: (agent: AiAgent) => void
  pushToast: (toast: Omit<ManagerToast, 'id'>) => void
}) {
  const [step, setStep] = useState<1 | 2>(1)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [search, setSearch] = useState('')
  const [selectedServiceIds, setSelectedServiceIds] = useState<string[]>([])
  const [form, setForm] = useState<WizardFormState>(() => createWizardSeed(agent, template))

  useEffect(() => {
    if (!open) return
    setStep(1)
    setError(null)
    setSearch('')
    setForm(createWizardSeed(agent, template))
    setSelectedServiceIds(
      agent?.assignedServiceIds?.length
        ? agent.assignedServiceIds
        : template
          ? matchTemplateServiceIds(template, services)
          : services.filter((service) => service.active).slice(0, 2).map((service) => service.id),
    )
  }, [agent, open, services, template])

  if (!open) return null

  const visibleServices = services.filter((service) => {
    const haystack = `${service.name} ${service.description ?? ''} ${service.instructions ?? ''}`.toLowerCase()
    return haystack.includes(search.toLowerCase().trim())
  })

  function selectAllVisible() {
    setSelectedServiceIds((current) => {
      const next = new Set(current)
      visibleServices.forEach((service) => next.add(service.id))
      return Array.from(next)
    })
  }

  function clearVisible() {
    setSelectedServiceIds((current) => current.filter((serviceId) => !visibleServices.some((service) => service.id === serviceId)))
  }

  function toggleService(serviceId: string) {
    setSelectedServiceIds((current) =>
      current.includes(serviceId) ? current.filter((id) => id !== serviceId) : [...current, serviceId],
    )
  }

  async function saveConfiguration() {
    setError(null)
    if (!form.name.trim()) {
      setError('El nombre del agente es requerido')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const payload = {
        name: form.name.trim(),
        title: form.title.trim() || (template?.title ?? 'Front Desk Receptionist'),
        specialty: form.specialty.trim() || (template?.specialty ?? 'General Practice'),
        voice: form.voice,
        personality: form.personality,
        sensitivity: getSensitivityNumeric(form.sensitivity),
        greetingMessage: form.greetingMessage.trim() || DEFAULT_WELCOME_MESSAGE,
        systemPrompt: form.systemPrompt.trim() || DEFAULT_AGENT_PROMPT,
        assignedServiceIds: selectedServiceIds,
        templateKey: form.templateKey,
        status: mode === 'create' ? (template ? 'live' : 'draft') : agent?.status,
        language: agent?.language ?? 'en',
        callsHandled: agent?.callsHandled ?? 0,
      }

      const saved =
        mode === 'create'
          ? await createAgent(supabase, businessId, payload)
          : await updateAgent(supabase, businessId, agent!.id, payload)

      onSaved(saved)
      pushToast({
        title: mode === 'create' ? 'Agent created' : 'Agent updated',
        message: `${saved.name} is ready for booking and follow-up work.`,
        tone: 'emerald',
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el agente')
    } finally {
      setSaving(false)
    }
  }

  const buttonLabel =
    mode === 'edit' ? 'Save Changes' : template ? 'Activate Agent' : 'Create Agent'

  return (
    <Modal
      open
      onClose={onClose}
      title={mode === 'edit' ? 'Edit AI Agent' : 'Create AI Agent'}
      description={step === 1 ? 'Step 1 of 2 - Agent Settings' : 'Step 2 of 2 - Assign Services'}
      className="max-w-4xl"
    >
      <div className="space-y-5">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold',
                step === 1 ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'border-[var(--border-soft)] bg-white text-[var(--text-muted)]',
              )}
            >
              1
            </span>
            <span
              className={cn(
                'inline-flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold',
                step === 2 ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]' : 'border-[var(--border-soft)] bg-white text-[var(--text-muted)]',
              )}
            >
              2
            </span>
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            {selectedServiceIds.length} service{selectedServiceIds.length === 1 ? '' : 's'} selected
          </div>
        </div>

        {error ? (
          <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">{error}</div>
        ) : null}

        {step === 1 ? (
          <div className="space-y-5">
            <div className="grid gap-4 md:grid-cols-2">
              <Input
                label="Agent Name"
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                placeholder="Clara - General Receptionist"
              />
              <Select
                label="Voice"
                value={form.voice}
                onChange={(event) => setForm((current) => ({ ...current, voice: event.target.value }))}
              >
                {VOICE_OPTIONS.map((voice) => (
                  <option key={voice.value} value={voice.value}>
                    {voice.label} - {voice.description}
                  </option>
                ))}
              </Select>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Select
                label="Personality"
                value={form.personality}
                onChange={(event) => setForm((current) => ({ ...current, personality: event.target.value }))}
              >
                {PERSONALITY_OPTIONS.map((personality) => (
                  <option key={personality} value={personality}>
                    {personality}
                  </option>
                ))}
              </Select>

              <Select
                label="Interruption Sensitivity"
                value={form.sensitivity}
                onChange={(event) =>
                  setForm((current) => ({ ...current, sensitivity: event.target.value as AgentSensitivityPreset }))
                }
              >
                {SENSITIVITY_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label} - {option.detail}
                  </option>
                ))}
              </Select>
            </div>

            <Textarea
              label="Greeting Message"
              value={form.greetingMessage}
              onChange={(event) => setForm((current) => ({ ...current, greetingMessage: event.target.value }))}
              rows={3}
              hint="First thing the AI says when the call connects."
            />

            <Textarea
              label="System Prompt"
              value={form.systemPrompt}
              onChange={(event) => setForm((current) => ({ ...current, systemPrompt: event.target.value }))}
              rows={9}
              hint="Instructions for how the AI should behave, what it knows, and how it handles calls."
              className="font-mono text-xs"
            />

            <div className="flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-4">
              <div className="text-sm text-[var(--text-muted)]">
                The next step controls which services this agent can discuss.
              </div>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button onClick={() => setStep(2)}>
                  Next: Assign Services
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-[24px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.04)] px-4 py-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-sm font-semibold text-[var(--text-strong)]">Which services can this agent discuss?</div>
                  <p className="mt-1 text-sm text-[var(--text-muted)]">
                    The AI will only recommend and answer questions about the services you select here.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="secondary" onClick={selectAllVisible}>
                    Select all
                  </Button>
                  <Button variant="ghost" onClick={clearVisible}>
                    Clear
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-[1fr_auto]">
              <Input
                label="Filter services"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search services..."
              />
              <div className="flex items-end">
                <Badge tone="slate" className="h-fit bg-white/90 normal-case tracking-normal">
                  {selectedServiceIds.length} selected
                </Badge>
              </div>
            </div>

            <div className="max-h-[44vh] space-y-3 overflow-y-auto pr-1">
              {visibleServices.length === 0 ? (
                <div className="rounded-[22px] border border-dashed border-[var(--border-soft)] bg-white/70 px-4 py-8 text-center text-sm text-[var(--text-muted)]">
                  No services match your search.
                </div>
              ) : (
                visibleServices.map((service) => {
                  const active = selectedServiceIds.includes(service.id)
                  return (
                    <button
                      key={service.id}
                      type="button"
                      onClick={() => toggleService(service.id)}
                      className={cn(
                        'flex w-full items-center gap-4 rounded-[22px] border px-4 py-4 text-left transition',
                        active
                          ? 'border-[rgba(15,118,110,0.28)] bg-[rgba(15,118,110,0.07)]'
                          : 'border-[var(--border-soft)] bg-white/85 hover:bg-white',
                      )}
                    >
                      <span
                        className={cn(
                          'grid h-5 w-5 shrink-0 place-items-center rounded-full border',
                          active
                            ? 'border-[var(--brand)] bg-[var(--brand)] text-white'
                            : 'border-[var(--border-strong)] bg-white text-transparent',
                        )}
                      >
                        <Check className="h-3 w-3" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="font-semibold text-[var(--text-strong)]">{service.name}</div>
                          <Badge tone={service.active ? 'emerald' : 'slate'} className="bg-white/80 normal-case tracking-normal">
                            {service.active ? 'Active' : 'Inactive'}
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-[var(--text-muted)]">
                          {service.description ?? 'No description'} · {service.durationMinutes} min
                        </div>
                      </div>
                      <div className="text-right text-sm text-[var(--text-muted)]">
                        <div className="font-semibold text-[var(--text-strong)]">
                          {service.price != null ? formatCurrency(service.price, service.currency) : 'Contact'}
                        </div>
                        <div>{service.instructions ?? 'No extra instructions'}</div>
                      </div>
                    </button>
                  )
                })
              )}
            </div>

            <div className="flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-4">
              <Button variant="secondary" onClick={() => setStep(1)}>
                Back
              </Button>
              <div className="flex items-center gap-3">
                <Button variant="secondary" onClick={onClose}>
                  Cancel
                </Button>
                <Button
                  onClick={() => void saveConfiguration()}
                  disabled={saving}
                  className="min-w-[180px]"
                  style={{
                    background: 'linear-gradient(135deg, var(--brand), var(--brand-strong))',
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <WandSparkles className="mr-2 h-4 w-4" />
                      {buttonLabel}
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </Modal>
  )
}

function TemplateCard({
  template,
  active,
  onPreview,
  onActivate,
}: {
  template: AgentTemplate
  active: boolean
  onPreview: () => void
  onActivate: () => void
}) {
  return (
    <div
      className="relative overflow-hidden rounded-[28px] border border-[var(--border-soft)] bg-white p-5 shadow-[0_18px_54px_-40px_rgba(15,23,42,0.45)]"
      style={{ boxShadow: `0 20px 60px -44px ${template.accent}80` }}
    >
      <div className="absolute inset-x-0 top-0 h-1.5" style={{ background: template.accent }} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <TemplateBadge template={template} />
            {active ? <StatusBadge tone="emerald">Already Active</StatusBadge> : <StatusBadge tone="slate">Template</StatusBadge>}
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
            {template.name}
          </h3>
          <p className="mt-1 text-sm font-medium text-[var(--text-muted)]">{template.title}</p>
          <p className="mt-2 text-sm text-[var(--text-muted)]">{template.specialty}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-[16px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.06)]">
          <Sparkles className="h-5 w-5" style={{ color: template.accent }} />
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          {template.capabilities.slice(0, 4).map((capability) => (
            <div key={capability} className="flex items-center gap-2 text-sm text-[var(--text-strong)]">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: template.accent }} />
              {capability}
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2">
          {template.bestFor.slice(0, 2).map((item) => (
            <Badge key={item} tone="slate" className="bg-[rgba(15,23,42,0.03)] normal-case tracking-normal">
              {item}
            </Badge>
          ))}
        </div>

        <div className="grid gap-2 text-sm text-[var(--text-muted)]">
          <div className="flex items-center justify-between gap-3">
            <span>Voice</span>
            <span className="font-semibold text-[var(--text-strong)]">{getVoiceLabel(template.voice)}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Personality</span>
            <span className="font-semibold text-[var(--text-strong)]">{template.personality}</span>
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-center gap-3">
        <button
          type="button"
          onClick={onActivate}
          disabled={active}
          className={cn(
            'inline-flex flex-1 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-sm font-semibold text-white transition',
            active ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5',
          )}
          style={{ background: active ? 'rgba(15,118,110,0.22)' : template.accent }}
        >
          <Plus className="h-4 w-4" />
          {active ? 'Already Active' : 'Activate Agent'}
        </button>
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center justify-center gap-2 rounded-full border border-[var(--border-soft)] bg-white px-4 py-2.5 text-sm font-semibold text-[var(--text-strong)] transition hover:bg-[var(--panel-soft)]"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
      </div>
    </div>
  )
}

function AgentRow({
  agent,
  services,
  onEdit,
  onToggleStatus,
  onDelete,
}: {
  agent: AiAgent
  services: Service[]
  onEdit: () => void
  onToggleStatus: () => void
  onDelete: () => void
}) {
  const serviceNames = getAgentServiceNames(agent, services)

  return (
    <div className="grid gap-4 border-b border-[var(--border-soft)] px-5 py-4 last:border-b-0 md:grid-cols-[1.5fr_0.9fr_1.2fr_0.7fr_0.7fr_auto] md:items-center">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[16px] bg-[linear-gradient(135deg,var(--brand),var(--brand-strong))] text-sm font-bold text-white">
          {agent.name
            .split(' ')
            .map((part) => part[0])
            .slice(0, 2)
            .join('')}
        </div>
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-semibold text-[var(--text-strong)]">{agent.name}</div>
            <StatusBadge tone={STATUS_TONE[agent.status]}>{STATUS_LABEL[agent.status]}</StatusBadge>
          </div>
          <div className="mt-1 text-sm text-[var(--text-muted)]">
            {agent.title ?? agent.specialty ?? 'Booking agent'}
          </div>
        </div>
      </div>

      <div className="text-sm text-[var(--text-muted)]">
        <div className="font-semibold text-[var(--text-strong)]">{getVoiceLabel(agent.voice)}</div>
        <div>{agent.personality}</div>
      </div>

      <div className="flex flex-wrap gap-2">
        {serviceNames.length === 0 ? (
          <span className="text-sm text-[var(--text-muted)]">No services</span>
        ) : (
          serviceNames.slice(0, 3).map((serviceName) => (
            <Badge key={serviceName} tone="slate" className="bg-[rgba(15,23,42,0.03)] normal-case tracking-normal">
              {serviceName}
            </Badge>
          ))
        )}
      </div>

      <div className="text-sm">
        <div className="font-semibold text-[var(--text-strong)]">{agent.callsHandled}</div>
        <div className="text-[var(--text-muted)]">Calls</div>
      </div>

      <div className="text-sm">
        <div className="font-semibold text-[var(--text-strong)]">{getSensitivityLabel(pickSensitivityPreset(agent.sensitivity))}</div>
        <div className="text-[var(--text-muted)]">Sensitivity</div>
      </div>

      <div className="flex items-center justify-end gap-2">
        <Button
          href={`/dashboard/agents/${agent.id}?mode=test-live`}
          variant="secondary"
          className="h-10 px-4 py-2 text-xs"
        >
          <Play className="mr-2 h-4 w-4" />
          Test
        </Button>
        <button
          type="button"
          onClick={onToggleStatus}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-strong)] transition hover:bg-[var(--panel-soft)]"
          aria-label={agent.status === 'live' ? 'Pause agent' : 'Activate agent'}
        >
          {agent.status === 'live' ? <PauseCircle className="h-4 w-4" /> : <Play className="h-4 w-4" />}
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-strong)] transition hover:bg-[var(--panel-soft)]"
          aria-label="Edit agent"
        >
          <PencilLine className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--coral)] transition hover:bg-[rgba(251,113,133,0.08)]"
          aria-label="Delete agent"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  )
}

export function AgentsManager({
  initialAgents,
  businessId,
  services,
}: {
  initialAgents: AiAgent[]
  businessId: string
  services: Service[]
}) {
  const [agents, setAgents] = useState(initialAgents)
  const [category, setCategory] = useState<AgentTemplateCategory>('all')
  const [previewTemplateKey, setPreviewTemplateKey] = useState<string | null>(null)
  const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create')
  const [wizardAgent, setWizardAgent] = useState<AiAgent | null>(null)
  const [wizardTemplate, setWizardTemplate] = useState<AgentTemplate | null>(null)
  const [wizardOpen, setWizardOpen] = useState(false)
  const [toasts, setToasts] = useState<ManagerToast[]>([])

  const templateCounts = TEMPLATE_FILTERS.reduce<Record<AgentTemplateCategory, number>>(
    (accumulator, filter) => {
      accumulator[filter.key] = filter.key === 'all' ? AGENT_TEMPLATES.length : AGENT_TEMPLATES.filter((template) => template.category === filter.key).length
      return accumulator
    },
    {
      all: AGENT_TEMPLATES.length,
      'front-desk': 0,
      'client-care': 0,
      'premium-concierge': 0,
      'spa-wellness': 0,
      'kids-family': 0,
      'walk-in': 0,
      barbering: 0,
      'digital-booking': 0,
    },
  )

  const sortedAgents = sortAgents(agents)
  const liveAgents = agents.filter((agent) => agent.status === 'live')
  const totalCallsHandled = agents.reduce((total, agent) => total + (agent.callsHandled ?? 0), 0)
  const uniqueAssignedServiceCount = new Set(agents.flatMap((agent) => agent.assignedServiceIds ?? [])).size

  const activeTemplateKeySet = new Set(
    agents
      .filter((agent) => agent.status === 'live' && agent.templateKey)
      .map((agent) => agent.templateKey as string),
  )

  const visibleTemplates = AGENT_TEMPLATES.filter(
    (template) => category === 'all' || template.category === category,
  )

  function pushToast(toast: Omit<ManagerToast, 'id'>) {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, ...toast }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3600)
  }

  function openCreate(template: AgentTemplate | null = null) {
    setWizardMode('create')
    setWizardAgent(null)
    setWizardTemplate(template)
    setWizardOpen(true)
  }

  function openEdit(agent: AiAgent) {
    setWizardMode('edit')
    setWizardAgent(agent)
    setWizardTemplate(AGENT_TEMPLATES.find((template) => template.key === agent.templateKey) ?? null)
    setWizardOpen(true)
  }

  async function toggleStatus(agent: AiAgent) {
    const supabase = createClient()
    const nextStatus = agent.status === 'live' ? 'paused' : 'live'
    const updated = await setAgentStatus(supabase, businessId, agent.id, nextStatus)
    setAgents((current) => sortAgents(current.map((item) => (item.id === updated.id ? updated : item))))
    pushToast({
      title: nextStatus === 'live' ? 'Agent activated' : 'Agent deactivated',
      message: `${updated.name} is now ${STATUS_LABEL[nextStatus].toLowerCase()}.`,
      tone: nextStatus === 'live' ? 'emerald' : 'amber',
    })
  }

  async function removeAgent(agent: AiAgent) {
    if (!window.confirm(`Delete ${agent.name}?`)) return
    const supabase = createClient()
    await deleteAgent(supabase, businessId, agent.id)
    setAgents((current) => current.filter((item) => item.id !== agent.id))
    pushToast({
      title: 'Agent deleted',
      message: `${agent.name} has been removed from the business.`,
      tone: 'slate',
    })
  }

  function handleSavedAgent(saved: AiAgent) {
    setAgents((current) => {
      const exists = current.some((item) => item.id === saved.id)
      const next = exists ? current.map((item) => (item.id === saved.id ? saved : item)) : [saved, ...current]
      return sortAgents(next)
    })
  }

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={<SectionEyebrow>AI Agents</SectionEyebrow>}
        title="Agents, templates, and live testing"
        description="Build and activate the front-desk, triage, and specialist voice agents your business uses on the website and over the phone."
        actions={
          <Button onClick={() => openCreate()} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Agent
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Live Agents" value={String(liveAgents.length)} delta="Handling client calls" icon={Bot} tone="teal" />
        <MetricCard label="Templates" value={String(AGENT_TEMPLATES.length)} delta="Ready to activate" icon={Sparkles} tone="blue" />
        <MetricCard
          label="Assigned Services"
          value={String(uniqueAssignedServiceCount)}
          delta={`${services.filter((service) => service.active).length} active services`}
          icon={Scissors}
          tone="emerald"
        />
        <MetricCard label="Calls Handled" value={String(totalCallsHandled)} delta="Across all agents" icon={Activity} tone="amber" />
      </div>

      <SurfaceCard className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-4">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Active AI Agents</div>
            <h2 className="mt-1 text-2xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
              The business voice stack that answers, books, and follows up
            </h2>
          </div>
          <div className="flex items-center gap-2 text-sm text-[var(--text-muted)]">
            <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
              {sortedAgents.length} total
            </Badge>
          </div>
        </div>

        <div className="hidden border-b border-[var(--border-soft)] bg-[rgba(16,33,41,0.04)] px-5 py-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)] md:grid md:grid-cols-[1.5fr_0.9fr_1.2fr_0.7fr_0.7fr_auto]">
          <div>Agent</div>
          <div>Voice</div>
          <div>Services</div>
          <div>Calls</div>
          <div>Sensitivity</div>
          <div className="text-right">Actions</div>
        </div>

        <div>
          {sortedAgents.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[rgba(15,118,110,0.08)] text-[var(--brand-strong)]">
                <Bot className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-lg font-semibold text-[var(--text-strong)]">No agents yet</h3>
              <p className="mt-2 text-sm text-[var(--text-muted)]">Create the first AI receptionist or activate one of the templates below.</p>
              <div className="mt-5">
                <Button onClick={() => openCreate()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create First Agent
                </Button>
              </div>
            </div>
          ) : (
            sortedAgents.map((agent) => (
              <AgentRow
                key={agent.id}
                agent={agent}
                services={services}
                onEdit={() => openEdit(agent)}
                onToggleStatus={() => void toggleStatus(agent)}
                onDelete={() => void removeAgent(agent)}
              />
            ))
          )}
        </div>
      </SurfaceCard>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <SectionEyebrow>AI Agent Templates</SectionEyebrow>
          <div className="mt-3 text-sm text-[var(--text-muted)]">Choose a specialist and activate it in one click.</div>
        </div>
        <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
          {AGENT_TEMPLATES.length} agents available
        </Badge>
      </div>

      <div className="flex flex-wrap gap-2">
        {TEMPLATE_FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setCategory(item.key)}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition',
              category === item.key
                ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]'
                : 'border-[var(--border-soft)] bg-white/85 text-[var(--text-muted)] hover:bg-white',
            )}
          >
            {item.label}
            <span className="rounded-full bg-white/80 px-2 py-0.5 text-[11px] font-bold">
              {templateCounts[item.key]}
            </span>
          </button>
        ))}
      </div>

      <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-4">
        {visibleTemplates.map((template) => (
          <TemplateCard
            key={template.key}
            template={template}
            active={activeTemplateKeySet.has(template.key)}
            onPreview={() => setPreviewTemplateKey(template.key)}
            onActivate={() => openCreate(template)}
          />
        ))}
      </div>

      {previewTemplateKey ? (
        <AgentPreviewModal
          template={AGENT_TEMPLATES.find((template) => template.key === previewTemplateKey) ?? null}
          alreadyActive={activeTemplateKeySet.has(previewTemplateKey)}
          onClose={() => setPreviewTemplateKey(null)}
          onActivate={() => {
            const template = AGENT_TEMPLATES.find((item) => item.key === previewTemplateKey) ?? null
            setPreviewTemplateKey(null)
            if (template) openCreate(template)
          }}
        />
      ) : null}

      <AgentWizardModal
        open={wizardOpen}
        mode={wizardMode}
        agent={wizardAgent}
        template={wizardTemplate}
        services={services}
        businessId={businessId}
        onClose={() => setWizardOpen(false)}
        onSaved={handleSavedAgent}
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
