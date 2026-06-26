export function getReplyPreviewText({ content, messageType, mediaUrl }) {
  if (messageType && messageType !== 'text') {
    if (messageType === 'image') return 'Photo'
    if (messageType === 'video') return 'Video'
    if (messageType === 'audio') return 'Voice message'
    if (messageType === 'file') return mediaUrl?.split('/').pop() || content?.split('/').pop() || 'File'
  }
  if (content) return content.length > 80 ? content.slice(0, 80) : content
  return 'Message'
}

export function getReplyImageUrl({ messageType, mediaUrl, content }) {
  if (messageType !== 'image') return null
  return mediaUrl || content || null
}

export function hasReplyPreview(msg) {
  return Boolean(msg.reply_to_message_id)
}

export function enrichMessageReplyMeta(message, messagesById) {
  if (!message.reply_to_message_id) return message

  const parent = messagesById.get(message.reply_to_message_id)
  const messageType = message.reply_message_type || parent?.message_type || null
  const parentMedia =
    parent?.media_url ||
    (parent?.message_type && parent.message_type !== 'text' ? parent.content : null) ||
    null
  const mediaUrl = message.reply_media_url || parentMedia || null

  let content = message.reply_content ?? null
  if (!content && messageType === 'text') {
    content = parent?.content ?? null
  }
  if (messageType && messageType !== 'text' && content && (content.startsWith('/') || content.startsWith('http'))) {
    content = null
  }

  const senderName =
    message.reply_sender_name ||
    parent?.sender_display_name ||
    parent?.sender_name ||
    null

  return {
    ...message,
    reply_message_type: messageType,
    reply_media_url: mediaUrl,
    reply_content: content,
    reply_sender_name: senderName,
  }
}

export function enrichMessagesWithReplyMeta(messages) {
  const byId = new Map(messages.map((m) => [m.id, m]))
  return messages.map((m) => enrichMessageReplyMeta(m, byId))
}
