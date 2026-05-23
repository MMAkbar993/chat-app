import { Link } from 'react-router-dom'

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-6 py-4 flex items-center justify-between">
          <Link to="/">
            <img src="/full-logo.png" alt="ConnectAR" className="h-8" />
          </Link>
          <Link to="/login" className="text-sm text-violet-600 hover:underline font-medium">
            Back to Sign In
          </Link>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms and Conditions</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: January 2025</p>

        <Section title="1. Acceptance of Terms">
          <p>By creating an account or using ConnectAR ("the Service"), you agree to be bound by these Terms and Conditions. If you do not agree to these terms, you may not use the Service.</p>
        </Section>

        <Section title="2. Eligibility">
          <p>You must be at least 18 years of age to use the Service. By using the Service you represent and warrant that you meet this requirement and that all information you provide is accurate and truthful.</p>
          <p>Identity verification (KYC) is required to access full platform features. Your account will not be activated until verification is approved.</p>
        </Section>

        <Section title="3. Account Responsibilities">
          <p>You are responsible for maintaining the confidentiality of your account credentials. You must notify us immediately of any unauthorized use. We are not liable for losses resulting from unauthorized access to your account.</p>
          <p>You may not create multiple accounts, share your account, or allow others to access your account.</p>
        </Section>

        <Section title="4. Subscription and Billing">
          <p>Access to full features requires a paid subscription (monthly or yearly). Your payment method will not be charged until identity verification is approved. Subscriptions automatically renew unless cancelled at least 24 hours before the renewal date.</p>
          <p>Refunds are handled on a case-by-case basis. Contact support within 7 days of a charge to request a refund.</p>
        </Section>

        <Section title="5. Acceptable Use">
          <p>You agree not to use the Service to send spam, harassment, or illegal content; impersonate others; attempt to gain unauthorized access to any system; violate any applicable laws; or engage in any activity that disrupts or interferes with the Service.</p>
          <p>We reserve the right to suspend or terminate accounts that violate these terms without prior notice.</p>
        </Section>

        <Section title="6. Content">
          <p>You retain ownership of content you post. By posting content, you grant us a non-exclusive, worldwide license to use, store, and display that content for the purpose of operating the Service.</p>
          <p>You are solely responsible for the content you share. We do not endorse any user-generated content.</p>
        </Section>

        <Section title="7. Privacy">
          <p>Our collection and use of personal information is governed by our <Link to="/privacy" className="text-violet-600 hover:underline">Privacy Policy</Link>, which is incorporated into these Terms.</p>
        </Section>

        <Section title="8. Intellectual Property">
          <p>The Service, including its design, features, and underlying technology, is owned by ConnectAR and protected by intellectual property laws. You may not copy, modify, or distribute any part of the Service without our written permission.</p>
        </Section>

        <Section title="9. Disclaimers">
          <p>The Service is provided "as is" without warranties of any kind. We do not guarantee that the Service will be uninterrupted, error-free, or meet your specific requirements.</p>
        </Section>

        <Section title="10. Limitation of Liability">
          <p>To the maximum extent permitted by law, ConnectAR shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of the Service. Our total liability shall not exceed the amount you paid in the 12 months preceding the claim.</p>
        </Section>

        <Section title="11. Termination">
          <p>We may suspend or terminate your account at any time for violation of these terms. You may close your account at any time through your account settings. Upon termination, your right to use the Service ceases immediately.</p>
        </Section>

        <Section title="12. Governing Law">
          <p>These Terms are governed by applicable law. Any disputes shall be resolved through binding arbitration, except where prohibited by law.</p>
        </Section>

        <Section title="13. Changes to Terms">
          <p>We may update these Terms at any time. We will notify you of material changes by email or through the Service. Continued use after the effective date of changes constitutes acceptance.</p>
        </Section>

        <Section title="14. Contact">
          <p>For questions about these Terms, contact us at:</p>
          <p className="font-medium text-gray-800">legal@connectar.online</p>
        </Section>
      </main>

      <footer className="border-t border-gray-200 py-6 text-center text-sm text-gray-400">
        <div className="flex items-center justify-center gap-4">
          <Link to="/privacy" className="hover:text-violet-600">Privacy Policy</Link>
          <span>·</span>
          <Link to="/terms" className="hover:text-violet-600">Terms &amp; Conditions</Link>
          <span>·</span>
          <Link to="/login" className="hover:text-violet-600">Sign In</Link>
        </div>
      </footer>
    </div>
  )
}
