import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { config } from '../config/env.js'
import { loadPublicProfile } from '../services/publicProfile.service.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INDEX_HTML_PATH = path.join(__dirname, '../../../frontend/dist/index.html')
const DEFAULT_IMAGE = '/Icon.png'

// index.html only changes on deploy, so it is read once and again only when the file's modified
// time moves, instead of a blocking disk read on every visit.
let templateCache = { mtimeMs: 0, html: null }
function readTemplate() {
  const { mtimeMs } = fs.statSync(INDEX_HTML_PATH)
  if (mtimeMs !== templateCache.mtimeMs || !templateCache.html) {
    templateCache = { mtimeMs, html: withoutSiteMeta(fs.readFileSync(INDEX_HTML_PATH, 'utf-8')) }
  }
  return templateCache.html
}

// The build bakes the home page's description and og:/twitter: tags into index.html as site-wide
// defaults (vite-plugins/staticPageMeta.js). Scrapers read the first tag of each kind, so left in,
// they won over the member's own tags added below and every profile link previewed as the home
// page. og:site_name is the same for every page, so it stays.
const SITE_META = /<meta\s+(?:name="description"|property="og:(?!site_name)[^"]*"|name="twitter:[^"]*")[^>]*>\s*/g
function withoutSiteMeta(html) {
  return html.replace(SITE_META, '')
}

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function buildMetaTags({ title, description, image, url }) {
  return `
    <meta name="description" content="${escapeHtml(description)}" />
    <meta property="og:type" content="profile" />
    <meta property="og:title" content="${escapeHtml(title)}" />
    <meta property="og:description" content="${escapeHtml(description)}" />
    <meta property="og:image" content="${escapeHtml(image)}" />
    <meta property="og:url" content="${escapeHtml(url)}" />
    <meta name="twitter:card" content="summary" />
    <meta name="twitter:title" content="${escapeHtml(title)}" />
    <meta name="twitter:description" content="${escapeHtml(description)}" />
    <meta name="twitter:image" content="${escapeHtml(image)}" />
  </head>`
}

export async function publicProfileOg(req, res, next) {
  try {
    const { username } = req.params
    const url = `${config.frontendUrl}/u/${encodeURIComponent(username)}`

    let template
    try {
      template = readTemplate()
    } catch {
      return res.status(503).send('Frontend build not found')
    }

    const user = await loadPublicProfile(username)

    const meta = user
      ? {
          title: `${user.display_name || user.full_name} (@${username}) on Pulse`,
          description: user.bio || `Chat with ${user.display_name || user.full_name} on Pulse.`,
          image: `${config.frontendUrl}${user.avatar_url || DEFAULT_IMAGE}`,
          url,
        }
      : {
          title: 'Pulse',
          description: 'Chat, call and connect on Pulse.',
          image: `${config.frontendUrl}${DEFAULT_IMAGE}`,
          url,
        }

    const html = template
      .replace(/<title>.*?<\/title>/, `<title>${escapeHtml(meta.title)}</title>`)
      .replace('</head>', buildMetaTags(meta))
    // This is the app's page itself for people (not only scrapers), so browsers must re-check
    // it: a deploy has to show up on the next visit.
    res.set('Content-Type', 'text/html').set('Cache-Control', 'no-cache').send(html)
  } catch (err) {
    next(err)
  }
}
