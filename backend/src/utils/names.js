// The rules for a member's name. full_name is the legal name from their ID (or set by an admin
// during manual review); display_name must be one of the renderings below — never free text — so
// the name other members see is always the verified one. The frontend builds the same list for
// the Settings dropdown (components/settings/SettingsDetailPanel.jsx); this file is the one the
// server enforces, so keep the two in step.

const NAME_SUFFIXES = new Set(['jr', 'jr.', 'snr', 'sr', 'sr.', 'ii', 'iii', 'iv'])

// ID documents often give names in capitals ("IVAN PETROV", "MARY-JANE O'NEIL"). A name with
// capitals and no lower-case letters at all is tidied to "Ivan Petrov", "Mary-Jane O'Neil";
// anything already in mixed case is left exactly as the ID gave it ("McDonald", "van der Berg").
// Works for any alphabet with case: Cyrillic, Greek, accented Latin.
export function tidyLegalName(raw) {
  const name = String(raw || '').replace(/\s+/g, ' ').trim()
  if (!name) return ''
  const hasUpper = /\p{Lu}/u.test(name)
  const hasLower = /\p{Ll}/u.test(name)
  if (!hasUpper || hasLower) return name
  return name
    .toLocaleLowerCase()
    .replace(/(^|[\s\-'’])(\p{Ll})/gu, (m, sep, ch) => sep + ch.toLocaleUpperCase())
}

// Every allowed rendering of a verified name: the whole thing, each part (suffixes alone are not
// a name), and the first name paired with each later part.
export function displayNameOptions(fullName) {
  const full = String(fullName || '').trim()
  const parts = full.split(/\s+/).filter(Boolean)
  const opts = []
  if (full) opts.push(full)
  parts.filter((p) => !NAME_SUFFIXES.has(p.toLowerCase())).forEach((p) => opts.push(p))
  if (parts.length > 2) parts.slice(1).forEach((p) => opts.push(`${parts[0]} ${p}`))
  return [...new Set(opts)]
}

export function isAllowedDisplayName(fullName, displayName) {
  return displayNameOptions(fullName).includes(String(displayName || '').trim())
}

// Keeps the member's chosen format where it still fits the (new) verified name, otherwise falls
// back to the full verified name.
export function pickDisplayName(fullName, current) {
  return isAllowedDisplayName(fullName, current) ? String(current).trim() : String(fullName || '').trim()
}
