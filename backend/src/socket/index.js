import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { createMessage } from '../db/queries/messages.js'
import { getParticipants, isParticipant, unhideParticipants } from '../db/queries/conversations.js'
import { createCall, updateCallStatus } from '../db/queries/calls.js'
import { findUserById } from '../db/queries/users.js'
import { toggleReaction, getReactionsForMessage } from '../db/queries/reactions.js'

let io = null

export function getIo() {
  return io
}

export function initSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: config.frontendUrl,
      credentials: true,
    },
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('No token'))
    try {
      const payload = jwt.verify(token, config.jwtSecret)
      socket.userId = payload.id
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    const userId = socket.userId

    socket.join(`user:${userId}`)

    socket.on('join-conversation', (conversationId) => {
      socket.join(`conv:${conversationId}`)
    })

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`)
    })

    socket.on('send-message', async ({ conversationId, content, messageType = 'text', mediaUrl, replyToMessageId }) => {
      try {
        const ok = await isParticipant(conversationId, userId)
        if (!ok) return

        const msg = await createMessage({ conversationId, senderId: userId, content, messageType, mediaUrl, replyToMessageId })
        await unhideParticipants(conversationId)
        const [participants, sender] = await Promise.all([
          getParticipants(conversationId),
          findUserById(userId),
        ])

        const fullMsg = {
          ...msg,
          sender_id: userId,
          sender_name: sender?.full_name || null,
          sender_display_name: sender?.display_name || null,
          sender_avatar: sender?.avatar_url || null,
        }

        // Emit to all participants (including sender for echo)
        participants.forEach((p) => {
          io.to(`user:${p.id}`).emit('new-message', fullMsg)
        })
      } catch (err) {
        console.error('send-message error:', err)
      }
    })

    socket.on('typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user-typing', { conversationId, userId })
    })

    socket.on('stop-typing', ({ conversationId }) => {
      socket.to(`conv:${conversationId}`).emit('user-stop-typing', { conversationId, userId })
    })

    // --- Message Reactions ---

    socket.on('toggle-reaction', async ({ messageId, conversationId, emoji }) => {
      try {
        const ok = await isParticipant(conversationId, userId)
        if (!ok) return
        await toggleReaction(messageId, userId, emoji)
        const reactions = await getReactionsForMessage(messageId)
        const participants = await getParticipants(conversationId)
        participants.forEach((p) => {
          io.to(`user:${p.id}`).emit('reaction-updated', { messageId, conversationId, reactions })
        })
      } catch (err) {
        console.error('toggle-reaction error:', err)
      }
    })

    // --- WebRTC Call Signaling ---

    socket.on('call-initiate', async ({ targetUserId, callType, conversationId }) => {
      try {
        const call = await createCall({ callerId: userId, calleeId: targetUserId, conversationId, callType })
        const caller = await findUserById(userId)
        socket.emit('call-created', { call })
        io.to(`user:${targetUserId}`).emit('incoming-call', {
          callId: call.id,
          callerId: userId,
          callType,
          conversationId,
          callerName: caller?.display_name || caller?.full_name || 'Unknown',
          callerAvatar: caller?.avatar_url || null,
        })
      } catch (err) {
        console.error('call-initiate error:', err)
      }
    })

    socket.on('call-accept', async ({ callId, callerId }) => {
      try {
        await updateCallStatus(callId, 'answered')
        io.to(`user:${callerId}`).emit('call-accepted', { callId })
      } catch (err) {
        console.error('call-accept error:', err)
      }
    })

    socket.on('call-reject', async ({ callId, callerId }) => {
      try {
        await updateCallStatus(callId, 'declined', new Date())
        io.to(`user:${callerId}`).emit('call-rejected', { callId })
      } catch (err) {
        console.error('call-reject error:', err)
      }
    })

    socket.on('call-end', async ({ callId, targetUserId, durationSeconds }) => {
      try {
        await updateCallStatus(callId, 'answered', new Date(), durationSeconds)
        io.to(`user:${targetUserId}`).emit('call-ended', { callId })
      } catch (err) {
        console.error('call-end error:', err)
      }
    })

    // WebRTC negotiation relay
    socket.on('webrtc-offer', ({ callId, targetUserId, offer }) => {
      io.to(`user:${targetUserId}`).emit('webrtc-offer', { callId, offer, fromUserId: userId })
    })

    socket.on('webrtc-answer', ({ callId, targetUserId, answer }) => {
      io.to(`user:${targetUserId}`).emit('webrtc-answer', { callId, answer })
    })

    socket.on('webrtc-ice-candidate', ({ callId, targetUserId, candidate }) => {
      io.to(`user:${targetUserId}`).emit('webrtc-ice-candidate', { callId, candidate })
    })

    socket.on('disconnect', () => {
      // nothing to clean up – rooms are auto-cleared
    })
  })

  return io
}
