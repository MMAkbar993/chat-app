// agora-token is CommonJS: Node's ESM lexer picks up RtcTokenBuilder but not RtcRole, so a
// named import of both fails at load. Default-import the namespace and destructure instead.
import agoraToken from 'agora-token'

import { getCallById } from '../db/queries/calls.js'
import { isParticipant } from '../db/queries/conversations.js'

const { RtcTokenBuilder, RtcRole } = agoraToken

// Agora needs a signed token per user per channel. The App Certificate that signs it is the
// shared secret for the whole account — it must never reach the browser, so tokens are minted
// here and handed out only to users who actually belong to the call.
//
// Without the membership check below this endpoint would be an open door: the channel name is
// just the call id, so anyone who could guess or observe one could mint themselves a publisher
// token and join a stranger's call.

// Four hours comfortably outlasts any real call. The SDK also fires
// `token-privilege-will-expire` 30s before the deadline, and the client re-fetches on that.
const TOKEN_TTL_SECONDS = 4 * 60 * 60

export async function getRtcToken(req, res, next) {
  try {
    const appId = process.env.AGORA_APP_ID
    const appCertificate = process.env.AGORA_APP_CERTIFICATE
    if (!appId || !appCertificate) {
      return res.status(503).json({ error: 'Calling is not configured on this server.' })
    }

    const call = await getCallById(req.params.id)
    if (!call) return res.status(404).json({ error: 'Call not found' })

    // A direct call has a callee; a group call has none and is scoped by its conversation.
    const allowed = call.callee_id
      ? call.caller_id === req.user.id || call.callee_id === req.user.id
      : Boolean(call.conversation_id) && (await isParticipant(call.conversation_id, req.user.id))
    if (!allowed) return res.status(403).json({ error: 'Not a participant in this call' })

    // String UIDs let us use the user's own id, so remote streams are attributable to a real
    // person without keeping a separate numeric-uid mapping in sync.
    const uid = req.user.id
    const channel = call.id
    const expiresAt = Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS

    const token = RtcTokenBuilder.buildTokenWithUserAccount(
      appId, appCertificate, channel, uid, RtcRole.PUBLISHER, TOKEN_TTL_SECONDS, TOKEN_TTL_SECONDS,
    )

    res.json({ appId, channel, uid, token, expiresAt })
  } catch (err) {
    next(err)
  }
}
