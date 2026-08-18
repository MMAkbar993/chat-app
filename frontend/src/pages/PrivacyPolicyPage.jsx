import { Link } from 'react-router-dom'
import LegalPage, { Section, SubSection, LegalList } from '../components/legal/LegalPage'

export default function PrivacyPolicyPage() {
  return (
    <LegalPage title="Pulse Privacy Policy" effectiveDate="7th August 2026" lastUpdated="7th August 2026">

      <Section title="1. Introduction">
        <p>Pulse ("Pulse", "we", "our", or "us") is committed to protecting your privacy and safeguarding your personal data. We recognise the importance of handling personal information responsibly and transparently, particularly as a platform built around verified identities and secure communications.</p>
        <p>This Privacy Policy explains how we collect, use, store, disclose, and protect your personal data when you access or use the Pulse website, applications, and related services (collectively, the "Services").</p>
        <p>Pulse processes personal data in accordance with the General Data Protection Regulation (EU) 2016/679 ("GDPR"), applicable Romanian data protection legislation, and other applicable privacy laws.</p>
        <p>By creating an account or using the Services, you acknowledge that you have read and understood this Privacy Policy.</p>
        <p>This Privacy Policy should be read together with our Terms &amp; Conditions, Cookie Policy, KYC &amp; Identity Verification Policy, and Subscription &amp; Refund Policy.</p>
        <p>In the event of any conflict between this Privacy Policy and the Terms &amp; Conditions regarding the processing of personal data, this Privacy Policy shall prevail.</p>
        <p>If you have any questions regarding this Privacy Policy or the way we process your personal data, you may contact us using the details provided at the end of this document.</p>
      </Section>

      <Section title="2. Who We Are">
        <p>Pulse is a secure communication platform designed for professionals within the global iGaming industry. Our Services enable verified Users to communicate, collaborate, and connect through messaging, voice and video calls, groups, and other communication features within a trusted, identity-verified environment.</p>
        <p>For the purposes of the General Data Protection Regulation (EU) 2016/679 ("GDPR") and other applicable data protection laws, Pulse is the Data Controller of the personal data collected through the Services, except where otherwise stated.</p>
        <SubSection title="Data Controller">
          <p className="font-medium text-gray-800">
            Michael Paul Holdings SRL<br />
            Bucharest, Romania<br />
            Email: pulse@affiliateroulette.com<br />
            Support: pulse@affiliateroulette.com
          </p>
        </SubSection>
        <p>As the Data Controller, Pulse is responsible for determining the purposes and means by which your personal data is processed. We are committed to ensuring that all personal data is processed lawfully, fairly, transparently, and securely.</p>
        <p>Where Pulse uses carefully selected third-party service providers to deliver certain aspects of the Services — including identity verification, payment processing, cloud infrastructure, analytics, and communication services — those providers process personal data on our behalf or as independent controllers where applicable. We require such providers to implement appropriate technical and organisational measures to protect your personal data and comply with applicable data protection laws.</p>
        <p>If we appoint a Data Protection Officer (DPO) or another designated privacy contact in the future, their contact details will be published on our website and within this Privacy Policy.</p>
      </Section>

      <Section title="3. Scope of This Privacy Policy">
        <p>This Privacy Policy applies to all personal data collected and processed by Pulse in connection with your access to and use of the Services, including our website, applications, subscriptions, identity verification process, customer support, and other related features. This Policy applies to:</p>
        <LegalList items={[
          'Individuals who register for a Pulse Account.',
          'Users of the Free and Pro subscription plans.',
          'Individuals completing the mandatory identity verification (KYC) process.',
          'Visitors to our website.',
          'Individuals who contact Pulse for support or enquiries.',
          'Individuals who otherwise interact with the Services.',
        ]} />
        <p>This Privacy Policy applies regardless of the device you use to access the Services, including desktop computers, laptops, tablets, and mobile devices.</p>
        <p>This Privacy Policy does <strong>not</strong> apply to third-party websites, applications, or services that may be linked to or integrated with Pulse, personal data processed directly by third-party providers in accordance with their own privacy policies, or information processed by third parties where Pulse is not the data controller.</p>
        <p>We encourage you to review the privacy policies of any third-party services you choose to use in connection with Pulse, including providers responsible for identity verification, payment processing, authentication, or other integrated services.</p>
        <p>Where another privacy notice or policy specifically applies to a particular feature or service, that notice will supplement this Privacy Policy to the extent applicable.</p>
      </Section>

      <Section title="4. Personal Data We Collect">
        <p>The personal data we collect depends on how you interact with Pulse, the Services you use, and the information you choose to provide. We collect only the personal data that is reasonably necessary to provide, secure, and improve the Services, comply with legal obligations, and protect our Users.</p>
        <SubSection title="4.1 Account Information">
          <p>When you create a Pulse Account, we may collect:</p>
          <LegalList items={[
            'Full name.', 'Username.', 'Email address.', 'Telephone number (where provided).', 'Profile photograph.',
            'Country or region.', 'Preferred language.', 'Account preferences and settings.', 'Subscription status.',
            'Account creation date and login history.',
          ]} />
        </SubSection>
        <SubSection title="4.2 Identity Verification (KYC) Information">
          <p>As part of our mandatory identity verification process, we and our identity verification provider, Didit, may collect:</p>
          <LegalList items={[
            'Government-issued identification documents.', 'Full legal name.', 'Date of birth.', 'Nationality.', 'Facial image or selfie.',
            'Biometric data used for identity verification, where permitted by applicable law.', 'Liveness detection results.',
            'Verification status.', 'Fraud prevention and risk assessment information.', 'Additional supporting documentation where required during manual review.',
          ]} />
          <p>Further information regarding the identity verification process is available in our <Link to="/kyc-policy" className="text-violet-600 hover:underline">KYC &amp; Identity Verification Policy</Link>.</p>
        </SubSection>
        <SubSection title="4.3 Subscription and Payment Information">
          <p>If you subscribe to the Pro Plan, we may collect:</p>
          <LegalList items={[
            'Subscription type.', 'Billing status.', 'Payment transaction identifiers.', 'Payment dates.',
            'Subscription renewal information.', 'Invoices and billing records.',
          ]} />
          <p>Payments are securely processed by Stripe. Pulse does not collect or store your full payment card details.</p>
        </SubSection>
        <SubSection title="4.4 Communications and User Content">
          <p>When you use the Services, we may process messages you send through the platform, files, images, and documents you upload or share, group membership information, contact lists created within Pulse, customer support communications, and reports submitted to Pulse.</p>
          <p>The handling of communications is further described in our Terms &amp; Conditions and this Privacy Policy.</p>
        </SubSection>
        <SubSection title="4.5 Device and Technical Information">
          <p>When you access the Services, we may automatically collect technical information, including:</p>
          <LegalList items={[
            'IP address.', 'Browser type and version.', 'Operating system.', 'Device type.', 'Device identifiers.',
            'Language settings.', 'Time zone.', 'Log files.', 'Crash reports.', 'Security events.', 'Session information.',
          ]} />
        </SubSection>
        <SubSection title="4.6 Usage Information">
          <p>We may collect information about how you use the Services, including features accessed, login activity, interaction with platform features, subscription usage, general performance and diagnostic information, and security and fraud detection events.</p>
          <p>This information helps us improve the reliability, performance, and security of the Services.</p>
        </SubSection>
        <SubSection title="4.7 Cookies and Similar Technologies">
          <p>We collect certain information through cookies and similar technologies. For more information about the cookies we use and how you can manage your preferences, please refer to our <Link to="/cookies" className="text-violet-600 hover:underline">Cookie Policy</Link>.</p>
        </SubSection>
      </Section>

      <Section title="5. How We Collect Your Personal Data">
        <p>Pulse collects personal data from a variety of sources depending on how you interact with the Services. We collect information directly from you, automatically through your use of the Services, and from trusted third-party providers where necessary to operate the platform securely and lawfully.</p>
        <SubSection title="5.1 Information You Provide">
          <p>We collect personal data that you voluntarily provide when you register for a Pulse Account, complete the mandatory identity verification (KYC) process, subscribe to the Pro Plan, create or update your profile, communicate with other Users, upload files or other Content, contact Pulse Support, respond to surveys, promotions, or feedback requests, or otherwise interact with the Services.</p>
          <p>You are responsible for ensuring that the information you provide is accurate, complete, and kept up to date.</p>
        </SubSection>
        <SubSection title="5.2 Information Collected Automatically">
          <p>When you access or use the Services, certain information is collected automatically through the operation of the platform, including device information, IP address, browser and operating system information, login and authentication records, security logs, session information, usage statistics, error and crash reports, and performance and diagnostic data.</p>
          <p>This information helps us maintain the security, reliability, and performance of the Services.</p>
        </SubSection>
        <SubSection title="5.3 Information from Third Parties">
          <p>We may receive personal data from trusted third-party providers where necessary to provide the Services, including:</p>
          <LegalList items={[
            'Didit, for identity verification and KYC results.',
            'Stripe, for subscription payment and billing information.',
            'Authentication providers (such as Google or Microsoft), where you choose to sign in using those services.',
            'Service providers supporting hosting, infrastructure, communications, analytics, fraud prevention, and platform security.',
          ]} />
          <p>We receive only the information necessary for the purposes described in this Privacy Policy.</p>
        </SubSection>
        <SubSection title="5.4 Cookies and Similar Technologies">
          <p>We collect certain information through cookies and similar technologies used on our website and within the Services. These technologies help us authenticate Users, remember preferences, maintain secure sessions, improve functionality, analyse usage, and enhance security. Further information is available in our <Link to="/cookies" className="text-violet-600 hover:underline">Cookie Policy</Link>.</p>
        </SubSection>
        <SubSection title="5.5 Information from Other Users">
          <p>In limited circumstances, another User may provide information about you through the Services, for example when sending you an invitation to join Pulse, adding you to a group or conversation, sharing contact information where authorised, or referring you to the platform.</p>
          <p>Where appropriate, such information will be processed in accordance with this Privacy Policy and applicable data protection laws.</p>
        </SubSection>
      </Section>

      <Section title="6. How We Use Your Personal Data">
        <p>Pulse processes your personal data only where necessary for legitimate, specified, and lawful purposes. We use your personal data to provide the Services, protect our Users, comply with legal obligations, and continually improve the platform.</p>
        <p><strong>We do not sell your personal data to third parties.</strong></p>
        <SubSection title="6.1 Providing the Services">
          <p>We use your personal data to create and manage your Pulse Account, authenticate your identity, provide access to the Services, deliver messaging, voice, video, and collaboration features, manage your subscription, process payments, provide customer support, and respond to enquiries and requests.</p>
        </SubSection>
        <SubSection title="6.2 Identity Verification and Platform Security">
          <p>To maintain a trusted environment, we process personal data to perform mandatory identity verification (KYC), verify your identity through our verification provider, Didit, prevent fraud, impersonation, and identity theft, detect suspicious or unauthorised activity, investigate security incidents, protect the integrity of the Services, and enforce our Terms &amp; Conditions.</p>
        </SubSection>
        <SubSection title="6.3 Improving the Services">
          <p>We use personal data to better understand how the Services are used and to improve their performance, reliability, and functionality, including analysing usage trends, monitoring system performance, diagnosing technical issues, developing new features, improving the user experience, and testing and maintaining the platform. Where possible, we use aggregated or anonymised information for these purposes.</p>
        </SubSection>
        <SubSection title="6.4 Subscription Management">
          <p>Where you purchase a Pro subscription, we process personal data to process subscription payments, manage renewals and cancellations, issue invoices and payment confirmations, maintain billing records, prevent payment fraud, and provide subscription-related support.</p>
        </SubSection>
        <SubSection title="6.5 Communications">
          <p>We may use your personal data to communicate with you regarding account verification, security alerts, login notifications, service announcements, changes to the Services, subscription and billing matters, customer support responses, and updates to our legal policies.</p>
          <p>Where required by law, marketing communications will only be sent with your consent or another lawful basis under applicable legislation.</p>
        </SubSection>
        <SubSection title="6.6 Legal and Regulatory Compliance">
          <p>We process personal data where necessary to comply with applicable laws and regulations, respond to lawful requests from courts, regulators, or public authorities, exercise or defend legal claims, enforce our contractual rights, and protect the rights, property, and safety of Pulse, our Users, and others.</p>
        </SubSection>
        <SubSection title="6.7 Fraud Prevention">
          <p>We may process personal data to detect fraudulent activity, prevent abuse of the Services, identify fake or duplicate accounts, monitor unusual account activity, and protect Users from security threats. These measures are essential to maintaining a secure and trusted communication platform.</p>
        </SubSection>
        <SubSection title="6.8 Research and Analytics">
          <p>We may use aggregated, anonymised, or statistical information to measure platform performance, improve our Services, understand user behaviour, produce internal business reports, and support product development. Where information has been anonymised so that individuals can no longer be identified, it is no longer considered personal data under applicable law.</p>
        </SubSection>
        <SubSection title="6.9 Other Lawful Purposes">
          <p>We may process your personal data for any other purpose that is compatible with the original purpose for which it was collected or where otherwise permitted or required by applicable law. Where required, we will obtain your consent before processing your personal data for a new purpose that is incompatible with the original purpose of collection.</p>
        </SubSection>
      </Section>

      <Section title="7. Legal Basis for Processing Your Personal Data (GDPR)">
        <p>Under the General Data Protection Regulation (EU) 2016/679 ("GDPR"), Pulse will only process your personal data where we have a valid legal basis for doing so. Depending on the circumstances, we rely on one or more of the following legal bases.</p>
        <SubSection title="7.1 Performance of a Contract">
          <p>We process personal data where it is necessary to perform our contract with you or to take steps at your request before entering into a contract. This includes processing necessary to create and manage your Account, provide access to the Services, deliver messaging, voice, video, and collaboration features, process Pro subscriptions and payments, provide customer support, and maintain your Account and profile. Without this processing, we would be unable to provide the Services.</p>
        </SubSection>
        <SubSection title="7.2 Compliance with Legal Obligations">
          <p>We process personal data where necessary to comply with our legal obligations under applicable laws and regulations, including processing required to respond to lawful requests from courts or public authorities, comply with data protection legislation, maintain appropriate business records, investigate unlawful activity, and meet other legal or regulatory requirements applicable to Pulse.</p>
        </SubSection>
        <SubSection title="7.3 Legitimate Interests">
          <p>We process certain personal data where it is necessary for the legitimate interests pursued by Pulse, provided that those interests are not overridden by your fundamental rights and freedoms. Our legitimate interests include maintaining the security of the Services, preventing fraud, abuse, and unauthorised access, improving and developing the platform, protecting Users and Pulse from security threats, maintaining system reliability and performance, responding to customer enquiries, enforcing our Terms &amp; Conditions, and defending legal claims. Where we rely on legitimate interests, we carefully assess the impact on your privacy and ensure that your rights are respected.</p>
        </SubSection>
        <SubSection title="7.4 Consent">
          <p>In certain circumstances, we process personal data based on your consent, including optional cookies and similar technologies, marketing communications where required by law, optional features that require your permission, and other processing activities where consent is the appropriate legal basis. Where processing is based on consent, you may withdraw your consent at any time. Withdrawal of consent does not affect the lawfulness of processing carried out before the withdrawal.</p>
        </SubSection>
        <SubSection title="7.5 Identity Verification and Biometric Data">
          <p>As access to Pulse is conditional upon successful completion of mandatory identity verification, certain personal data — including identity documents, facial images, and, where permitted by applicable law, biometric data — is processed to verify your identity and protect the security of the Services.</p>
          <p>Where the processing of biometric data constitutes the processing of special categories of personal data under the GDPR, Pulse and its identity verification provider process such data only where a valid legal basis and a lawful condition under Article 9 of the GDPR applies.</p>
          <p>Further details are available in our <Link to="/kyc-policy" className="text-violet-600 hover:underline">KYC &amp; Identity Verification Policy</Link>.</p>
        </SubSection>
        <SubSection title="7.6 Where Processing is Required">
          <p>Certain personal data is essential for Pulse to provide the Services. If you choose not to provide information required for account registration, identity verification, security, or subscription management, we may be unable to create your Account, complete the mandatory KYC process, provide access to the Services, or continue offering certain features.</p>
        </SubSection>
      </Section>

      <Section title="8. Identity Verification (KYC)">
        <p>Identity verification is a fundamental security feature of Pulse and a mandatory requirement for access to the Services. Our verification process helps create a trusted environment by reducing fraud, impersonation, and unauthorised access.</p>
        <SubSection title="8.1 Mandatory Verification">
          <p>Every User must successfully complete Pulse's Know Your Customer ("KYC") identity verification process before gaining access to the Services. Creating an Account alone does not grant access to Pulse. Access is only granted after a User's identity has been successfully verified and approved.</p>
        </SubSection>
        <SubSection title="8.2 Information Processed">
          <p>To complete the verification process, Pulse and our identity verification provider, Didit, may process information including government-issued identity documents, full legal name, date of birth, nationality, facial images or selfies, liveness detection results, verification status, additional documentation requested during manual review, and fraud prevention and verification metadata. This information is processed solely for identity verification, fraud prevention, security, and compliance purposes.</p>
        </SubSection>
        <SubSection title="8.3 Biometric Verification">
          <p>As part of the verification process, Didit may use facial recognition and liveness detection technologies to compare your identity document with your facial image and confirm that you are physically present during verification.</p>
          <p>Where biometric data is processed, it is handled in accordance with applicable data protection laws, including the GDPR, and only for the purpose of completing the identity verification process and protecting the integrity of the Services.</p>
        </SubSection>
        <SubSection title="8.4 Manual Review">
          <p>Where automatic verification cannot be completed, your verification request may be referred to Pulse for manual review. During this process, we may review the submitted information, request additional documentation, contact you to clarify information, and approve or reject your verification request.</p>
          <p>Verification decisions are made using the information available at the time of review and in accordance with our security procedures.</p>
        </SubSection>
        <SubSection title="8.5 Verification Provider">
          <p>Pulse uses Didit as its identity verification provider. Didit performs identity verification on our behalf using document verification, facial recognition, liveness detection, and fraud prevention technologies. Didit's processing of personal data is governed by its own privacy practices in addition to this Privacy Policy.</p>
        </SubSection>
        <SubSection title="8.6 Storage of Verification Information">
          <p>Verification-related information is retained only for as long as reasonably necessary to complete the verification process, maintain the security of the Services, prevent fraud and abuse, comply with applicable legal obligations, and resolve disputes and enforce our legal rights.</p>
          <p>Access to verification information is restricted to authorised personnel and trusted service providers with a legitimate need to access such information.</p>
        </SubSection>
        <SubSection title="8.7 No Commercial Use">
          <p>Pulse does not use identity verification information or biometric data for advertising, marketing, profiling, or any unrelated commercial purpose. Verification information is processed solely to verify identity, maintain platform security, prevent fraud, and comply with applicable legal obligations.</p>
        </SubSection>
        <SubSection title="8.8 Further Information">
          <p>Additional information regarding Pulse's identity verification procedures, accepted documents, verification outcomes, manual reviews, and related processes is available in our <Link to="/kyc-policy" className="text-violet-600 hover:underline">KYC &amp; Identity Verification Policy</Link>.</p>
        </SubSection>
      </Section>

      <Section title="9. How We Share Your Personal Data">
        <p>Pulse treats your personal data with care and confidentiality. We do not sell, rent, or trade your personal data to third parties for their own marketing purposes.</p>
        <p>We only share your personal data where necessary to provide the Services, comply with legal obligations, protect our Users, or where you have authorised us to do so.</p>
        <SubSection title="9.1 Service Providers">
          <p>We may share personal data with carefully selected third-party service providers who assist us in operating, maintaining, and improving the Services. These providers may include:</p>
          <LegalList items={[
            'Didit – Identity verification (KYC), document verification, facial recognition, and liveness detection.',
            'Stripe – Payment processing and subscription management.',
            'Agora – Voice and video communication services.',
            'Cloud hosting and infrastructure providers.',
            'Authentication providers (where you choose to use them).',
            'Customer support and communication service providers.',
            'Security, monitoring, and fraud prevention providers.',
            'Analytics providers.',
          ]} />
          <p>These providers may only process your personal data for the purposes specified by Pulse and in accordance with applicable data protection laws.</p>
        </SubSection>
        <SubSection title="9.2 Legal and Regulatory Requirements">
          <p>Pulse may disclose personal data where we believe such disclosure is necessary to comply with applicable laws or regulations, respond to lawful requests from courts, law enforcement agencies, regulators, or other competent public authorities, protect the rights, property, or safety of Pulse, our Users, or others, investigate suspected unlawful activity, fraud, or security incidents, or enforce our Terms &amp; Conditions or other legal rights.</p>
        </SubSection>
        <SubSection title="9.3 Business Transfers">
          <p>If Pulse is involved in a merger, acquisition, investment, corporate restructuring, sale of assets, or similar business transaction, your personal data may be transferred as part of that transaction. Where required by applicable law, Users will be notified of any such transfer and any choices available to them.</p>
        </SubSection>
        <SubSection title="9.4 Professional Advisers">
          <p>We may disclose personal data to our professional advisers where reasonably necessary, including legal advisers, accountants, auditors, insurance providers, and other professional advisers acting under appropriate confidentiality obligations.</p>
        </SubSection>
        <SubSection title="9.5 With Your Consent">
          <p>We may share your personal data with third parties where you have expressly requested or authorised us to do so, or where you have otherwise provided your consent. You may withdraw your consent at any time where the processing is based on consent.</p>
        </SubSection>
        <SubSection title="9.6 International Sharing">
          <p>Some of our trusted service providers may process personal data outside your country or outside the European Economic Area ("EEA"). Where this occurs, Pulse will ensure that appropriate safeguards are implemented in accordance with applicable data protection laws. Further information is provided in Section 10 – International Data Transfers.</p>
        </SubSection>
        <SubSection title="9.7 No Sale of Personal Data">
          <p>Pulse does not sell, lease, rent, or otherwise disclose your personal data to third parties for their own advertising or marketing purposes. Your personal data is only shared where necessary to provide the Services, fulfil our legal obligations, protect the security and integrity of the platform, or where you have expressly authorised such sharing.</p>
        </SubSection>
      </Section>

      <Section title="10. International Data Transfers">
        <p>Pulse is based in Bucharest, Romania, and processes personal data in accordance with the General Data Protection Regulation (EU) 2016/679 ("GDPR") and other applicable data protection laws.</p>
        <p>In order to provide the Services, some of your personal data may be transferred to, stored in, or accessed from countries outside the European Economic Area ("EEA").</p>
        <SubSection title="10.1 International Transfers">
          <p>Certain trusted third-party service providers used by Pulse may operate or process personal data from countries outside the EEA. These providers may include services relating to identity verification, payment processing, voice and video communications, cloud hosting and infrastructure, authentication services, customer support, security and fraud prevention, and analytics. Such transfers are only carried out where necessary to provide the Services or to fulfil our contractual or legal obligations.</p>
        </SubSection>
        <SubSection title="10.2 Appropriate Safeguards">
          <p>Where personal data is transferred outside the EEA to a country that has not been recognised by the European Commission as providing an adequate level of data protection, Pulse will ensure that appropriate safeguards are implemented in accordance with the GDPR. These safeguards may include European Commission Standard Contractual Clauses ("SCCs"), an adequacy decision issued by the European Commission, or other legally recognised transfer mechanisms permitted under applicable data protection laws.</p>
        </SubSection>
        <SubSection title="10.3 Protection of Your Personal Data">
          <p>Pulse takes reasonable steps to ensure that any organisation receiving personal data outside the EEA maintains appropriate technical and organisational measures to protect your personal data against unauthorised access, disclosure, alteration, loss, or misuse.</p>
          <p>We require our trusted service providers to process personal data only for authorised purposes and in accordance with applicable contractual and legal obligations.</p>
        </SubSection>
        <SubSection title="10.4 Your Rights">
          <p>Where required by applicable law, you may request further information regarding the safeguards applied to international transfers of your personal data. Requests may be submitted using the contact details provided at the end of this Privacy Policy.</p>
        </SubSection>
        <SubSection title="10.5 Future International Transfers">
          <p>As Pulse continues to develop and expand its Services, we may engage additional trusted service providers located in other jurisdictions. Where this occurs, any international transfer of personal data will continue to be carried out in accordance with applicable data protection laws and the safeguards described in this Privacy Policy.</p>
        </SubSection>
      </Section>

      <Section title="11. Data Retention">
        <p>Pulse retains personal data only for as long as necessary to fulfil the purposes for which it was collected, provide the Services, comply with legal and regulatory obligations, resolve disputes, enforce our legal rights, and protect the security and integrity of the platform.</p>
        <p>When personal data is no longer required, it will be securely deleted, anonymised, or otherwise disposed of in accordance with applicable law and our internal data retention procedures.</p>
        <SubSection title="11.1 Account Information">
          <p>We retain your account information for as long as your Pulse Account remains active. If your Account is closed or deleted, we may retain certain information for a limited period where necessary to comply with legal obligations, resolve disputes, prevent fraud or abuse, enforce our Terms &amp; Conditions, and protect the security of the Services.</p>
        </SubSection>
        <SubSection title="11.2 Identity Verification (KYC) Data">
          <p>Identity verification information, including documentation and verification records, is retained only for as long as reasonably necessary to complete and maintain identity verification, prevent fraud and impersonation, protect the security of the Services, comply with applicable legal and regulatory obligations, and exercise or defend legal claims. Retention periods for verification data may vary depending on legal requirements and the nature of the verification performed.</p>
        </SubSection>
        <SubSection title="11.3 Subscription and Billing Records">
          <p>Subscription, payment, and billing records are retained for the period required under applicable accounting, taxation, and financial reporting laws. Payment card information is processed by Stripe and is not stored by Pulse.</p>
        </SubSection>
        <SubSection title="11.4 Communications and Support">
          <p>Communications with Pulse Support and related records may be retained for as long as reasonably necessary to respond to enquiries, improve customer support, investigate complaints, resolve disputes, and protect the security of the Services.</p>
        </SubSection>
        <SubSection title="11.5 Technical and Security Logs">
          <p>Technical logs, security records, authentication logs, and system activity may be retained for an appropriate period to maintain platform security, detect and investigate fraud or abuse, diagnose technical issues, improve the reliability and performance of the Services, and comply with legal obligations.</p>
        </SubSection>
        <SubSection title="11.6 Legal Requirements">
          <p>In certain circumstances, Pulse may retain personal data for longer than the periods described above where necessary to comply with applicable laws or regulations, respond to lawful requests from competent authorities, exercise or defend legal claims, and investigate suspected unlawful activity or security incidents.</p>
        </SubSection>
        <SubSection title="11.7 Secure Deletion">
          <p>When personal data is no longer required, Pulse takes reasonable steps to ensure that it is securely deleted, anonymised, or otherwise rendered inaccessible, unless continued retention is required or permitted by applicable law.</p>
        </SubSection>
      </Section>

      <Section title="12. Your Rights Under the GDPR">
        <p>If you are located in the European Economic Area ("EEA"), the United Kingdom, or another jurisdiction with similar data protection laws, you may have certain rights regarding your personal data. Pulse is committed to respecting these rights and will respond to requests in accordance with applicable law.</p>
        <SubSection title="12.1 Right of Access">
          <p>You have the right to request confirmation of whether Pulse processes your personal data and, where applicable, to obtain a copy of the personal data we hold about you, together with information about how it is processed.</p>
        </SubSection>
        <SubSection title="12.2 Right to Rectification">
          <p>You have the right to request that we correct or update inaccurate, incomplete, or outdated personal data held about you. Where possible, you may also update certain information directly through your Pulse Account.</p>
        </SubSection>
        <SubSection title='12.3 Right to Erasure ("Right to be Forgotten")'>
          <p>You may request that Pulse delete your personal data where the data is no longer necessary for the purposes for which it was collected, you withdraw consent where processing is based on consent, you successfully object to processing, the data has been processed unlawfully, or deletion is required under applicable law.</p>
          <p>This right is not absolute. Pulse may retain certain information where required to comply with legal obligations, resolve disputes, prevent fraud, protect the security of the Services, or exercise or defend legal claims.</p>
        </SubSection>
        <SubSection title="12.4 Right to Restrict Processing">
          <p>You may request that Pulse restrict the processing of your personal data in certain circumstances, including where you contest the accuracy of the data, the processing is unlawful but you oppose deletion, Pulse no longer requires the data but you require it for legal claims, or you have objected to processing pending verification of that objection.</p>
        </SubSection>
        <SubSection title="12.5 Right to Object">
          <p>Where Pulse processes your personal data based on legitimate interests, you have the right to object to such processing where your particular circumstances justify doing so. We will carefully consider your request and cease processing unless we have compelling legitimate grounds or another lawful basis to continue.</p>
        </SubSection>
        <SubSection title="12.6 Right to Data Portability">
          <p>Where processing is based on your consent or the performance of a contract and is carried out by automated means, you may request a copy of your personal data in a structured, commonly used, and machine-readable format, or request that it be transferred to another data controller where technically feasible.</p>
        </SubSection>
        <SubSection title="12.7 Right to Withdraw Consent">
          <p>Where Pulse relies on your consent to process personal data, you may withdraw that consent at any time. Withdrawal of consent does not affect the lawfulness of processing carried out before the consent was withdrawn.</p>
        </SubSection>
        <SubSection title="12.8 Automated Decision-Making">
          <p>Some aspects of Pulse's identity verification process may involve automated decision-making performed by our identity verification provider, Didit. Where an automated verification cannot be completed or requires further assessment, the verification will be referred to Pulse for manual review. You may contact Pulse if you have questions regarding the outcome of your identity verification or wish to request further information regarding the verification process.</p>
        </SubSection>
        <SubSection title="12.9 Right to Lodge a Complaint">
          <p>If you believe that Pulse has processed your personal data in violation of applicable data protection laws, you have the right to lodge a complaint with your local data protection authority.</p>
          <p>If you are located in Romania, you may lodge a complaint with the National Supervisory Authority for Personal Data Processing (ANSPDCP) or the competent supervisory authority in your country of residence.</p>
          <p>We encourage you to contact Pulse first so that we have the opportunity to address your concerns directly.</p>
        </SubSection>
        <SubSection title="12.10 Exercising Your Rights">
          <p>To exercise any of the rights described in this Privacy Policy, please contact us using the details provided at the end of this document. We may request additional information to verify your identity before responding to your request in order to protect your personal data and prevent unauthorised access.</p>
          <p>Pulse will respond to valid requests within the timeframes required by applicable data protection laws.</p>
        </SubSection>
      </Section>

      <Section title="13. Data Security">
        <p>Pulse is committed to protecting the confidentiality, integrity, and availability of your personal data. We implement appropriate technical and organisational measures designed to safeguard personal data against accidental or unlawful destruction, loss, alteration, unauthorised disclosure, unauthorised access, or other unlawful forms of processing.</p>
        <p>While we strive to maintain a high level of security, no method of transmitting or storing data electronically can be guaranteed to be completely secure.</p>
        <SubSection title="13.1 Security Measures">
          <p>Pulse maintains a range of security measures appropriate to the nature of the Services and the personal data we process. These measures may include:</p>
          <LegalList items={[
            'Encryption of data in transit using industry-standard protocols.', 'Encryption of sensitive data where appropriate.',
            'Secure authentication and access controls.', 'Mandatory identity verification (KYC) for all Users.',
            'Multi-factor authentication where available.', 'Continuous monitoring of platform security.',
            'Firewalls, intrusion detection, and abuse prevention systems.', 'Regular software updates and security patches.',
            'Security logging and auditing.', 'Secure backup and disaster recovery procedures.',
          ]} />
          <p>These measures are regularly reviewed and updated to address evolving security risks.</p>
        </SubSection>
        <SubSection title="13.2 Access Controls">
          <p>Access to personal data is restricted to authorised personnel, contractors, and trusted service providers who require such access in order to perform their duties. All authorised personnel are subject to appropriate confidentiality obligations and are granted access only on a need-to-know basis.</p>
        </SubSection>
        <SubSection title="13.3 Third-Party Security">
          <p>Pulse works with carefully selected third-party providers, including providers of identity verification, payment processing, communications infrastructure, hosting, and cloud services. Where personal data is processed by third-party providers on our behalf, we require them to implement appropriate technical and organisational measures designed to protect your personal data and comply with applicable data protection laws.</p>
        </SubSection>
        <SubSection title="13.4 User Responsibilities">
          <p>While Pulse takes reasonable steps to protect your personal data, you also play an important role in maintaining the security of your Account. You are responsible for keeping your login credentials confidential, choosing a strong and unique password, enabling additional security features where available, keeping your devices and software up to date, and promptly notifying Pulse if you suspect unauthorised access to your Account or any other security incident.</p>
        </SubSection>
        <SubSection title="13.5 Security Incidents">
          <p>If Pulse becomes aware of a security incident affecting personal data, we will promptly investigate the incident, take reasonable steps to contain and mitigate its impact, and, where required by applicable law, notify affected Users and the relevant supervisory authorities within the legally required timeframes.</p>
        </SubSection>
        <SubSection title="13.6 No Absolute Security">
          <p>Although Pulse implements commercially reasonable safeguards to protect personal data, no website, application, online platform, or electronic communication system can guarantee absolute security. Accordingly, Pulse cannot guarantee that the Services will always be free from unauthorised access, cyberattacks, technical failures, or other security events beyond our reasonable control.</p>
          <p>Users acknowledge that they use the Services and transmit information to Pulse at their own risk, subject always to Pulse's obligations under applicable data protection laws.</p>
        </SubSection>
      </Section>

      <Section title="14. Children's Privacy">
        <p>Pulse is designed exclusively for adults and professionals within the global iGaming industry. The Services are <strong>not intended for individuals under the age of eighteen (18)</strong> or the age of legal majority in their jurisdiction, whichever is higher.</p>
        <SubSection title="14.1 Age Requirement">
          <p>You must be at least eighteen (18) years of age, or the age of legal majority in your jurisdiction if higher, to create a Pulse Account or use the Services. By registering for an Account, you represent and warrant that you meet this minimum age requirement.</p>
        </SubSection>
        <SubSection title="14.2 No Knowing Collection of Children's Data">
          <p>Pulse does not knowingly collect, process, or store personal data relating to children or individuals who do not meet the minimum age requirement. Our mandatory identity verification (KYC) process is intended to help prevent underage individuals from accessing the Services.</p>
        </SubSection>
        <SubSection title="14.3 Removal of Accounts">
          <p>If Pulse becomes aware that an Account has been created by, or personal data has been collected from, an individual who does not meet the minimum age requirement, we reserve the right to suspend or terminate the Account, remove access to the Services, and delete the associated personal data, except where retention is required by applicable law.</p>
        </SubSection>
        <SubSection title="14.4 Reporting">
          <p>If you believe that an individual under the required age has created a Pulse Account or provided personal data to Pulse, please contact us using the contact details provided at the end of this Privacy Policy. We will investigate the matter and take appropriate action in accordance with applicable law and our internal procedures.</p>
        </SubSection>
      </Section>

      <Section title="15. Changes to This Privacy Policy">
        <p>Pulse may update this Privacy Policy from time to time to reflect changes to our Services, legal or regulatory requirements, technology, security practices, or the way we process personal data.</p>
        <p>We encourage you to review this Privacy Policy periodically to stay informed about how we protect your personal data.</p>
        <SubSection title="15.1 Updates to This Policy">
          <p>We reserve the right to amend, modify, or replace this Privacy Policy at any time. The most current version will always be made available through the Pulse website and, where applicable, within the Pulse application. The "Last Updated" date at the beginning of this Privacy Policy indicates when the latest changes became effective.</p>
        </SubSection>
        <SubSection title="15.2 Notification of Material Changes">
          <p>Where required by applicable law or where we consider it appropriate, Pulse will notify Users of material changes to this Privacy Policy through one or more of the following methods: email, in-app notifications, a notice displayed on the Pulse website, or other reasonable methods of communication.</p>
        </SubSection>
        <SubSection title="15.3 Continued Use of the Services">
          <p>Your continued use of the Services after an updated Privacy Policy becomes effective constitutes your acknowledgement of the revised Privacy Policy. Where applicable law requires your consent for changes affecting the processing of your personal data, Pulse will obtain such consent before the changes take effect.</p>
        </SubSection>
        <SubSection title="15.4 Previous Versions">
          <p>Previous versions of this Privacy Policy may be retained for legal, regulatory, or record-keeping purposes. Users may request information regarding significant historical changes to this Privacy Policy by contacting Pulse using the details provided below.</p>
        </SubSection>
      </Section>

      <Section title="16. Contact Information">
        <p>If you have any questions about this Privacy Policy, our privacy practices, or the way Pulse processes your personal data, you may contact us using the details below.</p>
        <p>We are committed to responding to privacy-related enquiries and requests in accordance with applicable data protection laws.</p>
        <SubSection title="Data Controller">
          <p className="font-medium text-gray-800">
            Michael Paul Holdings SRL<br />
            Bucharest, Romania<br />
            Privacy Email: privacy@affiliateroulette.com<br />
            Support Email: hello@affiliateroulette.com<br />
            Website: https://pulse.affiliateroulette.com
          </p>
        </SubSection>
        <SubSection title="Exercising Your Privacy Rights">
          <p>If you wish to exercise any of your rights under applicable data protection laws, including your rights under the GDPR, you may contact us using the details above.</p>
          <p>To help protect your personal data, we may request additional information to verify your identity before processing your request.</p>
          <p>We will respond to valid requests within the timeframes required by applicable law.</p>
        </SubSection>
        <SubSection title="Complaints">
          <p>If you believe that Pulse has not handled your personal data in accordance with applicable data protection laws, we encourage you to contact us first so that we have the opportunity to resolve your concerns.</p>
          <p>You also have the right to lodge a complaint with the competent data protection authority in your country of residence or place of work. If you are located in Romania, you may contact:</p>
          <p className="font-medium text-gray-800">
            National Supervisory Authority for Personal Data Processing (ANSPDCP)<br />
            Bulevardul General Gheorghe Magheru 28-30, Sector 1, Bucharest, Romania<br />
            Website: <a href="https://www.dataprotection.ro" target="_blank" rel="noopener noreferrer" className="text-violet-600 hover:underline">www.dataprotection.ro</a>
          </p>
        </SubSection>
      </Section>

    </LegalPage>
  )
}
