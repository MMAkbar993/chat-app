import axios from 'axios'
import { upsertSocialConnection, deleteSocialConnection } from '../db/queries/auth_extras.js'
import { config } from '../config/env.js'

const FRONTEND = config.frontendUrl

const PLATFORMS = {
  linkedin: {
    authUrl: 'https://www.linkedin.com/oauth/v2/authorization',
    tokenUrl: 'https://www.linkedin.com/oauth/v2/accessToken',
    profileUrl: 'https://api.linkedin.com/v2/userinfo',
    clientId: () => process.env.LINKEDIN_CLIENT_ID,
    clientSecret: () => process.env.LINKEDIN_CLIENT_SECRET,
    redirectUri: () => process.env.LINKEDIN_REDIRECT_URI,
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
    redirectUri: () => process.env.GOOGLE_REDIRECT_URI,
    scope: 'openid email profile https://www.googleapis.com/auth/youtube.readonly',
    extractProfile: (data) => ({
      platformUserId: data.sub,
      username: data.email,
      displayName: data.name,
      profileUrl: `https://youtube.com/@${data.sub}`,
    }),
  },
  facebook: {
    authUrl: 'https://www.facebook.com/v19.0/dialog/oauth',
    tokenUrl: 'https://graph.facebook.com/v19.0/oauth/access_token',
    profileUrl: 'https://graph.facebook.com/me?fields=id,name,email,link',
    clientId: () => process.env.FACEBOOK_CLIENT_ID,
    clientSecret: () => process.env.FACEBOOK_CLIENT_SECRET,
    redirectUri: () => process.env.FACEBOOK_REDIRECT_URI,
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
    redirectUri: () => process.env.INSTAGRAM_REDIRECT_URI,
    scope: 'user_profile',
    extractProfile: (data) => ({
      platformUserId: data.id,
      username: data.username,
      displayName: data.username,
      profileUrl: `https://instagram.com/${data.username}`,
    }),
  },
  twitter: {
    authUrl: 'https://twitter.com/i/oauth2/authorize',
    tokenUrl: 'https://api.twitter.com/2/oauth2/token',
    profileUrl: 'https://api.twitter.com/2/users/me',
    clientId: () => process.env.TWITTER_CLIENT_ID,
    clientSecret: () => process.env.TWITTER_CLIENT_SECRET,
    redirectUri: () => process.env.TWITTER_REDIRECT_URI,
    scope: 'users.read tweet.read offline.access',
    pkce: true,
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
    redirectUri: () => process.env.TWITCH_REDIRECT_URI,
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
    authUrl: 'https://kick.com/oauth2/authorize',
    tokenUrl: 'https://kick.com/oauth2/token',
    profileUrl: 'https://kick.com/api/v1/user',
    clientId: () => process.env.KICK_CLIENT_ID,
    clientSecret: () => process.env.KICK_CLIENT_SECRET,
    redirectUri: () => process.env.KICK_REDIRECT_URI,
    scope: 'user:read',
    extractProfile: (data) => ({
      platformUserId: String(data.id),
      username: data.username,
      displayName: data.name,
      profileUrl: `https://kick.com/${data.username}`,
    }),
  },
}

// Store OAuth state -> userId in memory (fine for single-instance; use Redis in prod)
const oauthStateMap = new Map()

export function socialConnect(req, res) {
  const { platform } = req.params
  const cfg = PLATFORMS[platform]
  if (!cfg) return res.status(404).json({ error: 'Unknown platform' })

  const state = `${req.user.id}:${Date.now()}:${Math.random().toString(36).slice(2)}`
  oauthStateMap.set(state, req.user.id)
  // Clean old states after 10 minutes
  setTimeout(() => oauthStateMap.delete(state), 10 * 60 * 1000)

  const params = new URLSearchParams({
    client_id: cfg.clientId(),
    redirect_uri: cfg.redirectUri(),
    scope: cfg.scope,
    response_type: 'code',
    state,
  })

  res.redirect(`${cfg.authUrl}?${params}`)
}

export async function socialCallback(req, res) {
  const { platform } = req.params
  const { code, state, error } = req.query
  const cfg = PLATFORMS[platform]

  if (!cfg) return res.redirect(`${FRONTEND}/social-error?reason=unknown_platform`)
  if (error) return res.redirect(`${FRONTEND}/social-error?reason=${encodeURIComponent(error)}`)

  const userId = oauthStateMap.get(state)
  if (!userId) return res.redirect(`${FRONTEND}/social-error?reason=invalid_state`)
  oauthStateMap.delete(state)

  try {
    // Exchange code for token
    const tokenParams = {
      grant_type: 'authorization_code',
      code,
      redirect_uri: cfg.redirectUri(),
      client_id: cfg.clientId(),
      client_secret: cfg.clientSecret(),
    }

    let tokenData
    if (platform === 'instagram') {
      const form = new URLSearchParams(tokenParams)
      const response = await axios.post(cfg.tokenUrl, form.toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      tokenData = response.data
    } else {
      const response = await axios.post(cfg.tokenUrl, new URLSearchParams(tokenParams).toString(), {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      })
      tokenData = response.data
    }

    const accessToken = tokenData.access_token
    const refreshToken = tokenData.refresh_token || null
    const expiresIn = tokenData.expires_in
    const tokenExpiresAt = expiresIn ? new Date(Date.now() + expiresIn * 1000) : null

    // Fetch profile
    let profileData
    if (platform === 'twitch') {
      const response = await axios.get(cfg.profileUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Client-Id': cfg.clientId(),
        },
      })
      profileData = response.data
    } else if (platform === 'facebook') {
      const response = await axios.get(`${cfg.profileUrl}&access_token=${accessToken}`)
      profileData = response.data
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

    // Close popup and signal success to parent window
    res.send(`
      <html><body><script>
        if (window.opener) {
          window.opener.postMessage({type:'social-connect-success',platform:'${platform}'}, '${FRONTEND}');
          window.close();
        } else {
          window.location.href = '${FRONTEND}/chat';
        }
      </script></body></html>
    `)
  } catch (err) {
    console.error(`Social auth error (${platform}):`, err.message)
    res.redirect(`${FRONTEND}/social-error?reason=${encodeURIComponent('Connection failed')}`)
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

export async function socialDisconnect(req, res, next) {
  try {
    const { platform } = req.params
    if (!PLATFORMS[platform]) return res.status(404).json({ error: 'Unknown platform' })
    await deleteSocialConnection(req.user.id, platform)
    res.json({ message: `${platform} disconnected` })
  } catch (err) {
    next(err)
  }
}
