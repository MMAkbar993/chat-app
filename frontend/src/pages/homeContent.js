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
    headline: 'The iGaming industry, connected and verified.',
    subtext:
      'Chat, call, and collaborate with iGaming professionals on a platform built around verified identities and trusted business connections.',
    primaryCta: { label: 'Create free account', to: '/signup' },
    secondaryCta: { label: 'See how it works', to: '/how-it-works' },
    // TODO: confirm "about 2 minutes" — the ID check's own screen says about 1 minute, plus sign-up.
    footnote: 'Takes about 2 minutes · ID data deleted after 30 days',
  },

  // Social proof (logos and numbers) lives in SOCIAL_PROOF at the top of HomePage.jsx.

  problem: {
    eyebrow: 'The problem',
    heading: 'On Telegram or Teams, anyone can claim to be anyone.',
    lead: "Every day, iGaming professionals connect through usernames, profile pictures, and company names. But how can you be sure the person you're speaking with is really who they claim to be?",
    cards: [
      {
        title: 'Fake identities',
        body: 'Impersonators can copy names, photos, and company details to appear legitimate.',
        icon: 'M15 9h3.75M15 12h3.75M15 15h3.75M4.5 19.5h15a2.25 2.25 0 002.25-2.25V6.75A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25v10.5A2.25 2.25 0 004.5 19.5zm6-10.125a1.875 1.875 0 11-3.75 0 1.875 1.875 0 013.75 0zm1.294 6.336a6.721 6.721 0 01-3.17.789 6.721 6.721 0 01-3.168-.789 3.376 3.376 0 016.338 0z',
      },
      {
        title: 'Unverified connections',
        body: "Most messaging platforms don't verify who users are or which businesses they represent.",
        icon: 'M12 9v3.75m0-10.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.75c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.25-8.25-3.286zm0 13.036h.008v.008H12v-.008z',
      },
      {
        title: 'Business at risk',
        body: 'One fraudulent contact can put partnerships, payments, and professional reputations at risk.',
        icon: 'M2.25 6L9 12.75l4.306-4.307a11.95 11.95 0 015.814 5.519l2.74 1.22m0 0l-5.94 2.28m5.94-2.28l-2.28-5.941',
      },
    ],
  },

  fixes: {
    eyebrow: 'Why Pulse',
    heading: 'Everything you need to connect with confidence.',
    lead: 'One platform for verified identities, professional connections, and everyday communication across iGaming.',
    linkLabel: 'Learn more',
    cards: [
      {
        title: 'Verified identity',
        body: 'Every member completes identity and liveness verification through our trusted partner, Didit, before messaging.',
        to: '/how-it-works#verification',
        icon: 'M9 12.75l1.5 1.5 3.75-3.75M12 3l7 3v5c0 4.5-3 8.25-7 9.5-4-1.25-7-5-7-9.5V6l7-3z',
      },
      {
        title: 'Verified business connections',
        body: 'Verify your company or professional affiliation so others can see which business you represent.',
        to: '/how-it-works#company',
        icon: 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      },
      {
        title: 'Communication made simple',
        body: 'Stay connected with chats, group conversations, voice and video calls, and more, all in one place.',
        to: '/how-it-works#features',
        icon: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z',
      },
    ],
  },

  app: {
    eyebrow: 'See Pulse in action',
    heading: 'Familiar like Telegram or Teams. Verified like nothing else.',
    lead: 'Chats, groups, voice and video calls, and file sharing work the way you already know, with every person behind them verified.',
  },

  showcase: {
    eyebrow: 'Your professional identity',
    heading: 'Your identity. Your business. One verified profile.',
    body: 'Build trust before the first message. Share your Pulse profile with partners, colleagues, and new connections so they can review your verification status in one place.',
    points: [
      'Display your identity, website, and social verification badges.',
      'Share your unique profile link in emails, websites, and social media.',
      "Help business partners confirm they're connecting with the right person.",
    ],
    cta: { label: 'Get your verified profile', to: '/signup' },
  },

  industries: {
    eyebrow: 'Built for your industry',
    heading: 'One industry. One place to connect.',
    lead: 'From operators to affiliates, Pulse brings iGaming professionals together on one verified communication platform.',
    cards: [
      {
        title: 'Casino Operators',
        body: 'Connect with partners and manage industry relationships.',
        icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      },
      {
        title: 'Affiliates & Publishers',
        body: 'Build connections with operators and affiliate teams.',
        icon: 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      },
      {
        title: 'Affiliate Networks',
        body: 'Stay in touch with advertisers, publishers, and partners.',
        icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      },
      {
        title: 'Game Providers',
        body: 'Connect with operators and potential business partners.',
        icon: 'M11 4a2 2 0 114 0v1a1 1 0 001 1h3a1 1 0 011 1v3a1 1 0 01-1 1h-1a2 2 0 100 4h1a1 1 0 011 1v3a1 1 0 01-1 1h-3a1 1 0 01-1-1v-1a2 2 0 10-4 0v1a1 1 0 01-1 1H7a1 1 0 01-1-1v-3a1 1 0 00-1-1H4a2 2 0 110-4h1a1 1 0 001-1V7a1 1 0 011-1h3a1 1 0 001-1V4z',
      },
      {
        title: 'Streamers & Creators',
        body: 'Collaborate with brands and industry professionals.',
        icon: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',
      },
      {
        title: 'Agencies & Service Providers',
        body: 'Grow your network and communicate with clients.',
        icon: 'M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
      },
    ],
    more: '+20 Other iGaming Niches!',
  },

  pricing: {
    eyebrow: 'Pricing',
    heading: 'Start free. Upgrade when you need more.',
    // Prices match the live upgrade screen (UpgradeModal PLANS). Change both together.
    // For Pro, give numbers: the page formats them and works out the yearly saving itself.
    plans: [
      {
        name: 'Free',
        price: '€0',
        period: 'forever',
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
        monthly: 6.99,
        yearly: 70,
        period: 'per month',
        features: [
          'Everything in Free',
          'Create your own groups',
          'Unlimited voice and video calls',
          'Screen sharing',
          'Search people by business name',
          'Meeting scheduling with Google Calendar',
          'Higher file upload limits',
        ],
        // ?plan=pro makes the sign-up page say they're joining for Pro. No payment happens there.
        cta: { label: 'Start with Pro', to: '/signup?plan=pro' },
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
