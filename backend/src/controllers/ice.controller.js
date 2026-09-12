import crypto from 'crypto'

// STUN only tells a peer its public address. It cannot carry media, and it cannot help at all
// when both peers sit behind a NAT that refuses unsolicited inbound packets — which is the
// normal case on mobile data, where carrier-grade NAT is universal. Without a TURN relay to
// fall back on, a phone can complete signalling and show "connected" while no media ever
// flows: the call looks fine and nobody can see or hear anything.
const STUN_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
]

// Time-limited credentials, the scheme coturn implements as `use-auth-secret`: the username is
// an expiry timestamp and the password is its HMAC under a shared secret. The secret itself
// never leaves the server, and a leaked credential stops working within the TTL — static TURN
// passwords shipped to browsers get scraped and used to relay strangers' traffic at your cost.
const TURN_TTL_SECONDS = 4 * 60 * 60

function ephemeralCredentials(secret) {
  const username = String(Math.floor(Date.now() / 1000) + TURN_TTL_SECONDS)
  const credential = crypto.createHmac('sha1', secret).update(username).digest('base64')
  return { username, credential }
}

function turnUrls() {
  return (process.env.TURN_URLS || '')
    .split(',')
    .map((u) => u.trim())
    .filter(Boolean)
}

export function buildIceServers() {
  const urls = turnUrls()
  if (urls.length === 0) return STUN_SERVERS

  if (process.env.TURN_SECRET) {
    const { username, credential } = ephemeralCredentials(process.env.TURN_SECRET)
    return [...STUN_SERVERS, { urls, username, credential }]
  }
  if (process.env.TURN_USERNAME && process.env.TURN_CREDENTIAL) {
    return [
      ...STUN_SERVERS,
      { urls, username: process.env.TURN_USERNAME, credential: process.env.TURN_CREDENTIAL },
    ]
  }
  // URLs configured but no way to authenticate — send STUN rather than a server that will
  // reject every allocation, so the failure shows up in the logs instead of silently.
  console.warn('TURN_URLS is set but neither TURN_SECRET nor TURN_USERNAME/TURN_CREDENTIAL is — ignoring TURN.')
  return STUN_SERVERS
}

export async function getIceServers(req, res, next) {
  try {
    const iceServers = buildIceServers()
    res.json({
      iceServers,
      // Lets the client warn that calls will fail off-LAN rather than leaving people to
      // discover it mid-call.
      hasTurn: iceServers.some((s) => String(s.urls).includes('turn:') || String(s.urls).includes('turns:')),
    })
  } catch (err) {
    next(err)
  }
}
