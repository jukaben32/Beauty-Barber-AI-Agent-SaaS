export type KnowledgeTemplateCategoryKey =
  | 'appointments'
  | 'booking-cancellation'
  | 'hours-location'
  | 'new-clients'
  | 'pricing-payment'
  | 'products-allergies'
  | 'loyalty-membership'
  | 'walk-ins'
  | 'bridal-events'
  | 'kids'
  | 'gift-cards'
  | 'privacy'

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
  { key: 'booking-cancellation', label: 'Booking & Cancellation', tone: 'blue' },
  { key: 'hours-location', label: 'Hours & Location', tone: 'emerald' },
  { key: 'new-clients', label: 'New Clients', tone: 'amber' },
  { key: 'pricing-payment', label: 'Pricing & Payment', tone: 'rose' },
  { key: 'products-allergies', label: 'Products & Allergies', tone: 'blue' },
  { key: 'loyalty-membership', label: 'Loyalty & Membership', tone: 'teal' },
  { key: 'walk-ins', label: 'Walk-Ins', tone: 'emerald' },
  { key: 'bridal-events', label: 'Bridal & Events', tone: 'amber' },
  { key: 'kids', label: 'Kids', tone: 'rose' },
  { key: 'gift-cards', label: 'Gift Cards', tone: 'amber' },
  { key: 'privacy', label: 'Privacy', tone: 'slate' },
]

type TemplateSeed = {
  question: string
  answer: string
}

const TEMPLATE_SEEDS: Record<KnowledgeTemplateCategoryKey, TemplateSeed[]> = {
  appointments: [
    {
      question: 'How do I book an appointment?',
      answer: 'You can book by phone, through the client portal, or with the website widget. We will confirm the stylist, service, and time.',
    },
    {
      question: 'Can I book online?',
      answer: 'Yes. Use the portal or website widget to request a time and we will follow up with a confirmation.',
    },
    {
      question: 'How far in advance should I arrive?',
      answer: 'Please arrive 5 to 10 minutes early so we can get you checked in and settled before your service starts.',
    },
    {
      question: 'Can I request a specific stylist or barber?',
      answer: 'Yes. Let us know your preference when booking and we will match you with them whenever their schedule allows.',
    },
    {
      question: 'Do you offer same-day appointments?',
      answer: 'Same-day openings come up often, especially for haircuts and quick services. Check availability in the portal or give us a call.',
    },
    {
      question: 'How do I check my appointment time?',
      answer: 'You can see your scheduled time in the portal and in the confirmation message we send after booking.',
    },
  ],
  'booking-cancellation': [
    {
      question: 'What is your cancellation policy?',
      answer: 'We ask for at least 24 hours notice to cancel or reschedule so we can offer the slot to another client.',
    },
    {
      question: 'Do you charge a no-show fee?',
      answer: 'Missed appointments without notice may be charged a no-show fee. Rescheduling ahead of time avoids this.',
    },
    {
      question: 'Do you require a deposit to book?',
      answer: 'Some services, like color, extensions, and bridal bookings, require a deposit to secure your appointment. The deposit is applied to your final total.',
    },
    {
      question: 'Can I reschedule my appointment?',
      answer: 'Yes. Contact us as early as possible and we will move you to the next available slot with your preferred stylist.',
    },
    {
      question: 'How late can I be for my appointment?',
      answer: 'We can typically hold your slot for about 10 minutes. If you are running later than that, call us so we can adjust the service or reschedule.',
    },
  ],
  'hours-location': [
    {
      question: 'What are your hours?',
      answer: 'Our hours are listed in the portal and on the website, and can vary by day and stylist availability.',
    },
    {
      question: 'Where are you located?',
      answer: 'You can find our address, directions, and a maps link in our profile and footer contact section.',
    },
    {
      question: 'Is parking available?',
      answer: 'Yes. Parking is available on-site or nearby. We can share exact details when you call or book.',
    },
    {
      question: 'Are you open on weekends?',
      answer: 'Weekend availability depends on our schedule that week. Check posted hours or ask our front desk team.',
    },
  ],
  'new-clients': [
    {
      question: 'Are you accepting new clients?',
      answer: 'Yes. We welcome new clients and can help you choose the right stylist, barber, or service for your first visit.',
    },
    {
      question: 'Should I bring anything to my first appointment?',
      answer: 'Reference photos of the style or color you want are always helpful, but not required. Just come as you are.',
    },
    {
      question: 'How long is a first visit?',
      answer: 'First visits often run a little longer so we can do a consultation, talk through your hair or skin history, and set expectations.',
    },
    {
      question: 'Do you offer consultations before booking a big change?',
      answer: 'Yes. For major color changes, extensions, or bridal work, we recommend a free short consultation first.',
    },
  ],
  'pricing-payment': [
    {
      question: 'How much do your services cost?',
      answer: 'Pricing varies by service, hair length or thickness, and stylist. Exact pricing is listed on our services page, and we always confirm the estimate before starting.',
    },
    {
      question: 'What payment methods do you accept?',
      answer: 'We accept major cards, contactless payment, and cash. You can also pay securely through the portal.',
    },
    {
      question: 'Do you offer payment plans for larger services?',
      answer: 'For bridal packages or multi-session color work, we can discuss a deposit plus final-payment structure.',
    },
    {
      question: 'Is gratuity included in the price?',
      answer: 'Gratuity is not included in our listed prices and is always appreciated but never required.',
    },
    {
      question: 'Can I get a receipt?',
      answer: 'Yes. We can email or print an itemized receipt for any visit.',
    },
  ],
  'products-allergies': [
    {
      question: 'What hair and skincare product brands do you use?',
      answer: 'We use professional salon-grade brands for color, styling, and skincare. Ask your stylist for the exact line used on your service.',
    },
    {
      question: 'Do you offer a patch test before color services?',
      answer: 'Yes, and we recommend one for first-time color clients or anyone with sensitive skin, at least 48 hours before your appointment.',
    },
    {
      question: 'I have a sensitivity or allergy. Can you accommodate that?',
      answer: 'Please tell us about any known sensitivities or allergies when booking so we can choose suitable products and patch test in advance.',
    },
    {
      question: 'Can I buy the products used on me?',
      answer: 'Yes. Most products used during your service are available for purchase at the front desk.',
    },
  ],
  'loyalty-membership': [
    {
      question: 'Do you have a loyalty program?',
      answer: 'Yes. You earn points toward discounts and free add-ons every time you book with us. Ask our front desk to enroll you.',
    },
    {
      question: 'Do you offer memberships or packages?',
      answer: 'We offer monthly membership plans and prepaid service packages for regular clients. Ask us for current options and pricing.',
    },
    {
      question: 'Can I refer a friend for a discount?',
      answer: 'Yes. Referral perks are available for both you and your friend on their first visit.',
    },
  ],
  'walk-ins': [
    {
      question: 'Do you accept walk-ins?',
      answer: 'Yes, when availability allows, especially for haircuts and quick services. Booking ahead guarantees your spot with your preferred stylist.',
    },
    {
      question: 'How long is the wait for a walk-in?',
      answer: 'Wait times vary by day and time. We can give you a live estimate if you call ahead or check with the front desk.',
    },
    {
      question: 'Can I walk in for a color or chemical service?',
      answer: 'Longer services like color, extensions, or treatments are best booked in advance so we can reserve enough time with the right stylist.',
    },
  ],
  'bridal-events': [
    {
      question: 'Do you offer bridal hair and makeup?',
      answer: 'Yes. We offer bridal trials and day-of styling for hair and makeup, plus packages for the bridal party.',
    },
    {
      question: 'When should I book my bridal trial?',
      answer: 'We recommend booking a trial 1 to 2 months before the wedding, and locking in your day-of appointment as soon as your date is set.',
    },
    {
      question: 'Do you travel for weddings or events?',
      answer: 'On-location styling may be available depending on the date and team availability - ask us when booking.',
    },
    {
      question: 'Do you require a deposit for bridal bookings?',
      answer: 'Yes. Bridal and event bookings require a deposit to hold your date, applied toward your final total.',
    },
  ],
  kids: [
    {
      question: 'Do you cut children\'s hair?',
      answer: 'Yes. We offer kid-friendly haircuts for children of most ages.',
    },
    {
      question: 'Is there an age minimum for color or chemical services?',
      answer: 'Color and chemical services are generally reserved for teens and up, with parental consent required for minors.',
    },
    {
      question: 'Can a parent stay during the appointment?',
      answer: 'Absolutely. Parents and guardians are always welcome to stay with younger clients.',
    },
  ],
  'gift-cards': [
    {
      question: 'Do you sell gift cards?',
      answer: 'Yes. Gift cards are available in any amount, in salon or online, and can be used toward any service or product.',
    },
    {
      question: 'Do gift cards expire?',
      answer: 'Our gift cards do not expire and can be used at any time.',
    },
    {
      question: 'Can I use a gift card to book online?',
      answer: 'Yes. Enter your gift card code at checkout when booking through the portal, or mention it when you call.',
    },
  ],
  privacy: [
    {
      question: 'Is my personal information protected?',
      answer: 'Yes. We keep your contact and appointment information secure and only use it to manage your bookings and communicate with you.',
    },
    {
      question: 'Can you share my information with anyone else?',
      answer: 'We never share your information outside our business except where required by law or with your explicit permission.',
    },
    {
      question: 'How do I update or remove my information?',
      answer: 'You can update your details anytime through the portal, or contact us directly and we will take care of it.',
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
