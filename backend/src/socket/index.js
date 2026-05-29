import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { config } from '../config/env.js'
import { createMessage, markMessagesDelivered, markMessagesRead, getMessageById } from '../db/queries/messages.js'
import { getParticipants, isParticipant, unhideParticipants } from '../db/queries/conversations.js'
import { createCall, updateCallStatus } from '../db/queries/calls.js'
import { findUserById } from '../db/queries/users.js'
import { toggleReaction, getReactionsForMessage } from '../db/queries/reactions.js'

let io = null
const onlineUsers = new Map() // userId → socket count

function groupBySender(rows) {
  const map = {}
  rows.forEach(({ id, sender_id }) => {
    if (!map[sender_id]) map[sender_id] = []
    map[sender_id].push(id)
  })
  return map
}

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
    onlineUsers.set(userId, (onlineUsers.get(userId) || 0) + 1)

    socket.join(`user:${userId}`)

    socket.on('join-conversation', async (conversationId) => {
      socket.join(`conv:${conversationId}`)
      try {
        const updated = await markMessagesDelivered(conversationId, userId)
        if (updated.length > 0) {
          const bySender = groupBySender(updated)
          for (const [senderId, messageIds] of Object.entries(bySender)) {
            io.to(`user:${senderId}`).emit('message-status-updated', { messageIds, status: 'delivered', conversationId })
          }
        }
      } catch {}
    })

    socket.on('leave-conversation', (conversationId) => {
      socket.leave(`conv:${conversationId}`)
    })

    socket.on('mark-read', async ({ conversationId }) => {
      try {
        const updated = await markMessagesRead(conversationId, userId)
        if (updated.length > 0) {
          const bySender = groupBySender(updated)
          for (const [senderId, messageIds] of Object.entries(bySender)) {
            io.to(`user:${senderId}`).emit('message-status-updated', { messageIds, status: 'read', conversationId })
          }
        }
      } catch {}
    })

    socket.on('send-message', async ({ conversationId, content, messageType = 'text', mediaUrl, replyToMessageId }) => {
      try {
        const ok = await isParticipant(conversationId, userId)
        if (!ok) return

        const participants = await getParticipants(conversationId)
        const recipient = participants.find((p) => p.id !== userId)
        const isRecipientOnline = recipient && (onlineUsers.get(recipient.id) || 0) > 0
        const status = isRecipientOnline ? 'delivered' : 'sent'

        const msg = await createMessage({ conversationId, senderId: userId, content, messageType, mediaUrl, replyToMessageId, status })
        await unhideParticipants(conversationId)

        const [sender, replyMsg] = await Promise.all([
          findUserById(userId),
          replyToMessageId ? getMessageById(replyToMessageId) : Promise.resolve(null),
        ])

        const fullMsg = {
          ...msg,
          sender_id: userId,
          sender_name: sender?.full_name || null,
          sender_display_name: sender?.display_name || null,
          sender_avatar: sender?.avatar_url || null,
          reply_content: replyMsg?.content || null,
          reply_sender_name: replyMsg?.sender_display_name || replyMsg?.sender_name || null,
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
        if (!targetUserId && conversationId) {
          // Group call: ring all participants
          const participants = await getParticipants(conversationId)
          const call = await createCall({ callerId: userId, calleeId: null, conversationId, callType })
          const caller = await findUserById(userId)
          socket.emit('call-created', { call })
          participants
            .filter((p) => p.id !== userId)
            .forEach((p) => {
              io.to(`user:${p.id}`).emit('incoming-call', {
                callId: call.id,
                callerId: userId,
                callType,
                conversationId,
                callerName: caller?.display_name || caller?.full_name || 'Unknown',
                callerAvatar: caller?.avatar_url || null,
              })
            })
          return
        }
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
        const call = await updateCallStatus(callId, 'declined', new Date())
        io.to(`user:${callerId}`).emit('call-rejected', { callId })
        if (call?.conversation_id) {
          const content = JSON.stringify({ call_type: call.call_type, status: 'missed' })
          const msg = await createMessage({ conversationId: call.conversation_id, senderId: call.caller_id, content, messageType: 'call', status: 'delivered' })
          const participants = await getParticipants(call.conversation_id)
          const fullMsg = { ...msg, sender_id: call.caller_id }
          participants.forEach((p) => io.to(`user:${p.id}`).emit('new-message', fullMsg))
        }
      } catch (err) {
        console.error('call-reject error:', err)
      }
    })

    socket.on('call-end', async ({ callId, targetUserId, conversationId, durationSeconds }) => {
      try {
        const call = await updateCallStatus(callId, 'answered', new Date(), durationSeconds)
        const convId = call?.conversation_id || conversationId
        if (convId) {
          const participants = await getParticipants(convId)
          participants.forEach((p) => {
            if (p.id !== userId) io.to(`user:${p.id}`).emit('call-ended', { callId })
          })
          const content = JSON.stringify({ call_type: call?.call_type, status: 'ended', duration: durationSeconds || 0 })
          const msg = await createMessage({ conversationId: convId, senderId: call?.caller_id || userId, content, messageType: 'call', status: 'delivered' })
          const fullMsg = { ...msg, sender_id: call?.caller_id || userId }
          participants.forEach((p) => io.to(`user:${p.id}`).emit('new-message', fullMsg))
        } else if (targetUserId) {
          io.to(`user:${targetUserId}`).emit('call-ended', { callId })
        }
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

    // Emit current online list to the newly connected user
    socket.emit('online-users', { userIds: Array.from(onlineUsers.keys()) })
    // Broadcast this user coming online to everyone else
    socket.broadcast.emit('user-presence', { userId, online: true })

    socket.on('get-online-users', () => {
      socket.emit('online-users', { userIds: Array.from(onlineUsers.keys()) })
    })

    socket.on('disconnect', () => {
      const count = onlineUsers.get(userId) || 0
      if (count <= 1) {
        onlineUsers.delete(userId)
        io.emit('user-presence', { userId, online: false })
      } else {
        onlineUsers.set(userId, count - 1)
      }
    })
  })

  return io
}
