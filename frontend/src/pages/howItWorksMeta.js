// Single source for the How It Works page's <head> tags. Read both by the page itself (for
// in-app navigation) and by the build (vite-plugins/staticPageMeta.js), which bakes them into the HTML
// that link-preview scrapers and search engines see. Plain JS on purpose: the build imports it
// from vite.config.js, outside the React bundle.

export const SITE_URL = 'https://pulse.affiliateroulette.com'

export const HOW_IT_WORKS_META = {
  path: '/how-it-works',
  title: 'How Pulse Works | Verified Messaging for iGaming',
  description: 'The verified communication platform for iGaming. Chat, call, share files and schedule meetings with professionals whose identity has been verified.',
  // Wide wordmark on dark, sized for link previews (roughly 16:9), so it shows as a large card
  // rather than a square icon cropped into the preview's banner.
  image: '/og-image.png',
  imageWidth: 2600,
  imageHeight: 1463,
  imageAlt: 'Pulse',
  twitterCard: 'summary_large_image',
}
