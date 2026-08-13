import type { Metadata } from 'next'
import { LegalPageLayout, LegalSection } from '@/components/legal/LegalPageLayout'

export const metadata: Metadata = {
  title: 'Terms of Service',
}

const COMPANY_NAME = '[Legal company name]'
const CONTACT_EMAIL = '[contact@yourdomain.com]'
const JURISDICTION = '[Dominican Republic — confirm with counsel]'

export default function TermsPage() {
  return (
    <LegalPageLayout title="Terms of Service" effectiveDate="[YYYY-MM-DD]">
      <LegalSection title="1. Who this agreement is with">
        <p>
          These Terms of Service (&quot;Terms&quot;) govern access to and use of the Clara AI booking platform
          (the &quot;Service&quot;), operated by {COMPANY_NAME} (&quot;we&quot;, &quot;us&quot;). By creating a
          business account, embedding the widget, or otherwise using the Service, you (&quot;Customer&quot;,
          &quot;you&quot;) agree to these Terms on behalf of yourself and the business you represent.
        </p>
      </LegalSection>

      <LegalSection title="2. The Service">
        <p>
          The Service lets a salon, barbershop, or similar business manage appointments, clients, and services,
          and offer an AI-powered voice, chat, and WhatsApp booking assistant to its own clients through a
          website widget, phone line, or WhatsApp number the Customer connects. The AI assistant can access the
          Customer&apos;s configured services, availability, and booking rules to answer questions, schedule,
          reschedule, or cancel appointments, and record payment commitments on the Customer&apos;s behalf.
        </p>
        <p>
          The Customer is responsible for the accuracy of the business information, pricing, and policies it
          configures — the AI assistant relays what it is given.
        </p>
      </LegalSection>

      <LegalSection title="3. Accounts and eligibility">
        <ul className="list-disc space-y-2 pl-5">
          <li>You must provide accurate information when creating a business account and keep it current.</li>
          <li>You are responsible for activity under your account and for keeping login credentials confidential.</li>
          <li>You must have authority to bind the business you register on behalf of.</li>
        </ul>
      </LegalSection>

      <LegalSection title="4. Subscription plans and billing">
        <p>
          The Service is offered under the plans described at sign-up ([Free / Starter / Professional /
          Enterprise]). [Describe here how and when the Customer is billed for their subscription — this
          section must be completed once a real billing mechanism is in place; none is wired up in the
          product today.] Fees are non-refundable except as required by law or as we expressly state.
        </p>
      </LegalSection>

      <LegalSection title="5. Client payments collected through the Service">
        <p>
          The Service lets a Customer&apos;s clients commit to paying for appointments by cash, bank transfer,
          or card, and lets the Customer record the corresponding payment method and reference. We do not
          process card payments ourselves and do not store full card numbers. Bank transfer and cash payments
          are self-reported by the client and must be confirmed by the Customer&apos;s own staff — we make no
          guarantee that a reported payment was actually received.
        </p>
      </LegalSection>

      <LegalSection title="6. AI-generated content and calls">
        <p>
          The AI assistant uses a third-party language model provider to generate responses and may transcribe
          voice calls to text for booking and quality purposes. AI output can be inaccurate. The Customer is
          responsible for reviewing the assistant&apos;s configured instructions and for confirming appointment
          and pricing details with clients where accuracy is critical. The assistant is instructed to refer
          medical, health, or safety concerns to a qualified professional rather than advise on them, but we do
          not guarantee it will do so in every case.
        </p>
      </LegalSection>

      <LegalSection title="7. Acceptable use">
        <p>You agree not to use the Service to:</p>
        <ul className="list-disc space-y-2 pl-5">
          <li>Violate any applicable law, including consumer protection and data protection law;</li>
          <li>Send unsolicited communications to people who have not consented to being contacted;</li>
          <li>Attempt to disrupt, overload, or reverse-engineer the Service;</li>
          <li>Upload content you do not have the right to use, or that infringes a third party&apos;s rights.</li>
        </ul>
      </LegalSection>

      <LegalSection title="8. Data ownership and use">
        <p>
          As between the parties, the Customer owns the client, appointment, and business data it enters into
          the Service. We process it to provide the Service and as described in our{' '}
          <a href="/privacy" className="font-semibold text-[var(--brand)]">
            Privacy Policy
          </a>
          . On termination, the Customer may request an export of its data within [30] days; after that period
          it may be deleted.
        </p>
      </LegalSection>

      <LegalSection title="9. Third-party services">
        <p>
          The Service relies on third-party infrastructure to operate, including a database and authentication
          provider, an AI model provider, a transactional email provider, and — if the Customer connects
          WhatsApp — a WhatsApp gateway provider. Availability and performance of the Service depend on these
          providers.
        </p>
      </LegalSection>

      <LegalSection title="10. Disclaimers and limitation of liability">
        <p>
          THE SERVICE IS PROVIDED &quot;AS IS&quot; WITHOUT WARRANTIES OF ANY KIND. TO THE MAXIMUM EXTENT
          PERMITTED BY LAW, {COMPANY_NAME.toUpperCase()} WILL NOT BE LIABLE FOR INDIRECT, INCIDENTAL, OR
          CONSEQUENTIAL DAMAGES, OR FOR LOST REVENUE, ARISING FROM USE OF THE SERVICE, INCLUDING ERRORS OR
          OMISSIONS IN AI-GENERATED CONTENT OR MISSED/DOUBLE-BOOKED APPOINTMENTS.
        </p>
      </LegalSection>

      <LegalSection title="11. Termination">
        <p>
          Either party may terminate at any time. We may suspend or terminate access for a material breach of
          these Terms, including abusive use that threatens the integrity or cost of the Service.
        </p>
      </LegalSection>

      <LegalSection title="12. Governing law">
        <p>These Terms are governed by the laws of {JURISDICTION}, without regard to conflict-of-law rules.</p>
      </LegalSection>

      <LegalSection title="13. Changes to these Terms">
        <p>
          We may update these Terms from time to time. Material changes will be notified through the Service or
          by email; continued use after changes take effect constitutes acceptance.
        </p>
      </LegalSection>

      <LegalSection title="14. Contact">
        <p>
          Questions about these Terms can be sent to{' '}
          <a href={`mailto:${CONTACT_EMAIL}`} className="font-semibold text-[var(--brand)]">
            {CONTACT_EMAIL}
          </a>
          .
        </p>
      </LegalSection>
    </LegalPageLayout>
  )
}
