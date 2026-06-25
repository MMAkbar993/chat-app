export function getReplyPreviewText({ content, messageType, mediaUrl }) {
  if (content) return content.length > 80 ? content.slice(0, 80) : content
  if (messageType === 'image') return 'Photo'
  if (messageType === 'video') return 'Video'
  if (messageType === 'audio') return 'Voice message'
  if (messageType === 'file') return mediaUrl?.split('/').pop() || 'File'
  return 'Message'
}

export function getReplyImageUrl({ messageType, mediaUrl }) {
  if (messageType === 'image' && mediaUrl) return mediaUrl
  return null
}

export function hasReplyPreview(msg) {
  return Boolean(
    msg.reply_to_message_id &&
    (msg.reply_content || msg.reply_message_type || msg.reply_media_url)
  )
}
