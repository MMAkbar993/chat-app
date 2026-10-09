// ─────────────────────────────────────────────────────────────────────────────
//  HOME PAGE CONTENT — edit the words here, not in HomePage.jsx.
//
//  Anything marked TODO is a placeholder or a claim that still needs confirming.
//  Search this file for "TODO" to find them all.
//
//  Facts on this page must stay in step with the product:
//    • Prices      → features/payment/UpgradeModal.jsx (PLANS) and Stripe
//    • Free vs Pro → the Pro gates in calls, groups, contacts search and calendar
//    • ID data     → the 30-day retention promise on How It Works and the KYC screen
// ─────────────────────────────────────────────────────────────────────────────

export const HOME_CONTENT = {
  hero: {
    badge: 'Verified communication for iGaming',
    headline: 'Stop doing deals with fake affiliate managers.',
    subtext:
      'Every person on Pulse is ID-verified, and you can see which company they really work for before you reply.',
    primaryCta: { label: 'Create free account', to: '/signup' },
    secondaryCta: { label: 'See how it works', to: '/how-it-works' },
    // TODO: confirm "about 2 minutes" — the ID check's own screen says about 1 minute, plus sign-up.
    footnote: 'Takes about 2 minutes · ID data deleted after 30 days',
  },

  // Hidden entirely until real values are filled in, so a placeholder can't go live by accident.
  // Use logos OR stats (logos win if both are set).
  socialProof: {
    logosLabel: 'Trusted by affiliate teams at',
    // TODO: up to 5 logos, e.g. { src: '/marketing/logos/brand.svg', alt: 'Brand name' }.
    // Put the files in frontend/public/marketing/logos/. Get each company's permission first.
    logos: [],
    // TODO: e.g. [{ value: '1,200+', label: 'verified members' }, { value: '300', label: 'companies' },
    //       { value: '40', label: 'countries' }]. Leave empty until the numbers are real.
    stats: [],
  },

  problem: {
    eyebrow: 'The problem',
    heading: 'In iGaming, anyone can claim to be anyone',
    cards: [
      {
        title: 'Impersonators everywhere',
        body: 'Fake accounts copy real affiliate managers on Telegram and other apps, down to the name and photo.',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
      },
      {
        title: 'No way to check',
        body: 'A username and a profile picture prove nothing. Anyone can set them in a minute.',
        icon: 'M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Deals at risk',
        body: 'One wrong contact can cost you a partnership, a payout or your reputation.',
        icon: 'M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z',
      },
    ],
  },

  fixes: {
    eyebrow: 'How Pulse fixes it',
    heading: 'Verification built into every conversation',
    linkLabel: 'Learn more',
    cards: [
      {
        title: 'Verified identity',
        body: 'Every member passes a government ID and liveness check through our partner Didit before they can message anyone.',
        to: '/how-it-works#verification',
        icon: 'M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z',
      },
      {
        title: 'Verified company',
        body: 'Prove where you work with a head tag or DNS record on your website, or with your business email address.',
        to: '/how-it-works#websites',
        icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Everything in one place',
        body: 'Chat, groups, voice and video calls, file and screen sharing, and meeting scheduling.',
        to: '/how-it-works#features',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      },
    ],
  },

  showcase: {
    eyebrow: 'Your verified profile',
    heading: 'One link that proves who you are',
    body: 'Share your verified profile link anywhere: email signature, website, LinkedIn.',
    points: [
      'KYC, website and social verification shown at a glance',
      'Your own link, found under Settings → Profile Info',
    ],
    cta: { label: 'Get your verified profile', to: '/signup' },
  },

  pricing: {
    eyebrow: 'Pricing',
    heading: 'Start free. Upgrade when you need more.',
    // Prices match the live upgrade screen (UpgradeModal PLANS). Change both together.
    plans: [
      {
        name: 'Free',
        price: '€0',
        period: 'forever',
        note: null,
        features: [
          'One-to-one messaging',
          'Join groups you are invited to',
          '30 minutes of voice and video calls per month',
          'Identity, website and social verification',
        ],
        cta: { label: 'Create free account', to: '/signup' },
        highlighted: false,
      },
      {
        name: 'Pro',
        price: '€6.99',
        period: 'per month',
        note: 'or €70 per year',
        features: [
          'Everything in Free',
          'Create your own groups',
          'Unlimited voice and video calls',
          'Screen sharing',
          'Search people by business name',
          'Meeting scheduling with Google Calendar',
          'Higher file upload limits',
        ],
        cta: { label: 'Start with Pro', to: '/signup' },
        highlighted: true,
      },
    ],
  },

  // Short answers, kept consistent with the full Help Center FAQ (components/settings/FaqSection.jsx).
  faq: {
    eyebrow: 'FAQ',
    heading: 'Questions before you join',
    seeAll: { label: 'See all questions', to: '/how-it-works#faq' },
    items: [
      {
        q: 'Is Pulse free?',
        a: ['Yes. The Free plan includes one-to-one messaging, joining groups and 30 minutes of voice and video calls a month. Pulse Pro adds unlimited calls, your own groups, screen sharing, business-name search and calendar scheduling.'],
      },
      {
        q: 'Why do I need to verify my ID?',
        a: ['So every member is a real, identifiable person. It is what keeps impersonators and anonymous accounts out. The check is done once, through our partner Didit, with a government-issued ID and a quick selfie.'],
      },
      {
        q: 'What happens to my ID data?',
        a: ['Your documents and selfie are deleted automatically after 30 days. Pulse keeps only a record that you were verified. The only detail from your ID other members see is your name, shown the way you choose in Settings.'],
      },
      {
        q: 'Who can join Pulse?',
        a: ['Professionals working in iGaming: affiliate managers, affiliates and publishers, casino and sportsbook representatives, affiliate networks, agencies and the businesses that work with them.'],
      },
      {
        q: 'How is Pulse different from Telegram?',
        a: ['Telegram shows you a username and a profile picture, and anyone can copy those. On Pulse every member is ID-verified, and you can see which company they work for before you reply.'],
      },
    ],
  },

  cta: {
    title: 'Ready to join Pulse?',
    body: 'Create your account, verify your identity and connect with iGaming professionals in one trusted workspace.',
    buttonLabel: 'Create free account',
  },
}
