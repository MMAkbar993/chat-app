// @mentions, Telegram-style. A mention is "@" plus a username (letters, digits, underscore, the
// same rule sign-up enforces) at the start of the text or after a space, so an email address
// such as name@company.com is never mistaken for one.
export const MENTION_RE = /(^|\s)@([A-Za-z0-9_]{2,30})\b/g

// The "@partial" being typed just before the caret, or null.
export function mentionQueryAt(text, caret) {
  const before = text.slice(0, caret)
  const m = before.match(/(?:^|\s)@([A-Za-z0-9_]{0,30})$/)
  return m ? { query: m[1], start: caret - m[1].length - 1 } : null
}

// People in the chat whose username or name starts with what was typed (any word of the name).
export function filterMentionCandidates(people, query, limit = 6) {
  const q = query.toLowerCase()
  return people
    .filter((p) => p.username)
    .filter((p) => !q
      || p.username.toLowerCase().startsWith(q)
      || (p.name || '').toLowerCase().split(/\s+/).some((w) => w.startsWith(q)))
    .slice(0, limit)
}
