import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'
import { query } from '../config/database.js'
import { config } from '../config/env.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const INDEX_HTML_PATH = path.join(__dirname, '../../../frontend/dist/index.html')
const DEFAULT_IMAGE = '/Icon.png'

function escapeHtml(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

function buildMetaTags({ title, description, image, url }) {
  return `
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
      template = fs.readFileSync(INDEX_HTML_PATH, 'utf-8')
    } catch {
      return res.status(503).send('Frontend build not found')
    }

    const result = await query(
      `SELECT display_name, full_name, bio, avatar_url FROM users WHERE username = $1`,
      [username]
    )
    const user = result.rows[0]

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
    res.set('Content-Type', 'text/html').send(html)
  } catch (err) {
    next(err)
  }
}
