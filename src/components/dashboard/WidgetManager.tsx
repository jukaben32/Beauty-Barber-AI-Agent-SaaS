'use client'

import { useEffect, useState, type CSSProperties } from 'react'
import {
  ArrowRight,
  Check,
  ChevronDown,
  ChevronUp,
  Code2,
  Copy,
  Eye,
  Loader2,
  MonitorSmartphone,
  Palette,
  PencilLine,
  PhoneCall,
  Plus,
  Sparkles,
  Trash2,
} from 'lucide-react'

import { DEFAULT_APPOINTMENT_SLOT_MINUTES, DEFAULT_PRIMARY_COLOR, DEFAULT_SECONDARY_COLOR, DEFAULT_WIDGET_TONE, DEFAULT_WELCOME_MESSAGE } from '@/constants'
import type { AiAgent, Widget } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { cn, slugify, toTitleCase } from '@/lib/utils'
import { createWidget, deleteWidget, listWidgetsForBusiness, updateWidget, type WidgetListItem } from '@/services/widgets'
import Modal from '@/components/ui/Modal'
import Button from '@/components/ui/Button'
import Badge from '@/components/ui/Badge'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Toggle from '@/components/ui/Toggle'
import Toast from '@/components/ui/Toast'
import Tabs from '@/components/ui/Tabs'
import { MetricCard, SectionEyebrow, SectionHeading, StatusBadge, SurfaceCard, ValueCard, PhoneFrame } from '@/components/dashboard/shared'

type ToastTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

type ManagerToast = {
  id: string
  title: string
  message?: string
  tone?: ToastTone
}

type WidgetDraftState = {
  name: string
  agentId: string | null
  position: string
  theme: string
  primaryColor: string
  secondaryColor: string
  greetingMessage: string
  enabled: boolean
  tone: string
  slotDuration: number
  showBranding: boolean
  allowedOrigins: string[]
}

type WidgetPreviewModel = {
  name: string
  agentName: string | null
  position: string
  theme: string
  primaryColor: string
  secondaryColor: string
  greetingMessage: string
  enabled: boolean
}

type PreviewTarget = {
  model: WidgetPreviewModel
  sourceWidgetId?: string | null
  sourceAgentId?: string | null
}

type WidgetRecord = WidgetListItem

const CODE_TABS = [
  { label: 'Scripts', value: 'script' as const },
  { label: 'React / JSX', value: 'react' as const },
  { label: 'Full HTML', value: 'html' as const },
]

const POSITION_OPTIONS = [
  { value: 'bottom-right', label: 'Bottom Right', helper: 'Default corner placement' },
  { value: 'bottom-left', label: 'Bottom Left', helper: 'Friendly for sticky menus' },
  { value: 'top-right', label: 'Top Right', helper: 'Good for compact layouts' },
  { value: 'top-left', label: 'Top Left', helper: 'Useful for left-heavy pages' },
]

const THEME_OPTIONS = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
]

const COLOR_PRESETS = [
  { label: 'Teal', primary: '#0f766e', secondary: '#14b8a6' },
  { label: 'Blue', primary: '#2563eb', secondary: '#38bdf8' },
  { label: 'Violet', primary: '#7c3aed', secondary: '#8b5cf6' },
  { label: 'Amber', primary: '#ea580c', secondary: '#f59e0b' },
  { label: 'Rose', primary: '#db2777', secondary: '#ec4899' },
  { label: 'Green', primary: '#16a34a', secondary: '#22c55e' },
]

function hydrateWidget(widget: Widget, agents: AiAgent[]): WidgetRecord {
  return {
    ...widget,
    agentName: agents.find((agent) => agent.id === widget.agentId)?.name ?? null,
  }
}

function normalizeOrigin(origin: string) {
  return origin.replace(/\/+$/, '')
}

function escapeAttribute(value: string) {
  return value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;')
}

function createPreviewModel(widget: WidgetRecord): WidgetPreviewModel {
  return {
    name: widget.name,
    agentName: widget.agentName,
    position: widget.position,
    theme: widget.theme,
    primaryColor: widget.primaryColor,
    secondaryColor: widget.secondaryColor,
    greetingMessage: widget.welcomeMessage,
    enabled: widget.enabled,
  }
}

function createPreviewModelFromDraft(draft: WidgetDraftState, agentName: string | null): WidgetPreviewModel {
  return {
    name: draft.name,
    agentName,
    position: draft.position,
    theme: draft.theme,
    primaryColor: draft.primaryColor,
    secondaryColor: draft.secondaryColor,
    greetingMessage: draft.greetingMessage,
    enabled: draft.enabled,
  }
}

function getPositionLabel(value: string) {
  return POSITION_OPTIONS.find((option) => option.value === value)?.label ?? toTitleCase(value)
}

function getPositionStyle(position: string): { launcher: CSSProperties; panel: CSSProperties } {
  switch (position) {
    case 'bottom-left':
      return {
        launcher: { left: 18, bottom: 18 },
        panel: { left: 18, bottom: 92 },
      }
    case 'top-right':
      return {
        launcher: { right: 18, top: 18 },
        panel: { right: 18, top: 92 },
      }
    case 'top-left':
      return {
        launcher: { left: 18, top: 18 },
        panel: { left: 18, top: 92 },
      }
    case 'bottom-right':
    default:
      return {
        launcher: { right: 18, bottom: 18 },
        panel: { right: 18, bottom: 92 },
      }
  }
}

function createUniqueWidgetSlug(name: string, widgets: WidgetRecord[], currentWidgetId?: string | null) {
  const usedSlugs = new Set(widgets.filter((widget) => widget.id !== currentWidgetId).map((widget) => widget.slug))
  const baseSlug = slugify(name) || 'widget'
  if (!usedSlugs.has(baseSlug)) return baseSlug

  let suffix = 2
  while (usedSlugs.has(`${baseSlug}-${suffix}`)) {
    suffix += 1
  }
  return `${baseSlug}-${suffix}`
}

function buildWidgetScriptTag(widget: WidgetRecord, businessSlug: string, siteOrigin: string) {
  const base = normalizeOrigin(siteOrigin)
  return `<script src="${base}/api/widget-script" data-business-slug="${businessSlug}" data-widget-slug="${widget.slug}" data-position="${widget.position}" data-color="${widget.primaryColor}" data-secondary-color="${widget.secondaryColor}" data-theme="${widget.theme}" data-greeting="${escapeAttribute(widget.welcomeMessage)}"></script>`
}

function buildReactSnippet(widget: WidgetRecord, businessSlug: string, siteOrigin: string) {
  const base = normalizeOrigin(siteOrigin)
  return [
    'import Script from "next/script"',
    '',
    '<Script',
    `  src="${base}/api/widget-script"`,
    `  data-business-slug="${businessSlug}"`,
    `  data-widget-slug="${widget.slug}"`,
    `  data-position="${widget.position}"`,
    `  data-color="${widget.primaryColor}"`,
    `  data-secondary-color="${widget.secondaryColor}"`,
    `  data-theme="${widget.theme}"`,
    `  data-greeting="${escapeAttribute(widget.welcomeMessage)}"`,
    '  strategy="afterInteractive"',
    '/>',
  ].join('\n')
}

function buildFullHtmlSnippet(widget: WidgetRecord, businessSlug: string, siteOrigin: string) {
  const base = normalizeOrigin(siteOrigin)
  return [
    '<!doctype html>',
    '<html lang="en">',
    '  <head>',
    '    <meta charset="UTF-8" />',
    '    <meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    `    <title>${escapeAttribute(widget.name)}</title>`,
    '  </head>',
    '  <body>',
    '    <div id="app"></div>',
    `    <script src="${base}/api/widget-script" data-business-slug="${businessSlug}" data-widget-slug="${widget.slug}" data-position="${widget.position}" data-color="${widget.primaryColor}" data-secondary-color="${widget.secondaryColor}" data-theme="${widget.theme}" data-greeting="${escapeAttribute(widget.welcomeMessage)}"></script>`,
    '  </body>',
    '</html>',
  ].join('\n')
}

function buildCodeSnippet(tab: 'script' | 'react' | 'html', widget: WidgetRecord, businessSlug: string, siteOrigin: string) {
  if (tab === 'react') return buildReactSnippet(widget, businessSlug, siteOrigin)
  if (tab === 'html') return buildFullHtmlSnippet(widget, businessSlug, siteOrigin)
  return buildWidgetScriptTag(widget, businessSlug, siteOrigin)
}

function getDefaultDraft(widget: WidgetRecord | null, agents: AiAgent[], businessName: string) {
  const fallbackAgent = agents.find((agent) => agent.status === 'live') ?? agents[0] ?? null
  const selectedAgent = widget?.agentId ? agents.find((agent) => agent.id === widget.agentId) ?? null : fallbackAgent

  return {
    name: widget?.name ?? `${selectedAgent?.name ?? businessName} Widget`,
    agentId: widget?.agentId ?? selectedAgent?.id ?? null,
    position: widget?.position ?? 'bottom-right',
    theme: widget?.theme ?? 'light',
    primaryColor: widget?.primaryColor ?? DEFAULT_PRIMARY_COLOR,
    secondaryColor: widget?.secondaryColor ?? DEFAULT_SECONDARY_COLOR,
    greetingMessage: widget?.welcomeMessage ?? DEFAULT_WELCOME_MESSAGE,
    enabled: widget?.enabled ?? true,
    tone: widget?.tone ?? DEFAULT_WIDGET_TONE,
    slotDuration: widget?.slotDuration ?? DEFAULT_APPOINTMENT_SLOT_MINUTES,
    showBranding: widget?.showBranding ?? true,
    allowedOrigins: widget?.allowedOrigins ?? [],
  } satisfies WidgetDraftState
}

function createWidgetPreviewStage({
  preview,
  compact = false,
}: {
  preview: WidgetPreviewModel
  compact?: boolean
}) {
  const dark = preview.theme === 'dark'
  const placement = getPositionStyle(preview.position)

  return (
    <div
      className="relative overflow-hidden rounded-[28px] border"
      style={{
        minHeight: compact ? 300 : 420,
        borderColor: dark ? 'rgba(255,255,255,0.08)' : 'var(--border-soft)',
        background: dark
          ? 'linear-gradient(180deg, #0f172a 0%, #111827 100%)'
          : 'linear-gradient(180deg, rgba(255,255,255,0.98), rgba(243,250,248,0.96))',
        color: dark ? 'white' : 'var(--text-strong)',
      }}
    >
      <div
        className="absolute inset-0 opacity-70"
        style={{
          background: dark
            ? 'radial-gradient(circle at top left, rgba(20,184,166,0.18), transparent 36%), radial-gradient(circle at bottom right, rgba(124,58,237,0.14), transparent 32%)'
            : 'radial-gradient(circle at top left, rgba(15,118,110,0.10), transparent 36%), radial-gradient(circle at bottom right, rgba(124,58,237,0.08), transparent 32%)',
        }}
      />

      {/* `absolute inset-0` instead of `h-full`: the outer stage only sets
          minHeight (no explicit height), and height:100% doesn't resolve
          against an auto-height parent - it was collapsing this layer down
          to its static content's height, which pulled the bottom-anchored
          launcher button and panel up near the top of the visually taller
          outer box instead of to its actual bottom edge. */}
      <div className="absolute inset-0 p-4">
        <div className="absolute left-4 top-4 text-[11px] font-semibold uppercase tracking-[0.24em] text-current/48">
          Your website here
        </div>

        <div
          className="absolute z-10"
          style={placement.panel}
        >
          <div
            className="w-[250px] rounded-[24px] border p-4 shadow-[0_22px_54px_-28px_rgba(15,23,42,0.55)]"
            style={{
              borderColor: dark ? 'rgba(255,255,255,0.08)' : 'rgba(15,23,42,0.08)',
              background: dark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.94)',
              backdropFilter: 'blur(14px)',
            }}
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-current/48">
                  {preview.agentName ?? 'AI Assistant'}
                </div>
                <div className="mt-1 text-sm font-semibold">
                  {preview.name}
                </div>
              </div>
              <StatusBadge tone={preview.enabled ? 'emerald' : 'slate'}>
                {preview.enabled ? 'Live' : 'Disabled'}
              </StatusBadge>
            </div>

            <div
              className="mt-4 rounded-[20px] px-4 py-3 text-sm leading-6"
              style={{
                background: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,118,110,0.06)',
                color: dark ? 'rgba(255,255,255,0.92)' : 'var(--text-strong)',
              }}
            >
              {preview.greetingMessage}
            </div>

            <div className="mt-4 grid gap-2 text-xs">
              {['Book appointment', 'Ask a question', 'Request a callback'].map((item) => (
                <div
                  key={item}
                  className="flex items-center gap-2 rounded-full border px-3 py-2"
                  style={{
                    borderColor: dark ? 'rgba(255,255,255,0.08)' : 'var(--border-soft)',
                    background: dark ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.82)',
                  }}
                >
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ background: preview.secondaryColor }}
                  />
                  {item}
                </div>
              ))}
            </div>
          </div>
        </div>

        <button
          type="button"
          className="absolute grid h-14 w-14 place-items-center rounded-full text-white shadow-[0_22px_44px_-20px_rgba(15,23,42,0.55)]"
          style={{
            ...placement.launcher,
            background: `linear-gradient(135deg, ${preview.primaryColor}, ${preview.secondaryColor})`,
          }}
        >
          <PhoneCall className="h-5 w-5" />
        </button>
      </div>
    </div>
  )
}

function WidgetPreviewModal({
  target,
  onClose,
  onPrimaryAction,
}: {
  target: PreviewTarget | null
  onClose: () => void
  onPrimaryAction: () => void
}) {
  if (!target) return null

  const { model } = target
  const previewTitle = target.sourceWidgetId ? 'Widget Preview' : `${model.agentName ?? 'Template'} Preview`
  const actionLabel = target.sourceWidgetId ? 'Edit Widget' : 'Create Widget'

  return (
    <Modal open title={previewTitle} description={`${model.position} · ${model.theme} theme`} onClose={onClose} className="max-w-5xl">
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <SurfaceCard className="p-4">
          {createWidgetPreviewStage({ preview: model })}
        </SurfaceCard>

        <div className="space-y-4">
          <SurfaceCard className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Current Setup
            </div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Widget</span>
                <span className="font-semibold text-[var(--text-strong)]">{model.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Agent</span>
                <span className="font-semibold text-[var(--text-strong)]">{model.agentName ?? 'No agent selected'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Position</span>
                <span className="font-semibold text-[var(--text-strong)]">{getPositionLabel(model.position)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Theme</span>
                <span className="font-semibold text-[var(--text-strong)]">{toTitleCase(model.theme)}</span>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Launcher Color
            </div>
            <div className="mt-4 flex items-center gap-3">
              <span className="h-10 w-10 rounded-[16px]" style={{ background: model.primaryColor }} />
              <div>
                <div className="text-sm font-semibold text-[var(--text-strong)]">{model.primaryColor}</div>
                <div className="text-xs text-[var(--text-muted)]">Secondary accent {model.secondaryColor}</div>
              </div>
            </div>
          </SurfaceCard>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1 justify-center">
              Close
            </Button>
            <Button onClick={onPrimaryAction} className="flex-1 justify-center">
              {actionLabel}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

function WidgetWizardModal({
  open,
  mode,
  sourceWidget,
  sourceAgent,
  widgets,
  agents,
  businessId,
  businessName,
  onClose,
  onSaved,
  pushToast,
}: {
  open: boolean
  mode: 'create' | 'edit'
  sourceWidget: WidgetRecord | null
  sourceAgent: AiAgent | null
  widgets: WidgetRecord[]
  agents: AiAgent[]
  businessId: string
  businessName: string
  onClose: () => void
  onSaved: (widget: WidgetRecord) => void
  pushToast: (toast: Omit<ManagerToast, 'id'>) => void
}) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [form, setForm] = useState<WidgetDraftState>(() => getDefaultDraft(sourceWidget, agents, businessName))

  const [syncedKey, setSyncedKey] = useState({ agents, businessName, open, sourceAgent, sourceWidget })
  if (
    syncedKey.agents !== agents ||
    syncedKey.businessName !== businessName ||
    syncedKey.open !== open ||
    syncedKey.sourceAgent !== sourceAgent ||
    syncedKey.sourceWidget !== sourceWidget
  ) {
    setSyncedKey({ agents, businessName, open, sourceAgent, sourceWidget })
    if (open) {
      const selectedWidget = sourceWidget ?? null
      const selectedAgent = sourceAgent ?? (selectedWidget?.agentId ? agents.find((agent) => agent.id === selectedWidget.agentId) ?? null : null)
      setError(null)
      setSaving(false)
      setForm(
        selectedWidget
          ? getDefaultDraft(selectedWidget, agents, businessName)
          : {
              name: `${selectedAgent?.name ?? businessName} Widget`,
              agentId: selectedAgent?.id ?? null,
              position: 'bottom-right',
              theme: 'light',
              primaryColor: DEFAULT_PRIMARY_COLOR,
              secondaryColor: DEFAULT_SECONDARY_COLOR,
              greetingMessage: DEFAULT_WELCOME_MESSAGE,
              enabled: true,
              tone: DEFAULT_WIDGET_TONE,
              slotDuration: DEFAULT_APPOINTMENT_SLOT_MINUTES,
              showBranding: true,
              allowedOrigins: [],
            },
      )
    }
  }

  if (!open) return null

  const selectedAgent = agents.find((agent) => agent.id === form.agentId) ?? null
  const preview = createPreviewModelFromDraft(form, selectedAgent?.name ?? null)
  const isEdit = mode === 'edit'

  function setPresetColor(primary: string, secondary: string) {
    setForm((current) => ({ ...current, primaryColor: primary, secondaryColor: secondary }))
  }

  async function handleSave() {
    setError(null)
    if (!form.name.trim()) {
      setError('The widget name is required')
      return
    }

    if (!form.agentId && !selectedAgent) {
      setError('Please choose an AI agent for this widget')
      return
    }

    setSaving(true)
    try {
      const supabase = createClient()
      const slug = isEdit && sourceWidget ? sourceWidget.slug : createUniqueWidgetSlug(form.name, widgets)
      const payload = {
        name: form.name.trim(),
        slug,
        agentId: form.agentId,
        enabled: form.enabled,
        position: form.position,
        theme: form.theme,
        primaryColor: form.primaryColor,
        secondaryColor: form.secondaryColor,
        tone: form.tone,
        greetingMessage: form.greetingMessage.trim() || DEFAULT_WELCOME_MESSAGE,
        allowedOrigins: form.allowedOrigins,
        slotDuration: form.slotDuration,
        showBranding: form.showBranding,
      }

      const saved = isEdit && sourceWidget
        ? await updateWidget(supabase, businessId, sourceWidget.id, payload)
        : await createWidget(supabase, businessId, payload)

      const hydrated = hydrateWidget(saved, agents)
      onSaved(hydrated)
      pushToast({
        title: isEdit ? 'Widget updated' : 'Widget created',
        message: `${hydrated.name} is ready to embed.`,
        tone: 'emerald',
      })
      onClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save the widget')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Modal
      open
      onClose={onClose}
      title={isEdit ? 'Edit Widget' : 'Create Widget'}
      description={isEdit ? 'Step 1 of 1 - widget settings' : 'Build a widget that matches the business brand'}
      className="max-w-5xl"
    >
      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <div className="space-y-4">
          <SurfaceCard className="p-4">
            {createWidgetPreviewStage({ preview, compact: true })}
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
              Quick settings
            </div>
            <div className="mt-3 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Agent</span>
                <span className="font-semibold text-[var(--text-strong)]">{selectedAgent?.name ?? 'No agent selected'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Position</span>
                <span className="font-semibold text-[var(--text-strong)]">{getPositionLabel(form.position)}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Theme</span>
                <span className="font-semibold text-[var(--text-strong)]">{toTitleCase(form.theme)}</span>
              </div>
            </div>
          </SurfaceCard>
        </div>

        <SurfaceCard className="p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">
                Widget Settings
              </div>
              <h3 className="mt-2 text-2xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                Make the embed feel native to the business
              </h3>
            </div>
            <StatusBadge tone={form.enabled ? 'emerald' : 'slate'}>
              {form.enabled ? 'Active' : 'Disabled'}
            </StatusBadge>
          </div>

          {error ? (
            <div className="mt-4 rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
              {error}
            </div>
          ) : null}

          <div className="mt-5 grid gap-4 md:grid-cols-2">
            <Input
              label="Widget Name"
              value={form.name}
              onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
              placeholder="Main Widget"
            />
            <Select
              label="AI Agent"
              value={form.agentId ?? ''}
              onChange={(event) => setForm((current) => ({ ...current, agentId: event.target.value || null }))}
              hint="Pick the voice persona that will handle calls and chat."
            >
              <option value="">Select an agent</option>
              {agents.map((agent) => (
                <option key={agent.id} value={agent.id}>
                  {agent.name} - {agent.status}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select
              label="Position"
              value={form.position}
              onChange={(event) => setForm((current) => ({ ...current, position: event.target.value }))}
            >
              {POSITION_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>

            <Select
              label="Theme"
              value={form.theme}
              onChange={(event) => setForm((current) => ({ ...current, theme: event.target.value }))}
            >
              {THEME_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </Select>
          </div>

          <div className="mt-5">
            <div className="text-sm font-semibold text-[var(--text-strong)]">Primary Color</div>
            <div className="mt-3 flex flex-wrap gap-3">
              {COLOR_PRESETS.map((preset) => {
                const active = form.primaryColor === preset.primary
                return (
                  <button
                    key={preset.primary}
                    type="button"
                    onClick={() => setPresetColor(preset.primary, preset.secondary)}
                    className={cn(
                      'inline-flex items-center gap-3 rounded-full border px-3 py-2 text-sm font-semibold transition',
                      active
                        ? 'border-[var(--brand)] bg-[var(--brand-soft)] text-[var(--brand-strong)]'
                        : 'border-[var(--border-soft)] bg-white/80 text-[var(--text-muted)] hover:bg-white',
                    )}
                  >
                    <span className="h-4 w-4 rounded-full" style={{ background: preset.primary }} />
                    {preset.label}
                  </button>
                )
              })}
            </div>
          </div>

          <Textarea
            label="Greeting Message"
            value={form.greetingMessage}
            onChange={(event) => setForm((current) => ({ ...current, greetingMessage: event.target.value }))}
            rows={4}
            className="mt-4"
            hint="This appears in the widget preview and the live embed."
          />

          <div className="mt-4 grid gap-4 md:grid-cols-2">
            <Select
              label="Tone"
              value={form.tone}
              onChange={(event) => setForm((current) => ({ ...current, tone: event.target.value }))}
            >
              <option value="professional-and-friendly">Professional and friendly</option>
              <option value="warm-and-welcoming">Warm and welcoming</option>
              <option value="concise-and-clear">Concise and clear</option>
            </Select>
            <div className="flex items-end">
              <Toggle
                checked={form.enabled}
                onCheckedChange={(checked) => setForm((current) => ({ ...current, enabled: checked }))}
                label="Widget is active"
              />
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center justify-end gap-3 border-t border-[var(--border-soft)] pt-5">
            <Button variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  {isEdit ? 'Save Changes' : 'Create Widget'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </div>
        </SurfaceCard>
      </div>
    </Modal>
  )
}

function WidgetCodePanel({
  widget,
  businessSlug,
  siteOrigin,
  codeTab,
  onCodeTabChange,
  onCopy,
}: {
  widget: WidgetRecord
  businessSlug: string
  siteOrigin: string
  codeTab: 'script' | 'react' | 'html'
  onCodeTabChange: (tab: 'script' | 'react' | 'html') => void
  onCopy: (snippet: string) => void
}) {
  const snippet = buildCodeSnippet(codeTab, widget, businessSlug, siteOrigin)

  return (
    <div className="space-y-4 rounded-[24px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.03)] p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold text-[var(--text-strong)]">{widget.name}</div>
          <div className="text-xs text-[var(--text-muted)]">
            {widget.agentName ?? 'No agent selected'} - {getPositionLabel(widget.position)} - {toTitleCase(widget.theme)} theme
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <StatusBadge tone={widget.enabled ? 'emerald' : 'slate'}>{widget.enabled ? 'Active' : 'Disabled'}</StatusBadge>
          <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
            {widget.impressions} impressions
          </Badge>
          <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
            {widget.interactions} interactions
          </Badge>
        </div>
      </div>

      <Tabs items={CODE_TABS} value={codeTab} onChange={(value) => onCodeTabChange(value as 'script' | 'react' | 'html')} />

      <div className="rounded-[22px] border border-[rgba(15,23,42,0.08)] bg-slate-950 p-4 text-[11px] leading-6 text-teal-100">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.24em] text-teal-200/85">
            <Code2 className="h-4 w-4" />
            {CODE_TABS.find((tab) => tab.value === codeTab)?.label}
          </div>
          <button
            type="button"
            onClick={() => onCopy(snippet)}
            className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/8 px-3 py-1.5 text-[11px] font-semibold text-white/90 transition hover:bg-white/14"
          >
            <Copy className="h-3.5 w-3.5" />
            Copy
          </button>
        </div>
        <pre className="mt-4 overflow-auto whitespace-pre-wrap break-words font-mono text-[11px] leading-6">
          {snippet}
        </pre>
      </div>
    </div>
  )
}

function WidgetRow({
  widget,
  selected,
  businessSlug,
  siteOrigin,
  codeTab,
  onCodeTabChange,
  onSelect,
  onPreview,
  onEdit,
  onDelete,
  onCopy,
}: {
  widget: WidgetRecord
  selected: boolean
  businessSlug: string
  siteOrigin: string
  codeTab: 'script' | 'react' | 'html'
  onCodeTabChange: (tab: 'script' | 'react' | 'html') => void
  onSelect: () => void
  onPreview: () => void
  onEdit: () => void
  onDelete: () => void
  onCopy: (snippet: string) => void
}) {
  return (
    <div className={cn('border-b border-[var(--border-soft)] px-5 py-4 last:border-b-0', selected && 'bg-[rgba(15,118,110,0.04)]')}>
      <button
        type="button"
        onClick={onSelect}
        className="flex w-full items-start justify-between gap-4 text-left"
      >
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <div className="font-semibold text-[var(--text-strong)]">{widget.name}</div>
            {widget.agentName ? <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">{widget.agentName}</Badge> : null}
            <StatusBadge tone={widget.enabled ? 'emerald' : 'slate'}>{widget.enabled ? 'Active' : 'Disabled'}</StatusBadge>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
            <span>{getPositionLabel(widget.position)}</span>
            <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]/30" />
            <span>{toTitleCase(widget.theme)} theme</span>
            <span className="h-1 w-1 rounded-full bg-[var(--text-muted)]/30" />
            <span>{widget.slotDuration} min flow</span>
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
              {widget.impressions} impressions
            </Badge>
            <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
              {widget.interactions} interactions
            </Badge>
            <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
              {widget.showBranding ? 'Branding on' : 'Branding off'}
            </Badge>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onPreview()
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-strong)] transition hover:bg-[var(--panel-soft)]"
            aria-label="Preview widget"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onEdit()
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-strong)] transition hover:bg-[var(--panel-soft)]"
            aria-label="Edit widget"
          >
            <PencilLine className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation()
              onDelete()
            }}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--coral)] transition hover:bg-[rgba(251,113,133,0.08)]"
            aria-label="Delete widget"
          >
            <Trash2 className="h-4 w-4" />
          </button>
          <div className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-muted)]">
            {selected ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </div>
        </div>
      </button>

      {selected ? (
        <div className="mt-4">
          <WidgetCodePanel widget={widget} businessSlug={businessSlug} siteOrigin={siteOrigin} codeTab={codeTab} onCodeTabChange={onCodeTabChange} onCopy={onCopy} />
        </div>
      ) : null}
    </div>
  )
}

function WidgetTemplateCard({
  agent,
  widget,
  accent,
  onPreview,
  onCreate,
}: {
  agent: AiAgent
  widget: WidgetRecord | null
  accent: string
  onPreview: () => void
  onCreate: () => void
}) {
  const alreadyCreated = Boolean(widget)

  return (
    <div
      className="flex h-full flex-col rounded-[28px] border border-[var(--border-soft)] bg-white p-5 shadow-[0_18px_54px_-40px_rgba(15,23,42,0.45)]"
      style={{ boxShadow: `0 20px 60px -44px ${accent}66` }}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="slate" className="bg-[rgba(15,118,110,0.06)] normal-case tracking-normal">
              {agent.status === 'live' ? 'Live agent' : toTitleCase(agent.status)}
            </Badge>
            {alreadyCreated ? <StatusBadge tone="emerald">Widget already created</StatusBadge> : <StatusBadge tone="slate">Template</StatusBadge>}
          </div>
          <h3 className="mt-4 font-display text-xl font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
            {agent.name}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">{agent.title ?? agent.specialty ?? 'Booking assistant'}</p>
        </div>
        <div className="grid h-11 w-11 place-items-center rounded-[16px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.06)]">
          <Sparkles className="h-5 w-5" style={{ color: accent }} />
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.03)] p-4">
        <div className="text-[10px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Voice settings</div>
        <div className="mt-3 grid gap-2 text-sm text-[var(--text-muted)]">
          <div className="flex items-center justify-between gap-3">
            <span>Voice</span>
            <span className="font-semibold text-[var(--text-strong)]">{agent.voice}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Personality</span>
            <span className="font-semibold text-[var(--text-strong)]">{agent.personality}</span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>Calls handled</span>
            <span className="font-semibold text-[var(--text-strong)]">{agent.callsHandled}</span>
          </div>
        </div>
      </div>

      <div className="mt-4 rounded-[22px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.03)] p-4 text-sm text-[var(--text-muted)]">
        &ldquo;{agent.greetingMessage}&rdquo;
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge tone="slate" className="bg-[rgba(15,23,42,0.03)] normal-case tracking-normal">
          {agent.status === 'live' ? 'Ready for widget' : 'Preview only'}
        </Badge>
        <Badge tone="slate" className="bg-[rgba(15,23,42,0.03)] normal-case tracking-normal">
          {agent.language.toUpperCase()}
        </Badge>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Button variant="secondary" onClick={onPreview} className="justify-center">
          Preview
        </Button>
        <Button onClick={onCreate} disabled={alreadyCreated} className="justify-center" style={{ background: alreadyCreated ? 'rgba(15,118,110,0.18)' : accent }}>
          {alreadyCreated ? 'Widget already created' : 'Create Widget'}
        </Button>
      </div>
    </div>
  )
}

function WidgetDeleteModal({
  widget,
  onClose,
  onConfirm,
}: {
  widget: WidgetRecord | null
  onClose: () => void
  onConfirm: () => void
}) {
  if (!widget) return null

  return (
    <Modal open title="Delete Widget" description="This widget will be removed from the dashboard and the embed snippet will stop working." onClose={onClose} className="max-w-lg">
      <div className="space-y-5">
        <div className="rounded-[22px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.04)] px-4 py-4">
          <div className="text-sm font-semibold text-[var(--text-strong)]">{widget.name}</div>
          <div className="mt-1 text-sm text-[var(--text-muted)]">{widget.agentName ?? 'No agent selected'} - {getPositionLabel(widget.position)}</div>
        </div>

        <div className="flex flex-wrap items-center justify-end gap-3">
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm}>
            Delete
          </Button>
        </div>
      </div>
    </Modal>
  )
}

function WidgetTemplatePreviewModal({
  preview,
  onClose,
  onPrimaryAction,
  title,
}: {
  preview: WidgetPreviewModel | null
  onClose: () => void
  onPrimaryAction: () => void
  title: string
}) {
  if (!preview) return null

  return (
    <Modal open title={title} description={`${preview.position} - ${toTitleCase(preview.theme)} theme`} onClose={onClose} className="max-w-4xl">
      <div className="grid gap-5 lg:grid-cols-[1fr_0.9fr]">
        <SurfaceCard className="p-4">
          {createWidgetPreviewStage({ preview })}
        </SurfaceCard>

        <div className="space-y-4">
          <SurfaceCard className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Summary</div>
            <div className="mt-4 space-y-3 text-sm">
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Widget</span>
                <span className="font-semibold text-[var(--text-strong)]">{preview.name}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">Agent</span>
                <span className="font-semibold text-[var(--text-strong)]">{preview.agentName ?? 'No agent selected'}</span>
              </div>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[var(--text-muted)]">State</span>
                <span className="font-semibold text-[var(--text-strong)]">{preview.enabled ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Greeting</div>
            <p className="mt-3 text-sm leading-7 text-[var(--text-strong)]">{preview.greetingMessage}</p>
          </SurfaceCard>

          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={onClose} className="flex-1 justify-center">
              Close
            </Button>
            <Button onClick={onPrimaryAction} className="flex-1 justify-center">
              <Plus className="mr-2 h-4 w-4" />
              Continue
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  )
}

export function WidgetManager({
  initialWidgets,
  agents,
  businessId,
  businessName,
  businessSlug,
  siteOrigin,
}: {
  initialWidgets: WidgetRecord[]
  agents: AiAgent[]
  businessId: string
  businessName: string
  businessSlug: string
  siteOrigin: string
}) {
  const [widgets, setWidgets] = useState(initialWidgets)
  const [selectedWidgetId, setSelectedWidgetId] = useState<string | null>(initialWidgets[0]?.id ?? null)
  const [codeTab, setCodeTab] = useState<'script' | 'react' | 'html'>('script')
  const [wizardOpen, setWizardOpen] = useState(false)
  const [wizardMode, setWizardMode] = useState<'create' | 'edit'>('create')
  const [wizardWidget, setWizardWidget] = useState<WidgetRecord | null>(null)
  const [wizardAgent, setWizardAgent] = useState<AiAgent | null>(null)
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<WidgetRecord | null>(null)
  const [toasts, setToasts] = useState<ManagerToast[]>([])

  const [widgetSelectionSyncKey, setWidgetSelectionSyncKey] = useState({ selectedWidgetId, widgets })
  if (widgetSelectionSyncKey.selectedWidgetId !== selectedWidgetId || widgetSelectionSyncKey.widgets !== widgets) {
    setWidgetSelectionSyncKey({ selectedWidgetId, widgets })
    if (widgets.length === 0) {
      setSelectedWidgetId(null)
    } else if (!selectedWidgetId || !widgets.some((widget) => widget.id === selectedWidgetId)) {
      setSelectedWidgetId(widgets[0].id)
    }
  }

  const sortedAgents = [...agents].sort((a, b) => {
    if (a.status === b.status) {
      return a.name.localeCompare(b.name)
    }
    if (a.status === 'live') return -1
    if (b.status === 'live') return 1
    return a.name.localeCompare(b.name)
  })

  const widgetByAgentId = new Map(
    widgets
      .filter((widget) => widget.agentId)
      .map((widget) => [widget.agentId as string, widget] as const),
  )

  const selectedWidget = widgets.find((widget) => widget.id === selectedWidgetId) ?? widgets[0] ?? null

  const totalImpressions = widgets.reduce((sum, widget) => sum + widget.impressions, 0)
  const totalInteractions = widgets.reduce((sum, widget) => sum + widget.interactions, 0)
  const activeWidgets = widgets.filter((widget) => widget.enabled).length
  const activeAgents = agents.filter((agent) => agent.status === 'live').length

  function pushToast(toast: Omit<ManagerToast, 'id'>) {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, ...toast }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3200)
  }

  function openCreate(agent: AiAgent | null = null) {
    setWizardMode('create')
    setWizardWidget(null)
    setWizardAgent(agent)
    setWizardOpen(true)
  }

  function openEdit(widget: WidgetRecord) {
    setWizardMode('edit')
    setWizardWidget(widget)
    setWizardAgent(widget.agentId ? agents.find((agent) => agent.id === widget.agentId) ?? null : null)
    setWizardOpen(true)
  }

  function openPreviewWidget(widget: WidgetRecord) {
    setPreviewTarget({
      model: createPreviewModel(widget),
      sourceWidgetId: widget.id,
      sourceAgentId: widget.agentId ?? null,
    })
  }

  function openPreviewAgent(agent: AiAgent) {
    const matchedWidget = widgetByAgentId.get(agent.id) ?? null
    const previewDraft: WidgetPreviewModel = matchedWidget
      ? createPreviewModel(matchedWidget)
      : {
          name: `${agent.name} Widget`,
          agentName: agent.name,
          position: 'bottom-right',
          theme: 'light',
          primaryColor: DEFAULT_PRIMARY_COLOR,
          secondaryColor: DEFAULT_SECONDARY_COLOR,
          greetingMessage: agent.greetingMessage || DEFAULT_WELCOME_MESSAGE,
          enabled: true,
        }

    setPreviewTarget({
      model: previewDraft,
      sourceWidgetId: matchedWidget?.id ?? null,
      sourceAgentId: agent.id,
    })
  }

  async function copySnippet(snippet: string) {
    await navigator.clipboard.writeText(snippet)
    pushToast({
      title: 'Snippet copied',
      message: 'Paste it into the website where you want the widget to appear.',
      tone: 'emerald',
    })
  }

  async function handleDeleteConfirmed() {
    if (!deleteTarget) return

    const supabase = createClient()
    await deleteWidget(supabase, businessId, deleteTarget.id)
    setWidgets((current) => current.filter((widget) => widget.id !== deleteTarget.id))
    pushToast({
      title: 'Widget deleted',
      message: `${deleteTarget.name} was removed from the dashboard.`,
      tone: 'slate',
    })
    setDeleteTarget(null)
  }

  function handleWidgetSaved(widget: WidgetRecord) {
    setWidgets((current) => {
      const exists = current.some((item) => item.id === widget.id)
      const next = exists ? current.map((item) => (item.id === widget.id ? widget : item)) : [widget, ...current]
      return next.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    })
    setSelectedWidgetId(widget.id)
  }

  function openTemplateAction(agent: AiAgent) {
    const matchedWidget = widgetByAgentId.get(agent.id) ?? null
    if (matchedWidget) {
      openEdit(matchedWidget)
      return
    }
    openCreate(agent)
  }

  const templateAccentPalette = COLOR_PRESETS.map((preset) => preset.primary)

  return (
    <div className="space-y-8">
      <SectionHeading
        eyebrow={<SectionEyebrow>Widget</SectionEyebrow>}
        title="Embed the AI booking assistant on the business website"
        description="Create widgets per agent, preview the live launcher, and copy script, React, or full HTML snippets in one place."
        actions={
          <Button onClick={() => openCreate()} className="inline-flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Widget
          </Button>
        }
      />

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard label="Widgets" value={String(widgets.length)} delta={`${activeWidgets} active`} icon={MonitorSmartphone} tone="teal" />
        <MetricCard label="Agents" value={String(activeAgents)} delta={`${agents.length - activeAgents} paused or draft`} icon={Sparkles} tone="blue" />
        <MetricCard label="Impressions" value={String(totalImpressions)} delta="Across all widgets" icon={Eye} tone="emerald" />
        <MetricCard label="Interactions" value={String(totalInteractions)} delta="User clicks and opens" icon={PhoneCall} tone="amber" />
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.12fr_0.88fr]">
        <SurfaceCard className="overflow-hidden">
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[var(--border-soft)] px-5 py-4">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Embedded Widgets</div>
              <h2 className="mt-1 text-2xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                Manage each embed and its code snippet
              </h2>
            </div>
            <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
              {widgets.length} total
            </Badge>
          </div>

          <div className="divide-y divide-[var(--border-soft)]">
            {widgets.length === 0 ? (
              <div className="px-5 py-10 text-center">
                <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-[rgba(15,118,110,0.08)] text-[var(--brand-strong)]">
                  <MonitorSmartphone className="h-6 w-6" />
                </div>
                <h3 className="mt-4 text-lg font-semibold text-[var(--text-strong)]">No widgets yet</h3>
                <p className="mt-2 text-sm text-[var(--text-muted)]">Create the first widget to generate the embed code for the business website.</p>
                <div className="mt-5">
                  <Button onClick={() => openCreate()}>
                    <Plus className="mr-2 h-4 w-4" />
                    Create First Widget
                  </Button>
                </div>
              </div>
            ) : (
              widgets.map((widget) => (
                <WidgetRow
                  key={widget.id}
                  widget={widget}
                  selected={widget.id === selectedWidgetId}
                  businessSlug={businessSlug}
                  siteOrigin={siteOrigin}
                  codeTab={codeTab}
                  onCodeTabChange={setCodeTab}
                  onSelect={() => setSelectedWidgetId(widget.id)}
                  onPreview={() => openPreviewWidget(widget)}
                  onEdit={() => openEdit(widget)}
                  onDelete={() => setDeleteTarget(widget)}
                  onCopy={(snippet) => void copySnippet(snippet)}
                />
              ))
            )}
          </div>
        </SurfaceCard>

        <div className="space-y-6">
          {selectedWidget ? (
            <SurfaceCard className="p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Widget Preview</div>
                  <h3 className="mt-2 text-2xl font-display font-semibold tracking-[-0.03em] text-[var(--text-strong)]">
                    {selectedWidget.name}
                  </h3>
                </div>
                <StatusBadge tone={selectedWidget.enabled ? 'emerald' : 'slate'}>
                  {selectedWidget.enabled ? 'Live' : 'Disabled'}
                </StatusBadge>
              </div>

              <div className="mt-4">
                {createWidgetPreviewStage({ preview: createPreviewModel(selectedWidget), compact: true })}
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <ValueCard label="Agent" value={selectedWidget.agentName ?? 'None'} icon={Sparkles} tone="teal" />
                <ValueCard label="Position" value={getPositionLabel(selectedWidget.position)} icon={Palette} tone="blue" />
                <ValueCard label="Theme" value={toTitleCase(selectedWidget.theme)} icon={MonitorSmartphone} tone="emerald" />
              </div>

              <div className="mt-4 flex flex-wrap gap-3">
                <Button variant="secondary" onClick={() => openPreviewWidget(selectedWidget)}>
                  <Eye className="mr-2 h-4 w-4" />
                  Preview
                </Button>
                <Button variant="secondary" onClick={() => openEdit(selectedWidget)}>
                  <PencilLine className="mr-2 h-4 w-4" />
                  Edit Widget
                </Button>
              </div>
            </SurfaceCard>
          ) : null}

          <SurfaceCard className="p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Embed Notes</div>
                <h3 className="mt-2 text-lg font-semibold text-[var(--text-strong)]">What the snippet controls</h3>
              </div>
              <Code2 className="h-5 w-5 text-[var(--brand)]" />
            </div>
            <div className="mt-4 grid gap-3">
              <div className="rounded-[22px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.04)] px-4 py-3 text-sm text-[var(--text-muted)]">
                The widget script reads the business slug, widget slug, position, theme, colors, and greeting directly from data attributes.
              </div>
              <div className="rounded-[22px] border border-[var(--border-soft)] bg-[rgba(15,118,110,0.04)] px-4 py-3 text-sm text-[var(--text-muted)]">
                Keep one active widget per agent to mirror the reference flow and keep the website embed simple.
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <SectionEyebrow>Widget Templates</SectionEyebrow>
            <div className="mt-3 text-sm text-[var(--text-muted)]">
              One-click templates derived from the live AI agents in the business.
            </div>
          </div>
          <Badge tone="slate" className="bg-white/90 normal-case tracking-normal">
            {sortedAgents.length} agents available
          </Badge>
        </div>

        <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
          {sortedAgents.map((agent, index) => (
            <WidgetTemplateCard
              key={agent.id}
              agent={agent}
              widget={widgetByAgentId.get(agent.id) ?? null}
              accent={templateAccentPalette[index % templateAccentPalette.length]}
              onPreview={() => {
                const matchedWidget = widgetByAgentId.get(agent.id) ?? null
                const preview = matchedWidget
                  ? createPreviewModel(matchedWidget)
                  : createPreviewModelFromDraft(
                      {
                        name: `${agent.name} Widget`,
                        agentId: agent.id,
                        position: 'bottom-right',
                        theme: 'light',
                        primaryColor: DEFAULT_PRIMARY_COLOR,
                        secondaryColor: DEFAULT_SECONDARY_COLOR,
                        greetingMessage: agent.greetingMessage || DEFAULT_WELCOME_MESSAGE,
                        enabled: true,
                        tone: DEFAULT_WIDGET_TONE,
                        slotDuration: DEFAULT_APPOINTMENT_SLOT_MINUTES,
                        showBranding: true,
                        allowedOrigins: [],
                      },
                      agent.name,
                    )

                setPreviewTarget({
                  model: preview,
                  sourceWidgetId: matchedWidget?.id ?? null,
                  sourceAgentId: agent.id,
                })
              }}
              onCreate={() => openTemplateAction(agent)}
            />
          ))}
        </div>
      </div>

      <WidgetWizardModal
        open={wizardOpen}
        mode={wizardMode}
        sourceWidget={wizardWidget}
        sourceAgent={wizardAgent}
        widgets={widgets}
        agents={agents}
        businessId={businessId}
        businessName={businessName}
        onClose={() => setWizardOpen(false)}
        onSaved={handleWidgetSaved}
        pushToast={pushToast}
      />

      <WidgetTemplatePreviewModal
        preview={previewTarget?.model ?? null}
        title={previewTarget?.sourceWidgetId ? 'Widget Preview' : 'Template Preview'}
        onClose={() => setPreviewTarget(null)}
        onPrimaryAction={() => {
          const target = previewTarget
          if (!target) return
          if (target.sourceWidgetId) {
            const widget = widgets.find((item) => item.id === target.sourceWidgetId) ?? null
            if (widget) {
              setPreviewTarget(null)
              openEdit(widget)
            }
            return
          }

          const agent = agents.find((item) => item.id === target.sourceAgentId) ?? null
          if (agent) {
            setPreviewTarget(null)
            openCreate(agent)
          }
        }}
      />

      <WidgetDeleteModal
        widget={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => void handleDeleteConfirmed()}
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
