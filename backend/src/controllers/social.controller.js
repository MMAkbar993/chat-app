import crypto from 'crypto'
import axios from 'axios'
import jwt from 'jsonwebtoken'
import { upsertSocialConnection, deleteSocialConnection } from '../db/queries/auth_extras.js'
import { config } from '../config/env.js'

// X rejects state values over 500 chars — use short opaque state for PKCE platforms
const oauthStateMap = new Map()

// Twitter uses /api/social/x/callback in provider dashboards
const CALLBACK_PATH_ALIASES = { twitter: 'x' }

function resolveSocialPlatform(platform) {
  if (platform === 'x') return 'twitter'
  return platform
}

function callbackPath(platform) {
  const segment = CALLBACK_PATH_ALIASES[platform] || platform
  return `/api/social/${segment}/callback`
}

function getRedirectUri(platform, envKey) {
  const explicit = process.env[envKey]
  if (explicit) return explicit
  const base = process.env.BACKEND_URL || process.env.API_BASE_URL
  if (base) return `${base.replace(/\/$/, '')}${callbackPath(platform)}`
  return undefined
}

function generatePKCE() {
  const verifier = crypto.randomBytes(32).toString('base64url')
  const challenge = crypto.createHash('sha256').update(verifier).digest('base64url')
  return { verifier, challenge }
}

const OAUTH_RESULT_STORAGE_KEY = 'social-oauth-result'

const PLATFORM_LABELS = {
  facebook: 'Facebook',
  instagram: 'Instagram',
  twitter: 'X (Twitter)',
  linkedin: 'LinkedIn',
  youtube: 'YouTube',
  kick: 'Kick',
  twitch: 'Twitch',
}

function platformLabel(platform) {
  return PLATFORM_LABELS[platform] || (platform ? platform.charAt(0).toUpperCase() + platform.slice(1) : 'Account')
}

function oauthPopupStyles() {
  return `body{font-family:system-ui,sans-serif;margin:0;min-height:100vh;display:flex;align-items:center;justify-content:center;background:#f9fafb;padding:24px}
.card{background:#fff;border-radius:16px;padding:32px;max-width:360px;width:100%;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #f3f4f6}
.icon{width:56px;height:56px;border-radius:50%;display:flex;align-items:center;justify-content:center;margin:0 auto 16px}
.icon.ok{background:#dcfce7}.icon.err{background:#fee2e2}
h1{font-size:20px;margin:0 0 8px;color:#111}p{font-size:14px;color:#6b7280;margin:0 0 24px;line-height:1.5}
button{background:#7c3aed;color:#fff;border:none;border-radius:12px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;width:100%}
button:hover{background:#6d28d9}`
}

function notifyOpenerAndStore(payload) {
  const json = JSON.stringify(payload)
  return `(function(){
  var msg=${json};
  try{localStorage.setItem(${JSON.stringify(OAUTH_RESULT_STORAGE_KEY)},JSON.stringify(msg));}catch(e){}
  if(window.opener){try{window.opener.postMessage(msg,'*');}catch(e){}}
  setTimeout(function(){try{window.close();}catch(e){}},400);
})();`
}

function sendOAuthPopupResponse(res, { success, platform, reason }) {
  const label = platformLabel(platform)

  if (success) {
    const payload = { type: 'social-connect-success', platform, ts: Date.now() }
    return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Connected</title>
<style>${oauthPopupStyles()}</style></head><body>
<div class="card">
  <div class="icon ok"><svg width="28" height="28" fill="none" stroke="#16a34a" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7"/></svg></div>
  <h1>${label} connected!</h1>
  <p>Your ${label} account was linked successfully. You can close this window and return to Settings.</p>
  <button type="button" onclick="window.close()">Close window</button>
</div>
<script>${notifyOpenerAndStore(payload)}</script>
</body></html>`)
  }

  const safeReason = reason || 'Could not connect account. Please try again.'
  const payload = { type: 'social-connect-error', reason: safeReason, ts: Date.now() }
  return res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>Connection failed</title>
<style>${oauthPopupStyles()}</style></head><body>
<div class="card">
  <div class="icon err"><svg width="28" height="28" fill="none" stroke="#ef4444" stroke-width="2" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" d="M6 18L18 6M6 6l12 12"/></svg></div>
  <h1>Connection failed</h1>
  <p>${safeReason.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
  <button type="button" onclick="window.close()">Close window</button>
</div>
<script>${notifyOpenerAndStore(payload)}</script>
</body></html>`)
}

const PLATFORMS = {
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    profileUrl: 'https://api.linkedin.com/v2/userinfo',
    clientId: () => process.env.LINKEDIN_CLIENT_ID,
    clientSecret: () => process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: () => getRedirectUri('linkedin', 'LINKEDIN_REDIRECT_URI'),
    scope: 'openid profile email',
    extractProfile: (data) => ({
      platformUserId: data.sub,
      username: data.email,
      displayName: data.name,
      profileUrl: `https://www.linkedin.com/in/${data.sub}`,
    }),
  },
  youtube: {
    authUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
    tokenUrl: 'https://oauth2.googleapis.com/token',
    profileUrl: 'https://www.googleapis.com/oauth2/v3/userinfo',
    clientId: () => process.env.GOOGLE_CLIENT_ID,
    clientSecret: () => process.env.GOOGLE_CLIENT_SECRET,
    redirectUri: () => getRedirectUri('youtube', 'GOOGLE_REDIRECT_URI'),
    scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly',
    extraAuthParams: { access_type: 'offline', prompt: 'consent' },
    extractProfile: (data) => ({
      platformUserId: data.sub,
      username: data.channelHandle || data.email,
      displayName: data.channelTitle || data.name,
      profileUrl: data.channelUrl || `https://youtube.com/channel/${data.channelId || data.sub}`,
    }),
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    profileUrl: 'https://graph.facebook.com/me?fields=id,name,email,link',
    clientId: () => process.env.FACEBOOK_CLIENT_ID,
    clientSecret: () => process.env.FACEBOOK_CLIENT_SECRET,
    redirectUri: () => getRedirectUri('facebook', 'FACEBOOK_REDIRECT_URI'),
    scope: 'public_profile,email',
    extractProfile: (data) => ({
      platformUserId: data.id,
      username: data.email || data.name,
      displayName: data.name,
      profileUrl: data.link || `https://facebook.com/${data.id}`,
    }),
  },
  instagram: {
    authUrl: 'https://api.instagram.com/oauth/authorize',
    tokenUrl: 'https://api.instagram.com/oauth/access_token',
    profileUrl: 'https://graph.instagram.com/me?fields=id,username',
    clientId: () => process.env.INSTAGRAM_CLIENT_ID,
    clientSecret: () => process.env.INSTAGRAM_CLIENT_SECRET,
    redirectUri: () => getRedirectUri('instagram', 'INSTAGRAM_REDIRECT_URI'),
    scope: 'instagram_business_basic',
    extractProfile: (data) => ({
      platformUserId: data.id,
      username: data.username,
      displayName: data.username,
      profileUrl: `https://instagram.com/${data.username}`,
    }),
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.x.com/2/oauth2/token',
    profileUrl: 'https://api.x.com/2/users/me?user.fields=username,name',
    clientId: () => process.env.TWITTER_CLIENT_ID,
    clientSecret: () => process.env.TWITTER_CLIENT_SECRET,
    redirectUri: () => getRedirectUri('twitter', 'TWITTER_REDIRECT_URI'),
    scope: () => process.env.TWITTER_SCOPE || 'users.read offline.access',
    pkce: true,
    shortState: true,
    extractProfile: (data) => ({
      platformUserId: data.data?.id,
      username: data.data?.username,
      displayName: data.data?.name,
      profileUrl: `https://twitter.com/${data.data?.username}`,
    }),
  },
  twitch: {
    authUrl: 'https://id.twitch.tv/oauth2/authorize',
    tokenUrl: 'https://id.twitch.tv/oauth2/token',
    profileUrl: 'https://api.twitch.tv/helix/users',
    clientId: () => process.env.TWITCH_CLIENT_ID,
    clientSecret: () => process.env.TWITCH_CLIENT_SECRET,
    redirectUri: () => getRedirectUri('twitch', 'TWITCH_REDIRECT_URI'),
    scope: 'user:read:email',
    extractProfile: (data) => {
      const u = data.data?.[0]
      return {
        platformUserId: u?.id,
        username: u?.login,
        displayName: u?.display_name,
        profileUrl: `https://twitch.tv/${u?.login}`,
      }
    },
  },
  kick: {
    authUrl: 'https://id.kick.com/oauth/authorize',
    tokenUrl: 'https://id.kick.com/oauth/token',
    profileUrl: 'https://api.kick.com/public/v1/users',
    clientId: () => process.env.KICK_CLIENT_ID,
    clientSecret: () => process.env.KICK_CLIENT_SECRET,
    redirectUri: () => getRedirectUri('kick', 'KICK_REDIRECT_URI'),
    scope: 'user:read',
    pkce: true,
    shortState: true,
    extractProfile: (data) => {
      const u = data.data?.[0]
      return {
        platformUserId: String(u?.user_id ?? ''),
        username: u?.name || null,
        displayName: u?.name || null,
        profileUrl: null,
      }
    },
  },
}

async function exchangeInstagramLongLivedToken(shortLivedToken, clientSecret) {
  const response = await axios.get('https://graph.instagram.com/access_token', {
    params: {
      grant_type: 'ig_exchange_token',
      client_secret: clientSecret,
      access_token: shortLivedToken,
    },
  })
  return response.data.access_token || shortLivedToken
}

async function fetchYoutubeProfile(accessToken, baseProfile) {
  try {
    const response = await axios.get('https://www.googleapis.com/youtube/v3/channels', {
      params: { part: 'snippet', mine: true },
      headers: { Authorization: `Bearer ${accessToken}` },
    })
    const channel = response.data.items?.[0]
    if (!channel) return baseProfile

    const handle = channel.snippet?.customUrl?.replace(/^@/, '')
    return {
      ...baseProfile,
      channelId: channel.id,
      channelTitle: channel.snippet?.title || baseProfile.name,
      channelHandle: handle || channel.snippet?.title,
      channelUrl: handle
        ? `https://youtube.com/@${handle}`
        : `https://youtube.com/channel/${channel.id}`,
    }
  } catch {
    return baseProfile
  }
}

export function socialConnect(req, res) {
  const platform = resolveSocialPlatform(req.params.platform)
  const cfg = PLATFORMS[platform]
  if (!cfg) return res.status(404).json({ error: 'Unknown platform' })

  const redirectUri = cfg.redirectUri()
  if (!cfg.clientId() || !redirectUri) {
    const reason = `${platformLabel(platform)} OAuth is not configured. Set the client ID, secret and redirect URL (or BACKEND_URL).`
    return sendOAuthPopupResponse(res, { reason, platform })
  }

  const pkce = cfg.pkce ? generatePKCE() : null

  let state
  if (cfg.shortState) {
    state = crypto.randomBytes(16).toString('hex')
    oauthStateMap.set(state, { userId: req.user.id, platform, pkceVerifier: pkce?.verifier || null })
    setTimeout(() => oauthStateMap.delete(state), 10 * 60 * 1000)
  } else {
    state = jwt.sign(
      {
        sub: req.user.id,
        platform,
        ...(pkce && { pv: pkce.verifier }),
      },
      config.jwtSecret,
      { expiresIn: '10m' },
    )
  }

  const scope = typeof cfg.scope === 'function' ? cfg.scope() : cfg.scope

  const params = new URLSearchParams({
    client_id: cfg.clientId(),
    redirect_uri: redirectUri,
    scope,
    response_type: 'code',
    state,
  })

  if (pkce) {
    params.set('code_challenge', pkce.challenge)
    params.set('code_challenge_method', 'S256')
  }

  if (cfg.extraAuthParams) {
    for (const [key, value] of Object.entries(cfg.extraAuthParams)) {
      params.set(key, value)
    }
  }

  // X expects space-encoded scopes (%20), not +
  const query = platform === 'twitter'
    ? params.toString().replace(/\+/g, '%20')
    : params.toString()

  res.redirect(`${cfg.authUrl}?${query}`)
}

export async function socialCallback(req, res) {
  const platform = resolveSocialPlatform(req.params.platform)
  const { code, state, error, error_description: errorDescription } = req.query
  const cfg = PLATFORMS[platform]

  if (!cfg) {
    return sendOAuthPopupResponse(res, { reason: 'Unknown platform.' })
  }

  if (error) {
    let reason = error === 'access_denied'
      ? 'Access was denied or the authorization expired. Try connecting again.'
      : (errorDescription || 'Could not connect account. Please try again.')
    if (platform === 'twitter' && !errorDescription) {
      reason = 'X could not authorize the app. In the X Developer Portal, set Type of App to Web App, enable OAuth 2.0, and add callback URL exactly: ' + (cfg.redirectUri() || 'your TWITTER_REDIRECT_URI') + ' — with scopes users.read and offline.access enabled.'
    }
    return sendOAuthPopupResponse(res, { reason, platform })
  }

  let userId
  let pkceVerifier = null

  const mapEntry = oauthStateMap.get(state)
  if (mapEntry) {
    oauthStateMap.delete(state)
    if (mapEntry.platform !== platform) {
      return sendOAuthPopupResponse(res, { reason: 'Invalid OAuth state. Please try again.' })
    }
    userId = mapEntry.userId
    pkceVerifier = mapEntry.pkceVerifier
  } else {
    try {
      const stateEntry = jwt.verify(state, config.jwtSecret)
      if (stateEntry.platform !== platform) {
        return sendOAuthPopupResponse(res, { reason: 'Invalid OAuth state. Please try again.' })
      }
      userId = stateEntry.sub
      pkceVerifier = stateEntry.pv || null
    } catch {
      return sendOAuthPopupResponse(res, { reason: 'Session expired. Close this window and try connecting again.' })
    }
  }

  const redirectUri = cfg.redirectUri()

  try {
    let tokenData

    if (platform === 'twitter') {
      const bodyParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        code_verifier: pkceVerifier,
        client_id: cfg.clientId(),
      })
      const credentials = Buffer.from(`${cfg.clientId()}:${cfg.clientSecret()}`).toString('base64')
      const response = await axios.post(cfg.tokenUrl, bodyParams.toString(), {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${credentials}`,
        },
      })
      tokenData = response.data
    } else if (platform === 'kick') {
      const bodyParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: cfg.clientId(),
        client_secret: cfg.clientSecret(),
        code_verifier: pkceVerifier,
      })
      const response = await axios.post(cfg.tokenUrl, bodyParams.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      tokenData = response.data
    } else if (platform === 'instagram') {
      const form = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: cfg.clientId(),
        client_secret: cfg.clientSecret(),
      })
      const response = await axios.post(cfg.tokenUrl, form.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      tokenData = response.data
    } else {
      const tokenParams = new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
        client_id: cfg.clientId(),
        client_secret: cfg.clientSecret(),
        ...(pkceVerifier && { code_verifier: pkceVerifier }),
      })
      const response = await axios.post(cfg.tokenUrl, tokenParams.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      tokenData = response.data
    }

    let accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token || null
    const expiresIn = tokenData.expires_in
    let tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    if (platform === 'instagram') {
      accessToken = await exchangeInstagramLongLivedToken(accessToken, cfg.clientSecret())
      tokenExpiresAt = new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
    }

    let profileData
    if (platform === 'twitch') {
      const response = await axios.get(cfg.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': cfg.clientId(),
        },
      })
      profileData = response.data
    } else if (platform === 'kick') {
      const response = await axios.get(cfg.profileUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      profileData = response.data
    } else if (platform === 'facebook') {
      const response = await axios.get(`${cfg.profileUrl}&access_token=${accessToken}`)
      profileData = response.data
    } else if (platform === 'youtube') {
      const response = await axios.get(cfg.profileUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      profileData = await fetchYoutubeProfile(accessToken, response.data)
    } else {
      const response = await axios.get(cfg.profileUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      })
      profileData = response.data
    }

    const profile = cfg.extractProfile(profileData)
    await upsertSocialConnection(userId, platform, {
      ...profile,
      accessToken,
      refreshToken,
      tokenExpiresAt,
    })

    sendOAuthPopupResponse(res, { success: true, platform })
  } catch (err) {
    const detail = err.response?.data
    console.error(`Social auth error (${platform}):`, detail || err.message)

    let reason = 'Could not connect account. Please try again.'
    if (platform === 'facebook' && detail?.error?.message) {
      reason = detail.error.message
    } else if (platform === 'instagram' && detail?.error_message) {
      reason = detail.error_message
    } else if (detail?.error_description) {
      reason = detail.error_description
    } else if (detail?.error) {
      reason = typeof detail.error === 'string' ? detail.error : reason
    }

    sendOAuthPopupResponse(res, { reason })
  }
}

export async function saveLinkedinUrl(req, res, next) {
  try {
    const { url } = req.body
    if (!url || !url.trim()) return res.status(400).json({ error: 'URL is required' })
    const trimmed = url.trim()
    if (!trimmed.includes('linkedin.com/in/')) {
      return res.status(400).json({ error: 'Please provide a valid LinkedIn profile URL' })
    }
    await upsertSocialConnection(req.user.id, 'linkedin', {
      platformUserId: null,
      username: null,
      displayName: null,
      profileUrl: trimmed,
      accessToken: null,
      refreshToken: null,
      tokenExpiresAt: null,
    })
    res.json({ success: true, profileUrl: trimmed })
  } catch (err) {
    next(err)
  }
}

export async function saveAffiliateRouletteUrl(req, res, next) {
  try {
    const { url } = req.body
    const trimmed = (url || '').trim()
    if (trimmed && !trimmed.startsWith('http')) {
      return res.status(400).json({ error: 'Please provide a valid URL starting with http(s)://' })
    }
    if (trimmed) {
      await upsertSocialConnection(req.user.id, 'affiliate_roulette', {
        platformUserId: null,
        username: null,
        displayName: null,
        profileUrl: trimmed,
        accessToken: null,
        refreshToken: null,
        tokenExpiresAt: null,
      })
    } else {
      await deleteSocialConnection(req.user.id, 'affiliate_roulette')
    }
    res.json({ success: true, profileUrl: trimmed || null })
  } catch (err) {
    next(err)
  }
}

export async function socialDisconnect(req, res, next) {
  try {
    const platform = resolveSocialPlatform(req.params.platform)
    if (!PLATFORMS[platform]) return res.status(404).json({ error: 'Unknown platform' })
    await deleteSocialConnection(req.user.id, platform)
    res.json({ message: `${platform} disconnected` })
  } catch (err) {
    next(err)
  }
}
