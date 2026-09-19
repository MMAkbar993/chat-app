import fs from 'fs'
import path from 'path'

// Link-preview scrapers (Telegram, LinkedIn, WhatsApp, Slack, X) read the raw HTML and never run
// the app's JavaScript, so a page that wants its own title and description in a shared link
// needs them in the HTML it is served. After the build, this writes a copy of index.html with
// the page's tags to dist/<path>/index.html. Nginx's existing `try_files $uri $uri/ /index.html`
// then serves that file for the page's URL, and the SPA boots from it exactly as it would from
// the root index.html — no Nginx change needed.
//
// Deliberately no dependencies beyond Node's own fs/path.

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
}

export function headTags({ siteUrl, path: pagePath, title, description, image }) {
  const url = `${siteUrl}${pagePath}`
  const imageUrl = image ? `${siteUrl}${image}` : null
  return [
    `<title>${escapeHtml(title)}</title>`,
    `<meta name="description" content="${escapeHtml(description)}" />`,
    `<link rel="canonical" href="${escapeHtml(url)}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="Pulse" />`,
    `<meta property="og:url" content="${escapeHtml(url)}" />`,
    `<meta property="og:title" content="${escapeHtml(title)}" />`,
    `<meta property="og:description" content="${escapeHtml(description)}" />`,
    ...(imageUrl ? [`<meta property="og:image" content="${escapeHtml(imageUrl)}" />`] : []),
    `<meta name="twitter:card" content="summary" />`,
    `<meta name="twitter:title" content="${escapeHtml(title)}" />`,
    `<meta name="twitter:description" content="${escapeHtml(description)}" />`,
    ...(imageUrl ? [`<meta name="twitter:image" content="${escapeHtml(imageUrl)}" />`] : []),
  ].join('\n    ')
}

export function writePageHtml(outDir, siteUrl, page) {
  const source = fs.readFileSync(path.join(outDir, 'index.html'), 'utf8')
  const html = source.replace(/<title>[\s\S]*?<\/title>/, headTags({ siteUrl, ...page }))
  // Fail the build loudly rather than silently shipping a page with the default tags.
  if (html === source) throw new Error('staticPageMeta: no <title> found in the built index.html')
  const dir = path.join(outDir, page.path.replace(/^\/+/, ''))
  fs.mkdirSync(dir, { recursive: true })
  fs.writeFileSync(path.join(dir, 'index.html'), html)
}

export default function staticPageMeta({ siteUrl, pages }) {
  let outDir
  return {
    name: 'static-page-meta',
    apply: 'build',
    configResolved(config) {
      outDir = path.resolve(config.root, config.build.outDir)
    },
    closeBundle() {
      for (const page of pages) writePageHtml(outDir, siteUrl, page)
    },
  }
}
