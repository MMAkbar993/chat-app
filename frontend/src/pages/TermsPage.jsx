import { Link } from 'react-router-dom'
import LegalPage, { Section, SubSection, LegalList } from '../components/legal/LegalPage'

export default function TermsPage() {
  return (
    <LegalPage title="Pulse Terms & Conditions" effectiveDate="7th August 2026" lastUpdated="7th August 2026">

      <Section title="1. Introduction">
        <SubSection title="1.1 About Pulse">
          <p>Welcome to Pulse ("Pulse", "we", "our", or "us"). Pulse is a secure communication platform designed specifically for professionals within the global iGaming industry. Our platform enables verified users to communicate through messaging, voice and video calls, groups, and other collaboration features within a trusted and identity-verified environment.</p>
          <p>To help maintain the integrity and security of our community, every user must successfully complete our mandatory identity verification process before gaining access to the Services. We are committed to providing a professional platform where users can connect with confidence while reducing fraud, impersonation, and other forms of misuse.</p>
          <p>These Terms &amp; Conditions ("Terms") govern your access to and use of the Pulse website, applications, services, software, and related features (collectively, the "Services").</p>
        </SubSection>
        <SubSection title="1.2 Acceptance of the Terms">
          <p>By creating an account, completing the required identity verification process, accessing, or using the Services, you acknowledge that you have read, understood, and agree to be legally bound by these Terms, together with our Privacy Policy, Cookie Policy, and any other policies referenced within these Terms.</p>
          <p>If you do not agree with these Terms, you must not create an account, complete the verification process, or access or use the Services.</p>
          <p>We may update these Terms from time to time to reflect changes to our Services, applicable laws, security requirements, or business practices. Continued use of the Services after updated Terms become effective constitutes your acceptance of the revised Terms.</p>
        </SubSection>
        <SubSection title="1.3 Eligibility">
          <p>To create and maintain a Pulse account, you must:</p>
          <LegalList items={[
            'Be at least eighteen (18) years of age or the age of legal majority in your jurisdiction, whichever is higher.',
            'Have the legal capacity to enter into a binding agreement.',
            "Successfully complete Pulse's mandatory identity verification process before accessing the Services.",
            'Provide accurate, complete, and up-to-date information during registration and throughout your use of the Services.',
            'Comply with these Terms and all applicable laws and regulations.',
          ]} />
          <p>Pulse is intended for individuals who work within, provide services to, or otherwise professionally participate in the iGaming industry. We reserve the right to refuse, suspend, or terminate access to any individual or account that does not meet our eligibility requirements or whose access may pose a security, legal, or operational risk to the platform or its users.</p>
          <p>Access to the Services is not guaranteed until your account has been successfully verified and approved in accordance with our verification procedures.</p>
        </SubSection>
      </Section>

      <Section title="2. Definitions">
        <p>For the purposes of these Terms &amp; Conditions, the following terms shall have the meanings set out below:</p>
        <SubSection title='2.1 "Pulse"'>
          <p>"Pulse", "we", "our", or "us" refers to the Pulse communication platform, its website, applications, software, services, and any related products or features provided by Pulse.</p>
        </SubSection>
        <SubSection title='2.2 "User"'>
          <p>A "User" means any individual who registers for, accesses, or uses the Services, whether under a Free or Pro subscription.</p>
        </SubSection>
        <SubSection title='2.3 "Account"'>
          <p>An "Account" means a registered Pulse user profile created to access the Services. Each Account is personal to the verified individual and is subject to successful identity verification and ongoing compliance with these Terms.</p>
        </SubSection>
        <SubSection title='2.4 "Services"'>
          <p>The "Services" include all features, functionality, software, websites, mobile or desktop applications, messaging services, voice and video calling, groups, contacts, integrations, subscriptions, and any current or future products made available by Pulse.</p>
        </SubSection>
        <SubSection title='2.5 "Content"'>
          <p>"Content" means any information, text, messages, files, images, videos, audio, documents, profile information, usernames, business information, comments, links, or any other material that is uploaded, transmitted, shared, received, or otherwise made available through the Services by Users or by Pulse.</p>
        </SubSection>
        <SubSection title='2.6 "Verification"'>
          <p>"Verification" refers to the identity verification process required by Pulse before a User may access the Services. Verification may include identity document validation, facial recognition, liveness detection, manual review, or any additional verification procedures deemed necessary by Pulse to confirm a User's identity and maintain platform security.</p>
        </SubSection>
        <SubSection title='2.7 "Subscription"'>
          <p>A "Subscription" means a recurring paid plan that provides access to additional features and functionality within the Services. Pulse currently offers Free and Pro subscription plans. Subscription fees, billing terms, renewals, and cancellations are governed by these Terms and any applicable payment policies.</p>
        </SubSection>
        <SubSection title='2.8 "Know Your Customer (KYC)"'>
          <p>"Know Your Customer" or "KYC" refers to the mandatory identity verification process implemented by Pulse to establish and verify the identity of every User before access to the Services is granted. KYC may involve document verification, biometric verification, liveness detection, and manual review where required. Successful completion of KYC does not constitute an endorsement, recommendation, certification, or guarantee of a User's identity, business activities, reputation, or future conduct beyond the completion of the verification process.</p>
        </SubSection>
      </Section>

      <Section title="3. Eligibility & Registration">
        <SubSection title="3.1 Eligibility">
          <p>To register for and use the Services, you must:</p>
          <LegalList items={[
            'Be at least eighteen (18) years of age or the age of legal majority in your jurisdiction, whichever is higher.',
            'Have the legal capacity to enter into a legally binding agreement.',
            "Successfully complete Pulse's mandatory identity verification (KYC) process.",
            'Provide accurate, complete, and up-to-date registration information.',
            'Comply with these Terms and all applicable laws and regulations.',
          ]} />
          <p>Pulse reserves the right to refuse registration or access to any individual who does not meet these eligibility requirements or whose use of the Services may present a legal, security, or operational risk.</p>
        </SubSection>
        <SubSection title="3.2 Account Registration">
          <p>To access the Services, you must create a Pulse Account by providing the requested registration information and completing the required verification process.</p>
          <p>You agree that all information submitted during registration is truthful, accurate, complete, and current. You are responsible for promptly updating your Account information should it change.</p>
          <p>Providing false, misleading, incomplete, or fraudulent information may result in the suspension or permanent termination of your Account.</p>
        </SubSection>
        <SubSection title="3.3 Mandatory Verification Prior to Access">
          <p>Access to the Services is strictly conditional upon successful completion of Pulse's mandatory identity verification process.</p>
          <p>Creating an Account does not guarantee access to the Services. Your Account will remain inactive until your identity has been successfully verified and approved in accordance with Pulse's verification procedures.</p>
          <p>If your verification cannot be automatically completed, Pulse may conduct a manual review and may request additional information or documentation before making a final decision.</p>
          <p>Pulse reserves the right to refuse, suspend, or revoke access where verification cannot be completed, where the information provided cannot be verified, or where access would present a legal, regulatory, or security risk.</p>
        </SubSection>
        <SubSection title="3.4 One Account Per Individual">
          <p>Each User may maintain only one personal Pulse Account unless Pulse has provided prior written authorization for additional Accounts.</p>
          <p>Accounts may not be shared, transferred, sold, rented, or otherwise made available to another individual or entity.</p>
          <p>Users remain solely responsible for all activity carried out through their Account.</p>
        </SubSection>
        <SubSection title="3.5 Account Security">
          <p>You are responsible for maintaining the confidentiality of your login credentials and for all activity conducted through your Account. You agree to:</p>
          <LegalList items={[
            'Use a strong and secure password.',
            'Keep your login credentials confidential.',
            'Notify Pulse immediately if you suspect unauthorized access, loss of credentials, or any compromise of your Account.',
            'Log out of shared or public devices after using the Services.',
          ]} />
          <p>Pulse is not responsible for losses resulting from your failure to adequately protect your Account credentials, except where required by applicable law.</p>
        </SubSection>
        <SubSection title="3.6 Right to Refuse or Remove Access">
          <p>Pulse reserves the right, at its sole discretion and where permitted by applicable law, to refuse registration, deny verification, suspend, restrict, or permanently terminate any Account where:</p>
          <LegalList items={[
            'The eligibility requirements are not met.',
            'Identity verification cannot be completed successfully.',
            'Fraudulent or misleading information has been provided.',
            'The Account is believed to compromise the security or integrity of the platform.',
            'The User has violated these Terms or any applicable law.',
          ]} />
          <p>Where appropriate, Pulse may contact the User to request further information before making a final decision regarding access to the Services.</p>
        </SubSection>
      </Section>

      <Section title="4. Mandatory Identity Verification (KYC)">
        <SubSection title="4.1 Mandatory Verification Requirement">
          <p>Pulse is committed to maintaining a secure, trusted, and professional communication environment for the global iGaming community. To help protect our Users and the integrity of the Services, every individual must successfully complete Pulse's mandatory Know Your Customer ("KYC") identity verification process before being granted access to the platform.</p>
          <p>No User may access or use the Services until their identity has been successfully verified and approved.</p>
        </SubSection>
        <SubSection title="4.2 Verification Process">
          <p>As part of the KYC process, Users may be required to provide information and documentation necessary to verify their identity. This may include, but is not limited to:</p>
          <LegalList items={[
            'A valid government-issued identity document.',
            'A live facial scan or biometric verification.',
            'Liveness detection.',
            'Additional information or supporting documentation where reasonably required.',
            'Any other verification measures deemed necessary to comply with applicable laws or to protect the security of the platform.',
          ]} />
          <p>Pulse reserves the right to determine the verification requirements applicable to each User.</p>
        </SubSection>
        <SubSection title="4.3 Verification Outcomes">
          <p>Following submission of the required verification information, one of the following outcomes may occur:</p>
          <LegalList items={[
            "Approved: The User's identity has been successfully verified and access to the Services is granted.",
            'Manual Review: Where verification cannot be automatically completed or additional checks are required, the submission will be reviewed by the Pulse team. We may contact the User to request additional information or documentation before making a final decision.',
            "Rejected: If verification cannot be completed, the submitted information cannot be validated, fraudulent activity is suspected, or the User otherwise fails to satisfy Pulse's verification requirements, access to the Services will be denied.",
          ]} />
          <p>The outcome of any verification or manual review shall be determined by Pulse at its sole discretion, subject to applicable law.</p>
        </SubSection>
        <SubSection title="4.4 Ongoing Verification">
          <p>Pulse may require a User to complete additional identity verification at any time where reasonably necessary, including but not limited to:</p>
          <LegalList items={[
            'Changes to Account information.',
            'Detection of unusual or suspicious activity.',
            'Security investigations.',
            'Compliance with applicable legal or regulatory obligations.',
            'Periodic re-verification to maintain platform integrity.',
          ]} />
          <p>Failure to complete any requested verification within the specified timeframe may result in the temporary suspension or permanent termination of the User's Account.</p>
        </SubSection>
        <SubSection title="4.5 Accuracy of Information">
          <p>Users represent and warrant that all information and documentation submitted as part of the verification process is accurate, complete, current, and belongs to them.</p>
          <p>Providing false, misleading, altered, stolen, or fraudulent information, attempting to verify another person's identity, or otherwise attempting to circumvent the verification process constitutes a material breach of these Terms and may result in immediate suspension or permanent termination of the Account, without prejudice to any other rights or remedies available to Pulse.</p>
        </SubSection>
        <SubSection title="4.6 No Guarantee of Approval">
          <p>Submission of registration information or completion of the verification process does not guarantee approval or continued access to the Services.</p>
          <p>Pulse reserves the right, where permitted by applicable law, to refuse, suspend, restrict, or revoke access to any User where verification requirements are not satisfied or where Pulse reasonably believes that providing access would compromise the safety, security, integrity, or lawful operation of the platform.</p>
        </SubSection>
        <SubSection title="4.7 Security and Fraud Prevention">
          <p>The KYC process forms an essential part of Pulse's commitment to maintaining a secure communications platform. By requiring verified identities for all Users, Pulse seeks to reduce impersonation, fraudulent accounts, spam, abuse, and other activities that may undermine the trust and safety of the Services.</p>
          <p>Users acknowledge that identity verification is a condition of access to Pulse and agree to fully cooperate with any verification requests made in accordance with these Terms.</p>
        </SubSection>
      </Section>

      <Section title="5. Identity Verification Provider (Didit)">
        <SubSection title="5.1 Third-Party Verification Provider">
          <p>Pulse uses Didit as its third-party identity verification provider to perform the mandatory Know Your Customer ("KYC") process required for access to the Services.</p>
          <p>By creating an Account and initiating the verification process, you acknowledge and agree that your identity verification will be carried out using Didit's technology and services.</p>
        </SubSection>
        <SubSection title="5.2 Verification Services">
          <p>As part of the verification process, Didit may perform one or more of the following verification procedures:</p>
          <LegalList items={[
            'Verification of government-issued identity documents.',
            'Facial recognition and biometric comparison.',
            'Liveness detection to confirm the presence of a real individual.',
            'Authenticity checks of submitted documents.',
            'Fraud prevention and risk assessment.',
            'Additional verification procedures where required to complete the verification process.',
          ]} />
          <p>The exact verification methods used may vary depending on your location, the documents submitted, regulatory requirements, or security considerations.</p>
        </SubSection>
        <SubSection title="5.3 Consent to Verification">
          <p>By registering for Pulse, you expressly authorize Pulse and Didit to collect, process, and verify the information necessary to confirm your identity for the purposes of granting and maintaining access to the Services.</p>
          <p>This may include the processing of personal information, identity documents, facial images, biometric data where permitted by applicable law, and other information required to complete the verification process.</p>
        </SubSection>
        <SubSection title="5.4 Privacy and Data Processing">
          <p>Identity verification is carried out by Didit in accordance with its own privacy practices and applicable data protection laws.</p>
          <p>Pulse encourages all Users to review Didit's Privacy Policy and Terms of Service before completing the verification process.</p>
          <p>Pulse processes verification-related information in accordance with its own Privacy Policy and applicable laws, including the General Data Protection Regulation (GDPR).</p>
        </SubSection>
        <SubSection title="5.5 Manual Review">
          <p>Where Didit is unable to automatically verify a User's identity or where additional verification is required, the verification request may be referred to Pulse for manual review. During a manual review, Pulse may:</p>
          <LegalList items={[
            'Request additional identification or supporting documentation.',
            'Contact the User to clarify submitted information.',
            'Conduct additional verification checks where reasonably necessary.',
            'Approve or reject the verification request based on the information available.',
          ]} />
          <p>Users agree to cooperate with any reasonable requests made during the manual review process.</p>
        </SubSection>
        <SubSection title="5.6 Verification Decisions">
          <p>Verification decisions may be based on information provided by Didit, information supplied by the User, additional documentation, and Pulse's internal security procedures.</p>
          <p>Pulse reserves the right, where permitted by applicable law, to approve, reject, suspend, or revoke verification where identity cannot be satisfactorily confirmed or where approval would present a security, legal, regulatory, or operational risk.</p>
        </SubSection>
        <SubSection title="5.7 Third-Party Service Availability">
          <p>Pulse relies on Didit to perform identity verification services. While Pulse endeavours to provide uninterrupted access to the verification process, Pulse is not responsible for temporary interruptions, delays, outages, maintenance, or technical failures affecting Didit's systems or services.</p>
          <p>Verification may be delayed where third-party services are unavailable or where additional security checks are required.</p>
        </SubSection>
        <SubSection title="5.8 No Responsibility for Third-Party Policies">
          <p>Didit is an independent third-party service provider. Your use of Didit's verification services is also subject to Didit's applicable terms, conditions, and privacy policies.</p>
          <p>Pulse is not responsible for the operation, policies, security practices, or availability of Didit's services, except to the extent required by applicable law.</p>
        </SubSection>
      </Section>

      <Section title="6. Free & Pro Subscription">
        <SubSection title="6.1 Subscription Plans">
          <p>Pulse offers the following subscription plans:</p>
          <LegalList items={[
            "Free Plan – Provides access to Pulse's core communication features as determined by Pulse from time to time.",
            'Pro Plan – Provides access to additional features and functionality for a recurring subscription fee.',
          ]} />
          <p>The features included in each subscription plan are described on the Pulse website and may be updated from time to time.</p>
        </SubSection>
        <SubSection title="6.2 Pro Subscription Fees">
          <p>The current pricing for the Pro Plan is:</p>
          <LegalList items={['€6.99 per month, or', '€70.00 per year.']} />
          <p>All prices are displayed in Euros (EUR) unless otherwise stated and may be subject to applicable taxes or fees required by law.</p>
          <p>Pulse reserves the right to modify its subscription pricing at any time. Any price changes will apply only to future billing periods. Where required by applicable law, Users will be notified in advance before any pricing changes take effect.</p>
        </SubSection>
        <SubSection title="6.3 Payment Processing">
          <p>All subscription payments are securely processed through Stripe, our third-party payment processor.</p>
          <p>By purchasing a Pro subscription, you authorize Stripe to charge your selected payment method for the applicable subscription fees, taxes, and any other charges associated with your subscription in accordance with your chosen billing cycle.</p>
          <p>Pulse does not collect, store, or have access to your complete payment card information.</p>
        </SubSection>
        <SubSection title="6.4 Automatic Renewal">
          <p>Unless cancelled before the end of the current billing period, Pro subscriptions automatically renew for successive monthly or annual billing periods, depending on the subscription selected.</p>
          <p>By subscribing to the Pro Plan, you authorize recurring payments through Stripe until your subscription is cancelled.</p>
        </SubSection>
        <SubSection title="6.5 Cancellation">
          <p>You may cancel your Pro subscription at any time through your Pulse account settings or via the payment management options provided by Stripe.</p>
          <p>Cancellation will prevent future renewals but will not affect your access to Pro features until the end of your current paid billing period.</p>
        </SubSection>
        <SubSection title="6.6 Refund Policy">
          <p>Subscription fees are generally non-refundable once a billing period has begun, except where required by applicable law or where Pulse determines that a billing error has occurred.</p>
          <p>Nothing in these Terms limits any mandatory consumer rights that may apply under applicable European Union or Romanian law.</p>
        </SubSection>
        <SubSection title="6.7 Changes to Subscription Features">
          <p>Pulse may introduce, modify, replace, or discontinue features available under the Free or Pro plans at any time to improve the Services, enhance security, comply with legal obligations, or introduce new functionality.</p>
          <p>The availability of any particular feature is not guaranteed and may change without creating any entitlement to compensation.</p>
        </SubSection>
        <SubSection title="6.8 Failed Payments">
          <p>If a subscription payment cannot be successfully processed, Pulse may suspend Pro features or downgrade the Account to the Free Plan until payment has been successfully completed.</p>
          <p>Repeated payment failures or suspected fraudulent payment activity may result in suspension or termination of the Account.</p>
        </SubSection>
        <SubSection title="6.9 Free Plan">
          <p>Users of the Free Plan remain subject to these Terms &amp; Conditions.</p>
          <p>Pulse reserves the right to modify, limit, or discontinue features available under the Free Plan at any time, provided such changes comply with applicable law.</p>
        </SubSection>
      </Section>

      <Section title="7. Acceptable Use Policy">
        <SubSection title="7.1 Purpose of the Services">
          <p>Pulse is intended to provide a secure, professional communication platform for verified individuals within the global iGaming industry. Users must use the Services responsibly, lawfully, and in a manner that respects the rights, privacy, and security of other Users and the integrity of the platform.</p>
          <p>You agree not to use the Services for any unlawful, fraudulent, abusive, or harmful purpose.</p>
        </SubSection>
        <SubSection title="7.2 Prohibited Activities">
          <p>When using the Services, you must not:</p>
          <LegalList items={[
            'Violate any applicable local, national, or international law or regulation.',
            'Create or use fake, misleading, or impersonated identities.',
            "Access or attempt to access another User's Account without authorization.",
            'Share, sell, rent, transfer, or otherwise allow another person to use your Account.',
            "Circumvent or attempt to bypass Pulse's identity verification, security measures, or access controls.",
            "Use automated software, bots, scripts, crawlers, or similar technologies to access or interact with the Services without Pulse's prior written consent.",
            'Reverse engineer, decompile, modify, or attempt to discover the source code of the Services except where permitted by applicable law.',
            'Interfere with the operation, security, or availability of the Services.',
          ]} />
        </SubSection>
        <SubSection title="7.3 Prohibited Communications">
          <p>Users must not use Pulse to:</p>
          <LegalList items={[
            'Send unsolicited commercial messages or spam.',
            'Conduct phishing attacks or impersonate another person or organization.',
            'Distribute malware, ransomware, viruses, or other harmful software.',
            'Promote or facilitate fraud, scams, money laundering, terrorist financing, or any other illegal activity.',
            'Harass, threaten, intimidate, stalk, or abuse another User.',
            'Publish defamatory, hateful, discriminatory, or unlawful content.',
            'Share content that is obscene, sexually explicit, or otherwise inappropriate.',
            'Encourage violence, criminal activity, or self-harm.',
            "Infringe another person's intellectual property or other legal rights.",
          ]} />
        </SubSection>
        <SubSection title="7.4 Professional Conduct">
          <p>As Pulse is designed for professionals working within the iGaming industry, Users are expected to conduct themselves in a respectful and professional manner at all times. Users must:</p>
          <LegalList items={[
            'Communicate honestly and respectfully.',
            'Represent themselves and their businesses accurately.',
            'Respect the confidentiality of private communications.',
            'Avoid deceptive, misleading, or unethical business practices.',
            'Treat other Users in a professional manner regardless of commercial disagreements.',
          ]} />
          <p>Pulse is not responsible for disputes arising between Users but reserves the right to investigate conduct that may threaten the safety or integrity of the platform.</p>
        </SubSection>
        <SubSection title="7.5 User Responsibility">
          <p>Users are solely responsible for:</p>
          <LegalList items={[
            'All Content they upload, transmit, or share.',
            'Their communications with other Users.',
            'Any files or links they distribute.',
            'Ensuring that their use of the Services complies with these Terms and applicable law.',
          ]} />
          <p>Pulse does not routinely monitor private communications but reserves the right to investigate reports of abuse, security incidents, unlawful activity, or violations of these Terms where permitted by applicable law.</p>
        </SubSection>
        <SubSection title="7.6 Enforcement">
          <p>Where Pulse reasonably believes that a User has breached this Acceptable Use Policy or otherwise poses a risk to the platform or its Users, Pulse may, at its sole discretion and where permitted by applicable law:</p>
          <LegalList items={[
            'Issue warnings.',
            'Remove or restrict access to Content.',
            'Temporarily suspend or permanently terminate an Account.',
            'Restrict access to specific features.',
            'Conduct security or compliance investigations.',
            'Report unlawful activity to the appropriate authorities.',
            'Take any other action reasonably necessary to protect the Services, Users, or Pulse.',
          ]} />
          <p>These enforcement measures may be taken without prior notice where immediate action is necessary to protect the security, integrity, or lawful operation of the Services.</p>
        </SubSection>
        <SubSection title="7.7 Reporting Violations">
          <p>Users who become aware of suspected fraud, abuse, impersonation, spam, security vulnerabilities, or other violations of these Terms are encouraged to report the matter to Pulse through the designated support channels.</p>
          <p>Pulse will review reports in good faith but does not guarantee that any particular action will be taken following a report.</p>
        </SubSection>
      </Section>

      <Section title="8. Communications Features">
        <SubSection title="8.1 Availability of Communication Services">
          <p>Pulse provides a range of communication and collaboration features designed for verified users of the platform. Depending on your subscription plan and the features made available by Pulse from time to time, the Services may include:</p>
          <LegalList items={[
            'One-to-one messaging.', 'Group conversations.', 'Voice calls.', 'Video calls.', 'File and document sharing.',
            'Contact management.', 'Presence and availability status.', 'Notifications.', 'Calendar integrations.',
            'Other communication and collaboration features introduced by Pulse.',
          ]} />
          <p>The availability of any feature may vary depending on your subscription plan, device, region, or future updates to the Services.</p>
        </SubSection>
        <SubSection title="8.2 Appropriate Use of Communications">
          <p>Users are solely responsible for all communications sent or received through the Services.</p>
          <p>You agree that all communications conducted through Pulse will comply with these Terms, applicable laws, and the Acceptable Use Policy.</p>
          <p>Pulse must not be used to transmit unlawful, fraudulent, abusive, defamatory, threatening, or otherwise prohibited content.</p>
        </SubSection>
        <SubSection title="8.3 Private Communications">
          <p>Pulse is designed to facilitate private communications between verified Users.</p>
          <p>Except where required by applicable law, necessary to provide the Services, or permitted under our Privacy Policy, Pulse does not actively monitor the content of private messages, voice calls, or video calls. However, Pulse reserves the right to investigate reports of abuse, unlawful activity, security incidents, or violations of these Terms where reasonably necessary and permitted by law.</p>
        </SubSection>
        <SubSection title="8.4 File Sharing">
          <p>Users may share files and other content through the Services where such functionality is available. Users are solely responsible for ensuring that any files uploaded or shared:</p>
          <LegalList items={[
            'Are lawful.', 'Do not contain malware or malicious code.',
            "Do not infringe the intellectual property or other rights of third parties.", 'Do not violate these Terms or any applicable law.',
          ]} />
          <p>Pulse reserves the right to restrict, remove, or block files that may present a security, legal, or operational risk.</p>
        </SubSection>
        <SubSection title="8.5 Voice and Video Calls">
          <p>Voice and video calling features are provided to facilitate communication between verified Users.</p>
          <p>Call quality and availability may be affected by internet connectivity, device compatibility, third-party service providers, maintenance, or technical issues beyond Pulse's reasonable control.</p>
          <p>Pulse does not guarantee uninterrupted, error-free, or continuous voice or video communications.</p>
        </SubSection>
        <SubSection title="8.6 Groups and Community Features">
          <p>Where group functionality is available, Users creating or administering groups are responsible for managing their groups in accordance with these Terms.</p>
          <p>Pulse reserves the right to suspend, restrict, or remove any group or group content that violates these Terms, applicable law, or threatens the safety, security, or integrity of the platform.</p>
        </SubSection>
        <SubSection title="8.7 Delivery of Communications">
          <p>Pulse will make reasonable efforts to facilitate the delivery of messages, calls, notifications, and other communications.</p>
          <p>However, Pulse does not guarantee that any communication will be delivered, received, stored, synchronized, or remain available without interruption or delay.</p>
          <p>Users acknowledge that technical failures, network outages, software updates, third-party services, or circumstances beyond Pulse's control may affect the availability or delivery of communications.</p>
        </SubSection>
        <SubSection title="8.8 No Responsibility for User Communications">
          <p>Pulse acts solely as the provider of the communication platform and does not endorse, verify, monitor, or accept responsibility for the accuracy, legality, reliability, or content of communications exchanged between Users.</p>
          <p>Users are solely responsible for the communications they send, receive, and rely upon while using the Services.</p>
        </SubSection>
      </Section>

      <Section title="9. User Content">
        <SubSection title="9.1 Ownership of Content">
          <p>Users retain ownership of all Content they create, upload, transmit, share, or otherwise make available through the Services.</p>
          <p>Nothing in these Terms transfers ownership of your Content to Pulse.</p>
        </SubSection>
        <SubSection title="9.2 Licence to Pulse">
          <p>By submitting, uploading, transmitting, or sharing Content through the Services, you grant Pulse a worldwide, non-exclusive, royalty-free, transferable (only where reasonably necessary to operate the Services), and sublicensable licence to:</p>
          <LegalList items={[
            'Store your Content.', 'Process your Content.', 'Transmit your Content.', 'Display your Content where necessary.',
            'Reproduce your Content solely for the purpose of operating, maintaining, securing, improving, and providing the Services.',
          ]} />
          <p>This licence exists only to the extent necessary for Pulse to operate the Services and does not grant Pulse ownership of your Content.</p>
        </SubSection>
        <SubSection title="9.3 User Responsibility">
          <p>You are solely responsible for all Content that you upload, transmit, or otherwise make available through the Services. You represent and warrant that:</p>
          <LegalList items={[
            'You own the Content or have all necessary rights and permissions to use and share it.',
            'Your Content does not infringe the intellectual property, privacy, publicity, or other legal rights of any third party.',
            'Your Content complies with these Terms and all applicable laws and regulations.',
          ]} />
        </SubSection>
        <SubSection title="9.4 Prohibited Content">
          <p>Users must not upload, transmit, store, or distribute Content that:</p>
          <LegalList items={[
            'Is unlawful, fraudulent, defamatory, or misleading.',
            'Contains malware, malicious code, or harmful software.',
            'Infringes the intellectual property or other legal rights of any third party.',
            'Promotes violence, terrorism, criminal activity, or illegal conduct.',
            'Contains hate speech, discrimination, harassment, or threats.',
            'Is sexually explicit, obscene, or otherwise unlawful.',
            'Is intended to deceive, impersonate, or defraud another person or organisation.',
            'Otherwise violates these Terms or applicable law.',
          ]} />
        </SubSection>
        <SubSection title="9.5 Content Removal">
          <p>Pulse reserves the right, but not the obligation, to remove, restrict access to, disable, or refuse to display any Content where Pulse reasonably believes that such Content:</p>
          <LegalList items={[
            'Violates these Terms.', 'May expose Pulse or its Users to legal liability.', 'Creates a security or operational risk.',
            'Is subject to a lawful request from a competent authority.', 'Is otherwise necessary to protect the Services or its Users.',
          ]} />
          <p>Where appropriate, Pulse may remove Content without prior notice.</p>
        </SubSection>
        <SubSection title="9.6 Content Storage">
          <p>Pulse may retain, archive, or delete Content in accordance with these Terms, our Privacy Policy, legal obligations, operational requirements, and data retention policies.</p>
          <p>Pulse does not guarantee that any Content will remain permanently available or recoverable. Users are responsible for maintaining their own backups of any important Content.</p>
        </SubSection>
        <SubSection title="9.7 No Endorsement">
          <p>Content shared by Users represents the views and opinions of the individual User who created it and does not necessarily reflect the views of Pulse.</p>
          <p>Pulse does not endorse, verify, guarantee, or accept responsibility for the accuracy, legality, reliability, or completeness of User Content.</p>
        </SubSection>
        <SubSection title="9.8 Reporting Content">
          <p>If you believe that any Content available through the Services violates these Terms, infringes your legal rights, or is otherwise unlawful, you may report it to Pulse through the designated support channels.</p>
          <p>Pulse will review reports in good faith and may take any action it considers appropriate in accordance with these Terms and applicable law.</p>
        </SubSection>
      </Section>

      <Section title="10. Platform Security">
        <SubSection title="10.1 Our Commitment to Security">
          <p>Pulse is designed to provide a secure and trusted communication platform for verified professionals within the global iGaming industry. We continuously implement technical, organisational, and administrative measures intended to protect the confidentiality, integrity, and availability of the Services and User Accounts.</p>
          <p>While we strive to maintain a secure platform, no online service can guarantee absolute security.</p>
        </SubSection>
        <SubSection title="10.2 Security Measures">
          <p>To help protect the Services and our Users, Pulse may implement security measures including, but not limited to:</p>
          <LegalList items={[
            'Mandatory identity verification (KYC).', 'Account authentication and access controls.', 'Encryption of data where appropriate.',
            'Fraud detection systems.', 'Monitoring for suspicious or unauthorized activity.', 'Login security measures.',
            'Rate limiting and abuse prevention.', 'Security logging and auditing.', 'Manual security investigations.',
            'Additional safeguards introduced from time to time.',
          ]} />
          <p>These measures may be updated without prior notice to respond to evolving security threats.</p>
        </SubSection>
        <SubSection title="10.3 Security Monitoring">
          <p>Pulse may monitor the operation of the Services for the purpose of:</p>
          <LegalList items={[
            'Detecting fraud or abuse.', 'Preventing unauthorized access.', 'Investigating suspected violations of these Terms.',
            'Protecting Users and the platform.', 'Maintaining system integrity.', 'Complying with applicable legal or regulatory obligations.',
          ]} />
          <p>Such monitoring will be carried out in accordance with applicable law and our Privacy Policy.</p>
        </SubSection>
        <SubSection title="10.4 User Responsibilities">
          <p>Users are responsible for helping maintain the security of their Accounts and agree to:</p>
          <LegalList items={[
            'Keep login credentials confidential.', 'Use secure passwords.', 'Enable additional security features where available.',
            'Keep devices and software reasonably secure and up to date.',
            'Promptly notify Pulse if they suspect unauthorized access or any security incident affecting their Account.',
          ]} />
          <p>Users remain responsible for all activity conducted through their Account unless otherwise required by applicable law.</p>
        </SubSection>
        <SubSection title="10.5 Security Investigations">
          <p>Where Pulse reasonably believes that an Account, User, or activity may present a security, legal, or operational risk, Pulse may conduct an investigation. As part of such investigations, Pulse may:</p>
          <LegalList items={[
            'Request additional information or documentation.', 'Temporarily restrict access to the Services.', 'Suspend certain features.',
            'Require additional identity verification.', 'Cooperate with competent law enforcement or regulatory authorities where legally required.',
          ]} />
          <p>Users agree to cooperate with reasonable security-related requests made by Pulse.</p>
        </SubSection>
        <SubSection title="10.6 Security Incidents">
          <p>If Pulse becomes aware of a security incident affecting the Services, we will take reasonable steps to investigate, mitigate, and respond to the incident.</p>
          <p>Where required by applicable law, Pulse will notify affected Users and relevant authorities within the applicable legal timeframes.</p>
        </SubSection>
        <SubSection title="10.7 No Guarantee of Absolute Security">
          <p>Although Pulse employs commercially reasonable security measures, Users acknowledge that no electronic communications system, software platform, or method of data transmission or storage can be guaranteed to be completely secure, uninterrupted, or free from vulnerabilities.</p>
          <p>Accordingly, Pulse does not warrant or guarantee that the Services will be immune from cyberattacks, unauthorized access, data breaches, service interruptions, or other security incidents beyond our reasonable control.</p>
        </SubSection>
        <SubSection title="10.8 Right to Protect the Platform">
          <p>To preserve the safety, security, and integrity of the Services, Pulse reserves the right to suspend, restrict, investigate, or terminate any Account, activity, device, or connection that we reasonably believe presents a security threat, violates these Terms, or may adversely affect the platform or its Users.</p>
          <p>Where reasonably practicable, such actions will be taken in accordance with applicable law and may be implemented without prior notice where immediate action is necessary to protect the Services or other Users.</p>
        </SubSection>
      </Section>

      <Section title="11. Account Suspension & Termination">
        <SubSection title="11.1 Suspension or Termination by Pulse">
          <p>Pulse reserves the right, at its sole discretion and where permitted by applicable law, to suspend, restrict, or permanently terminate any Account or access to the Services if we reasonably believe that:</p>
          <LegalList items={[
            'You have violated these Terms or any applicable law.',
            'You have failed or refused to complete the mandatory identity verification (KYC) process.',
            'Your identity verification has been rejected or revoked.',
            'You have provided false, misleading, inaccurate, or fraudulent information.',
            'Your Account has been compromised or presents a security risk.',
            'Your use of the Services may harm Pulse, its Users, or the integrity of the platform.',
            'We are required to do so by law, regulation, or a lawful request from a competent authority.',
          ]} />
          <p>Pulse may take such action immediately where necessary to protect the security, integrity, or lawful operation of the Services.</p>
        </SubSection>
        <SubSection title="11.2 Suspension Pending Investigation">
          <p>Pulse may temporarily suspend an Account while investigating suspected violations of these Terms, security incidents, fraudulent activity, or other circumstances requiring review.</p>
          <p>During a suspension, access to some or all features of the Services may be restricted until the investigation has been completed.</p>
        </SubSection>
        <SubSection title="11.3 Termination by the User">
          <p>You may terminate your Pulse Account at any time through your account settings or by contacting Pulse Support.</p>
          <p>Termination of your Account does not automatically cancel an active Pro subscription. Any subscription must be cancelled separately in accordance with Section 6 of these Terms to prevent future renewals.</p>
        </SubSection>
        <SubSection title="11.4 Effect of Termination">
          <p>Upon suspension or termination of an Account:</p>
          <LegalList items={[
            'Your right to access and use the Services will immediately cease.',
            'Pulse may deactivate or remove your Account.',
            'Access to messages, files, contacts, groups, and other Content associated with your Account may no longer be available.',
            'Pulse may retain certain information where required by law, for legitimate business purposes, or in accordance with our Privacy Policy and data retention obligations.',
          ]} />
          <p>Termination of an Account does not affect any rights or obligations that arose before the date of termination.</p>
        </SubSection>
        <SubSection title="11.5 No Refund Following Termination for Cause">
          <p>Where an Account is suspended or terminated due to a breach of these Terms, fraudulent activity, abuse of the Services, or other misconduct by the User, Pulse shall have no obligation to provide a refund for any unused portion of a Pro subscription, except where required by applicable law.</p>
        </SubSection>
        <SubSection title="11.6 Survival">
          <p>Any provisions of these Terms that by their nature should survive suspension or termination, including but not limited to provisions relating to intellectual property, user content, limitation of liability, indemnification, governing law, dispute resolution, and data retention, shall remain in full force and effect following the suspension or termination of your Account.</p>
        </SubSection>
      </Section>

      <Section title="12. Third-Party Services">
        <SubSection title="12.1 Third-Party Providers">
          <p>Pulse relies on certain trusted third-party providers to deliver, operate, maintain, and improve the Services. By using Pulse, you acknowledge that certain features of the Services depend on these third-party providers and their respective technologies. Current third-party providers may include, but are not limited to:</p>
          <LegalList items={[
            'Didit – Identity verification (KYC), document verification, facial recognition, and liveness detection.',
            'Stripe – Secure payment processing for Pro subscriptions.',
            'Agora – Voice and video communication services.',
            'Google Calendar – Calendar integration, where connected by the User.',
            'Authentication Providers – Such as Google, Microsoft, or other supported login providers, where available.',
            'Cloud Hosting and Infrastructure Providers – Used to securely host and operate the Pulse platform.',
          ]} />
          <p>Pulse may add, replace, or discontinue third-party providers at any time without prior notice where reasonably necessary.</p>
        </SubSection>
        <SubSection title="12.2 Independent Services">
          <p>Third-party providers operate independently from Pulse and may have their own terms of service, privacy policies, data processing practices, and acceptable use requirements.</p>
          <p>Where you choose to use a third-party service or integration, you may also be subject to the applicable terms and policies of that provider.</p>
        </SubSection>
        <SubSection title="12.3 No Responsibility for Third-Party Services">
          <p>To the fullest extent permitted by applicable law, Pulse is not responsible for:</p>
          <LegalList items={[
            'The availability of third-party services.',
            'Interruptions, delays, outages, or maintenance performed by third-party providers.',
            'The accuracy, reliability, or security of third-party systems.',
            'Any acts, omissions, products, or services provided by third parties.',
          ]} />
          <p>Pulse shall not be liable for any loss or damage arising solely from the failure or unavailability of a third-party provider beyond Pulse's reasonable control.</p>
        </SubSection>
        <SubSection title="12.4 Third-Party Integrations">
          <p>Certain Pulse features may allow Users to connect or interact with third-party applications or services.</p>
          <p>Users choose to use such integrations at their own discretion and are responsible for ensuring that they have the necessary rights and permissions to connect those services.</p>
          <p>Pulse does not guarantee the continued availability or compatibility of any third-party integration.</p>
        </SubSection>
        <SubSection title="12.5 Changes to Third-Party Providers">
          <p>Pulse reserves the right to modify, replace, suspend, or discontinue any third-party provider or integration where necessary for operational, security, legal, or commercial reasons.</p>
          <p>Such changes shall not constitute a breach of these Terms and will not entitle Users to compensation or damages.</p>
        </SubSection>
        <SubSection title="12.6 Third-Party Links">
          <p>The Services may contain links to third-party websites, applications, or resources for your convenience.</p>
          <p>Pulse does not endorse, control, or assume responsibility for the content, products, services, or privacy practices of any third-party website or service. Users access such third-party resources entirely at their own risk.</p>
        </SubSection>
      </Section>

      <Section title="13. Intellectual Property">
        <SubSection title="13.1 Ownership">
          <p>The Services, including the Pulse website, applications, software, source code, databases, user interface, design, graphics, logos, trademarks, branding, text, audio, video, and all other materials made available by Pulse (collectively, the "Pulse Materials") are owned by or licensed to Pulse and are protected by applicable intellectual property, copyright, trademark, database, and other proprietary rights.</p>
          <p>Except as expressly permitted by these Terms, no rights or licences are granted to you in respect of the Pulse Materials.</p>
        </SubSection>
        <SubSection title="13.2 Limited Licence">
          <p>Subject to your compliance with these Terms, Pulse grants you a limited, non-exclusive, non-transferable, non-sublicensable, and revocable licence to access and use the Services solely for their intended purpose.</p>
          <p>This license does not transfer ownership of any intellectual property rights to you.</p>
        </SubSection>
        <SubSection title="13.3 Restrictions">
          <p>You must not, without Pulse's prior written consent:</p>
          <LegalList items={[
            'Copy, reproduce, modify, adapt, translate, or create derivative works from the Services or Pulse Materials.',
            'Reverse engineer, decompile, disassemble, or otherwise attempt to discover the source code of the Services, except where expressly permitted by applicable law.',
            'Sell, licence, lease, distribute, sublicense, or commercially exploit any part of the Services.',
            'Remove, alter, or obscure any copyright, trademark, or proprietary notices.',
            "Use Pulse's name, logo, branding, or trademarks in a manner that suggests endorsement or affiliation without prior written permission.",
          ]} />
        </SubSection>
        <SubSection title="13.4 User Content">
          <p>Users retain ownership of the Content they submit to the Services, subject to the licence granted to Pulse under Section 9 of these Terms.</p>
          <p>Nothing in these Terms transfers ownership of User Content to Pulse.</p>
        </SubSection>
        <SubSection title="13.5 Feedback">
          <p>If you provide Pulse with suggestions, ideas, feedback, feature requests, or other comments regarding the Services ("Feedback"), you grant Pulse a perpetual, irrevocable, worldwide, royalty-free, transferable licence to use, reproduce, modify, publish, distribute, and incorporate such Feedback into the Services without compensation, acknowledgement, or restriction.</p>
          <p>You acknowledge that Pulse is under no obligation to implement any Feedback provided.</p>
        </SubSection>
        <SubSection title="13.6 Reporting Intellectual Property Infringement">
          <p>If you believe that any Content available through the Services infringes your intellectual property rights, you may notify Pulse by contacting our designated legal contact.</p>
          <p>Your notice should include sufficient information to identify the allegedly infringing material, establish your rights, and enable Pulse to investigate the matter.</p>
          <p>Pulse reserves the right to remove or disable access to allegedly infringing material while an investigation is conducted where appropriate.</p>
        </SubSection>
      </Section>

      <Section title="14. Privacy & Data Protection">
        <SubSection title="14.1 Privacy Commitment">
          <p>Pulse is committed to protecting the privacy and personal data of its Users. We collect, use, store, process, and protect personal information in accordance with applicable data protection laws, including the General Data Protection Regulation (EU) 2016/679 ("GDPR"), applicable Romanian legislation, and our Privacy Policy.</p>
          <p>By using the Services, you acknowledge that your personal data will be processed as described in these Terms and our <Link to="/privacy" className="text-violet-600 hover:underline">Privacy Policy</Link>.</p>
        </SubSection>
        <SubSection title="14.2 Privacy Policy">
          <p>Our <Link to="/privacy" className="text-violet-600 hover:underline">Privacy Policy</Link> forms an integral part of these Terms and explains in greater detail what personal data we collect, how and why we process it, the legal bases for processing, how long your data is retained, when your data may be shared with trusted third parties, your rights under applicable data protection laws, and how you may contact us regarding privacy matters.</p>
          <p>Users should read the Privacy Policy carefully before using the Services.</p>
        </SubSection>
        <SubSection title="14.3 Data Processing">
          <p>Pulse processes personal data only where there is a lawful basis to do so, including where processing is necessary to:</p>
          <LegalList items={[
            'Provide and maintain the Services.', 'Verify User identities through our KYC process.', 'Process subscription payments.',
            'Protect the security and integrity of the platform.', 'Prevent fraud and unlawful activity.',
            'Comply with legal and regulatory obligations.', 'Respond to User requests and provide customer support.', 'Improve and develop the Services.',
          ]} />
        </SubSection>
        <SubSection title="14.4 Third-Party Data Processors">
          <p>To provide the Services, Pulse may engage carefully selected third-party service providers who process personal data on our behalf, relating to identity verification, payment processing, voice and video communications, cloud hosting and infrastructure, authentication services, and analytics and security monitoring.</p>
          <p>Where third parties process personal data on our behalf, Pulse takes reasonable steps to ensure they provide appropriate safeguards in accordance with applicable data protection laws.</p>
        </SubSection>
        <SubSection title="14.5 International Data Transfers">
          <p>Where personal data is transferred outside the European Economic Area ("EEA"), Pulse will ensure that appropriate safeguards are in place in accordance with applicable data protection laws, including the GDPR.</p>
          <p>Such safeguards may include adequacy decisions issued by the European Commission, Standard Contractual Clauses, or other legally recognised transfer mechanisms.</p>
        </SubSection>
        <SubSection title="14.6 User Rights">
          <p>Subject to applicable law, Users may have the right to access their personal data, correct inaccurate personal data, request deletion of personal data, restrict or object to certain processing activities, request data portability, withdraw consent where processing is based on consent, and lodge a complaint with a competent supervisory authority.</p>
          <p>Certain rights may be limited where Pulse is required to retain information to comply with legal obligations, resolve disputes, prevent fraud, or protect the security of the Services.</p>
        </SubSection>
        <SubSection title="14.7 Data Security">
          <p>Pulse implements appropriate technical and organisational measures designed to protect personal data against accidental or unlawful destruction, loss, alteration, unauthorised disclosure, or access.</p>
          <p>While Pulse strives to maintain a secure environment, no electronic system or method of transmission over the internet can be guaranteed to be completely secure.</p>
        </SubSection>
        <SubSection title="14.8 Data Retention">
          <p>Pulse retains personal data only for as long as necessary to provide the Services, fulfil contractual obligations, comply with applicable legal and regulatory requirements, resolve disputes, enforce these Terms, and protect the security and integrity of the platform.</p>
          <p>Further details regarding retention periods are provided in our <Link to="/privacy" className="text-violet-600 hover:underline">Privacy Policy</Link>.</p>
        </SubSection>
        <SubSection title="14.9 Contact Regarding Privacy">
          <p>Questions regarding the processing of personal data or the exercise of your privacy rights may be directed to Pulse using the contact information provided at the end of these Terms or within our Privacy Policy.</p>
        </SubSection>
      </Section>

      <Section title="15. Availability of the Services">
        <SubSection title="15.1 Service Availability">
          <p>Pulse aims to provide reliable and continuous access to the Services. However, the Services are provided on an "as available" and "as is" basis.</p>
          <p>While we strive to minimise interruptions, we do not guarantee that the Services will always be available, uninterrupted, secure, or error-free.</p>
        </SubSection>
        <SubSection title="15.2 Maintenance">
          <p>Pulse may temporarily suspend or restrict access to all or part of the Services in order to perform scheduled maintenance, deploy software updates or new features, improve performance or security, resolve technical issues, or comply with legal or regulatory requirements.</p>
          <p>Where reasonably practicable, Pulse will provide advance notice of planned maintenance. Emergency maintenance may be carried out without prior notice where necessary to protect the Services or its Users.</p>
        </SubSection>
        <SubSection title="15.3 Service Interruptions">
          <p>Access to the Services may be interrupted or affected by circumstances beyond Pulse's reasonable control, including but not limited to internet or telecommunications failures, power outages, hardware or software failures, cybersecurity incidents, third-party service outages, force majeure events, or government actions or regulatory restrictions.</p>
          <p>Pulse shall not be liable for any delay, interruption, or unavailability of the Services arising from such events.</p>
        </SubSection>
        <SubSection title="15.4 Changes to the Services">
          <p>Pulse continually develops and improves its platform. Accordingly, we may, at any time and without prior notice where reasonably necessary, add, modify, or remove features or functionality, introduce new Services or subscription options, improve security or performance, change the design, interface, or operation of the Services, or discontinue features that are no longer supported or commercially viable.</p>
          <p>Where required by applicable law, Users will be notified of material changes.</p>
        </SubSection>
        <SubSection title="15.5 No Guarantee of Compatibility">
          <p>Pulse does not guarantee that the Services will be compatible with every device, browser, operating system, network, or third-party application.</p>
          <p>Users are responsible for ensuring that they use supported devices, software, and internet connections to access the Services.</p>
        </SubSection>
        <SubSection title="15.6 Backup Responsibility">
          <p>Although Pulse implements reasonable measures to protect data and maintain service continuity, Users are responsible for maintaining their own copies or backups of any important information, files, or Content shared through the Services.</p>
          <p>Pulse does not guarantee that Content will always be recoverable following technical failures, accidental deletion, or other unforeseen events.</p>
        </SubSection>
        <SubSection title="15.7 Right to Suspend the Services">
          <p>Pulse reserves the right to suspend, restrict, or discontinue all or part of the Services where reasonably necessary to protect the security or integrity of the platform, prevent fraud or abuse, comply with legal or regulatory obligations, perform maintenance or upgrades, or respond to technical issues or emergencies.</p>
          <p>Such actions shall not constitute a breach of these Terms and, except where required by applicable law, shall not give rise to any entitlement to compensation.</p>
        </SubSection>
      </Section>

      <Section title="16. Disclaimer">
        <SubSection title='16.1 Services Provided "As Is"'>
          <p>The Services are provided on an "as is" and "as available" basis. To the fullest extent permitted by applicable law, Pulse makes no representations, warranties, or guarantees, whether express, implied, statutory, or otherwise, regarding the operation, availability, reliability, accuracy, security, or performance of the Services.</p>
          <p>Without limitation, Pulse disclaims all implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement.</p>
        </SubSection>
        <SubSection title="16.2 Communications Platform Only">
          <p>Pulse is a communication platform designed to enable verified professionals within the iGaming industry to communicate and collaborate.</p>
          <p>Pulse does not act as an employer, recruitment agency, broker, intermediary, agent, financial institution, legal adviser, gambling operator, affiliate network, or participant in any commercial relationship formed between Users.</p>
          <p>Any business relationship, agreement, transaction, employment opportunity, or commercial arrangement entered into between Users is solely between those Users.</p>
        </SubSection>
        <SubSection title="16.3 No Endorsement of Users">
          <p>Although Pulse requires mandatory identity verification before granting access to the Services, successful verification confirms only that a User has completed Pulse's identity verification process. Verification does not constitute a recommendation or endorsement, a guarantee of identity beyond the verification process, a certification of honesty, competence, reputation, financial standing, or business practices, a guarantee that a User will fulfil contractual obligations, or a guarantee that a User or business is legitimate, licensed, regulated, or financially solvent.</p>
          <p>Users remain responsible for conducting their own due diligence before entering into any business relationship or transaction.</p>
        </SubSection>
        <SubSection title="16.4 No Responsibility for User Conduct">
          <p>Pulse is not responsible for the actions or omissions of Users, the accuracy of information shared by Users, communications exchanged between Users, business negotiations or agreements, payments made between Users, or any disputes arising between Users.</p>
          <p>Users interact with one another entirely at their own risk.</p>
        </SubSection>
        <SubSection title="16.5 Third-Party Services">
          <p>Pulse does not warrant or guarantee the availability, reliability, security, or performance of any third-party services, integrations, or providers used in connection with the Services.</p>
          <p>The use of third-party services is subject to the terms and policies of the relevant provider.</p>
        </SubSection>
        <SubSection title="16.6 No Guarantee of Results">
          <p>Pulse does not guarantee that use of the Services will result in employment opportunities, business partnerships, commercial agreements, increased revenue or profits, successful networking, or any particular business outcome.</p>
          <p>Individual results depend on numerous factors outside Pulse's control.</p>
        </SubSection>
        <SubSection title="16.7 User Responsibility">
          <p>Users are solely responsible for their communications and interactions with other Users, any Content they create or share, decisions made based on information obtained through the Services, compliance with applicable laws and regulations, and protecting their own business interests when dealing with other Users.</p>
          <p>Users acknowledge that they use the Services entirely at their own discretion and risk.</p>
        </SubSection>
        <SubSection title="16.8 Consumer Rights">
          <p>Nothing in these Terms excludes, limits, or restricts any rights that cannot lawfully be excluded or limited under applicable law, including mandatory consumer protection rights available under the laws of Romania or the European Union.</p>
        </SubSection>
      </Section>

      <Section title="17. Limitation of Liability">
        <SubSection title="17.1 Scope of Liability">
          <p>To the fullest extent permitted by applicable law, Pulse, its owners, directors, officers, employees, affiliates, contractors, licensors, and service providers shall not be liable for any indirect, incidental, consequential, special, exemplary, or punitive damages arising out of or relating to your access to or use of the Services. This includes, without limitation, damages relating to:</p>
          <LegalList items={[
            'Loss of profits or revenue.', 'Loss of business opportunities.', 'Loss of goodwill or reputation.', 'Loss of data or Content.',
            'Business interruption.', 'Loss resulting from unauthorised access to your Account.',
            'Any other indirect or consequential loss, even if Pulse has been advised of the possibility of such damages.',
          ]} />
        </SubSection>
        <SubSection title="17.2 User Interactions">
          <p>Pulse shall not be liable for any loss, damage, claim, or dispute arising from communications between Users, business relationships formed through the Services, commercial agreements or transactions, employment or recruitment opportunities, payments or financial arrangements made between Users, or the conduct, acts, or omissions of any User or third party.</p>
          <p>Users acknowledge that they interact with other Users entirely at their own risk.</p>
        </SubSection>
        <SubSection title="17.3 Third-Party Services">
          <p>Pulse shall not be responsible for any loss or damage resulting from the acts, omissions, failures, outages, security incidents, or performance of third-party providers, including but not limited to payment processors, identity verification providers, communication infrastructure providers, hosting providers, or other integrated services.</p>
        </SubSection>
        <SubSection title="17.4 Maximum Liability">
          <p>To the fullest extent permitted by applicable law, Pulse's total aggregate liability arising out of or relating to these Terms or the Services shall not exceed:</p>
          <LegalList items={[
            'The total amount paid by you to Pulse for your Pro subscription during the twelve (12) months immediately preceding the event giving rise to the claim; or',
            '€100, if you have not paid Pulse any subscription fees during that period,',
          ]} />
          <p>whichever amount is greater.</p>
        </SubSection>
        <SubSection title="17.5 Exceptions">
          <p>Nothing in these Terms excludes or limits liability that cannot lawfully be excluded or limited under applicable law, including liability for death or personal injury caused by negligence, fraud or fraudulent misrepresentation, wilful misconduct, or any liability that cannot be excluded under the laws of Romania or the European Union.</p>
        </SubSection>
        <SubSection title="17.6 Duty to Mitigate">
          <p>Users agree to take reasonable steps to minimise any loss or damage arising from their use of the Services.</p>
        </SubSection>
        <SubSection title="17.7 Basis of the Agreement">
          <p>You acknowledge that the limitations of liability contained in these Terms are an essential basis of the agreement between you and Pulse.</p>
          <p>The Services and subscription pricing have been established in reliance upon these limitations, and Pulse would not be able to provide the Services on the same commercial basis without them.</p>
        </SubSection>
      </Section>

      <Section title="18. Indemnification">
        <SubSection title="18.1 User Indemnity">
          <p>To the fullest extent permitted by applicable law, you agree to defend, indemnify, and hold harmless Pulse, its owners, directors, officers, employees, affiliates, contractors, licensors, and service providers from and against any claims, demands, actions, proceedings, liabilities, damages, losses, judgments, costs, and expenses (including reasonable legal fees) arising out of or relating to:</p>
          <LegalList items={[
            'Your use of the Services.', 'Your violation of these Terms.', 'Your violation of any applicable law or regulation.',
            'Any Content that you create, upload, transmit, or share through the Services.',
            'Your infringement of any intellectual property, privacy, or other legal rights of any third party.',
            'Any dispute between you and another User or third party arising from your use of the Services.',
            'Any fraudulent, negligent, or unlawful act or omission by you.',
          ]} />
        </SubSection>
        <SubSection title="18.2 Cooperation">
          <p>Where Pulse seeks indemnification under this Section, you agree to cooperate fully and in good faith with Pulse in the defence, investigation, or settlement of any applicable claim.</p>
          <p>Pulse reserves the right, at its own expense, to assume the exclusive defence and control of any matter otherwise subject to indemnification by you. In such circumstances, you agree to cooperate fully with Pulse in the defence of the matter.</p>
        </SubSection>
        <SubSection title="18.3 Survival">
          <p>Your obligations under this Section shall survive the suspension or termination of your Account and your use of the Services to the extent permitted by applicable law.</p>
        </SubSection>
      </Section>

      <Section title="19. Changes to the Services and Terms">
        <SubSection title="19.1 Changes to the Services">
          <p>Pulse is continually developing and improving its platform. Accordingly, we reserve the right to modify, update, enhance, suspend, or discontinue any aspect of the Services at any time, including but not limited to features and functionality, subscription plans and pricing, user interface and design, technical requirements, security measures, third-party integrations, and supported devices and platforms.</p>
          <p>Where reasonably practicable, Pulse will provide advance notice of material changes that may significantly affect your use of the Services.</p>
        </SubSection>
        <SubSection title="19.2 Changes to Subscription Fees">
          <p>Pulse may revise the pricing of its Pro subscription from time to time.</p>
          <p>Any changes to subscription fees will apply only to future billing periods. Existing subscribers will be notified in advance before any price changes take effect, where required by applicable law.</p>
          <p>Continued use of a Pro subscription after the effective date of a new subscription fee constitutes acceptance of the revised pricing.</p>
        </SubSection>
        <SubSection title="19.3 Changes to These Terms">
          <p>Pulse reserves the right to amend, update, or replace these Terms at any time to reflect changes to the Services, changes in applicable laws or regulations, security requirements, operational or business needs, or improvements to clarity or readability.</p>
          <p>The latest version of the Terms will always be made available through the Pulse website or application.</p>
        </SubSection>
        <SubSection title="19.4 Notification of Changes">
          <p>Where required by applicable law or where Pulse considers it appropriate, we will notify Users of material changes to these Terms by email, an in-app notification, a notice on our website, or another reasonable method of communication.</p>
          <p>Users are responsible for reviewing any updated Terms.</p>
        </SubSection>
        <SubSection title="19.5 Continued Use">
          <p>By continuing to access or use the Services after revised Terms become effective, you agree to be bound by the updated Terms.</p>
          <p>If you do not agree to the revised Terms, you must stop using the Services and, where applicable, cancel your subscription and close your Account.</p>
        </SubSection>
        <SubSection title="19.6 Previous Versions">
          <p>Previous versions of these Terms may no longer apply once updated Terms become effective, except where expressly stated or required by applicable law.</p>
        </SubSection>
      </Section>

      <Section title="20. Governing Law & Dispute Resolution">
        <SubSection title="20.1 Governing Law">
          <p>These Terms, and any dispute or claim arising out of or in connection with them, the Services, or your use of the Services, shall be governed by and construed in accordance with the laws of Romania, without regard to its conflict of law principles.</p>
          <p>Nothing in these Terms shall affect any mandatory rights afforded to consumers under applicable European Union or Romanian law.</p>
        </SubSection>
        <SubSection title="20.2 Good Faith Resolution">
          <p>Before commencing formal legal proceedings, both you and Pulse agree to make reasonable efforts to resolve any dispute through good faith discussions.</p>
          <p>Users are encouraged to contact Pulse using the contact information provided in these Terms so that we may attempt to resolve the matter promptly and amicably.</p>
        </SubSection>
        <SubSection title="20.3 Jurisdiction">
          <p>Subject to any mandatory consumer protection laws, the courts of Bucharest, Romania, shall have exclusive jurisdiction to hear and determine any dispute, claim, or proceeding arising out of or relating to these Terms or the Services.</p>
        </SubSection>
        <SubSection title="20.4 Compliance with Applicable Laws">
          <p>Users are responsible for ensuring that their use of the Services complies with all applicable laws and regulations in their own jurisdiction.</p>
          <p>Pulse makes no representation that the Services are lawful or available in every country or jurisdiction. Access to the Services from locations where such use would be unlawful is prohibited.</p>
        </SubSection>
        <SubSection title="20.5 Severability">
          <p>If any provision of these Terms is held by a court or other competent authority to be invalid, illegal, or unenforceable, that provision shall be enforced to the maximum extent permitted by law, and the remaining provisions shall remain in full force and effect.</p>
        </SubSection>
        <SubSection title="20.6 Waiver">
          <p>Any failure or delay by Pulse in exercising any right or remedy under these Terms shall not constitute a waiver of that right or remedy.</p>
          <p>No waiver shall be effective unless made in writing and signed by an authorised representative of Pulse.</p>
        </SubSection>
        <SubSection title="20.7 Entire Agreement">
          <p>These Terms, together with the Privacy Policy, Cookie Policy, and any other policies expressly incorporated by reference, constitute the entire agreement between you and Pulse regarding your use of the Services and supersede all prior agreements, understandings, representations, or communications relating to the Services.</p>
        </SubSection>
        <SubSection title="20.8 Assignment">
          <p>Pulse may assign, transfer, or delegate its rights and obligations under these Terms as part of a merger, acquisition, corporate restructuring, sale of assets, or by operation of law.</p>
          <p>You may not assign, transfer, or delegate any of your rights or obligations under these Terms without the prior written consent of Pulse.</p>
        </SubSection>
        <SubSection title="20.9 Contact Information">
          <p>If you have any questions regarding these Terms or the Services, you may contact Pulse at:</p>
          <p className="font-medium text-gray-800">
            Pulse<br />
            Bucharest, Romania<br />
            Support: pulse@affiliateroulette.com<br />
            Legal: legal@affiliateroulette.com
          </p>
          <p>We will make reasonable efforts to respond to enquiries within a reasonable timeframe.</p>
        </SubSection>
      </Section>

    </LegalPage>
  )
}
