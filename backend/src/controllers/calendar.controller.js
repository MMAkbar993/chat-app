import axios from 'axios'
import jwt from 'jsonwebtoken'
import { randomUUID } from 'crypto'
import { config } from '../config/env.js'
import { isProUser } from '../utils/plan.js'
import {
  getCalendarConnection,
  upsertCalendarConnection,
  deleteCalendarConnection,
} from '../db/queries/calendar.js'
import { isParticipant, getParticipants, getOtherParticipantEmail } from '../db/queries/conversations.js'
import { createMessage } from '../db/queries/messages.js'
import { getIo } from '../socket/index.js'

const AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const TOKEN_URL = 'https://oauth2.googleapis.com/token'
// calendar.events (not the broader calendar scope) — read/write on events specifically, without
// calendar-management/sharing permissions this app has no use for.
const SCOPE = 'https://www.googleapis.com/auth/calendar.events'

function redirectUri() {
  if (process.env.GOOGLE_CALENDAR_REDIRECT_URI) return process.env.GOOGLE_CALENDAR_REDIRECT_URI
  const base = process.env.BACKEND_URL
  return base ? `${base.replace(/\/$/, '')}/api/calendar/callback` : undefined
}

function escapeHtmlAttr(str) {
  return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))
}

// Minimal self-closing popup page, matching the message shape social.controller.js's OAuth popups
// already send (`social-connect-success`/`social-connect-error`) so the existing generic frontend
// listener (frontend/src/utils/socialOAuth.js) picks this up without any changes. Close/notify
// logic lives in the external /api/static/oauth-popup.js, not an inline <script> here — Helmet's CSP
// (script-src 'self', script-src-attr 'none') blocks inline scripts and onclick= attributes
// outright, with no exception carved out for this response.
function sendCalendarPopupResponse(res, { success, reason }) {
  const payload = success
    ? { type: 'social-connect-success', platform: 'calendar', ts: Date.now() }
    : { type: 'social-connect-error', reason: reason || 'Could not connect. Please try again.', ts: Date.now() }
  const safeReason = (reason || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')
  res.send(`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${success ? 'Connected' : 'Connection failed'}</title></head>
<body style="font-family:system-ui,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;margin:0;background:#f9fafb">
  <div style="background:#fff;border-radius:16px;padding:32px;max-width:360px;text-align:center;box-shadow:0 1px 3px rgba(0,0,0,.08);border:1px solid #f3f4f6">
    <h1 style="font-size:20px;margin:0 0 8px;color:#111">${success ? 'Google Calendar connected!' : 'Connection failed'}</h1>
    <p id="oauth-close-hint" style="font-size:14px;color:#6b7280;margin:0 0 20px;line-height:1.5">${success ? 'This window should close automatically.' : safeReason}</p>
    <button id="oauth-close-btn" type="button" style="background:#7c3aed;color:#fff;border:none;border-radius:12px;padding:12px 24px;font-size:14px;font-weight:600;cursor:pointer;width:100%">Close window</button>
  </div>
  <script src="/api/static/oauth-popup.js" data-payload="${escapeHtmlAttr(JSON.stringify(payload))}"></script>
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

    let calendarName = null
    try {
      const { data: cal } = await axios.get('https://www.googleapis.com/calendar/v3/calendars/primary', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      })
      calendarName = cal.summary || null
    } catch {
      // Non-fatal — the connection still works, we just won't have a friendly name to show yet.
    }

    await upsertCalendarConnection(userId, {
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      tokenExpiresAt,
      calendarName,
    })
    return sendCalendarPopupResponse(res, { success: true })
  } catch (err) {
    console.error('Calendar OAuth error:', err.response?.data || err.message)
    return sendCalendarPopupResponse(res, { reason: 'Could not connect Google Calendar. Please try again.' })
  }
}

// Shared by calendarEvents and createCalendarEvent — refreshes the access token when expired,
// throws a 409-tagged error when there's no refresh token to fall back on.
async function getValidAccessToken(userId, conn) {
  if (!conn.token_expires_at || new Date(conn.token_expires_at) > new Date()) {
    return conn.access_token
  }
  if (!conn.refresh_token) {
    throw Object.assign(new Error('Connection expired. Please reconnect.'), { status: 409 })
  }
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
  const tokenExpiresAt = data.expires_in ? new Date(Date.now() + data.expires_in * 1000) : null
  await upsertCalendarConnection(userId, { accessToken: data.access_token, refreshToken: conn.refresh_token, tokenExpiresAt })
  return data.access_token
}

// Google rejects a write with 403 insufficientPermissions when the stored token was only ever
// granted calendar.readonly (e.g. connected before this app supported creating events) — distinct
// from other 403s (like the Pro-gating one above), so the frontend can tell them apart and prompt
// a reconnect instead of a dead-end error.
function isInsufficientScopeError(err) {
  return err.response?.status === 403
    && err.response?.data?.error?.errors?.some((e) => e.reason === 'insufficientPermissions')
}

export async function getCalendarStatus(req, res, next) {
  try {
    if (!isProUser(req.user)) return res.status(403).json({ error: 'Google Calendar is a Pro feature' })
    const conn = await getCalendarConnection(req.user.id)
    res.json({ connected: !!conn, calendarName: conn?.calendar_name || null })
  } catch (err) {
    next(err)
  }
}

function formatEventTimeForMessage(start, allDay) {
  const d = new Date(start)
  if (allDay) return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' })
  return d.toLocaleString([], { weekday: 'long', month: 'long', day: 'numeric', hour: 'numeric', minute: '2-digit' })
}

// Schedules a meeting on the caller's Google Calendar, invites the other participant in the
// conversation by email (Google emails them the invite directly — sendUpdates=all is required for
// that, it's opt-in on Google's side), then posts a real chat message with the event link so
// everyone stays inside the conversation instead of needing to go find it in their own calendar.
export async function scheduleMeeting(req, res, next) {
  try {
    if (!isProUser(req.user)) return res.status(403).json({ error: 'Google Calendar is a Pro feature' })

    const { conversationId, title, description, start, end, allDay } = req.body
    if (!conversationId || !title?.trim() || !start || !end) {
      return res.status(400).json({ error: 'conversationId, title, start and end are required' })
    }

    const ok = await isParticipant(conversationId, req.user.id)
    if (!ok) return res.status(403).json({ error: 'Not a participant' })

    const conn = await getCalendarConnection(req.user.id)
    if (!conn) return res.status(404).json({ error: 'Not connected' })

    const accessToken = await getValidAccessToken(req.user.id, conn)
    const attendeeEmail = await getOtherParticipantEmail(conversationId, req.user.id)

    let event
    try {
      const { data } = await axios.post(
        'https://www.googleapis.com/calendar/v3/calendars/primary/events',
        {
          summary: title.trim(),
          description: description?.trim() || undefined,
          start: allDay ? { date: start } : { dateTime: start },
          end: allDay ? { date: end } : { dateTime: end },
          ...(attendeeEmail && { attendees: [{ email: attendeeEmail }] }),
          conferenceData: {
            createRequest: {
              requestId: randomUUID(),
              conferenceSolutionKey: { type: 'hangoutsMeet' },
            },
          },
        },
        {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { conferenceDataVersion: 1, ...(attendeeEmail && { sendUpdates: 'all' }) },
        }
      )
      event = {
        id: data.id,
        title: data.summary || '(No title)',
        start: data.start?.dateTime || data.start?.date,
        end: data.end?.dateTime || data.end?.date,
        htmlLink: data.htmlLink,
        meetLink: data.hangoutLink || null,
      }
    } catch (err) {
      if (isInsufficientScopeError(err)) {
        return res.status(403).json({ error: 'insufficient_scope', message: 'Reconnect Google Calendar to allow scheduling meetings.' })
      }
      throw err
    }

    const content = `📅 Scheduled: ${event.title}\n${formatEventTimeForMessage(event.start, allDay)}\n`
      + (event.meetLink ? `🎥 Join: ${event.meetLink}\n` : '')
      + event.htmlLink
    const msg = await createMessage({ conversationId, senderId: req.user.id, content, messageType: 'text' })
    const fullMsg = {
      ...msg,
      sender_id: req.user.id,
      sender_name: req.user.full_name,
      sender_avatar: req.user.avatar_url,
      sender_display_name: req.user.display_name,
    }

    const participants = await getParticipants(conversationId)
    const io = getIo()
    participants.forEach((p) => {
      if (p.id !== req.user.id) {
        io.to(`user:${p.id}`).emit('new-message', fullMsg)
      }
    })

    res.status(201).json({ event, message: fullMsg })
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
