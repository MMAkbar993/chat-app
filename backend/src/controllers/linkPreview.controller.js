import dns from 'dns/promises'
import net from 'net'
import axios from 'axios'

const FETCH_TIMEOUT_MS = 5000
const MAX_BYTES = 2 * 1024 * 1024
const USER_AGENT = 'Mozilla/5.0 (compatible; PulseLinkPreview/1.0; +https://pulse.affiliateroulette.com)'

// In-memory cache — link previews are cheap to re-derive but expensive (a real network round
// trip) to fetch, and the same URL is commonly shared/forwarded by multiple users/messages.
const cache = new Map() // url -> { data, expires }
const CACHE_TTL_MS = 60 * 60 * 1000

function isPrivateIp(ip) {
  if (net.isIPv4(ip)) {
    const [a, b] = ip.split('.').map(Number)
    return (
      a === 10 ||
      a === 127 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      a === 0
    )
  }
  // IPv6 loopback/link-local/unique-local
  return ip === '::1' || ip.startsWith('fe80:') || ip.startsWith('fc') || ip.startsWith('fd')
}

// Fetching an arbitrary user-supplied URL server-side is a classic SSRF vector (probing internal
// services, cloud metadata endpoints, etc.) — resolve the hostname ourselves and refuse anything
// that lands on a private/loopback/link-local address instead of trusting axios to just fetch it.
async function assertPublicUrl(url) {
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    throw new Error('Invalid URL')
  }
  if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('Only http/https URLs are supported')
  const hostname = parsed.hostname
  if (hostname === 'localhost') throw new Error('URL not allowed')
  const records = await dns.lookup(hostname, { all: true })
  if (records.some((r) => isPrivateIp(r.address))) throw new Error('URL not allowed')
  return parsed
}

function extractMeta(html, attrs) {
  for (const attr of attrs) {
    const re = new RegExp(`<meta[^>]+(?:property|name)=["']${attr}["'][^>]+content=["']([^"']*)["']`, 'i')
    const match = html.match(re) || html.match(new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${attr}["']`, 'i'))
    if (match) return match[1]
  }
  return null
}

function decodeEntities(str) {
  if (!str) return str
  return str
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#0?39;/g, "'")
}

function resolveUrl(maybeRelative, base) {
  if (!maybeRelative) return null
  try {
    return new URL(maybeRelative, base).toString()
  } catch {
    return null
  }
}

export async function getLinkPreview(req, res, next) {
  try {
    const { url } = req.query
    if (!url) return res.status(400).json({ error: 'url required' })

    const cached = cache.get(url)
    if (cached && cached.expires > Date.now()) return res.json(cached.data)
    if (cache.size > 1000) cache.clear() // crude bound on unbounded growth

    const parsed = await assertPublicUrl(url)

    const response = await axios.get(parsed.toString(), {
      timeout: FETCH_TIMEOUT_MS,
      maxContentLength: MAX_BYTES,
      maxRedirects: 5,
      headers: { 'User-Agent': USER_AGENT, Accept: 'text/html' },
      responseType: 'text',
      validateStatus: (s) => s >= 200 && s < 300,
    })

    const contentType = response.headers['content-type'] || ''
    if (!contentType.includes('text/html')) {
      const data = null
      cache.set(url, { data, expires: Date.now() + CACHE_TTL_MS })
      return res.json(data)
    }

    const html = response.data
    const finalUrl = response.request?.res?.responseUrl || parsed.toString()
    const titleTagMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)

    const data = {
      url: finalUrl,
      title: decodeEntities(extractMeta(html, ['og:title', 'twitter:title']) || titleTagMatch?.[1]?.trim() || null),
      description: decodeEntities(extractMeta(html, ['og:description', 'twitter:description', 'description'])),
      image: resolveUrl(extractMeta(html, ['og:image', 'twitter:image']), finalUrl),
      siteName: decodeEntities(extractMeta(html, ['og:site_name'])) || new URL(finalUrl).hostname,
    }

    if (!data.title && !data.description && !data.image) {
      cache.set(url, { data: null, expires: Date.now() + CACHE_TTL_MS })
      return res.json(null)
    }

    cache.set(url, { data, expires: Date.now() + CACHE_TTL_MS })
    res.json(data)
  } catch {
    // Any failure (unreachable host, blocked by SSRF guard, timeout, non-2xx, etc.) just means
    // no preview — the message itself still renders fine as plain linkified text.
    res.json(null)
  }
}
