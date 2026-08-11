export type KnowledgeTemplateCategoryKey =
  | 'appointments'
  | 'insurance-billing'
  | 'hours-location'
  | 'new-patients'
  | 'prescriptions'
  | 'test-results'
  | 'telehealth'
  | 'referrals'
  | 'pediatrics'
  | 'mental-health'
  | 'urgent-care'
  | 'privacy-hipaa'

export type KnowledgeTemplateTone = 'teal' | 'emerald' | 'blue' | 'amber' | 'rose' | 'slate'

export type KnowledgeTemplateCategory = {
  key: 'all' | KnowledgeTemplateCategoryKey
  label: string
  tone: KnowledgeTemplateTone
}

export type KnowledgeTemplate = {
  key: string
  category: KnowledgeTemplateCategoryKey
  question: string
  answer: string
}

export const KNOWLEDGE_TEMPLATE_CATEGORIES: KnowledgeTemplateCategory[] = [
  { key: 'all', label: 'All Topics', tone: 'slate' },
  { key: 'appointments', label: 'Appointments', tone: 'teal' },
  { key: 'insurance-billing', label: 'Insurance & Billing', tone: 'blue' },
  { key: 'hours-location', label: 'Hours & Location', tone: 'emerald' },
  { key: 'new-patients', label: 'New Patients', tone: 'amber' },
  { key: 'prescriptions', label: 'Prescriptions', tone: 'rose' },
  { key: 'test-results', label: 'Test Results', tone: 'blue' },
  { key: 'telehealth', label: 'Telehealth', tone: 'teal' },
  { key: 'referrals', label: 'Referrals', tone: 'emerald' },
  { key: 'pediatrics', label: 'Pediatrics', tone: 'amber' },
  { key: 'mental-health', label: 'Mental Health', tone: 'rose' },
  { key: 'urgent-care', label: 'Urgent Care', tone: 'amber' },
  { key: 'privacy-hipaa', label: 'Privacy & HIPAA', tone: 'slate' },
]

type TemplateSeed = {
  question: string
  answer: string
}

const TEMPLATE_SEEDS: Record<KnowledgeTemplateCategoryKey, TemplateSeed[]> = {
  appointments: [
    {
      question: 'How do I schedule an appointment?',
      answer: 'You can book by phone, through the portal, or with the website widget. Our team will confirm the best visit type and time.',
    },
    {
      question: 'Can I book online?',
      answer: 'Yes. Use the portal or website widget to request a visit and we will follow up with a confirmation.',
    },
    {
      question: 'How far in advance should I arrive?',
      answer: 'Please arrive 10 to 15 minutes early so we can complete check-in and any required forms.',
    },
    {
      question: 'Can I reschedule my appointment?',
      answer: 'Yes. Contact the clinic as early as possible and we will move you to the next available slot.',
    },
    {
      question: 'Can I cancel an appointment?',
      answer: 'Yes. You can cancel through the portal or call the clinic before the visit starts.',
    },
    {
      question: 'Do you offer same-day appointments?',
      answer: 'Same-day openings are available when the schedule allows, especially for urgent concerns.',
    },
    {
      question: 'How do I check my appointment time?',
      answer: 'You can see your scheduled time in the portal and in the confirmation message we send after booking.',
    },
  ],
  'insurance-billing': [
    {
      question: 'What insurance plans do you accept?',
      answer: 'We accept most major plans, but coverage can vary by location and service. Our staff can verify your benefits before the visit.',
    },
    {
      question: "What if I don't have insurance?",
      answer: 'You can still receive care as a self-pay patient. We will review the expected cost before the appointment.',
    },
    {
      question: 'What is a copay?',
      answer: 'A copay is the amount your insurance asks you to pay at the time of the visit for a covered service.',
    },
    {
      question: 'Can I pay online?',
      answer: 'Yes. You can pay securely through the portal or settle the balance at the clinic.',
    },
    {
      question: 'Do you offer payment plans?',
      answer: 'For certain services, we can review partial payment options and remaining balances with you in advance.',
    },
    {
      question: 'How do I update my billing information?',
      answer: 'You can update billing details through the portal or let our front desk team help you by phone.',
    },
    {
      question: 'Can I get an itemized receipt?',
      answer: 'Yes. We can provide an itemized receipt for your records, insurance submission, or reimbursement request.',
    },
  ],
  'hours-location': [
    {
      question: 'What are your office hours?',
      answer: 'Our office hours vary by clinic, but the current schedule is listed in the portal and on the website.',
    },
    {
      question: 'Where are you located?',
      answer: 'You can find our address, directions, and maps link in the clinic profile and footer contact section.',
    },
    {
      question: 'Is parking available?',
      answer: 'Yes. Most locations offer patient parking or nearby public parking. We can share the details when you call.',
    },
    {
      question: 'Are you open on weekends?',
      answer: 'Weekend availability depends on the clinic schedule. Check the posted hours or ask the front desk team.',
    },
  ],
  'new-patients': [
    {
      question: 'Are you accepting new patients?',
      answer: 'Yes. We welcome new patients and can help you choose the best provider or service for your first visit.',
    },
    {
      question: 'What should I bring to my first appointment?',
      answer: 'Please bring a photo ID, insurance card if you have one, medication list, and any prior records that may help.',
    },
    {
      question: 'How do I complete my new patient forms?',
      answer: 'You can complete forms in the portal before your appointment or fill them out when you arrive.',
    },
    {
      question: 'How long is a first visit?',
      answer: 'First visits are usually longer so we can review your history, goals, and any current symptoms in detail.',
    },
    {
      question: 'Can minors be seen without a parent?',
      answer: 'Policies vary by service and age. In most cases, a parent or legal guardian must be involved.',
    },
  ],
  prescriptions: [
    {
      question: 'Can I request a prescription refill online?',
      answer: 'Yes. Submit the request through the portal and we will review it with your provider.',
    },
    {
      question: 'How do I ask for a new prescription?',
      answer: 'Book a visit or send the request through the portal so we can review your symptoms and medication history.',
    },
    {
      question: 'Do you prescribe controlled medications?',
      answer: 'Some medications require an in-person evaluation and are subject to clinic policy and state regulations.',
    },
    {
      question: 'How long do prescription requests take?',
      answer: 'Most requests are handled within one business day, but timing can vary depending on the medication and provider review.',
    },
  ],
  'test-results': [
    {
      question: 'How will I get my results?',
      answer: 'Results are usually shared in the portal, by message, or during a follow-up visit depending on the test type.',
    },
    {
      question: 'When will my results be ready?',
      answer: 'Timing depends on the test. Basic results may be available the same day, while others can take several days.',
    },
    {
      question: 'Can I see lab results in the portal?',
      answer: 'Yes. When results are released, you can review them in the patient portal if that feature is enabled for your clinic.',
    },
    {
      question: 'Who explains abnormal results?',
      answer: 'A clinician will contact you if anything needs follow-up and will explain the next steps clearly.',
    },
  ],
  telehealth: [
    {
      question: 'Do you offer virtual visits?',
      answer: 'Yes. Telehealth appointments are available for many follow-ups, consultations, and medication check-ins.',
    },
    {
      question: 'How do I join a telehealth appointment?',
      answer: 'We will send you a secure link before the visit. Open it a few minutes early and follow the prompts.',
    },
    {
      question: 'What equipment do I need for telehealth?',
      answer: 'A phone, tablet, or computer with a camera and microphone is usually enough for a virtual visit.',
    },
    {
      question: 'Can I use telehealth for follow-up visits?',
      answer: 'Yes. Follow-up care is one of the most common uses for telehealth when an in-person exam is not required.',
    },
  ],
  referrals: [
    {
      question: 'Do I need a referral to see a specialist?',
      answer: 'Some specialties require a referral from your primary care provider or insurance plan before scheduling.',
    },
    {
      question: 'How do I get a referral?',
      answer: 'Ask the clinic during your appointment or through the portal and we will review the best next step.',
    },
    {
      question: 'How long does a referral take?',
      answer: 'Referral timing depends on the specialty and insurance rules, but we process them as quickly as possible.',
    },
  ],
  pediatrics: [
    {
      question: 'Do you see children?',
      answer: 'Yes. Pediatric care is available for infants, children, and teens depending on the clinic setup.',
    },
    {
      question: 'Do you offer immunizations for kids?',
      answer: 'Yes. We provide recommended childhood vaccines based on age and care guidelines.',
    },
    {
      question: 'Can I schedule a school physical?',
      answer: 'Absolutely. School and sports physicals can be booked like any other visit.',
    },
    {
      question: 'Do you see newborns?',
      answer: 'Yes. Newborn checkups are available for early growth, feeding, and wellness guidance.',
    },
  ],
  'mental-health': [
    {
      question: 'Do you offer mental health services?',
      answer: 'Yes. Depending on the clinic, we offer counseling, therapy, medication management, or virtual support.',
    },
    {
      question: 'Is my mental health information kept confidential?',
      answer: 'Yes. Mental health records are protected and only shared with the proper authorization or safety exceptions required by law.',
    },
    {
      question: 'How long is a therapy session?',
      answer: 'Therapy sessions usually last about 45 to 60 minutes, depending on the provider and visit type.',
    },
    {
      question: 'Can I schedule an urgent mental health visit?',
      answer: 'If you need urgent support, contact the clinic right away so we can help you get the appropriate care.',
    },
  ],
  'urgent-care': [
    {
      question: 'Do I need an appointment for urgent care?',
      answer: 'In most cases, urgent care accepts walk-ins, but same-day scheduling can help you avoid waiting.',
    },
    {
      question: 'What conditions do you treat in urgent care?',
      answer: 'We handle minor injuries, fevers, infections, rashes, sprains, and other non-emergency concerns that need prompt attention.',
    },
    {
      question: 'How long is the wait time?',
      answer: 'Wait times vary based on volume and severity. We will always try to see urgent cases as quickly as possible.',
    },
    {
      question: 'Can I walk in today?',
      answer: 'Yes. If there is availability, you can walk in today and our team will help you check in.',
    },
  ],
  'privacy-hipaa': [
    {
      question: 'Is my information protected?',
      answer: 'Yes. We protect patient data using the security and privacy controls required for healthcare information.',
    },
    {
      question: 'Can you share records with family members?',
      answer: 'Only with your permission or when the law allows it. We follow clinic policy and privacy regulations carefully.',
    },
    {
      question: 'How do I request medical records?',
      answer: 'You can request records through the clinic office or the portal depending on the workflow your location uses.',
    },
  ],
}

export const KNOWLEDGE_TEMPLATE_BANK: KnowledgeTemplate[] = (Object.entries(TEMPLATE_SEEDS) as Array<
  [KnowledgeTemplateCategoryKey, TemplateSeed[]]
>).flatMap(([category, items]) =>
  items.map((item, index) => ({
    key: `${category}-${index + 1}`,
    category,
    question: item.question,
    answer: item.answer,
  })),
)

export function getKnowledgeTemplateCategoryLabel(categoryKey: KnowledgeTemplateCategoryKey | 'all') {
  return KNOWLEDGE_TEMPLATE_CATEGORIES.find((category) => category.key === categoryKey)?.label ?? 'All Topics'
}

export function getKnowledgeTemplateCategoryTone(categoryKey: KnowledgeTemplateCategoryKey | 'all'): KnowledgeTemplateTone {
  return KNOWLEDGE_TEMPLATE_CATEGORIES.find((category) => category.key === categoryKey)?.tone ?? 'slate'
}

