import axios from 'axios'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { isProUser } from '../utils/plan.js'
import {
  getCalendarConnection,
  upsertCalendarConnection,
  deleteCalendarConnection,
} from '../db/queries/calendar.js'

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
const SCOPE = 'https://www.googleapis.com/auth/calendar.readonly'

function redirectUri() {
  if (process.env.GOOGLE_CALENDAR_REDIRECT_URI) return process.env.GOOGLE_CALENDAR_REDIRECT_URI
  const base = process.env.BACKEND_URL
  return base ? `${base.replace(/\/$/, '')}/api/calendar/callback` : undefined
}

// Minimal self-closing popup page, matching the message shape social.controller.js's OAuth popups
// already send (`social-connect-success`/`social-connect-error`) so the existing generic frontend
// listener (frontend/src/utils/socialOAuth.js) picks this up without any changes.
function sendCalendarPopupResponse(res, { success, reason }) {
  const payload = success
    ? { type: 'social-connect-success', platform: 'calendar', ts: Date.now() }
    : { type: 'social-connect-error', reason: reason || 'Could not connect. Please try again.', ts: Date.now() }
  const json = JSON.stringify(payload)
  const safeReason = (reason || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${success ? 'Connected' : 'Connection failed'}</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb">
  <div style="background:#fff;border-radius:16px;padding:32px;max-width:360px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #f3f4f6">
    <h1 style="font-size:20px;margin:0 0 8px;color:#111">${success ? 'Google Calendar connected!' : 'Connection failed'}</h1>
    <p style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:1.5">${success ? 'This window should close automatically.' : safeReason}</p>
    <button onclick="window.close()" style="background:#7c3aed;color:#fff;border:none;border-radius:12px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;width:100%">Close window</button>
  </div>
  <script>
    var msg = ${json};
    try { localStorage.setItem('social-oauth-result', JSON.stringify(msg)); } catch (e) {}
    if (window.opener) { try { window.opener.postMessage(msg, '*'); } catch (e) {} }
    setTimeout(function () { window.close(); }, 800);
  </script>
</body></html>`)
}

export function calendarConnect(req, res) {
  if (!isProUser(req.user)) return res.status(403).json({ error: 'Google Calendar is a Pro feature' })

  const uri = redirectUri()
  if (!process.env.GOOGLE_CLIENT_ID || !uri) {
    return sendCalendarPopupResponse(res, { reason: 'Google Calendar is not configured on the server.' })
  }

  const state = jwt.sign({ sub: req.user.id, purpose: 'calendar' }, config.jwtSecret, { expiresIn: '10m' })
  const params = new URLSearchParams({
    client_id: process.env.GOOGLE_CLIENT_ID,
    redirect_uri: uri,
    response_type: 'code',
    scope: SCOPE,
    access_type: 'offline',
    prompt: 'consent', // forces a refresh_token every time, not just on first-ever consent
    state,
  })
  res.redirect(`${AUTH_URL}?${params.toString()}`)
}

export async function calendarCallback(req, res) {
  const { code, state, error } = req.query
  if (error) return sendCalendarPopupResponse(res, { reason: 'Google denied the request.' })

  let userId
  try {
    const payload = jwt.verify(state, config.jwtSecret)
    if (payload.purpose !== 'calendar') throw new Error('bad state')
    userId = payload.sub
  } catch {
    return sendCalendarPopupResponse(res, { reason: 'Session expired. Close this window and try connecting again.' })
  }

  try {
    const { data } = await axios.post(
      TOKEN_URL,
      new URLSearchParams({
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri(),
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    )

    const tokenExpiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null
    await upsertCalendarConnection(userId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt,
    })
    return sendCalendarPopupResponse(res, { success: true })
  } catch (err) {
    console.error('Calendar OAuth error:', err.response?.data || err.message)
    return sendCalendarPopupResponse(res, { reason: 'Could not connect Google Calendar. Please try again.' })
  }
}

export async function calendarEvents(req, res, next) {
  try {
    if (!isProUser(req.user)) return res.status(403).json({ error: 'Google Calendar is a Pro feature' })

    const conn = await getCalendarConnection(req.user.id)
    if (!conn) return res.status(404).json({ error: 'Not connected' })

    let accessToken = conn.access_token
    if (conn.token_expires_at && new Date(conn.token_expires_at) <= new Date()) {
      if (!conn.refresh_token) return res.status(409).json({ error: 'Connection expired. Please reconnect.' })
      const { data } = await axios.post(
        TOKEN_URL,
        new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: conn.refresh_token,
          client_id: process.env.GOOGLE_CLIENT_ID,
          client_secret: process.env.GOOGLE_CLIENT_SECRET,
        }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
      )
      accessToken = data.access_token
      const tokenExpiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null
      await upsertCalendarConnection(req.user.id, { accessToken, refreshToken: conn.refresh_token, tokenExpiresAt })
    }

    const { data } = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary/events', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { timeMin: new Date().toISOString(), singleEvents: true, orderBy: 'startTime', maxResults: 10 },
    })

    const events = (data.items || []).map((e) => ({
      id: e.id,
      title: e.summary || '(No title)',
      start: e.start?.dateTime || e.start?.date,
      end: e.end?.dateTime || e.end?.date,
      htmlLink: e.htmlLink,
    }))
    res.json({ events })
  } catch (err) {
    next(err)
  }
}

export async function calendarDisconnect(req, res, next) {
  try {
    await deleteCalendarConnection(req.user.id)
    res.json({ ok: true })
  } catch (err) {
    next(err)
  }
}
