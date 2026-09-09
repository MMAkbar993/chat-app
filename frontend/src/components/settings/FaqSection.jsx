import { useState, useMemo } from 'react'

// Content is owned by the product team — treat it as copy, not code, and keep the wording
// they supplied. Two exceptions are marked inline below where the supplied answer described
// behaviour the platform does not currently have.
//
// Each answer is an array of blocks: a string is a paragraph, a nested array is a bullet list.
const FAQ = [
  {
    category: 'About Pulse',
    items: [
      {
        q: 'What is Pulse?',
        a: [
          'Pulse is a verified messaging platform built specifically for the iGaming industry.',
          'It gives affiliates, affiliate managers, operators, affiliate networks and other industry professionals a place to connect and communicate while providing greater transparency around who they are speaking with.',
          'Pulse combines identity verification with website and social profile verification to help users distinguish verified industry professionals from anonymous or potentially impersonated accounts.',
          'Our goal is simple: Make professional communication in iGaming more transparent, secure and trustworthy.',
        ],
      },
      {
        q: 'Why was Pulse created?',
        a: [
          'Impersonation, fake profiles and fraudulent accounts are a persistent problem in iGaming.',
          "On traditional messaging platforms, someone can create an account, use another person's name and profile picture, and claim to represent a casino, affiliate network or company.",
          'Pulse was created to add additional layers of verification.',
          'Users verify their identity before accessing Pulse, while websites and supported social profiles can be separately verified and displayed on their profile.',
          'This gives you more information about the person behind an account before you decide to do business with them.',
        ],
      },
      {
        q: 'Who can use Pulse?',
        a: [
          'Pulse is designed for professionals working within the iGaming ecosystem, including:',
          [
            'Affiliate managers',
            'Affiliates and publishers',
            'Casino and sportsbook representatives',
            'Affiliate networks',
            'Agencies',
            'Suppliers',
            'Game providers',
            'Payment providers',
            'B2B service providers',
            'Other verified iGaming professionals',
          ],
        ],
      },
      {
        q: 'Does Pulse guarantee that every user is trustworthy?',
        a: [
          'No. Verification provides additional trust signals, but it cannot guarantee that every individual or company will behave honestly or professionally.',
          'You should always perform appropriate due diligence before entering into commercial agreements, transferring money or sharing confidential business information.',
          'Pulse verification is an additional layer of trust, not a replacement for good judgement.',
        ],
      },
    ],
  },
  {
    category: 'Getting Started & Identity Verification',
    items: [
      {
        q: 'Do I need to verify my identity to use Pulse?',
        a: [
          'Yes. No KYC, no access.',
          'Identity verification is a fundamental part of Pulse and helps us establish that there is a real person behind every account.',
          'Allowing anonymous, unverified accounts would undermine the purpose of creating a verified professional communication platform.',
        ],
      },
      {
        q: 'How does Pulse verify my identity?',
        a: [
          'Pulse uses Didit, a specialist third-party identity verification provider, to perform our identity and liveness verification process.',
          'Depending on the verification process, you may be asked to provide a supported identity document and complete a selfie or liveness check.',
          'These checks help confirm that the identity document is legitimate and that the person completing the verification is the person associated with that document.',
        ],
      },
      {
        q: 'What is a liveness check?',
        a: [
          'A liveness check helps determine whether the person completing verification is physically present.',
          'It is designed to detect attempts to complete verification using photographs, recordings, screens or other forms of impersonation.',
          'This adds another layer of protection against stolen identities and fake accounts.',
        ],
      },
      {
        q: 'Why does Pulse need my ID?',
        a: [
          "Pulse doesn't request identity verification because we want to build a database of people's identity documents.",
          'We use identity verification to establish that a real person is behind a Pulse account.',
          'This makes it considerably harder for someone to create anonymous accounts, impersonate another industry professional or repeatedly create fake identities.',
        ],
      },
      {
        q: 'How long is my KYC information stored?',
        a: [
          'Pulse has configured a maximum one-month retention period for verification data processed through our identity verification provider.',
          'This provides a limited period in which verification or account issues can be investigated if necessary.',
          'After the configured retention period, the applicable verification data held by our verification provider is automatically deleted.',
          'Pulse may retain limited verification metadata necessary to record and manage the verification status of your account.',
        ],
      },
      {
        q: 'Is my verification information protected?',
        a: [
          'Pulse uses Didit rather than developing an internal identity-document verification system.',
          'Verification data is encrypted while being transmitted and while stored, and Didit maintains security and compliance controls designed for identity verification.',
          'Pulse has also deliberately configured a limited one-month retention period for verification data rather than retaining identity documentation indefinitely.',
          'For further information about how personal information is processed, please see our Privacy Policy and KYC & Identity Verification Policy.',
        ],
      },
      {
        q: 'Can other Pulse users see my ID?',
        a: [
          'No. Your identity document is not displayed on your Pulse profile and is not made available to other Pulse users.',
          'Other users can see verification indicators associated with your Pulse account, but this does not give them access to your underlying identity documents.',
        ],
      },
      {
        q: 'What happens if my verification fails?',
        a: [
          "A failed verification doesn't necessarily mean you've done anything wrong.",
          'Verification may fail because of poor image quality, lighting, unsupported documents, difficulties completing the liveness check or because additional review is required.',
          "If you're unable to complete verification, contact Pulse Support and our team can review the situation and advise you on the next steps.",
        ],
      },
    ],
  },
  {
    category: 'Website Verification',
    items: [
      {
        q: 'Why should I verify my website?',
        a: [
          'Identity verification establishes who you are.',
          'Website verification helps establish your association with a website or organisation.',
          'For example, someone successfully completing KYC does not automatically prove that they work for a particular casino, affiliate network or company.',
          'Website verification provides an additional trust signal by demonstrating control of a website associated with the organization displayed on your Pulse profile.',
          'Verified websites are displayed on your public Pulse profile, helping other users understand your professional associations.',
        ],
      },
      {
        q: 'How do I verify a website?',
        a: [
          'Website verification must currently be completed through the Pulse web app.',
          'Go to Settings → Website Verification.',
          'Enter the URL of the website you want to verify. Pulse will generate a unique verification meta tag for that website.',
          'Add this meta tag to the <head> section of your website.',
          'Once the tag has been added, return to Pulse and select the option to verify the website.',
          'Pulse will check for the verification tag and, if successfully detected, the website will become verified and can appear on your profile.',
        ],
      },
      {
        q: "I don't know how to add a verification tag. What should I do?",
        a: [
          'If you manage the website yourself, you can follow our instructions for adding a meta tag to your website.',
          'For WordPress websites, see our WordPress guide below.',
          'If someone else manages your website, simply send the verification tag generated by Pulse to your developer or website administrator and ask them to add it to the <head> section of your website.',
          "Once they've added it, return to Pulse and complete verification.",
        ],
      },
      {
        q: 'How do I add the verification tag to WordPress?',
        a: [
          'There are several ways to add a meta tag to the <head> section of a WordPress website depending on your theme and configuration.',
          'If you use a plugin or theme that provides a Header Scripts, Custom Code or Header & Footer section, you can paste the Pulse verification tag into the appropriate header area.',
          'Alternatively, ask your website administrator or developer to add the tag for you.',
          'Once the tag is live on your website, return to Settings → Website Verification and select Verify.',
          'We recommend avoiding direct changes to WordPress theme files unless you are comfortable managing website code, as theme updates may overwrite those changes.',
        ],
      },
      {
        q: 'My developers need a few days to add the tag. Will it expire?',
        a: [
          'No. The verification tag stays the same until the website is verified.',
          'You can close the page, sign out and come back later — Settings → Website Verification will still show the same tag waiting for you, so there is no need to generate a new one.',
        ],
      },
      {
        q: 'I added the tag but verification says it cannot find it. What should I do?',
        a: [
          'The most common cause is a website firewall. Services such as Cloudflare often block automated requests, which means our check is refused before it can read your HTML — the tag is fine, we simply cannot see it. When this happens Pulse will tell you so directly.',
          'You have two options in that situation: allow the user agent "PulseSiteVerifier" in your firewall rules, or verify using a DNS record instead.',
          'Other causes worth ruling out: the tag was added to a staging site rather than the live one, it sits outside the <head> section, or the change has not been published yet.',
        ],
      },
      {
        q: 'Can I verify a website without editing its code?',
        a: [
          'Yes. On the verification screen, open "Can\'t edit your <head>? Verify with a DNS record instead".',
          'Pulse will give you a TXT record to add at your DNS provider. DNS verification is not affected by firewalls or caching layers, so it works on websites where the meta tag check cannot.',
          'Allow a few minutes for the record to propagate before selecting Verify.',
        ],
      },
      {
        q: "What happens if I'm the first person to verify a company website?",
        a: [
          'If you are the first Pulse user to successfully verify a website, you become the Website Admin for that company on Pulse.',
          'Other Pulse users who want to associate themselves with that website can then request to become representatives of the company.',
          'As Website Admin, you\'ll receive a notification when someone requests to represent the company. You can then approve or deny their request.',
          'This helps prevent people from simply adding well-known companies to their profile without authorization.',
        ],
      },
      {
        q: 'What is a Website Admin?',
        a: [
          'A Website Admin is the Pulse user responsible for managing a verified website and its representatives.',
          'The Website Admin can review requests from other Pulse users who want to associate themselves with the company and approve or deny those requests.',
          'This creates an additional verification layer beyond identity verification.',
        ],
      },
      {
        q: 'Can I remove a verified website?',
        a: [
          'Yes. You can remove a website associated with your account through the Website Verification settings.',
          'If there are no other representatives, the website can simply be removed.',
          'If other representatives are associated with the website, you will be given the option to:',
          [
            'Transfer administration to another representative before removing yourself; or',
            'Remove the website and its representatives, which removes the website association from all connected Pulse profiles.',
          ],
          'Be careful when selecting the second option, as it affects other users associated with that website.',
        ],
      },
      {
        q: 'Can I represent more than one website or company?',
        a: [
          'Yes. Pulse recognizes that many iGaming professionals work with multiple businesses, brands or websites.',
          'You can verify additional websites by going to Settings → Website Verification and selecting Verify a Website.',
          'Each website must be successfully verified before it can receive verified status on your profile.',
        ],
      },
      {
        q: 'Can anyone claim they work for my company?',
        a: [
          'They can request to represent the company, but they cannot automatically become an approved representative of a website that is already managed on Pulse.',
          'When a website already has an admin, new users requesting association with that company must be approved by the Website Admin.',
          'This gives companies additional control over who is publicly associated with their website on Pulse.',
        ],
      },
      {
        q: 'What happens if I change companies?',
        a: [
          'If you leave a company, you can remove the associated website or company from your Pulse profile.',
          'The Website Admin can also remove you as an approved representative of the company.',
          'If you join a new company, you can request to become a representative of an existing verified website or verify a new website through Settings → Website Verification.',
          'This helps keep the company information displayed on Pulse profiles accurate and up to date.',
        ],
      },
      {
        q: 'What if a Website Admin leaves the company?',
        a: [
          'If a Website Admin leaves a company or no longer wishes to manage its representatives, they can transfer Website Admin rights to another approved representative.',
          'When removing a website from their account, the current Website Admin will be given the option to transfer administration to another representative.',
          "The new Website Admin will then become responsible for managing the company's representatives on Pulse.",
        ],
      },
      {
        q: 'What if the wrong person becomes Website Admin?',
        a: [
          "If you believe the wrong person is managing your company's website on Pulse, you should first become an approved representative of the company and request that the existing Website Admin transfer administration to you.",
          'If the issue cannot be resolved between the representatives, contact Pulse Support.',
          'Our team can review the situation and, where appropriate, reassign Website Admin rights to an authorized representative.',
        ],
      },
    ],
  },
  {
    category: 'Social Profile Verification',
    items: [
      {
        q: 'Why should I connect my social profiles?',
        a: [
          'Connecting verified social accounts adds another layer of transparency to your Pulse identity.',
          "It allows people you communicate with to confirm that the Pulse account they're speaking with is connected to established social profiles controlled by that user.",
          'For iGaming professionals who regularly communicate through platforms such as LinkedIn, Instagram or other supported networks, this can provide another useful trust signal.',
          "The more relevant information you verify, the easier it becomes for other professionals to establish that they're speaking with the right person.",
        ],
      },
      {
        q: 'How do I add a social profile?',
        a: [
          'Social profiles can be connected through Settings → Social Profiles.',
          'Select the social platform you want to connect and follow the authentication process.',
          'Where supported, Pulse uses OAuth verification rather than simply allowing you to paste a social profile URL.',
          'Once successfully connected, the social account can appear on your public Pulse profile.',
        ],
      },
      {
        q: 'What is OAuth verification?',
        a: [
          "OAuth allows Pulse to confirm your connection to a supported social account through the social platform's own authentication process.",
          'Instead of simply typing a username and claiming that an account belongs to you, you authenticate directly with the platform.',
          'This provides a stronger verification signal that you actually control the social account being added.',
        ],
      },
      {
        q: 'Can I remove a social profile?',
        a: [
          'Yes. Go to Settings → Social Profiles, find the connected account and select Disconnect.',
          'The social account will then be removed from your Pulse profile.',
        ],
      },
      {
        q: 'Can I add or verify websites and social profiles from the mobile app?',
        a: [
          'Not currently. Website verification and social profile management must currently be completed through the Pulse web app.',
          'Once verified, the information can still appear on your Pulse profile when other users view it from supported devices.',
        ],
      },
    ],
  },
  {
    category: 'Understanding Pulse Verification',
    items: [
      {
        q: "What's the difference between Identity, Website and Social Verification?",
        a: [
          'Pulse uses different verification layers because each one establishes something different.',
          [
            'Identity Verified — helps establish that a real person is behind the Pulse account.',
            'Website Verified — helps establish a verified association with a website, company or business.',
            'Social Verified — helps establish control of a connected social media account.',
          ],
          "Together, these signals provide users with significantly more context about who they're communicating with.",
        ],
      },
      {
        q: "Why doesn't KYC automatically verify my company?",
        a: [
          'Because proving your identity and proving where you work are two different things.',
          'A person could successfully verify their real identity while falsely claiming to work for a well-known casino or company.',
          "That's why Pulse separates Identity Verification from Website/Company Verification.",
        ],
      },
      {
        q: 'Why are verified websites and social accounts important?',
        a: [
          'Think of your Pulse profile as your verified professional identity within iGaming.',
          "KYC establishes that you're a real person.",
          "Website verification helps establish the organizations you represent.",
          'Social verification connects your established online presence.',
          "Together, these verification layers help other users make more informed decisions about who they're speaking with.",
        ],
      },
      {
        q: 'Does a verification badge mean Pulse endorses a user?',
        a: [
          'No. Verification confirms that a particular verification process has been successfully completed.',
          'It does not mean Pulse recommends, endorses or guarantees the professional conduct of an individual or company.',
          'You should always conduct appropriate due diligence before entering into business arrangements, sharing confidential information or transferring funds.',
        ],
      },
    ],
  },
  {
    category: 'Account Security',
    items: [
      {
        q: 'Does Pulse support Two-Factor Authentication (2FA)?',
        a: [
          'Yes. Two-Factor Authentication can be enabled from your Pulse account settings. We strongly recommend enabling 2FA.',
          '2FA adds an additional security layer by requiring a second authentication step when accessing your account.',
          'This means that even if someone obtains your password, they may still be unable to access your Pulse account without the additional authentication factor.',
        ],
      },
      {
        q: 'Should I enable 2FA?',
        a: [
          'Yes. We recommend that every Pulse user enables Two-Factor Authentication, particularly users who represent companies or manage website representatives.',
          'Your Pulse profile represents your professional identity, so protecting access to it is important.',
        ],
      },
      {
        q: 'What should I do if I think my account has been compromised?',
        a: [
          'Contact Pulse Support immediately.',
          'You should also change your password and review your account, connected social profiles and website associations.',
          'If you still have access to your account and have not already done so, enable Two-Factor Authentication.',
        ],
      },
      {
        q: 'What happens if I lose access to my 2FA device?',
        a: [
          'If you lose access to the device used for Two-Factor Authentication and cannot access your Pulse account, contact Pulse Support.',
          'Because Pulse accounts are linked to verified identities, we may require you to complete an identity verification process before 2FA can be reset.',
          "This helps prevent someone from using the account recovery process to take control of another person's verified Pulse account.",
        ],
      },
      {
        q: 'What happens if I forget my Pulse password?',
        a: [
          'Use the Forgot Password option on the Pulse login screen.',
          'Follow the instructions sent to your registered email address to reset your password.',
          "If you're still unable to access your account, contact Pulse Support.",
        ],
      },
    ],
  },
  {
    category: 'Your Pulse Profile',
    items: [
      {
        q: 'What information appears on my Pulse profile?',
        a: [
          "Your Pulse profile is designed to give other professionals useful information about who they're communicating with.",
          "Depending on the information you've chosen to provide and verify, your profile may display information such as:",
          [
            'Your Display Name',
            'Profile image',
            'Position or professional role',
            'Company information',
            'Verified websites',
            'Connected social profiles',
            'Verification indicators',
          ],
          'The information displayed may evolve as Pulse continues to develop.',
        ],
      },
      {
        q: 'Will my full legal name be displayed on Pulse?',
        a: [
          'No. Completing identity verification does not mean you have to publicly display your full legal name.',
          'Pulse uses your full identity information during the verification process to confirm that you are a real person.',
          'Once your identity has been successfully verified, you can choose which part of your verified name you would like to use as your Display Name on Pulse.',
          'Your Display Name must be taken from your verified identity — you cannot enter an unrelated or completely different name.',
          'For example, if your verified name is Apple Paul Michael Jr, you could choose to display:',
          ['Apple', 'Paul', 'Michael', 'Jr'],
          'This gives you more control over how your identity appears publicly while ensuring that the name displayed on Pulse is still connected to your verified identity.',
        ],
      },
      {
        q: 'Can I use a fake name or alias as my Display Name?',
        a: [
          'No. Your Display Name must be based on a name that forms part of your successfully verified identity.',
          'Pulse does not allow users to enter an unrelated name simply to hide who is behind an account.',
          'This helps maintain the trust and transparency that Pulse is designed around while still giving users control over how much of their verified name is displayed publicly.',
        ],
      },
      {
        q: "Why doesn't Pulse require my full legal name to be public?",
        a: [
          'Identity verification and publicly displaying your entire legal name are two different things.',
          'Pulse needs to establish that there is a real, verified person behind an account.',
          "That doesn't necessarily mean every part of that person's legal name needs to be visible to everyone using the platform.",
          'Allowing users to select a Display Name from their verified name gives them an additional level of privacy while maintaining the integrity of the verification process.',
          'Pulse verifies your identity without requiring you to publicly display your entire identity.',
        ],
      },
      {
        q: 'Can I change my Display Name later?',
        a: [
          'Yes. You can change your Display Name under Settings → Profile Info.',
          'Your Display Name must still be selected from the name information associated with your verified identity. You cannot replace it with an unrelated alias or fake name.',
        ],
      },
      {
        q: 'Can I change my profile photo, position or other profile information?',
        a: [
          'Yes. You can update your available profile information at any time by going to Settings → Profile Info.',
          'Certain information associated with identity or other verification processes may be subject to additional restrictions.',
        ],
      },
      {
        q: "Can someone see if I've viewed their Pulse profile?",
        a: ['No. Pulse users cannot currently see which individual users have viewed their profile.'],
      },
      {
        q: 'Can I share my Pulse profile outside Pulse?',
        a: [
          'Yes, and we encourage it.',
          'Every Pulse user receives a unique Share Link for their profile. You can find yours under Settings → Profile Info.',
          'Your link will look similar to: pulse.affiliateroulette.com/u/xxxxxxx',
          'Copy this link and share it wherever you want people to find your verified Pulse profile.',
        ],
      },
      {
        q: 'Can I add my Pulse profile to my company website?',
        a: [
          'Yes. You can link directly to your Pulse profile from your company website.',
          'For example, you can add the Pulse logo alongside your contact information and link it to your unique Pulse Share Link.',
          "Visitors can then open your Pulse profile and confirm that they're contacting the correct person.",
          'This is particularly useful for affiliate managers and other industry professionals who are frequently targeted by impersonators.',
        ],
      },
      {
        q: 'Where else should I share my Pulse profile?',
        a: [
          'You can use your Pulse Share Link on:',
          [
            'Your company website',
            'Email signature',
            'LinkedIn',
            'Other professional social profiles',
            'Digital business cards',
            'Contact pages',
          ],
          'The goal is to give people an easy way to find and confirm your official Pulse identity.',
        ],
      },
    ],
  },
  {
    category: 'Messaging & Contacts',
    items: [
      {
        q: 'Who can I message on Pulse?',
        a: [
          'Pulse is designed to allow verified industry professionals to discover and communicate with other Pulse users.',
          'Available messaging and contact functionality may depend on your account and subscription level.',
        ],
      },
      {
        q: 'Why use Pulse instead of Telegram or another messenger?',
        a: [
          "Pulse isn't simply trying to recreate another messaging app.",
          'The major difference is the verification layer surrounding communication.',
          "Traditional messaging platforms may show you a username, profile picture and bio, but those details alone don't necessarily prove who is behind an account.",
          'Pulse combines communication with identity, website and social verification signals specifically designed for professional iGaming communication.',
        ],
      },
      {
        q: 'Are my Pulse messages private?',
        a: [
          'Yes. Pulse messages are private communications between the participants of a conversation and are not publicly visible on the platform.',
        ],
      },
      {
        // The supplied copy said messages are end-to-end encrypted. They are not: message
        // content is stored in readable form and is queried server-side (search, previews),
        // so this answer describes what the platform actually does today.
        q: 'Are Pulse messages end-to-end encrypted?',
        a: [
          'Not currently. Traffic between your device and Pulse is encrypted in transit, and your conversations are private — they are not visible to other Pulse users and are not published anywhere on the platform.',
          'However, message content is not end-to-end encrypted today. It is stored in a form our systems can process, which is what allows features such as message search and conversation previews to work.',
          'For that reason, you should avoid sending passwords, financial credentials or other highly sensitive material through Pulse — as with any messaging platform.',
        ],
      },
      {
        q: 'Can Pulse employees read my messages?',
        a: [
          'Pulse does not monitor private conversations. Access to message content is restricted and limited to what is necessary to operate the platform, investigate reports of abuse, or comply with a legal obligation.',
          'Because messages are not end-to-end encrypted today, that access is controlled by policy and access restrictions rather than by encryption.',
          'You should also bear in mind that anyone you message can retain, copy, forward or capture the information you send them.',
        ],
      },
      {
        q: 'Does Pulse eliminate fraud?',
        a: [
          'No platform can guarantee that fraud will never occur.',
          'Pulse is designed to make impersonation and anonymous abuse more difficult and to provide users with additional information before they decide to trust someone.',
          'You should still perform appropriate due diligence when entering commercial agreements or sending money.',
        ],
      },
    ],
  },
  {
    category: 'Safety, Reporting & Blocking',
    items: [
      {
        q: 'Can I block another user?',
        a: [
          'Yes. You can block another Pulse user by visiting their profile and selecting Block User.',
          'You can view and manage users you have blocked under Settings → Other → Blocked Users.',
        ],
      },
      {
        q: 'Can I report a user?',
        a: [
          'Yes. If you encounter suspected fraud, impersonation, harassment, spam, suspicious activity or other behaviour that may violate Pulse policies, you can report the user directly from their profile by selecting Report User.',
          'Reports may be reviewed by the Pulse team and appropriate action may be taken where necessary.',
        ],
      },
      {
        q: 'Can Pulse suspend or remove a verified account?',
        a: [
          "Yes. Being identity verified does not exempt a user from Pulse's rules.",
          'Pulse may restrict, suspend or remove accounts where we identify fraud, abuse, serious misconduct, violations of our policies or other activity that may put the Pulse community at risk.',
          'Identity verification confirms that an account has successfully completed our verification process. It does not mean that Pulse endorses, recommends or guarantees the business conduct of that user.',
        ],
      },
    ],
  },
  {
    category: 'Voice & Video Calls',
    items: [
      {
        q: 'Can I make voice and video calls through Pulse?',
        a: [
          'Yes. Pulse supports voice and video communication, subject to the features available with your account.',
          'This allows users to move from verified messaging to calls without needing to immediately switch to another communication platform.',
        ],
      },
      {
        q: 'Are voice and video calls available on the Free plan?',
        a: [
          'Yes. Free users receive a monthly allowance for voice and video calling.',
          'Pulse Pro provides expanded or unlimited calling functionality subject to the current Pulse Pro plan terms.',
          'You can view the latest plan features from the Pulse pricing page or your account.',
        ],
      },
    ],
  },
  {
    category: 'Pulse Pro',
    items: [
      {
        q: 'Do I need Pulse Pro to use Pulse?',
        a: [
          'No. Pulse has a Free plan that provides access to the core platform.',
          'Pulse Pro is designed for professionals who want additional communication and business features.',
        ],
      },
      {
        q: 'What does Pulse Pro include?',
        a: [
          'Pulse Pro can include additional features such as:',
          ['Groups', 'Expanded voice and video calling', 'Calendar integrations', 'Additional professional tools'],
          'Features may continue to evolve as Pulse develops.',
          'You can always see the latest included features from the Pulse pricing page.',
        ],
      },
    ],
  },
  {
    category: 'Billing & Subscription Management',
    items: [
      {
        q: 'Where can I manage my subscription?',
        a: [
          'Billing and subscription settings can be managed through Settings → Billing.',
          'From here, depending on your current subscription, you can manage your billing information and subscription.',
        ],
      },
      {
        q: 'What payment methods does Pulse accept?',
        a: [
          'Pulse Pro subscriptions can currently be purchased using supported debit and credit cards through Stripe, our payment processor.',
          'Available payment methods may depend on your location and the payment options supported by Stripe.',
        ],
      },
      {
        q: 'Are Pulse Pro subscriptions automatically renewed?',
        a: [
          'Yes. Pulse Pro subscriptions automatically renew according to the billing cycle you select — monthly or annually — unless you cancel your subscription before the next renewal date.',
          'You can manage your subscription under Settings → Billing.',
        ],
      },
      {
        q: 'Can I upgrade or downgrade my Pulse plan?',
        a: [
          'Yes. Go to Settings → Billing.',
          'You can view your current subscription and available upgrade or downgrade options.',
        ],
      },
      {
        q: 'How do I cancel Pulse Pro?',
        a: [
          'You can cancel your subscription through Settings → Billing.',
          'Cancelling stops your subscription from renewing at the end of your current billing period.',
        ],
      },
      {
        q: 'Can I get a refund for Pulse Pro?',
        a: [
          'Pulse Pro subscription payments are generally non-refundable once processed, subject to applicable law.',
          "Cancelling your subscription stops the next automatic renewal but does not immediately terminate the subscription period you've already paid for.",
          'For example, if you purchase a monthly subscription on 4 September and cancel it before the next renewal, your Pulse Pro subscription will remain active until 4 October. You will not be charged for the following subscription period.',
        ],
      },
      {
        q: 'What happens to my Pulse Pro features if I cancel?',
        a: [
          'Cancelling Pulse Pro does not immediately remove your Pro features.',
          'You will continue to have access to Pulse Pro until the end of your current paid billing period.',
          'Once that period ends, your account will return to the Free plan and you will lose access to features that require Pulse Pro.',
          'Your Pulse account itself will remain active unless you separately choose to delete it.',
        ],
      },
      {
        q: 'Where can I download my invoices?',
        a: [
          'Invoices and available billing documentation can be accessed through Settings → Billing.',
          'From here you can view and download invoices associated with your Pulse subscription.',
        ],
      },
    ],
  },
  {
    category: 'Privacy & Data Protection',
    items: [
      {
        q: 'Does Pulse sell my personal information?',
        a: [
          'No. Pulse does not sell your KYC information to advertisers, casinos, affiliates or other Pulse users.',
          'Identity verification exists to establish trust and protect the Pulse ecosystem — not to create a marketing database from your identity documents.',
        ],
      },
      {
        q: 'Who handles Pulse identity verification?',
        a: [
          'Pulse uses Didit as its specialist third-party identity verification provider.',
          'Didit performs the document and liveness verification process on behalf of Pulse.',
          'Further details about the processing of personal information are available in our Privacy Policy and KYC & Identity Verification Policy.',
        ],
      },
      {
        q: 'Where is verification data processed?',
        a: [
          'Our identity verification provider processes verification data in the European Union by default under our current configuration.',
          'For further information about data processing, international transfers and subprocessors, please refer to the relevant Pulse privacy documentation.',
        ],
      },
      {
        q: 'Can I request access to or deletion of my personal data?',
        a: [
          'You may have rights regarding your personal information under applicable data-protection law, including rights relating to access, correction and deletion.',
          'Requests concerning personal data processed for Pulse should be directed to Pulse.',
          'Certain information may need to be retained where required or permitted by applicable law or for legitimate security, fraud-prevention or legal purposes.',
          'Please see our Privacy Policy for further information.',
        ],
      },
    ],
  },
  {
    category: 'Account Management & Deletion',
    items: [
      {
        q: 'Can I delete my Pulse account?',
        a: [
          'Yes. You can delete your Pulse account by going to Settings → Other → Delete Account.',
          'Deleting your account will permanently remove your Pulse account and associated profile information, subject to any information Pulse may be required or permitted to retain under applicable law or for legitimate legal, security or fraud-prevention purposes.',
          'Please see our Privacy Policy for further information.',
        ],
      },
      {
        q: 'What happens to my data when I delete my account?',
        a: [
          'When you delete your Pulse account, the personal data associated with your account will be deleted in accordance with our Privacy Policy and applicable data-protection requirements.',
          'Certain limited information may need to be retained where required or permitted by law, including where necessary for legal, security, fraud-prevention or dispute-resolution purposes.',
          'Identity verification data processed through our verification provider is also subject to the separate retention periods explained in our KYC & Identity Verification Policy.',
        ],
      },
      {
        q: 'Can I have more than one Pulse account?',
        a: [
          'No. Pulse accounts are intended to represent individual verified users. Each person should maintain one Pulse account.',
          "This helps protect the integrity of Pulse's identity verification system and reduces the risk of duplicate, misleading or impersonation accounts.",
        ],
      },
      {
        q: 'Can businesses create company accounts?',
        a: [
          'Not currently. Pulse accounts are currently created and identity verified at the individual level.',
          'Companies and organisations can instead be represented through verified websites and their approved representatives.',
          'Dedicated Business Profiles may become available as Pulse continues to develop.',
        ],
      },
    ],
  },
  {
    category: 'Pulse & Affiliate Roulette',
    items: [
      {
        q: 'Is Pulse connected to Affiliate Roulette?',
        a: [
          'Yes. Pulse is a sister brand of Affiliate Roulette.',
          'Both platforms share a broader focus on improving trust and transparency within the iGaming industry, but they serve different purposes.',
          'Affiliate Roulette is a B2B iGaming directory designed to help operators, affiliates, affiliate networks and other industry businesses discover and connect with one another.',
          'Pulse is a verified communication platform designed to help iGaming professionals communicate while providing additional identity, company and social verification signals.',
          "Your use of Pulse remains subject to Pulse's own applicable Terms, Privacy Policy and platform policies.",
        ],
      },
    ],
  },
  {
    category: 'Support',
    items: [
      {
        q: 'How do I report a bug?',
        a: [
          'You can report bugs directly from Pulse. Go to Settings → Other → Feedback & Support.',
          'Please provide as much information as possible about what happened so our team can investigate. Screenshots can also be extremely helpful.',
        ],
      },
      {
        q: 'Can I suggest a new feature?',
        a: [
          'Absolutely. Our private beta exists partly to learn how iGaming professionals actually use Pulse.',
          'Go to Settings → Other → Feedback & Support and send us your suggestion.',
          'Feedback from beta users directly influences how Pulse develops.',
        ],
      },
      {
        q: 'How do I contact Pulse Support?',
        a: [
          'If you experience an account, verification, billing, security or technical issue, you can contact our support team through the available support options within Pulse.',
          'For beta users, the easiest route is Settings → Other → Feedback & Support.',
          "We'll review your request and assist where possible.",
        ],
      },
    ],
  },
]

// Flattened once so the search filter doesn't rebuild every answer's text on each keystroke.
const SEARCH_INDEX = new Map()
FAQ.forEach((group) => {
  group.items.forEach((item) => {
    const text = [item.q, ...item.a.flat()].join(' ').toLowerCase()
    SEARCH_INDEX.set(item, text)
  })
})

function Answer({ blocks, darkMode }) {
  const tone = darkMode ? 'text-gray-400' : 'text-gray-600'
  return (
    <div className="pb-4 pr-7 space-y-2">
      {blocks.map((block, i) =>
        Array.isArray(block) ? (
          <ul key={i} className={`text-sm leading-relaxed list-disc pl-5 space-y-1 ${tone}`}>
            {block.map((li, k) => <li key={k}>{li}</li>)}
          </ul>
        ) : (
          <p key={i} className={`text-sm leading-relaxed ${tone}`}>{block}</p>
        )
      )}
    </div>
  )
}

function QaRow({ item, darkMode, open, onToggle }) {
  return (
    <div className={`border-b last:border-b-0 ${darkMode ? 'border-gray-700' : 'border-gray-100'}`}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        className="w-full flex items-start justify-between gap-3 text-left py-3.5"
      >
        <span className={`text-sm font-medium ${darkMode ? 'text-gray-100' : 'text-gray-900'}`}>{item.q}</span>
        <svg
          className={`w-4 h-4 mt-0.5 shrink-0 transition-transform ${open ? 'rotate-180' : ''} ${
            darkMode ? 'text-gray-500' : 'text-gray-400'
          }`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open && <Answer blocks={item.a} darkMode={darkMode} />}
    </div>
  )
}

export default function FaqSection({ darkMode }) {
  const [search, setSearch] = useState('')
  // Keyed by "category::question" so two categories can't collide on a similar wording.
  const [openKey, setOpenKey] = useState(null)

  const term = search.trim().toLowerCase()

  const groups = useMemo(() => {
    if (!term) return FAQ
    // Search answers as well as questions — people describe the symptom they have, not the
    // question we happened to write ("cloudflare", "refund", "can't find the tag").
    return FAQ
      .map((g) => ({ ...g, items: g.items.filter((i) => SEARCH_INDEX.get(i).includes(term)) }))
      .filter((g) => g.items.length > 0)
  }, [term])

  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const card = `rounded-2xl border ${darkMode ? 'border-gray-700 bg-gray-800' : 'border-gray-100 bg-white'}`
  const sub = darkMode ? 'text-gray-400' : 'text-gray-500'

  return (
    <div className="space-y-4">
      <div className={`${card} p-5`}>
        <h4 className={`text-sm font-bold mb-1 ${darkMode ? 'text-white' : 'text-gray-900'}`}>
          Pulse Help Center
        </h4>
        <p className={`text-xs mb-4 ${sub}`}>
          Answers about Pulse, identity verification, website and social verification, privacy,
          security, messaging, billing and managing your account.
        </p>

        <div className="relative">
          <svg
            className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`}
            fill="none" viewBox="0 0 24 24" stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search the Help Center…"
            className={`w-full rounded-xl pl-10 pr-9 py-2.5 text-sm outline-none border ${
              darkMode
                ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-500'
                : 'bg-white border-gray-200 placeholder-gray-400'
            } focus:ring-2 focus:ring-violet-400`}
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className={`absolute right-3 top-1/2 -translate-y-1/2 ${darkMode ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'}`}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>

        {term && (
          <p className={`text-xs mt-2 ${sub}`}>
            {total === 0
              ? 'No answers matched. Try a different word, or contact support below.'
              : `${total} ${total === 1 ? 'answer' : 'answers'} for “${search.trim()}”`}
          </p>
        )}
      </div>

      {groups.map((group) => (
        <div key={group.category} className={`${card} p-5`}>
          <h5 className={`text-xs font-bold uppercase tracking-wide mb-1 ${darkMode ? 'text-violet-300' : 'text-violet-600'}`}>
            {group.category}
          </h5>
          <div>
            {group.items.map((item) => {
              const key = `${group.category}::${item.q}`
              return (
                <QaRow
                  key={key}
                  item={item}
                  darkMode={darkMode}
                  // While searching, show every match expanded — collapsing a result set the
                  // user just filtered down to makes them click twice for what they asked for.
                  open={term ? true : openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                />
              )
            })}
          </div>
        </div>
      ))}

      <div className={`${card} p-5 flex flex-wrap items-center justify-between gap-3`}>
        <div>
          <p className={`text-sm font-semibold ${darkMode ? 'text-white' : 'text-gray-900'}`}>
            Didn&apos;t find your answer?
          </p>
          <p className={`text-xs mt-0.5 ${sub}`}>Settings → Other → Feedback &amp; Support reaches our team.</p>
        </div>
        <a
          href="mailto:pulse@affiliateroulette.com"
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors shrink-0"
        >
          Contact Support
        </a>
      </div>
    </div>
  )
}
