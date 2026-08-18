import LegalPage, { Section, SubSection, LegalList } from '../components/legal/LegalPage'

export default function CookiePolicyPage() {
  return (
    <LegalPage title="Pulse Cookie Policy" effectiveDate="7th August 2026" lastUpdated="7th August 2026">

      <Section title="1. Introduction">
        <p>This Cookie Policy explains how Pulse ("Pulse", "we", "our", or "us") uses cookies and similar technologies when you visit or use our website, applications, and Services (collectively, the "Services").</p>
        <p>This Policy should be read together with our Privacy Policy and Terms &amp; Conditions.</p>
        <p>By continuing to use our Services, you acknowledge that cookies may be used as described in this Policy. Where required by applicable law, we will request your consent before placing non-essential cookies on your device.</p>
      </Section>

      <Section title="2. What Are Cookies?">
        <p>Cookies are small text files placed on your computer, smartphone, tablet, or other device when you visit a website or use an online service.</p>
        <p>Cookies allow websites and applications to recognise your device, remember your preferences, improve functionality, enhance security, and provide information about how the Services are used.</p>
        <p>In addition to cookies, Pulse may use similar technologies such as local storage, session storage, pixels, and software development kits (SDKs) where appropriate.</p>
      </Section>

      <Section title="3. Types of Cookies We Use">
        <SubSection title="3.1 Strictly Necessary Cookies">
          <p>These cookies are essential for the operation of the Services and cannot be disabled through our cookie preferences. They may be used to:</p>
          <LegalList items={[
            'Authenticate Users.',
            'Maintain secure login sessions.',
            'Protect against fraudulent activity.',
            'Enable security features.',
            'Remember privacy or cookie preferences.',
            'Ensure the proper operation of the Services.',
          ]} />
          <p>Without these cookies, certain parts of the Services may not function correctly.</p>
        </SubSection>
        <SubSection title="3.2 Functional Cookies">
          <p>Functional cookies allow the Services to remember choices you make in order to improve your experience. These may include remembering:</p>
          <LegalList items={[
            'Language preferences.', 'Theme preferences.', 'Notification settings.', 'Device preferences.', 'Recently used features.',
          ]} />
        </SubSection>
        <SubSection title="3.3 Analytics Cookies">
          <p>Analytics cookies help us understand how Users interact with the Services. These cookies may collect information such as:</p>
          <LegalList items={[
            'Pages visited.', 'Features used.', 'Session duration.', 'Device type.', 'Browser type.',
            'General geographic region.', 'Error reports.', 'Anonymous usage statistics.',
          ]} />
          <p>This information helps us improve the performance, usability, and reliability of Pulse.</p>
          <p>Where required by law, analytics cookies will only be used with your consent.</p>
        </SubSection>
        <SubSection title="3.4 Performance Cookies">
          <p>Performance cookies help monitor and improve the speed, stability, and technical performance of the Services. These cookies may help identify:</p>
          <LegalList items={['Slow-loading pages.', 'Technical errors.', 'Service interruptions.', 'Performance bottlenecks.']} />
        </SubSection>
        <SubSection title="3.5 Third-Party Cookies">
          <p>Certain third-party providers used by Pulse may place cookies or similar technologies on your device in connection with the Services. These providers may include:</p>
          <LegalList items={[
            'Stripe (payment processing)', 'Didit (identity verification)', 'Google (authentication and integrations)',
            'Cloud hosting and infrastructure providers', 'Analytics providers', 'Other trusted service providers supporting the operation of Pulse',
          ]} />
          <p>These third parties operate under their own privacy and cookie policies, and Pulse does not control the cookies they place.</p>
        </SubSection>
      </Section>

      <Section title="4. Why We Use Cookies">
        <p>We use cookies and similar technologies to:</p>
        <LegalList items={[
          'Operate and secure the Services.', 'Authenticate Users.', 'Protect against fraud and unauthorised access.',
          'Remember User preferences.', 'Improve platform performance.', 'Analyse usage trends.', 'Diagnose technical issues.',
          'Maintain the stability and reliability of the Services.', 'Comply with legal obligations where applicable.',
        ]} />
      </Section>

      <Section title="5. Managing Cookies">
        <p>You can manage or delete cookies at any time through your browser settings. Most web browsers allow you to:</p>
        <LegalList items={[
          'View stored cookies.', 'Delete existing cookies.', 'Block all cookies.', 'Block third-party cookies.', 'Receive notifications before cookies are stored.',
        ]} />
        <p>Please note that disabling certain cookies may affect the functionality, security, or performance of the Services.</p>
      </Section>

      <Section title="6. Cookie Consent">
        <p>Where required by applicable law, Pulse will request your consent before placing non-essential cookies on your device.</p>
        <p>You may withdraw or modify your cookie preferences at any time through our cookie preferences tool or your browser settings.</p>
        <p>Withdrawing consent does not affect the lawfulness of any processing carried out before consent was withdrawn.</p>
      </Section>

      <Section title="7. Changes to This Cookie Policy">
        <p>Pulse may update this Cookie Policy from time to time to reflect changes in technology, legal requirements, or our Services.</p>
        <p>The updated version will be published on our website together with the revised "Last Updated" date.</p>
        <p>Continued use of the Services after any changes become effective constitutes your acknowledgement of the updated Cookie Policy.</p>
      </Section>

      <Section title="8. Contact Us">
        <p>If you have any questions regarding this Cookie Policy or our use of cookies, please contact us:</p>
        <p className="font-medium text-gray-800">
          Pulse<br />
          Bucharest, Romania<br />
          Email: privacy@affiliateroulette.com
        </p>
        <p>For more information about how we process personal data, please refer to our Privacy Policy.</p>
      </Section>

    </LegalPage>
  )
}
