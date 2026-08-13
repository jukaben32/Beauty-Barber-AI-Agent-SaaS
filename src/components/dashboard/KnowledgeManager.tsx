'use client'

import { useState, type FormEvent } from 'react'
import {
  Archive,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Eye,
  Filter,
  Loader2,
  PencilLine,
  Plus,
  RotateCcw,
  Search,
  Sparkles,
  Trash2,
} from 'lucide-react'

import type { KnowledgeDocument } from '@/types'
import { createClient } from '@/lib/supabase/client'
import { deleteKnowledgeDocument, upsertKnowledgeDocument } from '@/services/faqs'
import {
  KNOWLEDGE_TEMPLATE_BANK,
  KNOWLEDGE_TEMPLATE_CATEGORIES,
  getKnowledgeTemplateCategoryLabel,
  type KnowledgeTemplate,
  type KnowledgeTemplateCategoryKey,
} from './knowledge-templates'
import { cn } from '@/lib/utils'
import Button from '@/components/ui/Button'
import Input from '@/components/ui/Input'
import Select from '@/components/ui/Select'
import Textarea from '@/components/ui/Textarea'
import Modal from '@/components/ui/Modal'
import Toast from '@/components/ui/Toast'
import { MetricCard, SectionEyebrow, StatusBadge, SurfaceCard } from '@/components/dashboard/shared'

type KnowledgeToastTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

type KnowledgeToast = {
  id: string
  title: string
  message?: string
  tone?: KnowledgeToastTone
}

type KnowledgeDraft = {
  question: string
  answer: string
  category: KnowledgeTemplateCategoryKey
}

type PreviewTarget =
  | {
      type: 'template'
      template: KnowledgeTemplate
    }
  | {
      type: 'document'
      document: KnowledgeDocument
    }

type ChipAccent = {
  fill: string
  border: string
  text: string
}

const CATEGORY_ACCENTS: Record<KnowledgeTemplateCategoryKey | 'all', ChipAccent> = {
  all: {
    fill: 'rgba(16, 33, 41, 0.05)',
    border: 'rgba(16, 33, 41, 0.08)',
    text: 'var(--text-muted)',
  },
  appointments: {
    fill: 'rgba(15, 42, 107, 0.09)',
    border: 'rgba(15, 42, 107, 0.2)',
    text: 'var(--brand-strong)',
  },
  'booking-cancellation': {
    fill: 'rgba(37, 99, 235, 0.08)',
    border: 'rgba(37, 99, 235, 0.18)',
    text: '#1d4ed8',
  },
  'hours-location': {
    fill: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.18)',
    text: '#047857',
  },
  'new-clients': {
    fill: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.2)',
    text: '#b45309',
  },
  'pricing-payment': {
    fill: 'rgba(236, 72, 153, 0.09)',
    border: 'rgba(236, 72, 153, 0.18)',
    text: '#be185d',
  },
  'products-allergies': {
    fill: 'rgba(59, 130, 246, 0.08)',
    border: 'rgba(59, 130, 246, 0.18)',
    text: '#1d4ed8',
  },
  'loyalty-membership': {
    fill: 'rgba(14, 116, 144, 0.08)',
    border: 'rgba(14, 116, 144, 0.18)',
    text: '#0f766e',
  },
  'walk-ins': {
    fill: 'rgba(16, 185, 129, 0.08)',
    border: 'rgba(16, 185, 129, 0.18)',
    text: '#047857',
  },
  'bridal-events': {
    fill: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.2)',
    text: '#b45309',
  },
  kids: {
    fill: 'rgba(236, 72, 153, 0.09)',
    border: 'rgba(236, 72, 153, 0.18)',
    text: '#be185d',
  },
  'gift-cards': {
    fill: 'rgba(245, 158, 11, 0.1)',
    border: 'rgba(245, 158, 11, 0.2)',
    text: '#b45309',
  },
  privacy: {
    fill: 'rgba(16, 33, 41, 0.05)',
    border: 'rgba(16, 33, 41, 0.1)',
    text: 'var(--text-muted)',
  },
}

function createDraft(category: KnowledgeTemplateCategoryKey = 'appointments'): KnowledgeDraft {
  return {
    question: '',
    answer: '',
    category,
  }
}

function normalize(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? ''
}

function resolveCategoryKey(value: string | null | undefined): KnowledgeTemplateCategoryKey {
  const normalized = normalize(value)
  const match = KNOWLEDGE_TEMPLATE_CATEGORIES.find(
    (item) => item.key !== 'all' && (item.key === value || item.label.toLowerCase() === normalized),
  )
  return (match?.key ?? 'appointments') as KnowledgeTemplateCategoryKey
}

function resolveCategoryLabel(value: string | null | undefined) {
  if (!value) return 'Uncategorized'
  const normalized = normalize(value)
  const match = KNOWLEDGE_TEMPLATE_CATEGORIES.find(
    (item) => item.key !== 'all' && (item.key === value || item.label.toLowerCase() === normalized),
  )
  return match?.label ?? value
}

function matchesQuery(values: Array<string | null | undefined>, query: string) {
  const normalized = normalize(query)
  if (!normalized) return true
  return values.some((value) => normalize(value).includes(normalized))
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(value))
}

function categoryAccent(categoryKey: KnowledgeTemplateCategoryKey | 'all') {
  return CATEGORY_ACCENTS[categoryKey]
}

function CategoryChip({
  categoryKey,
  label,
  active = false,
  count,
  onClick,
}: {
  categoryKey: KnowledgeTemplateCategoryKey | 'all'
  label: string
  count?: number
  active?: boolean
  onClick?: () => void
}) {
  const accent = categoryAccent(categoryKey)

  const content = (
    <>
      <span className="truncate">{label}</span>
      {typeof count === 'number' ? <span className="text-[10px] font-bold opacity-70">{count}</span> : null}
    </>
  )

  const className = cn(
    'inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[11px] font-semibold transition',
    active ? 'shadow-[0_10px_24px_-18px_rgba(15,23,42,0.28)]' : 'hover:-translate-y-[1px]',
  )

  const style = {
    backgroundColor: active ? accent.fill : 'rgba(255,255,255,0.78)',
    borderColor: active ? accent.border : 'var(--border-soft)',
    color: active ? accent.text : 'var(--text-muted)',
  } as const

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={className} style={style}>
        {content}
      </button>
    )
  }

  return (
    <span className={className} style={style}>
      {content}
    </span>
  )
}

function KnowledgeRow({
  doc,
  expanded,
  archived,
  busy,
  onToggle,
  onEdit,
  onArchive,
  onRestore,
  onPreview,
}: {
  doc: KnowledgeDocument
  expanded: boolean
  archived?: boolean
  busy?: boolean
  onToggle: () => void
  onEdit: () => void
  onArchive?: () => void
  onRestore?: () => void
  onPreview: () => void
}) {
  const categoryKey = resolveCategoryKey(doc.category)
  const accent = categoryAccent(categoryKey)
  const question = doc.question ?? doc.title
  const answer = doc.answer ?? 'No answer has been added yet.'
  const statusTone = archived ? 'slate' : 'emerald'

  return (
    <div
      className={cn(
        'overflow-hidden rounded-[24px] border bg-[rgba(255,255,255,0.88)] transition',
        archived ? 'opacity-95' : 'hover:-translate-y-[1px]',
      )}
      style={{
        borderColor: accent.border,
        boxShadow: archived ? '0 14px 34px -30px rgba(15,33,41,0.18)' : '0 16px 44px -34px rgba(15,33,41,0.22)',
      }}
    >
      <div className="flex items-start gap-4 px-4 py-4 sm:px-5">
        <button type="button" onClick={onToggle} className="flex min-w-0 flex-1 items-start gap-4 text-left">
          <div
            className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] border"
            style={{
              backgroundColor: accent.fill,
              borderColor: accent.border,
              color: accent.text,
            }}
          >
            <BookOpen className="h-4 w-4" />
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="truncate font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{question}</h3>
              <CategoryChip categoryKey={categoryKey} label={resolveCategoryLabel(doc.category)} />
              <StatusBadge tone={statusTone}>{archived ? 'Archived' : 'Active'}</StatusBadge>
            </div>
            <div className="mt-1 text-xs text-[var(--text-muted)]">Updated {formatDate(doc.updatedAt)}</div>
          </div>
        </button>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            onClick={onPreview}
            disabled={busy}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-strong)] transition hover:bg-[var(--panel-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Preview article"
          >
            <Eye className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={onEdit}
            disabled={busy}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-strong)] transition hover:bg-[var(--panel-soft)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label="Edit article"
          >
            <PencilLine className="h-4 w-4" />
          </button>
          {archived ? (
            <button
              type="button"
              onClick={onRestore}
              disabled={busy}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[rgba(15, 42, 107,0.18)] bg-[rgba(15, 42, 107,0.08)] text-[var(--brand-strong)] transition hover:bg-[rgba(15, 42, 107,0.12)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Restore article"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
            </button>
          ) : (
            <button
              type="button"
              onClick={onArchive}
              disabled={busy}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--coral)] transition hover:bg-[rgba(251,113,133,0.08)] disabled:cursor-not-allowed disabled:opacity-50"
              aria-label="Archive article"
            >
              {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            </button>
          )}
          <button
            type="button"
            onClick={onToggle}
            disabled={busy}
            className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[var(--border-soft)] bg-white text-[var(--text-muted)] transition hover:text-[var(--text-strong)] disabled:cursor-not-allowed disabled:opacity-50"
            aria-label={expanded ? 'Collapse article' : 'Expand article'}
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="border-t border-[var(--border-soft)] bg-[rgba(15, 42, 107,0.03)] px-4 py-4 sm:px-5">
          <div className="grid gap-3 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.9fr)]">
            <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/85 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Answer</div>
              <p className="mt-2 text-sm leading-7 text-[var(--text-strong)]">{answer}</p>
            </div>
            <div className="grid gap-3">
              <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/85 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Source</div>
                <p className="mt-2 text-sm font-semibold text-[var(--text-strong)]">
                  {doc.catalogKey ? 'FAQ template' : 'Custom article'}
                </p>
              </div>
              <div className="rounded-[20px] border border-[var(--border-soft)] bg-white/85 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Controls</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button variant="secondary" className="!px-3 !py-2 !text-xs" onClick={onPreview}>
                    <Eye className="h-3.5 w-3.5" />
                    Preview
                  </Button>
                  <Button variant="secondary" className="!px-3 !py-2 !text-xs" onClick={onEdit}>
                    <PencilLine className="h-3.5 w-3.5" />
                    Edit
                  </Button>
                  {archived ? (
                    <Button variant="secondary" className="!px-3 !py-2 !text-xs" onClick={onRestore} disabled={busy}>
                      <RotateCcw className="h-3.5 w-3.5" />
                      Restore
                    </Button>
                  ) : (
                    <Button variant="secondary" className="!px-3 !py-2 !text-xs" onClick={onArchive} disabled={busy}>
                      <Trash2 className="h-3.5 w-3.5" />
                      Archive
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

function TemplateCard({
  template,
  isActive,
  busy,
  onPreview,
  onAdd,
}: {
  template: KnowledgeTemplate
  isActive: boolean
  busy?: boolean
  onPreview: () => void
  onAdd: () => void
}) {
  const accent = categoryAccent(template.category)
  const label = getKnowledgeTemplateCategoryLabel(template.category)

  return (
    <SurfaceCard
      className="group flex h-full flex-col overflow-hidden p-4 transition duration-200 hover:-translate-y-[1px]"
      style={{
        borderColor: accent.border,
        boxShadow: '0 16px 42px -34px rgba(15,33,41,0.22)',
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <CategoryChip categoryKey={template.category} label={label} />
        <StatusBadge tone={isActive ? 'emerald' : 'slate'}>{isActive ? 'Added' : 'Ready'}</StatusBadge>
      </div>

      <h3 className="mt-4 font-semibold tracking-[-0.03em] text-[var(--text-strong)]">{template.question}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">{template.answer}</p>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-[var(--border-soft)] pt-4">
        <button
          type="button"
          onClick={onPreview}
          className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-muted)] transition hover:text-[var(--text-strong)]"
        >
          <Eye className="h-4 w-4" />
          Preview
        </button>
        <button
          type="button"
          onClick={onAdd}
          disabled={busy || isActive}
          className={cn(
            'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
            isActive
              ? 'border border-[var(--border-soft)] bg-[var(--panel-soft)] text-[var(--text-muted)]'
              : 'border border-[rgba(15, 42, 107,0.2)] bg-[rgba(15, 42, 107,0.08)] text-[var(--brand-strong)] hover:bg-[rgba(15, 42, 107,0.12)]',
            busy && 'cursor-not-allowed opacity-70',
          )}
        >
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
          {isActive ? 'Added' : 'Add'}
        </button>
      </div>
    </SurfaceCard>
  )
}

function PreviewModal({
  target,
  onClose,
  onAddTemplate,
  onLoadDocument,
  onLoadTemplate,
}: {
  target: PreviewTarget | null
  onClose: () => void
  onAddTemplate: (template: KnowledgeTemplate) => void
  onLoadDocument: (doc: KnowledgeDocument) => void
  onLoadTemplate: (template: KnowledgeTemplate) => void
}) {
  if (!target) return null

  if (target.type === 'template') {
    const label = getKnowledgeTemplateCategoryLabel(target.template.category)

    return (
      <Modal
        open
        onClose={onClose}
        title="Template Preview"
        description="Review the question and answer before adding it to the active knowledge base."
        className="max-w-2xl"
      >
        <div className="space-y-5">
          <div className="rounded-[24px] border border-[var(--border-soft)] bg-[rgba(15, 42, 107,0.03)] p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CategoryChip categoryKey={target.template.category} label={label} />
              <StatusBadge tone="slate">FAQ template</StatusBadge>
            </div>
            <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{target.template.question}</h3>
            <p className="mt-3 text-sm leading-7 text-[var(--text-strong)]">{target.template.answer}</p>
            <div className="mt-4 rounded-[20px] border border-[var(--border-soft)] bg-white/85 p-4 text-sm text-[var(--text-muted)]">
              This template will be added to the active knowledge list and can be edited after insertion.
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              variant="secondary"
              onClick={() => {
                onLoadTemplate(target.template)
                onClose()
              }}
            >
              <PencilLine className="h-4 w-4" />
              Use in editor
            </Button>
            <Button
              variant="primary"
              onClick={() => {
                onAddTemplate(target.template)
                onClose()
              }}
            >
              <Plus className="h-4 w-4" />
              Add to knowledge
            </Button>
          </div>
        </div>
      </Modal>
    )
  }

  const doc = target.document
  const label = resolveCategoryLabel(doc.category)
  const question = doc.question ?? doc.title
  const answer = doc.answer ?? 'No answer has been added yet.'
  const isArchived = !doc.isActive

  return (
    <Modal
      open
      onClose={onClose}
      title="Knowledge Entry"
      description="Preview the active or archived article before editing or restoring it."
      className="max-w-2xl"
    >
      <div className="space-y-5">
        <div className="rounded-[24px] border border-[var(--border-soft)] bg-[rgba(15, 42, 107,0.03)] p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CategoryChip categoryKey={resolveCategoryKey(doc.category)} label={label} />
            <StatusBadge tone={isArchived ? 'slate' : 'emerald'}>{isArchived ? 'Archived' : 'Active'}</StatusBadge>
          </div>
          <h3 className="mt-4 text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{question}</h3>
          <p className="mt-3 text-sm leading-7 text-[var(--text-strong)]">{answer}</p>
          <div className="mt-4 grid gap-3 rounded-[20px] border border-[var(--border-soft)] bg-white/85 p-4 text-sm sm:grid-cols-2">
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Source</div>
              <div className="mt-1 font-semibold text-[var(--text-strong)]">{doc.catalogKey ? 'FAQ template' : 'Custom article'}</div>
            </div>
            <div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Updated</div>
              <div className="mt-1 font-semibold text-[var(--text-strong)]">{formatDate(doc.updatedAt)}</div>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            variant="secondary"
            onClick={() => {
              onLoadDocument(doc)
              onClose()
            }}
          >
            <PencilLine className="h-4 w-4" />
            Edit in panel
          </Button>
          <Button
            variant={isArchived ? 'secondary' : 'secondary'}
            onClick={() => {
              onLoadDocument(doc)
              onClose()
            }}
          >
            <Sparkles className="h-4 w-4" />
            Use in editor
          </Button>
        </div>
      </div>
    </Modal>
  )
}

export function KnowledgeManager({
  initialDocuments,
  businessId,
}: {
  initialDocuments: KnowledgeDocument[]
  businessId: string
}) {
  const [documents, setDocuments] = useState(initialDocuments)
  const [draft, setDraft] = useState<KnowledgeDraft>(createDraft())
  const [editingDocumentId, setEditingDocumentId] = useState<string | null>(null)
  const [expandedDocumentId, setExpandedDocumentId] = useState<string | null>(
    initialDocuments.find((doc) => doc.isActive)?.id ?? initialDocuments[0]?.id ?? null,
  )
  const [selectedCategory, setSelectedCategory] = useState<KnowledgeTemplateCategoryKey | 'all'>('appointments')
  const [searchQuery, setSearchQuery] = useState('')
  const [previewTarget, setPreviewTarget] = useState<PreviewTarget | null>(null)
  const [savingDraft, setSavingDraft] = useState(false)
  const [busyId, setBusyId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toasts, setToasts] = useState<KnowledgeToast[]>([])

  const templateCategories = KNOWLEDGE_TEMPLATE_CATEGORIES.filter((item) => item.key !== 'all')
  const activeDocuments = documents.filter((doc) => doc.isActive)
  const archivedDocuments = documents.filter((doc) => !doc.isActive)
  const filteredActiveDocuments = activeDocuments.filter((doc) =>
    matchesQuery([doc.title, doc.question, doc.answer, doc.category, doc.catalogKey], searchQuery),
  )

  const visibleTemplateGroups =
    selectedCategory === 'all'
      ? templateCategories
      : templateCategories.filter((item) => item.key === selectedCategory)

  const addVisibleTemplatesLabel =
    selectedCategory === 'all' ? 'Add visible topics' : `Add all ${selectedCategory === 'appointments' ? 'appointments' : getKnowledgeTemplateCategoryLabel(selectedCategory)}`

  function pushToast(toast: Omit<KnowledgeToast, 'id'>) {
    const id = crypto.randomUUID()
    setToasts((current) => [...current, { id, ...toast }])
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== id))
    }, 3200)
  }

  function resetDraft() {
    setDraft(createDraft())
    setEditingDocumentId(null)
    setError(null)
  }

  function loadDocumentIntoDraft(doc: KnowledgeDocument) {
    setDraft({
      question: doc.question ?? doc.title,
      answer: doc.answer ?? '',
      category: resolveCategoryKey(doc.category),
    })
    setEditingDocumentId(doc.id)
    setSelectedCategory(resolveCategoryKey(doc.category))
    setError(null)
  }

  function loadTemplateIntoDraft(template: KnowledgeTemplate) {
    setDraft({
      question: template.question,
      answer: template.answer,
      category: template.category,
    })
    setEditingDocumentId(null)
    setSelectedCategory(template.category)
    setError(null)
    setExpandedDocumentId(null)
  }

  function findMatchingTemplateDocument(template: KnowledgeTemplate) {
    return documents.find(
      (doc) =>
        doc.catalogKey === template.key ||
        normalize(doc.question) === normalize(template.question) ||
        normalize(doc.title) === normalize(template.question),
    )
  }

  async function saveDraft(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)

    const question = draft.question.trim()
    const answer = draft.answer.trim()
    if (!question || !answer) {
      setError('La pregunta y la respuesta son requeridas.')
      return
    }

    setSavingDraft(true)
    const isEditing = Boolean(editingDocumentId)
    try {
      const supabase = createClient()
      const sourceDocument = editingDocumentId ? documents.find((doc) => doc.id === editingDocumentId) ?? null : null
      const saved = await upsertKnowledgeDocument(supabase, businessId, {
        id: editingDocumentId ?? undefined,
        title: question,
        question,
        answer,
        category: resolveCategoryLabel(draft.category),
        catalogKey: sourceDocument?.catalogKey ?? null,
        isActive: true,
      })

      setDocuments((current) => {
        if (isEditing) {
          return current.map((item) => (item.id === saved.id ? saved : item))
        }
        return [saved, ...current]
      })
      setExpandedDocumentId(saved.id)
      resetDraft()
      pushToast({
        title: isEditing ? 'Knowledge updated' : 'FAQ added',
        message: question,
        tone: 'teal',
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo guardar el artículo.')
    } finally {
      setSavingDraft(false)
    }
  }

  async function archiveDocument(doc: KnowledgeDocument) {
    setBusyId(doc.id)
    try {
      const supabase = createClient()
      const archived = await deleteKnowledgeDocument(supabase, businessId, doc.id)
      setDocuments((current) => current.map((item) => (item.id === archived.id ? archived : item)))
      setExpandedDocumentId((current) => (current === doc.id ? null : current))
      pushToast({
        title: 'FAQ archived',
        message: 'It was removed from the active knowledge list.',
        tone: 'slate',
      })
    } catch (err) {
      pushToast({
        title: 'Could not archive',
        message: err instanceof Error ? err.message : 'There was a problem archiving the article.',
        tone: 'rose',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function restoreDocument(doc: KnowledgeDocument) {
    setBusyId(doc.id)
    try {
      const supabase = createClient()
      const restored = await upsertKnowledgeDocument(supabase, businessId, {
        id: doc.id,
        title: doc.question ?? doc.title,
        question: doc.question ?? doc.title,
        answer: doc.answer ?? '',
        category: resolveCategoryLabel(doc.category),
        catalogKey: doc.catalogKey,
        isActive: true,
      })
      setDocuments((current) => current.map((item) => (item.id === restored.id ? restored : item)))
      setExpandedDocumentId(restored.id)
      pushToast({
        title: 'FAQ restored',
        message: 'The article is back in the active knowledge list.',
        tone: 'emerald',
      })
    } catch (err) {
      pushToast({
        title: 'Could not restore',
        message: err instanceof Error ? err.message : 'There was a problem restoring the article.',
        tone: 'rose',
      })
    } finally {
      setBusyId(null)
    }
  }

  async function activateTemplate(template: KnowledgeTemplate, options?: { silent?: boolean; skipBusy?: boolean }) {
    const existing = findMatchingTemplateDocument(template)
    if (existing?.isActive) {
      if (!options?.silent) {
        pushToast({
          title: 'Already active',
          message: 'This template is already part of the knowledge base.',
          tone: 'slate',
        })
      }
      return false
    }

    if (!options?.skipBusy) {
      setBusyId(template.key)
    }

    try {
      const supabase = createClient()
      const saved = await upsertKnowledgeDocument(supabase, businessId, {
        id: existing?.id,
        title: template.question,
        question: template.question,
        answer: template.answer,
        category: getKnowledgeTemplateCategoryLabel(template.category),
        catalogKey: template.key,
        isActive: true,
      })

      setDocuments((current) => {
        if (existing) {
          return current.map((item) => (item.id === saved.id ? saved : item))
        }
        return [saved, ...current]
      })
      setExpandedDocumentId(saved.id)
      if (!options?.silent) {
        pushToast({
          title: existing ? 'FAQ restored' : 'FAQ added',
          message: template.question,
          tone: 'teal',
        })
      }
      return true
    } catch (err) {
      if (!options?.silent) {
        pushToast({
          title: 'Could not add FAQ',
          message: err instanceof Error ? err.message : 'There was a problem saving the template.',
          tone: 'rose',
        })
      }
      return false
    } finally {
      if (!options?.skipBusy) {
        setBusyId(null)
      }
    }
  }

  async function activateTemplateGroup(templates: KnowledgeTemplate[], busyKey: string, summaryLabel: string) {
    if (templates.length === 0) {
      pushToast({
        title: 'Nothing to add',
        message: 'The current template filter has no matching items.',
        tone: 'slate',
      })
      return
    }

    setBusyId(busyKey)
    let addedCount = 0
    try {
      for (const template of templates) {
        const didAdd = await activateTemplate(template, { silent: true, skipBusy: true })
        if (didAdd) addedCount += 1
      }
    } finally {
      setBusyId(null)
    }

    pushToast({
      title: addedCount > 0 ? `${addedCount} template${addedCount === 1 ? '' : 's'} added` : 'No new templates added',
      message:
        addedCount > 0
          ? `The selection for ${summaryLabel} is now part of the active knowledge base.`
          : 'Everything that matched is already active.',
      tone: addedCount > 0 ? 'teal' : 'slate',
    })
  }

  async function addAllVisibleTemplates() {
    const visibleTemplates =
      selectedCategory === 'all'
        ? KNOWLEDGE_TEMPLATE_BANK.filter((template) =>
            matchesQuery([template.question, template.answer, getKnowledgeTemplateCategoryLabel(template.category)], searchQuery),
          )
        : KNOWLEDGE_TEMPLATE_BANK.filter(
            (template) =>
              template.category === selectedCategory &&
              matchesQuery([template.question, template.answer, getKnowledgeTemplateCategoryLabel(template.category)], searchQuery),
          )

    const summaryLabel =
      selectedCategory === 'all'
        ? 'visible topics'
        : getKnowledgeTemplateCategoryLabel(selectedCategory).toLowerCase()

    await activateTemplateGroup(visibleTemplates, `filter:${selectedCategory}`, summaryLabel)
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.34fr)_minmax(260px,0.66fr)]">
        <SurfaceCard className="relative overflow-hidden p-6 lg:p-7" glow>
          <div className="absolute inset-y-0 right-0 w-2/5 bg-[radial-gradient(circle_at_center,rgba(15, 42, 107,0.08),transparent_70%)]" />
          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="max-w-2xl">
              <SectionEyebrow>Knowledge Base</SectionEyebrow>
              <h2 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[var(--text-strong)] md:text-4xl">
                Teach Clara the exact answers your clients expect
              </h2>
              <p className="mt-3 max-w-2xl text-base leading-7 text-[var(--text-muted)]">
                Add custom articles, browse FAQ templates, and keep archived items recoverable. The active
                list below is what the AI agent uses during live calls and chat.
              </p>

              <div className="mt-6 flex flex-wrap gap-2">
                <CategoryChip categoryKey="appointments" label={`${activeDocuments.length} active answers`} />
                <CategoryChip categoryKey="loyalty-membership" label={`${KNOWLEDGE_TEMPLATE_BANK.length} templates`} />
                <CategoryChip categoryKey="privacy" label={`${archivedDocuments.length} archived`} />
              </div>

              <div className="mt-6 flex flex-wrap gap-3">
                <Button
                  variant="primary"
                  onClick={() => {
                    resetDraft()
                    setTimeout(() => {
                      const questionInput = document.getElementById('knowledge-question-input')
                      questionInput?.focus()
                    }, 0)
                  }}
                >
                  <Plus className="h-4 w-4" />
                  Add custom FAQ
                </Button>
                <Button variant="secondary" onClick={() => setSelectedCategory('appointments')}>
                  <Sparkles className="h-4 w-4" />
                  Browse templates
                </Button>
              </div>
            </div>

            <div className="grid min-w-[240px] gap-3 sm:grid-cols-3 lg:min-w-[280px] lg:grid-cols-1">
              <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/85 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Active</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{activeDocuments.length}</div>
              </div>
              <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/85 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Templates</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{KNOWLEDGE_TEMPLATE_BANK.length}</div>
              </div>
              <div className="rounded-[24px] border border-[var(--border-soft)] bg-white/85 p-4">
                <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Topics</div>
                <div className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">{templateCategories.length}</div>
              </div>
            </div>
          </div>
        </SurfaceCard>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
          <MetricCard
            label="Active articles"
            value={String(activeDocuments.length)}
            delta="Used by Clara in real time"
            icon={BookOpen}
            tone="teal"
          />
          <MetricCard
            label="FAQ templates"
            value={String(KNOWLEDGE_TEMPLATE_BANK.length)}
            delta="One click to add"
            icon={Sparkles}
            tone="blue"
          />
          <MetricCard
            label="Template topics"
            value={String(templateCategories.length)}
            delta="Appointments, pricing, policies, and more"
            icon={Filter}
            tone="amber"
          />
          <MetricCard
            label="Archived"
            value={String(archivedDocuments.length)}
            delta="Soft delete only, never permanent"
            icon={Archive}
            tone="rose"
          />
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_minmax(360px,0.78fr)]">
        <div className="space-y-6">
          <SurfaceCard className="p-5 lg:p-6" glow>
            <div className="flex flex-col gap-5 border-b border-[var(--border-soft)] pb-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[rgba(15, 42, 107,0.04)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                    <BookOpen className="h-3.5 w-3.5" />
                    Knowledge list
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                    Active knowledge articles
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                    Click a row to expand the answer. Use the archive icon to remove it from active use without
                    losing the record.
                  </p>
                </div>
                <Button variant="secondary" onClick={() => setSelectedCategory('all')}>
                  <Search className="h-4 w-4" />
                  View all templates
                </Button>
              </div>

              <Input
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
                placeholder="Search questions, answers, or topics..."
                className="w-full"
                label="Search knowledge"
              />
            </div>

            <div className="mt-5 space-y-3">
              {filteredActiveDocuments.length > 0 ? (
                filteredActiveDocuments.map((doc) => (
                  <KnowledgeRow
                    key={doc.id}
                    doc={doc}
                    expanded={expandedDocumentId === doc.id}
                    busy={busyId === doc.id}
                    onToggle={() => setExpandedDocumentId((current) => (current === doc.id ? null : doc.id))}
                    onEdit={() => loadDocumentIntoDraft(doc)}
                    onArchive={() => void archiveDocument(doc)}
                    onPreview={() => setPreviewTarget({ type: 'document', document: doc })}
                  />
                ))
              ) : (
                <div className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--panel-soft)] px-5 py-10 text-center">
                  <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-white text-[var(--brand-strong)]">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-[var(--text-strong)]">No active articles found</h3>
                  <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                    Add a custom FAQ or activate a template to start feeding Clara the right answers.
                  </p>
                  <div className="mt-4 flex justify-center gap-3">
                    <Button variant="primary" onClick={resetDraft}>
                      <Plus className="h-4 w-4" />
                      Create article
                    </Button>
                    <Button variant="secondary" onClick={() => setSelectedCategory('appointments')}>
                      <Sparkles className="h-4 w-4" />
                      Browse templates
                    </Button>
                  </div>
                </div>
              )}
            </div>

            {archivedDocuments.length > 0 ? (
              <details className="group mt-5 rounded-[24px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.72)] px-4 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-2xl border border-[rgba(160,84,87,0.18)] bg-[rgba(160,84,87,0.08)] text-[var(--coral)]">
                      <Archive className="h-4 w-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold text-[var(--text-strong)]">Archived knowledge</div>
                      <div className="text-xs text-[var(--text-muted)]">
                        {archivedDocuments.length} removed from active use, still recoverable.
                      </div>
                    </div>
                  </div>
                  <ChevronDown className="h-4 w-4 text-[var(--text-muted)] transition group-open:rotate-180" />
                </summary>
                <div className="mt-4 space-y-3">
                  {archivedDocuments.map((doc) => (
                    <KnowledgeRow
                      key={doc.id}
                      doc={doc}
                      archived
                      expanded={expandedDocumentId === doc.id}
                      busy={busyId === doc.id}
                      onToggle={() => setExpandedDocumentId((current) => (current === doc.id ? null : doc.id))}
                      onEdit={() => loadDocumentIntoDraft(doc)}
                      onRestore={() => void restoreDocument(doc)}
                      onPreview={() => setPreviewTarget({ type: 'document', document: doc })}
                    />
                  ))}
                </div>
              </details>
            ) : null}
          </SurfaceCard>

          <SurfaceCard className="p-5 lg:p-6" glow>
            <div className="flex flex-col gap-4 border-b border-[var(--border-soft)] pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[rgba(15, 42, 107,0.04)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                    <Sparkles className="h-3.5 w-3.5" />
                    FAQ templates
                  </div>
                  <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                    Pre-written client Q&A
                  </h3>
                  <p className="mt-2 max-w-2xl text-sm leading-7 text-[var(--text-muted)]">
                    {KNOWLEDGE_TEMPLATE_BANK.length} pre-written Q&A pairs across {templateCategories.length} topics.
                    Add them in one click or preview before inserting them into the active knowledge base.
                  </p>
                </div>
                <Button variant="secondary" onClick={() => void addAllVisibleTemplates()} disabled={visibleTemplateGroups.length === 0 || busyId !== null}>
                  {busyId === selectedCategory ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {addVisibleTemplatesLabel}
                </Button>
              </div>

              <div className="flex flex-wrap gap-2">
                {KNOWLEDGE_TEMPLATE_CATEGORIES.map((item) => {
                  const count =
                    item.key === 'all'
                      ? KNOWLEDGE_TEMPLATE_BANK.length
                      : KNOWLEDGE_TEMPLATE_BANK.filter((template) => template.category === item.key).length
                  return (
                    <CategoryChip
                      key={item.key}
                      categoryKey={item.key}
                      label={item.label}
                      count={count}
                      active={selectedCategory === item.key}
                      onClick={() => setSelectedCategory(item.key as KnowledgeTemplateCategoryKey | 'all')}
                    />
                  )
                })}
              </div>
            </div>

            <div className="mt-5 space-y-6">
              {selectedCategory === 'all' ? (
                templateCategories.map((category) => {
                  const templates = KNOWLEDGE_TEMPLATE_BANK.filter(
                    (template) =>
                      template.category === category.key &&
                      matchesQuery([template.question, template.answer, getKnowledgeTemplateCategoryLabel(template.category)], searchQuery),
                  )
                  if (templates.length === 0) return null

                  return (
                    <section key={category.key} className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <CategoryChip categoryKey={category.key} label={category.label} count={templates.length} active />
                          <span className="text-xs font-medium text-[var(--text-muted)]">
                            Click any card to preview or add.
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          className="!px-4 !py-2 !text-xs"
                          onClick={() => void activateTemplateGroup(templates, category.key, category.label.toLowerCase())}
                          disabled={busyId !== null}
                        >
                          {busyId === category.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          Add all {templates.length}
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {templates.map((template) => {
                          const matchingDocument = findMatchingTemplateDocument(template)
                          return (
                            <TemplateCard
                              key={template.key}
                              template={template}
                              isActive={Boolean(matchingDocument?.isActive)}
                              busy={busyId === template.key}
                              onPreview={() => setPreviewTarget({ type: 'template', template })}
                              onAdd={() => void activateTemplate(template)}
                            />
                          )
                        })}
                      </div>
                    </section>
                  )
                })
              ) : (
                visibleTemplateGroups.map((category) => {
                  const templates = KNOWLEDGE_TEMPLATE_BANK.filter(
                    (template) =>
                      template.category === category.key &&
                      matchesQuery([template.question, template.answer, getKnowledgeTemplateCategoryLabel(template.category)], searchQuery),
                  )

                  if (templates.length === 0) {
                    return (
                      <div key={category.key} className="rounded-[24px] border border-dashed border-[var(--border-soft)] bg-[var(--panel-soft)] px-5 py-10 text-center text-sm text-[var(--text-muted)]">
                        No template matches found in this topic.
                      </div>
                    )
                  }

                  return (
                    <section key={category.key} className="space-y-4">
                      <div className="flex items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                          <CategoryChip categoryKey={category.key} label={category.label} count={templates.length} active />
                          <span className="text-xs font-medium text-[var(--text-muted)]">
                            {templates.length} template{templates.length === 1 ? '' : 's'} in this topic
                          </span>
                        </div>
                        <Button
                          variant="secondary"
                          className="!px-4 !py-2 !text-xs"
                          onClick={() => void activateTemplateGroup(templates, category.key, category.label.toLowerCase())}
                          disabled={busyId !== null}
                        >
                          {busyId === category.key ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Plus className="h-3.5 w-3.5" />}
                          Add all {templates.length}
                        </Button>
                      </div>

                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {templates.map((template) => {
                          const matchingDocument = findMatchingTemplateDocument(template)
                          return (
                            <TemplateCard
                              key={template.key}
                              template={template}
                              isActive={Boolean(matchingDocument?.isActive)}
                              busy={busyId === template.key}
                              onPreview={() => setPreviewTarget({ type: 'template', template })}
                              onAdd={() => void activateTemplate(template)}
                            />
                          )
                        })}
                      </div>
                    </section>
                  )
                })
              )}
            </div>
          </SurfaceCard>
        </div>

        <div className="xl:sticky xl:top-6 space-y-6 self-start">
          <SurfaceCard className="p-5 lg:p-6" glow>
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full border border-[var(--border-soft)] bg-[rgba(15, 42, 107,0.04)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--brand-strong)]">
                  <Plus className="h-3.5 w-3.5" />
                  Add article
                </div>
                <h3 className="mt-3 font-display text-2xl font-semibold tracking-[-0.04em] text-[var(--text-strong)]">
                  Quick create panel
                </h3>
              </div>
              {editingDocumentId ? (
                <StatusBadge tone="teal">Editing</StatusBadge>
              ) : (
                <StatusBadge tone="slate">New</StatusBadge>
              )}
            </div>

            <div className="mt-5 rounded-[24px] border border-[var(--border-soft)] bg-[rgba(15, 42, 107,0.04)] p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--text-muted)]">Live preview</div>
              <div className="mt-3 rounded-[20px] border border-[var(--border-soft)] bg-white/88 p-4">
                <div className="text-sm font-semibold text-[var(--text-strong)]">
                  {draft.question.trim() || 'Is parking available?'}
                </div>
                <p className="mt-2 text-sm leading-7 text-[var(--text-muted)]">
                  {draft.answer.trim() || 'Yes, free parking is available at our location.'}
                </p>
              </div>
            </div>

            {error ? <p className="mt-4 text-sm font-medium text-[var(--coral)]">{error}</p> : null}

            <form onSubmit={saveDraft} className="mt-5 space-y-4">
              <Input
                id="knowledge-question-input"
                value={draft.question}
                onChange={(event) => setDraft((current) => ({ ...current, question: event.target.value }))}
                placeholder="Is parking available?"
                label="Question"
                hint="This is the wording the AI agent will use to recognize the topic."
              />
              <Textarea
                value={draft.answer}
                onChange={(event) => setDraft((current) => ({ ...current, answer: event.target.value }))}
                placeholder="Yes, free parking is available at our location."
                label="Answer the agent will give"
                hint="Keep the answer short, direct, and ready for live conversation."
                rows={6}
              />
              <Select
                value={draft.category}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, category: event.target.value as KnowledgeTemplateCategoryKey }))
                }
                label="Topic"
                hint="Use the same topics that appear in the template browser."
              >
                {templateCategories.map((category) => (
                  <option key={category.key} value={category.key}>
                    {category.label}
                  </option>
                ))}
              </Select>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" variant="primary" className="flex-1 justify-center" disabled={savingDraft}>
                  {savingDraft ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
                  {editingDocumentId ? 'Update article' : 'Add article'}
                </Button>
                <Button type="button" variant="secondary" onClick={resetDraft}>
                  Clear
                </Button>
              </div>
            </form>

            <div className="mt-5 grid gap-3 rounded-[24px] border border-[var(--border-soft)] bg-[rgba(255,255,255,0.72)] p-4 text-sm text-[var(--text-muted)]">
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-[var(--text-strong)]">Current topic</span>
                <CategoryChip categoryKey={draft.category} label={resolveCategoryLabel(draft.category)} />
              </div>
              <div className="flex items-center justify-between gap-4">
                <span className="font-semibold text-[var(--text-strong)]">Editing mode</span>
                <span className="text-[var(--text-muted)]">{editingDocumentId ? 'Enabled' : 'Off'}</span>
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard className="p-5 lg:p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-11 w-11 shrink-0 place-items-center rounded-[18px] border border-[rgba(15, 42, 107,0.18)] bg-[rgba(15, 42, 107,0.08)] text-[var(--brand-strong)]">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <h4 className="font-semibold tracking-[-0.03em] text-[var(--text-strong)]">Soft delete behavior</h4>
                <p className="mt-1 text-sm leading-7 text-[var(--text-muted)]">
                  Archiving only removes an article from active use. The record stays in the archived section so you
                  can restore it later.
                </p>
              </div>
            </div>
          </SurfaceCard>
        </div>
      </div>

      <PreviewModal
        target={previewTarget}
        onClose={() => setPreviewTarget(null)}
        onAddTemplate={(template) => {
          void activateTemplate(template)
        }}
        onLoadDocument={(doc) => {
          if (!doc) return
          loadDocumentIntoDraft(doc)
        }}
        onLoadTemplate={(template) => {
          loadTemplateIntoDraft(template)
        }}
      />

      <div className="fixed bottom-5 right-5 z-30 flex max-w-sm flex-col gap-3">
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
