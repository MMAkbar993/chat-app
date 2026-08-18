import LegalPage, { Section, SubSection, LegalList } from '../components/legal/LegalPage'

export default function KycPolicyPage() {
  return (
    <LegalPage title="Pulse KYC & Identity Verification Policy" effectiveDate="7th August 2026" lastUpdated="7th August 2026">

      <Section title="1. Introduction">
        <p>Pulse is committed to maintaining a secure, trusted, and professional communication platform for the global iGaming industry. A key part of this commitment is ensuring that every individual using the Services is a verified person.</p>
        <p>To protect our Users and the integrity of the platform, identity verification is mandatory for every Pulse Account. No User is permitted to access the Services until they have successfully completed the verification process in accordance with this Policy.</p>
        <p>This KYC &amp; Identity Verification Policy explains why identity verification is required, how the verification process works, the information and documentation that may be requested, how biometric verification is used, how manual reviews are conducted, how verification information is processed and protected, and the rights and responsibilities of Users throughout the verification process.</p>
        <p>Pulse conducts identity verification using Didit, our trusted third-party identity verification provider. Where automatic verification cannot be completed, Pulse may conduct a manual review to determine whether access to the Services should be granted.</p>
        <p>This Policy should be read together with our Terms &amp; Conditions, Privacy Policy, and Cookie Policy.</p>
        <p>In the event of any inconsistency between this Policy and the Terms &amp; Conditions regarding identity verification procedures, this Policy shall apply to the verification process, while the Terms &amp; Conditions shall continue to govern your use of the Services.</p>
        <p>This introduction clearly establishes that <strong>"No KYC = No Access"</strong> is a fundamental principle of Pulse and sets the stage for the detailed operational rules that follow.</p>
      </Section>

      <Section title="2. Why Identity Verification Is Required">
        <p>Pulse has been designed as a secure communication platform for professionals within the global iGaming industry. Unlike many communication platforms, Pulse requires every User to verify their identity before being granted access to the Services.</p>
        <p>Mandatory identity verification helps us create a trusted environment where Users can communicate with greater confidence while reducing fraud, impersonation, spam, and other forms of abuse.</p>
        <p>Identity verification is an essential security measure and a condition of access to the Services.</p>
        <SubSection title="2.1 Protecting Our Community">
          <p>Pulse uses identity verification to help:</p>
          <LegalList items={[
            'Confirm that each User is a real individual.', 'Reduce fake, duplicate, or impersonated accounts.', 'Prevent fraud and other malicious activity.',
            'Protect Users from identity theft and impersonation.', 'Promote trust within the Pulse community.', 'Maintain the integrity and security of the platform.',
          ]} />
        </SubSection>
        <SubSection title="2.2 Platform Security">
          <p>Identity verification forms part of Pulse's broader security framework, which also includes account protection, fraud prevention, monitoring for suspicious activity, and other technical and organisational safeguards.</p>
          <p>Verification allows Pulse to better protect both individual Users and the overall security of the Services.</p>
        </SubSection>
        <SubSection title="2.3 Compliance">
          <p>Identity verification may also assist Pulse in complying with applicable legal, regulatory, contractual, or security obligations.</p>
          <p>Where required, Pulse may request additional information or documentation to satisfy legal or regulatory requirements or to protect the integrity of the Services.</p>
        </SubSection>
        <SubSection title="2.4 Mandatory Requirement">
          <p>Completion of the KYC process is mandatory for all Users.</p>
          <p>Creating a Pulse Account does not automatically grant access to the Services. Access is only provided once identity verification has been successfully completed and approved in accordance with this Policy.</p>
          <p>Users who choose not to complete the verification process, or who are unable to successfully verify their identity, will not be permitted to access or continue using the Services.</p>
        </SubSection>
        <SubSection title="2.5 Ongoing Commitment">
          <p>Identity verification is not a one-time security measure. Pulse may require additional verification or re-verification where reasonably necessary to maintain platform security, investigate suspicious activity, comply with legal obligations, or protect the rights and safety of our Users.</p>
        </SubSection>
      </Section>

      <Section title="3. Who Must Complete KYC">
        <p>Identity verification is mandatory for every individual seeking to access the Pulse Services. No person may use the Services until their identity has been successfully verified and approved in accordance with this Policy.</p>
        <SubSection title="3.1 All Users">
          <p>Every individual creating a Pulse Account, whether using the Free or Pro subscription plan, must complete the KYC process before access to the Services is granted.</p>
          <p>The verification requirement applies equally to all Users, regardless of their location, profession, or subscription type.</p>
        </SubSection>
        <SubSection title="3.2 One Verified Identity Per Account">
          <p>Each Pulse Account must be associated with one verified individual. Users must verify their own identity and may not:</p>
          <LegalList items={[
            "Create an Account using another person's identity.",
            "Submit another individual's identity documents.",
            'Allow another person to complete the verification process on their behalf.',
            'Share, transfer, sell, or otherwise permit another individual to use their verified Account.',
          ]} />
          <p>Pulse reserves the right to suspend or terminate any Account found to be in breach of these requirements.</p>
        </SubSection>
        <SubSection title="3.3 Accurate Information">
          <p>Users must provide accurate, complete, and current information throughout the verification process. All identity documents and information submitted must:</p>
          <LegalList items={[
            'Belong to the User completing the verification.', 'Be authentic and unaltered.', 'Be valid and, where applicable, unexpired.',
            'Match the information provided during Account registration.',
          ]} />
          <p>Providing false, misleading, forged, stolen, or manipulated information may result in immediate rejection of the verification request and the suspension or permanent termination of the Account.</p>
        </SubSection>
        <SubSection title="3.4 Users Unable to Complete Verification">
          <p>Users who are unable or unwilling to complete the required identity verification process will not be granted access to the Services.</p>
          <p>Where automatic verification cannot be completed, Pulse may offer a manual review process as described in this Policy. However, submission for manual review does not guarantee approval.</p>
        </SubSection>
        <SubSection title="3.5 Existing Users">
          <p>Pulse reserves the right to require any existing User to complete a new or updated identity verification process where reasonably necessary, including where:</p>
          <LegalList items={[
            'Account information has changed.', 'Suspicious or unusual activity has been detected.', 'Additional security verification is required.',
            'Legal or regulatory obligations require re-verification.', 'Pulse considers re-verification necessary to maintain the security and integrity of the platform.',
          ]} />
          <p>Failure to complete any requested re-verification within the required timeframe may result in temporary suspension or permanent termination of access to the Services.</p>
        </SubSection>
      </Section>

      <Section title="4. Verification Process">
        <p>Pulse uses a combination of automated identity verification and, where necessary, manual review to verify the identity of every User before access to the Services is granted. Our verification process is designed to be secure, efficient, and compliant with applicable data protection laws.</p>
        <SubSection title="4.1 Account Registration">
          <p>The verification process begins once you create a Pulse Account and provide the required registration information.</p>
          <p>Registration alone does not grant access to the Services. Your Account will remain inactive until the verification process has been successfully completed and approved.</p>
        </SubSection>
        <SubSection title="4.2 Identity Verification">
          <p>Following registration, you will be directed to complete the identity verification process through our trusted identity verification provider, Didit. During this process, you may be required to:</p>
          <LegalList items={[
            'Submit a valid government-issued identity document.', 'Capture a live facial image (selfie).', 'Complete a liveness detection check.',
            'Confirm certain personal information.', 'Provide additional information where requested.',
          ]} />
          <p>The verification process may vary depending on your location, the type of identification document submitted, security requirements, or applicable legal obligations.</p>
        </SubSection>
        <SubSection title="4.3 Automated Verification">
          <p>Didit will perform automated verification checks using secure technologies designed to validate the authenticity of identity documents, compare facial images with submitted identification documents, confirm liveness, detect potential fraud or document manipulation, and assess whether the submitted information is consistent.</p>
          <p>Most verification requests are expected to be completed automatically within a short period.</p>
        </SubSection>
        <SubSection title="4.4 Manual Review">
          <p>Where automated verification cannot be completed successfully or additional checks are required, the verification request may be referred to Pulse for manual review. During this process, Pulse may:</p>
          <LegalList items={[
            'Review the submitted documentation.', 'Request additional identification or supporting documents.',
            'Contact the User for clarification.', 'Conduct further verification checks where reasonably necessary.',
          ]} />
          <p>Manual reviews are performed by authorised personnel and are intended to ensure fair and accurate verification decisions.</p>
        </SubSection>
        <SubSection title="4.5 Verification Completion">
          <p>The verification process concludes when one of the following outcomes is reached:</p>
          <LegalList items={[
            'Approved – Your identity has been successfully verified and access to the Services is granted.',
            'Manual Review Required – Additional review or information is required before a final decision can be made.',
            'Rejected – Verification requirements have not been satisfied and access to the Services is denied.',
          ]} />
          <p>Further details regarding these outcomes are provided in Section 8 – Verification Outcomes.</p>
        </SubSection>
        <SubSection title="4.6 User Responsibilities">
          <p>During the verification process, you agree to provide accurate and truthful information, submit only authentic documents that belong to you, cooperate with any reasonable requests for additional information, and complete the verification process in good faith.</p>
          <p>Any attempt to manipulate, interfere with, or circumvent the verification process may result in immediate rejection of the verification request and may lead to the suspension or permanent termination of your Pulse Account.</p>
        </SubSection>
      </Section>

      <Section title="5. Identity Documents We Accept">
        <p>To verify your identity, Pulse requires the submission of a valid government-issued identity document through our identity verification provider, Didit.</p>
        <p>The documents accepted may vary depending on your country of residence and applicable legal or security requirements.</p>
        <SubSection title="5.1 Accepted Identity Documents">
          <p>Subject to availability in your jurisdiction, Pulse may accept the following documents:</p>
          <LegalList items={[
            'Passport.', 'National Identity Card.', 'Driving Licence.', 'Residence Permit.',
            'Other government-issued photographic identification approved by Pulse or Didit.',
          ]} />
          <p>Pulse reserves the right to update or modify the list of accepted documents at any time.</p>
        </SubSection>
        <SubSection title="5.2 Document Requirements">
          <p>All identity documents submitted for verification must:</p>
          <LegalList items={[
            'Be valid and, where applicable, unexpired.', 'Be issued by a recognised government authority.',
            'Belong to the individual completing the verification process.', 'Be complete and clearly legible.',
            'Display all required information without obstruction.', 'Not be altered, edited, damaged, or manipulated.',
          ]} />
          <p>Documents that do not meet these requirements may be rejected.</p>
        </SubSection>
        <SubSection title="5.3 Image Quality">
          <p>To ensure successful verification, Users should ensure that submitted images are clear and in focus, captured in good lighting, show the entire document, are free from glare, reflections, or obstructions, and have not been digitally altered or enhanced.</p>
          <p>Poor image quality may delay verification or require resubmission.</p>
        </SubSection>
        <SubSection title="5.4 Additional Documentation">
          <p>Where reasonably necessary, Pulse may request additional documentation to complete the verification process. Additional documentation may be requested where identity cannot be confidently verified, information appears inconsistent, further security checks are required, manual review is necessary, or applicable legal or regulatory obligations require additional verification.</p>
        </SubSection>
        <SubSection title="5.5 Rejected Documents">
          <p>Pulse may reject documents that are expired, illegible or incomplete, damaged or altered, suspected of being fraudulent, submitted by someone other than the Account holder, or otherwise unsuitable for identity verification.</p>
          <p>Submission of fraudulent or manipulated documents may result in immediate rejection of the verification request and the suspension or permanent termination of the associated Pulse Account.</p>
        </SubSection>
      </Section>

      <Section title="6. Biometric Verification & Liveness Detection">
        <p>To help protect the security and integrity of the Pulse platform, identity verification includes biometric verification and liveness detection performed by our trusted identity verification provider, Didit.</p>
        <p>These technologies help confirm that the individual completing the verification process is the rightful owner of the submitted identity document and is physically present during verification.</p>
        <SubSection title="6.1 Facial Verification">
          <p>As part of the verification process, you may be asked to capture a live facial image (selfie). This image is compared with the photograph contained on your submitted identity document to verify that both belong to the same individual.</p>
        </SubSection>
        <SubSection title="6.2 Liveness Detection">
          <p>Pulse uses liveness detection technology to help determine that the facial image submitted originates from a real, live person and not from a photograph, a video recording, a screen or digital display, artificially generated or manipulated media, or any other attempt to bypass the verification process.</p>
          <p>Liveness detection helps reduce identity fraud and strengthen the security of the Services.</p>
        </SubSection>
        <SubSection title="6.3 Biometric Processing">
          <p>Where permitted by applicable law, biometric information generated during the verification process may be processed solely for the purpose of verifying your identity, detecting fraud or impersonation, confirming document ownership, and maintaining the security and integrity of the Services.</p>
          <p>Pulse does not use biometric information for advertising, marketing, profiling, or any unrelated commercial purpose.</p>
        </SubSection>
        <SubSection title="6.4 Data Protection">
          <p>Biometric verification is carried out using secure technologies provided by Didit.</p>
          <p>Pulse and Didit process biometric and verification-related information in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR), and implement appropriate technical and organisational measures to protect such information from unauthorised access, disclosure, alteration, or misuse.</p>
        </SubSection>
        <SubSection title="6.5 Verification Failure">
          <p>If biometric verification or liveness detection cannot be successfully completed, your verification request may require you to repeat the verification process, be referred for manual review by Pulse, or be rejected where your identity cannot be satisfactorily verified.</p>
          <p>Failure of an automated biometric check does not necessarily result in permanent rejection. Where appropriate, Pulse may conduct additional verification before making a final decision.</p>
        </SubSection>
        <SubSection title="6.6 User Cooperation">
          <p>By initiating the verification process, you acknowledge and agree to participate in the required biometric verification and liveness detection procedures as part of Pulse's mandatory KYC process.</p>
          <p>If you choose not to complete these procedures, Pulse will be unable to verify your identity and access to the Services cannot be granted.</p>
        </SubSection>
      </Section>

      <Section title="7. Manual Review Process">
        <p>While most identity verification requests are completed automatically through Didit, certain verification requests may require additional review to ensure the security and integrity of the Pulse platform.</p>
        <p>Where automated verification cannot confidently verify a User's identity, the verification request may be referred to Pulse for manual review.</p>
        <SubSection title="7.1 When Manual Review May Be Required">
          <p>A verification request may be referred for manual review where, including but not limited to:</p>
          <LegalList items={[
            'The submitted identity document cannot be automatically verified.', 'Facial verification or liveness detection is inconclusive.',
            'The submitted information is inconsistent.', 'The document image quality is insufficient.', 'Additional security checks are considered necessary.',
            'Fraud prevention systems identify unusual activity.', 'Further verification is required to protect the Services or comply with applicable legal obligations.',
          ]} />
          <p>Referral for manual review does not imply wrongdoing by the User.</p>
        </SubSection>
        <SubSection title="7.2 Additional Information">
          <p>During the manual review process, Pulse may request additional information or documentation, including a new photograph of the identity document, a higher-quality image or scan, an alternative government-issued identity document, additional identification or supporting documentation, or clarification regarding submitted information.</p>
          <p>Users are expected to respond to reasonable requests within the timeframe specified by Pulse.</p>
        </SubSection>
        <SubSection title="7.3 Communication During Review">
          <p>Where additional information is required, Pulse may contact you using the email address associated with your Account or through other appropriate communication channels.</p>
          <p>Failure to respond within a reasonable period may result in the verification request being rejected or closed.</p>
        </SubSection>
        <SubSection title="7.4 Review Decisions">
          <p>Following manual review, Pulse may determine that the verification request is Approved, where identity has been satisfactorily verified; Rejected, where identity cannot be verified or the requirements of this Policy have not been met; or Cancelled, where the verification process is abandoned or required information is not provided within the requested timeframe.</p>
          <p>Verification decisions are made based on the information available at the time of review and in accordance with Pulse's security procedures.</p>
        </SubSection>
        <SubSection title="7.5 Finality of Decisions">
          <p>Pulse reserves the right to make the final decision regarding whether a User's identity has been successfully verified.</p>
          <p>Verification decisions are made in good faith to protect the safety, security, and integrity of the Services and may take into account information obtained during both automated verification and manual review.</p>
          <p>Where appropriate and permitted by applicable law, Users may contact Pulse to request further clarification regarding the outcome of their verification.</p>
        </SubSection>
      </Section>

      <Section title="8. Verification Outcomes">
        <p>Once the identity verification process has been completed, Pulse will determine the outcome of your verification based on the information available through automated verification, manual review (where applicable), and our internal security procedures.</p>
        <p>Verification outcomes are intended to protect both individual Users and the integrity of the Pulse platform.</p>
        <SubSection title="8.1 Approved">
          <p>Your verification will be approved where Pulse is satisfied that your identity has been successfully verified. Once approved, your Pulse Account will be activated, you will be granted access to the Services in accordance with your subscription plan, and you may begin using Pulse subject to our Terms &amp; Conditions and other applicable policies.</p>
          <p>Approval confirms only that you have successfully completed Pulse's identity verification process. It does <strong>not</strong> constitute an endorsement, certification, recommendation, or guarantee of your identity beyond the verification process, reputation, business practices, or future conduct.</p>
        </SubSection>
        <SubSection title="8.2 Manual Review Required">
          <p>Where additional verification is necessary, your application may remain under manual review. During this stage, Pulse may request additional documentation, request a new verification attempt, contact you for clarification, and conduct additional security checks.</p>
          <p>Your Account will remain inaccessible until the manual review process has been completed and a final decision has been made.</p>
        </SubSection>
        <SubSection title="8.3 Rejected">
          <p>Your verification request may be rejected where, including but not limited to, your identity cannot be satisfactorily verified, required information or documentation is not provided, submitted documents are invalid, expired, altered, or fraudulent, facial verification or liveness detection cannot be completed, false or misleading information has been provided, multiple or conflicting identities are detected, or Pulse reasonably believes that granting access would present a security, legal, or operational risk.</p>
          <p>Where appropriate, Pulse may invite you to submit a new verification request or provide additional information before making a final determination.</p>
        </SubSection>
        <SubSection title="8.4 Account Restrictions">
          <p>Users whose verification is pending, under manual review, or rejected will not be granted access to the Services until the verification requirements have been successfully satisfied.</p>
          <p>Pulse may also suspend or revoke access to previously verified Accounts where new information affects the validity of a previous verification, fraud or misuse is suspected, re-verification is required and not completed, or continued access presents a security or legal risk.</p>
        </SubSection>
        <SubSection title="8.5 No Guarantee of Approval">
          <p>Submitting identification documents or completing the verification process does not guarantee approval.</p>
          <p>Pulse reserves the right, where permitted by applicable law, to refuse, suspend, or revoke verification where identity cannot be satisfactorily confirmed or where access would compromise the security, integrity, or lawful operation of the Services.</p>
        </SubSection>
      </Section>

      <Section title="9. Reverification">
        <p>To maintain the security, integrity, and trust of the Pulse platform, Pulse reserves the right to require Users to complete a new or updated identity verification process after their initial verification has been approved.</p>
        <p>Reverification is an important security measure and may be required where circumstances change or additional verification is reasonably necessary.</p>
        <SubSection title="9.1 When Reverification May Be Required">
          <p>Pulse may request reverification where, including but not limited to:</p>
          <LegalList items={[
            'Your personal or account information has changed.', 'You replace or update your identity documents.',
            'Unusual, suspicious, or potentially fraudulent activity is detected.', 'Your Account has been compromised or is suspected of being compromised.',
            'Additional security verification is required.', 'We are required to do so by applicable law or regulatory obligations.',
            'Periodic verification is necessary to maintain the security and integrity of the Services.',
          ]} />
        </SubSection>
        <SubSection title="9.2 Reverification Process">
          <p>Where reverification is required, you may be asked to submit a new government-issued identity document, complete a new facial verification, complete a new liveness detection check, confirm or update personal information, and provide additional supporting documentation where reasonably required.</p>
          <p>The reverification process may be completed using Didit and, where necessary, may also be subject to manual review by Pulse.</p>
        </SubSection>
        <SubSection title="9.3 Access During Reverification">
          <p>Depending on the circumstances, Pulse may allow continued access to the Services while reverification is in progress, temporarily restrict certain features, or temporarily suspend access until reverification has been successfully completed.</p>
          <p>The approach taken will depend on the nature of the security concern, applicable legal obligations, and the potential risk to the platform or its Users.</p>
        </SubSection>
        <SubSection title="9.4 Failure to Complete Reverification">
          <p>If you fail to complete a requested reverification within the timeframe specified by Pulse, we may suspend your Account, restrict access to the Services, revoke your verified status, or permanently terminate your Account where appropriate.</p>
        </SubSection>
        <SubSection title="9.5 Notification">
          <p>Where reasonably practicable, Pulse will notify you when reverification is required and provide instructions for completing the process.</p>
          <p>Users are responsible for responding promptly to reverification requests in order to avoid interruption of access to the Services.</p>
        </SubSection>
      </Section>

      <Section title="10. Fraud Prevention & Security">
        <p>Protecting the Pulse community from fraud, impersonation, and other forms of abuse is a core objective of our identity verification programme. Pulse continuously monitors and improves its security measures to maintain a trusted environment for all Users.</p>
        <SubSection title="10.1 Fraud Prevention">
          <p>Pulse uses a combination of automated technologies, identity verification procedures, and manual reviews to help detect and prevent identity fraud, impersonation, fake or duplicate accounts, document fraud, account takeovers, unauthorised access, and other malicious or unlawful activity.</p>
          <p>These measures are intended to protect both individual Users and the overall integrity of the Services.</p>
        </SubSection>
        <SubSection title="10.2 Security Monitoring">
          <p>Pulse may monitor verification activity and account behaviour to identify potential security risks, including unusual login activity, suspected fraudulent behaviour, or attempts to circumvent our security measures.</p>
          <p>Such monitoring is carried out only for legitimate security, fraud prevention, and compliance purposes and in accordance with applicable data protection laws.</p>
        </SubSection>
        <SubSection title="10.3 False or Fraudulent Information">
          <p>Users must not submit false or misleading personal information, altered or forged identity documents, identity documents belonging to another person, artificially generated or manipulated images, or information intended to deceive or circumvent the verification process.</p>
          <p>Any attempt to manipulate or abuse the verification process may result in immediate rejection of the verification request, suspension or permanent termination of the Account, and, where appropriate, referral to the relevant authorities.</p>
        </SubSection>
        <SubSection title="10.4 Security Investigations">
          <p>Where Pulse reasonably believes that fraudulent activity, abuse, or other security risks may exist, we may conduct additional investigations. As part of these investigations, Pulse may request additional verification, request supporting documentation, temporarily restrict access to the Services, suspend or terminate Accounts, and cooperate with competent law enforcement or regulatory authorities where required by law.</p>
        </SubSection>
        <SubSection title="10.5 User Responsibility">
          <p>Users play an important role in maintaining the security of the Pulse platform. You are responsible for providing truthful and accurate information, protecting your Account credentials, promptly reporting suspected fraud or unauthorised access, and cooperating with reasonable security or verification requests made by Pulse.</p>
          <p>Failure to comply with these responsibilities may affect your ability to access or continue using the Services.</p>
        </SubSection>
        <SubSection title="10.6 Continuous Improvement">
          <p>Pulse regularly reviews and enhances its fraud prevention and security measures to respond to emerging threats, technological developments, and evolving legal or regulatory requirements.</p>
          <p>Accordingly, our verification procedures and security controls may be updated from time to time without prior notice where reasonably necessary to protect the Services and our Users.</p>
        </SubSection>
      </Section>

      <Section title="11. Storage & Retention of Verification Data">
        <p>Pulse recognises that identity verification information is particularly sensitive. We are committed to ensuring that verification data is processed, stored, retained, and protected in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR).</p>
        <p>Verification data is retained only for as long as reasonably necessary to fulfil the purposes described in this Policy, comply with legal obligations, protect the security of the Services, and exercise or defend legal rights.</p>
        <SubSection title="11.1 Verification Data We Retain">
          <p>Subject to applicable law and operational requirements, verification data may include verification status, identity verification records, document verification results, facial verification results, liveness detection results, fraud prevention information, manual review records, and communications relating to the verification process.</p>
          <p>Pulse does not retain more information than is reasonably necessary for these purposes.</p>
        </SubSection>
        <SubSection title="11.2 Secure Storage">
          <p>Verification information is stored using appropriate technical and organisational safeguards designed to protect it against unauthorised access, disclosure, alteration, loss, or misuse.</p>
          <p>Access to verification data is restricted to authorised personnel and trusted service providers with a legitimate need to access such information in the performance of their duties.</p>
        </SubSection>
        <SubSection title="11.3 Retention Periods">
          <p>Verification data is retained only for as long as necessary to maintain the security and integrity of the Services, prevent fraud and identity abuse, comply with applicable legal and regulatory obligations, resolve disputes, exercise or defend legal claims, and respond to lawful requests from competent authorities.</p>
          <p>Once verification data is no longer required, it will be securely deleted, anonymised, or otherwise disposed of in accordance with applicable law and Pulse's internal data retention procedures.</p>
        </SubSection>
        <SubSection title="11.4 Third-Party Storage">
          <p>Certain verification information may be processed or stored by Didit, our trusted identity verification provider, in accordance with its contractual obligations, applicable data protection laws, and its own privacy practices.</p>
          <p>Where third-party providers process verification data on Pulse's behalf, we require them to implement appropriate technical and organisational measures to safeguard that information.</p>
        </SubSection>
        <SubSection title="11.5 Data Security">
          <p>Pulse continuously reviews and updates its security measures to help protect verification information throughout its lifecycle.</p>
          <p>Although no electronic system can guarantee absolute security, Pulse employs commercially reasonable safeguards designed to reduce the risk of unauthorised access, disclosure, alteration, or loss of verification data.</p>
        </SubSection>
      </Section>

      <Section title="12. Your Rights">
        <p>Pulse respects your privacy rights and is committed to processing identity verification information in accordance with applicable data protection laws, including the General Data Protection Regulation (GDPR).</p>
        <p>Because identity verification is a mandatory security requirement for access to the Services, certain rights may be subject to legal, regulatory, fraud prevention, or security-related limitations.</p>
        <SubSection title="12.1 Right of Access">
          <p>You may request confirmation of whether Pulse processes your identity verification information and, where applicable, request access to the personal data relating to your verification, subject to applicable legal restrictions and the rights of third parties.</p>
        </SubSection>
        <SubSection title="12.2 Right to Rectification">
          <p>If your personal information is inaccurate or incomplete, you may request that it be corrected or updated. Where a correction affects your identity verification, Pulse may require you to complete a new verification or reverification process.</p>
        </SubSection>
        <SubSection title="12.3 Right to Erasure">
          <p>You may request the deletion of your personal data where permitted by applicable law. However, Pulse may retain certain verification information where necessary to comply with legal or regulatory obligations, prevent fraud or abuse, protect the security of the Services, resolve disputes, and exercise or defend legal claims.</p>
        </SubSection>
        <SubSection title="12.4 Right to Restrict Processing">
          <p>You may request that Pulse restrict the processing of your verification information in circumstances permitted under applicable data protection laws. Restrictions may not apply where processing is necessary to comply with legal obligations, protect the security of the Services, or prevent fraud.</p>
        </SubSection>
        <SubSection title="12.5 Right to Object">
          <p>Where Pulse processes personal data based on legitimate interests, you may object to that processing where permitted by applicable law. Pulse will carefully consider your request and determine whether we have compelling legitimate grounds to continue processing the information.</p>
        </SubSection>
        <SubSection title="12.6 Right to Lodge a Complaint">
          <p>If you believe that Pulse has processed your verification information in violation of applicable data protection laws, you have the right to lodge a complaint with the competent data protection authority.</p>
          <p>If you are located in Romania, you may contact the National Supervisory Authority for Personal Data Processing (ANSPDCP) or the relevant supervisory authority in your country of residence.</p>
        </SubSection>
        <SubSection title="12.7 Exercising Your Rights">
          <p>To exercise any of your rights relating to identity verification data, please contact Pulse using the contact details provided at the end of this Policy.</p>
          <p>To protect the security of your personal data, Pulse may request additional information to verify your identity before responding to your request.</p>
          <p>We will respond to valid requests within the timeframes required by applicable law.</p>
        </SubSection>
      </Section>

      <Section title="13. Changes to This KYC & Identity Verification Policy">
        <p>Pulse may update this KYC &amp; Identity Verification Policy from time to time to reflect changes in our Services, identity verification procedures, security practices, legal or regulatory requirements, or the third-party providers we use to deliver the verification process.</p>
        <p>We encourage Users to review this Policy periodically to remain informed about how identity verification is conducted and how verification information is processed.</p>
        <SubSection title="13.1 Policy Updates">
          <p>Pulse reserves the right to amend, modify, or replace this Policy at any time.</p>
          <p>The most current version will always be made available through the Pulse website and, where applicable, within the Pulse application.</p>
          <p>The "Last Updated" date at the beginning of this Policy indicates when the latest version became effective.</p>
        </SubSection>
        <SubSection title="13.2 Material Changes">
          <p>Where required by applicable law or where we consider it appropriate, Pulse will notify Users of material changes to this Policy through one or more of the following methods: email, in-app notifications, a notice displayed on the Pulse website, or other reasonable methods of communication.</p>
        </SubSection>
        <SubSection title="13.3 Continued Use of the Services">
          <p>Your continued use of the Services following the effective date of an updated KYC &amp; Identity Verification Policy constitutes your acknowledgement of the revised Policy.</p>
          <p>Where applicable law requires your consent for changes affecting the processing of your personal data, Pulse will obtain such consent before those changes take effect.</p>
        </SubSection>
        <SubSection title="13.4 Previous Versions">
          <p>Previous versions of this Policy may be retained for legal, regulatory, audit, or record-keeping purposes.</p>
          <p>Users may request information regarding significant historical changes to this Policy by contacting Pulse using the details provided in the Contact Information section.</p>
        </SubSection>
      </Section>

      <Section title="14. Contact Information">
        <p>If you have any questions regarding this KYC &amp; Identity Verification Policy or the identity verification process, you may contact Pulse using the details below.</p>
        <p>We are committed to responding to verification-related enquiries in a timely manner and in accordance with applicable legal and data protection requirements.</p>
        <SubSection title="Verification Support">
          <p>For questions relating to identity verification, manual review requests, verification status, reverification, verification documentation, or general KYC enquiries, please contact:</p>
          <p className="font-medium text-gray-800">
            Michael Paul Holdings SRL<br />
            Bucharest, Romania<br />
            Verification Support: pulse@affiliateroulette.com<br />
            Privacy Enquiries: privacy@affiliateroulette.com<br />
            General Support: hello@affiliateroulette.com<br />
            Website: https://pulse.affiliateroulette.com
          </p>
        </SubSection>
        <SubSection title="Verification Requests">
          <p>Where additional documentation or information is requested during the verification process, Users should submit the requested information through the method specified by Pulse.</p>
          <p>For your security, Pulse may require additional identity verification before discussing verification-related matters or making changes to your verification status.</p>
        </SubSection>
        <SubSection title="Privacy Questions">
          <p>Questions regarding the processing of personal data collected during the identity verification process should be directed to our Privacy Team using the contact details above.</p>
          <p>Further information regarding how Pulse processes personal data is available in our Privacy Policy.</p>
        </SubSection>
      </Section>

    </LegalPage>
  )
}
