// The website verification picker's three options (WebsiteVerificationSection).
// The three ways to prove a website, and what each one grants. Admin comes only from changing
// the site or its DNS; a company email shows you work there, which is representation.
export const METHODS = [
  {
    key: 'meta',
    title: 'HTML Head Tag',
    grant: 'admin',
    blurb: "Add a meta tag to your website's <head> section.",
    points: ['Verifies ownership of the website', 'Shows the website on your public profile', 'Lets you manage the Business Profile & Reps'],
    icon: 'M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4',
    action: 'Verify with Head Tag',
  },
  {
    key: 'dns',
    title: 'DNS Record',
    grant: 'admin',
    blurb: "Add a TXT record to your domain's DNS settings.",
    points: ['Verifies ownership of the website', 'Shows the website on your public profile', 'Lets you manage the Business Profile & Reps'],
    icon: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4',
    action: 'Verify with DNS Record',
  },
  {
    key: 'email',
    title: 'Business Email',
    grant: 'rep',
    blurb: 'Verify using a company email address (e.g. name@yourcompany.com).',
    points: ['Confirms you work for the business', 'Shows the business on your public profile', 'Adds you as a Verified Representative'],
    icon: 'M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z',
    action: 'Verify with Business Email',
  },
]
