import type { ClinicService } from '@/types'

export type AgentTemplateCategory =
  | 'all'
  | 'general-practice'
  | 'mental-health'
  | 'pediatrics'
  | 'urgent-care'
  | 'dental'
  | 'telehealth'
  | 'specialist'
  | 'chronic-care'

export type AgentSensitivityPreset = 'gentle' | 'balanced' | 'decisive'

export type AgentTemplate = {
  key: string
  name: string
  title: string
  specialty: string
  category: AgentTemplateCategory
  badge: string
  badgeTone: 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'
  accent: string
  voice: string
  personality: string
  sensitivity: AgentSensitivityPreset
  greetingMessage: string
  systemPrompt: string
  capabilities: string[]
  bestFor: string[]
  serviceKeywords: string[]
}

export const TEMPLATE_FILTERS: Array<{ key: AgentTemplateCategory; label: string }> = [
  { key: 'all', label: 'All' },
  { key: 'general-practice', label: 'General Practice' },
  { key: 'mental-health', label: 'Mental Health & Therapy' },
  { key: 'pediatrics', label: 'Pediatrics & Child Health' },
  { key: 'urgent-care', label: 'Urgent & Emergency Care' },
  { key: 'dental', label: 'Dental & Oral Health' },
  { key: 'telehealth', label: 'Telehealth & Remote Care' },
  { key: 'specialist', label: 'Specialist & Premium Care' },
  { key: 'chronic-care', label: 'Chronic Care & Wellness' },
]

export const VOICE_OPTIONS = [
  { value: 'nova', label: 'Nova', description: 'Female, warm and clear' },
  { value: 'alloy', label: 'Alloy', description: 'Neutral, calm and balanced' },
  { value: 'shimmer', label: 'Shimmer', description: 'Friendly and conversational' },
  { value: 'echo', label: 'Echo', description: 'Professional and precise' },
  { value: 'onyx', label: 'Onyx', description: 'Formal and confident' },
  { value: 'fable', label: 'Fable', description: 'Casual and approachable' },
]

export const PERSONALITY_OPTIONS = ['Professional', 'Friendly', 'Warm', 'Calm', 'Decisive', 'Empathetic'] as const

// Used both to label the agent and as the language hint sent to Whisper for
// call transcription - without it, transcripts default toward English no
// matter what language the caller actually speaks.
export const LANGUAGE_OPTIONS = [
  { value: 'en', label: 'English' },
  { value: 'es', label: 'Spanish' },
  { value: 'pt', label: 'Portuguese' },
  { value: 'fr', label: 'French' },
  { value: 'ht', label: 'Haitian Creole' },
]

export const SENSITIVITY_OPTIONS: Array<{
  value: AgentSensitivityPreset
  label: string
  detail: string
  numeric: number
}> = [
  { value: 'gentle', label: 'Low - Gentle', detail: 'Lets the patient speak longer.', numeric: 0.25 },
  { value: 'balanced', label: 'Medium - Balanced', detail: 'A natural interruption rhythm.', numeric: 0.5 },
  { value: 'decisive', label: 'High - Fast & Decisive', detail: 'Moves the conversation quickly.', numeric: 0.8 },
]

export const DEFAULT_AGENT_PROMPT =
  'You are a professional medical receptionist. Your goals are to answer questions, capture patient details, and book appointments in a calm, efficient, and reassuring way.'

export const AGENT_TEMPLATES: AgentTemplate[] = [
  {
    key: 'clara',
    name: 'Clara',
    title: 'Front Desk Receptionist',
    specialty: 'General Practice',
    category: 'general-practice',
    badge: 'Most Popular',
    badgeTone: 'teal',
    accent: '#0f766e',
    voice: 'nova',
    personality: 'Professional',
    sensitivity: 'balanced',
    greetingMessage:
      'Hello! Thank you for calling. I am Clara, your AI medical receptionist. I can help you schedule an appointment, answer questions about our services, or provide any other information you need. How can I assist you today?',
    systemPrompt:
      'You are Clara, a professional AI medical receptionist. Your primary goals are to help patients schedule appointments, answer questions about healthcare services, and capture patient information.',
    capabilities: ['Appointment booking', 'Insurance verification', 'Service FAQs', 'Callback requests'],
    bestFor: ['General clinics', 'Family medicine', 'Multi-specialty practices'],
    serviceKeywords: ['general', 'consult', 'follow', 'check'],
  },
  {
    key: 'grace',
    name: 'Grace',
    title: 'Patient Care Coordinator',
    specialty: 'Chronic Care & Wellness',
    category: 'chronic-care',
    badge: 'Patient Favorite',
    badgeTone: 'rose',
    accent: '#db2777',
    voice: 'shimmer',
    personality: 'Friendly',
    sensitivity: 'balanced',
    greetingMessage:
      'Hi there! I am Grace, your care coordinator. I am here to make scheduling as easy as possible and help keep your care on track.',
    systemPrompt:
      'You are Grace, a patient care coordinator focused on follow-up scheduling, wellness check-ins, and warm support for ongoing care plans.',
    capabilities: ['Warm patient support', 'Follow-up scheduling', 'Wellness check-ins', 'Care plan guidance'],
    bestFor: ['Wellness clinics', 'Chronic disease management', 'Primary care'],
    serviceKeywords: ['follow', 'wellness', 'care', 'plan'],
  },
  {
    key: 'dr-morgan',
    name: 'Dr. Morgan',
    title: 'Patient Services Consultant',
    specialty: 'Specialist & Premium Care',
    category: 'specialist',
    badge: 'High-End Practices',
    badgeTone: 'blue',
    accent: '#7c3aed',
    voice: 'onyx',
    personality: 'Formal',
    sensitivity: 'gentle',
    greetingMessage:
      'Hello, thank you for reaching out. I am Dr. Morgan. I can help coordinate your visit, answer questions about our services, and guide you to the right specialist.',
    systemPrompt:
      'You are Dr. Morgan, a premium patient services consultant. You handle specialist routing, concierge scheduling, and detailed service explanations with a polished tone.',
    capabilities: ['Detailed service consults', 'Specialist referrals', 'Insurance pre-auth', 'Concierge support'],
    bestFor: ['Specialist clinics', 'Concierge medicine', 'Premium practices'],
    serviceKeywords: ['specialist', 'referral', 'consult', 'premium'],
  },
  {
    key: 'luna',
    name: 'Luna',
    title: 'Mental Health Intake Coordinator',
    specialty: 'Mental Health & Therapy',
    category: 'mental-health',
    badge: 'Sensitive & Calm',
    badgeTone: 'slate',
    accent: '#8b5cf6',
    voice: 'shimmer',
    personality: 'Calm',
    sensitivity: 'gentle',
    greetingMessage:
      'Hi, I am Luna. I am here to help you take the next step toward care in a calm, respectful, and supportive way.',
    systemPrompt:
      'You are Luna, a mental health intake assistant. You focus on compassionate triage, therapy scheduling, and supportive intake conversations.',
    capabilities: ['Compassionate intake', 'Crisis awareness', 'Therapy scheduling', 'Confidential routing'],
    bestFor: ['Therapy practices', 'Psychiatry clinics', 'Behavioral health'],
    serviceKeywords: ['mental', 'therapy', 'behavior', 'counsel'],
  },
  {
    key: 'aria',
    name: 'Aria',
    title: 'Pediatric Intake Coordinator',
    specialty: 'Pediatrics & Child Health',
    category: 'pediatrics',
    badge: 'Family-Friendly',
    badgeTone: 'amber',
    accent: '#f59e0b',
    voice: 'fable',
    personality: 'Friendly',
    sensitivity: 'gentle',
    greetingMessage:
      'Hello! I am Aria, and I am here to help with your child’s visit, scheduling, and any questions you have for the clinic.',
    systemPrompt:
      'You are Aria, a pediatric intake coordinator. You support child wellness visits, vaccination scheduling, and family-friendly communication.',
    capabilities: ['Well-child visit booking', 'Vaccination scheduling', 'Parent FAQ handling', 'Triage for pediatrics'],
    bestFor: ['Pediatric clinics', 'Children’s hospitals', 'Family practices'],
    serviceKeywords: ['pediatric', 'child', 'vac', 'family'],
  },
  {
    key: 'victor',
    name: 'Victor',
    title: 'Urgent Care Triage Agent',
    specialty: 'Urgent & Emergency Care',
    category: 'urgent-care',
    badge: 'Fast & Decisive',
    badgeTone: 'rose',
    accent: '#dc2626',
    voice: 'echo',
    personality: 'Decisive',
    sensitivity: 'decisive',
    greetingMessage:
      'Thank you for calling. I am Victor, and I will quickly help route your request to the right urgent care service or appointment.',
    systemPrompt:
      'You are Victor, an urgent care triage assistant. You prioritize symptom triage, same-day scheduling, and quick routing for non-emergency urgent needs.',
    capabilities: ['Symptom triage', 'Wait time info', 'Walk-in appointment guidance', 'Escalation routing'],
    bestFor: ['Urgent care centers', 'Walk-in clinics', 'After-hours support'],
    serviceKeywords: ['urgent', 'emergency', 'triage', 'walk'],
  },
  {
    key: 'sage',
    name: 'Sage',
    title: 'Dental Office Receptionist',
    specialty: 'Dental & Oral Health',
    category: 'dental',
    badge: 'Dental Practices',
    badgeTone: 'blue',
    accent: '#0891b2',
    voice: 'alloy',
    personality: 'Friendly',
    sensitivity: 'balanced',
    greetingMessage:
      'Hello! I am Sage, your dental scheduling assistant. I can help with cleaning visits, dental emergencies, and procedure information.',
    systemPrompt:
      'You are Sage, a dental office receptionist. You handle cleaning bookings, emergency triage, insurance questions, and dental procedure information.',
    capabilities: ['Cleaning and checkup booking', 'Dental emergency triage', 'Insurance and payment plans', 'Procedure information'],
    bestFor: ['Dental clinics', 'Orthodontists', 'Oral surgery practices'],
    serviceKeywords: ['dental', 'oral', 'clean', 'checkup'],
  },
  {
    key: 'nova',
    name: 'Nova',
    title: 'Virtual Care Coordinator',
    specialty: 'Telehealth & Remote Care',
    category: 'telehealth',
    badge: 'Digital-First',
    badgeTone: 'emerald',
    accent: '#16a34a',
    voice: 'shimmer',
    personality: 'Casual',
    sensitivity: 'balanced',
    greetingMessage:
      'Hi, I am Nova. I can help with virtual scheduling, platform setup questions, and remote care coordination.',
    systemPrompt:
      'You are Nova, a virtual care coordinator. You support telehealth scheduling, remote visit setup, and digital patient guidance.',
    capabilities: ['Virtual visit scheduling', 'Platform setup guidance', 'Prescription refill requests', 'Remote care support'],
    bestFor: ['Telehealth platforms', 'Remote-first practices', 'Hybrid care teams'],
    serviceKeywords: ['tele', 'remote', 'virtual', 'video'],
  },
]

export function getTemplateCategoryLabel(category: AgentTemplateCategory) {
  return TEMPLATE_FILTERS.find((item) => item.key === category)?.label ?? 'All'
}

export function matchTemplateServiceIds(template: AgentTemplate, services: ClinicService[]) {
  const activeServices = services.filter((service) => service.active)
  const matched = activeServices.filter((service) =>
    template.serviceKeywords.some((keyword) => {
      const haystack = `${service.name} ${service.description ?? ''} ${service.instructions ?? ''}`.toLowerCase()
      return haystack.includes(keyword.toLowerCase())
    }),
  )

  if (matched.length > 0) {
    return matched.map((service) => service.id)
  }

  return activeServices.slice(0, Math.min(3, activeServices.length)).map((service) => service.id)
}

