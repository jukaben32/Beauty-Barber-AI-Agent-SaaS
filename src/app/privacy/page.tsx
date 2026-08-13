import type { Metadata } from 'next'
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Privacy Policy',
}

const COMPANY_NAME = '[Legal company name]'
const CONTACT_EMAIL = '[contact@yourdomain.com]'

export default function PrivacyPage() {
  return (
    <LegalPageLayout title="Privacy Policy" effectiveDate="[YYYY-MM-DD]">
      <LegalSection title="1. Scope">
        <p>
          This Privacy Policy explains how {COMPANY_NAME} (&quot;we&quot;) collects, uses, and shares personal
          data through the Clara AI booking platform (the &quot;Service&quot;) — both data from businesses that
          run the Service (&quot;Customers&quot;) and data about the Customer&apos;s own clients
          (&quot;Clients&quot;) collected when they book, call, chat, or message a Customer&apos;s AI assistant.
        </p>
      </LegalSection>

      <LegalSection title="2. What we collect">
        <ul className="list-disc space-y-2 pl-5">
          <li>
            <strong>Business account data:</strong> owner/staff name, email, phone, business profile, and
            configuration entered into the dashboard.
          </li>
          <li>
            <strong>Client data:</strong> name, phone number, email, appointment history, and any notes a
            Client or the Customer&apos;s staff enters.
          </li>
          <li>
            <strong>Conversation data:</strong> voice call transcripts, chat messages, and WhatsApp messages
            exchanged with the AI assistant, kept so the Customer can review what was discussed and so the
            assistant can hand off context to staff.
          </li>
          <li>
            <strong>Payment references:</strong> the payment method a Client selects (cash, bank transfer, or
            card) and any confirmation number or reference they provide. We do not collect or store full card
            numbers, card verification codes, or bank account credentials.
          </li>
          <li>
            <strong>Technical data:</strong> IP address and basic request metadata, used for abuse prevention
            (rate limiting) and diagnostics.
          </li>
        </ul>
      </LegalSection>

      <LegalSection title="3. How we use it">
        <ul className="list-disc space-y-2 pl-5">
          <li>To operate the booking, scheduling, and AI assistant features of the Service;</li>
          <li>To send appointment confirmations, reminders, and account-related email;</li>
          <li>To detect and prevent abuse of public endpoints (e.g. request rate limiting);</li>
          <li>To improve the Service, including reviewing AI assistant transcripts for quality and safety;</li>
          <li>To comply with legal obligations.</li>
        </ul>
        <p>We do not sell personal data.</p>
      </LegalSection>

      <LegalSection title="4. Who we share it with">
        <p>
          We share data with the sub-processors that run the Service&apos;s infrastructure, strictly to provide
          it:
        </p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Our database, authentication, and file storage provider;</li>
          <li>Our AI/language model provider, to generate the assistant&apos;s voice and chat responses;</li>
          <li>Our transactional email provider, to send booking and account emails;</li>
          <li>
            If the Customer connects WhatsApp, our WhatsApp gateway provider, to send and receive WhatsApp
            messages on the Customer&apos;s behalf;</li>
          <li>Our hosting provider.</li>
        </ul>
        <p>
          Within the Service, a Customer&apos;s staff can see the data of their own Clients only — businesses do
          not see each other&apos;s data.
        </p>
      </LegalSection>

      <LegalSection title="5. Data retention">
        <p>
          We retain Customer and Client data for as long as the Customer&apos;s account is active, plus a
          reasonable period after closure to allow data export or as required by law. Rate-limit request
          records are kept only briefly (on the order of hours) and then deleted automatically.
        </p>
      </LegalSection>

      <LegalSection title="6. Your rights">
        <p>
          Depending on where you are located, you may have rights to access, correct, export, or delete your
          personal data, and to object to certain processing. A Client should generally direct these requests
          to the business they booked with, since the business controls that data; a business owner can
          contact us directly at {CONTACT_EMAIL}.
        </p>
        <p>
          [If operating in or serving the Dominican Republic, confirm applicable obligations under Ley
          172-13 on the protection of personal data, and update this section accordingly. If serving the EU/UK
          or California, add the corresponding GDPR/CCPA disclosures.]
        </p>
      </LegalSection>

      <LegalSection title="7. Security">
        <p>
          We use industry-standard measures to protect data in transit and at rest, including per-business data
          isolation at the database level. No system is perfectly secure, and we cannot guarantee absolute
          security.
        </p>
      </LegalSection>

      <LegalSection title="8. Cookies">
        <p>
          We use essential cookies to keep you signed in and to operate the Service. We do not currently use
          third-party advertising or cross-site tracking cookies.
        </p>
      </LegalSection>

      <LegalSection title="9. Children">
        <p>
          The Service is intended for business use and for adults booking salon/barbershop appointments. We do
          not knowingly collect data from children beyond what a parent or guardian provides when booking on a
          minor&apos;s behalf.
        </p>
      </LegalSection>

      <LegalSection title="10. Changes to this policy">
        <p>
          We may update this Privacy Policy from time to time. Material changes will be notified through the
          Service or by email.
        </p>
      </LegalSection>

      <LegalSection title="11. Contact">
        <p>
          Questions about this policy can be sent to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--brand)]">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
