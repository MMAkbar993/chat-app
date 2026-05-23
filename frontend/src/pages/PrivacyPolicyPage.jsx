import { Link } from 'react-router-dom'

function Section({ title, children }) {
  return (
    <section className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-3">{title}</h2>
      <div className="text-gray-600 leading-relaxed space-y-2">{children}</div>
    </section>
  )
}

export default function PrivacyPolicyPage() {
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
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
        <p className="text-gray-500 text-sm mb-10">Last updated: January 2025</p>

        <Section title="1. Information We Collect">
          <p>We collect information you provide directly when you create an account, including your full name, username, email address, country, role, and phone number. We also collect information during identity verification (KYC) and payment processing.</p>
          <p>We automatically collect usage data such as IP address, browser type, pages visited, and timestamps when you use our service.</p>
        </Section>

        <Section title="2. How We Use Your Information">
          <p>We use your information to provide and improve our services, communicate with you about your account, process payments and verify your identity, send important notices and updates, and comply with legal obligations.</p>
          <p>We do not sell your personal information to third parties.</p>
        </Section>

        <Section title="3. Identity Verification">
          <p>To maintain a trusted platform, we require identity verification through a third-party KYC provider. During this process, you may be asked to provide government-issued identification. This information is processed and stored securely by our KYC partner according to their privacy policy.</p>
        </Section>

        <Section title="4. Payment Information">
          <p>Payment processing is handled by Stripe. We do not store your card details on our servers. Stripe stores and processes payment information in accordance with PCI-DSS standards. You can review Stripe's privacy policy at stripe.com/privacy.</p>
        </Section>

        <Section title="5. Data Sharing">
          <p>We share your data only with trusted service providers who assist us in operating our platform (such as our payment processor, KYC provider, and cloud infrastructure), when required by law or to protect our legal rights, or with your explicit consent.</p>
        </Section>

        <Section title="6. Social Account Connections">
          <p>When you choose to connect social accounts (LinkedIn, YouTube, Facebook, Instagram, X, Twitch, Kick), we receive an access token and basic profile information from those platforms. This information is displayed on your public profile to verify your identity. You can disconnect any social account at any time from your settings.</p>
        </Section>

        <Section title="7. Data Retention">
          <p>We retain your personal information for as long as your account is active or as needed to provide services. You may request deletion of your account and associated data by contacting us. Some data may be retained for legal compliance purposes.</p>
        </Section>

        <Section title="8. Security">
          <p>We implement industry-standard security measures including encryption in transit (HTTPS/TLS), hashed passwords, and access controls. However, no method of transmission over the internet is 100% secure.</p>
        </Section>

        <Section title="9. Cookies">
          <p>We use essential cookies to keep you logged in and maintain your session. We do not use third-party advertising cookies. You can control cookies through your browser settings, but disabling essential cookies may affect functionality.</p>
        </Section>

        <Section title="10. Your Rights">
          <p>Depending on your location, you may have rights to access, correct, or delete your personal data, object to processing, or request data portability. To exercise these rights, contact us at privacy@connectar.online.</p>
        </Section>

        <Section title="11. Children">
          <p>Our service is not directed to children under 18. We do not knowingly collect personal information from minors. If you believe we have collected information from a child, please contact us immediately.</p>
        </Section>

        <Section title="12. Changes to This Policy">
          <p>We may update this policy from time to time. We will notify you of significant changes by email or through the platform. Continued use of the service after changes constitutes acceptance.</p>
        </Section>

        <Section title="13. Contact Us">
          <p>If you have questions about this privacy policy, contact us at:</p>
          <p className="font-medium text-gray-800">privacy@connectar.online</p>
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
