// Every way a member may show their verified name, built only from the name on their ID. Shared by
// Settings (the display name picker) and the identity check screen (the preview). The server
// (backend utils/names.js) enforces the same list: keep them in step.
const NAME_SUFFIXES = new Set(['jr', 'jr.', 'snr', 'sr', 'sr.', 'ii', 'iii', 'iv'])

// Every sensible way to render someone's own verified name: the whole thing, each individual
// part, and the first name paired with each later part. Options are built from full_name rather
// than free text so a display name always stays truthful to the KYC'd identity — but which part
// you go by is your choice, since "the first word" isn't the first name for everyone.
export function displayNameOptions(fullName) {
  const full = (fullName || '').trim()
  const parts = full.split(/\s+/).filter(Boolean)
  const opts = []
  if (full) opts.push(full)
  parts.filter((p) => !NAME_SUFFIXES.has(p.toLowerCase())).forEach((p) => opts.push(p))
  // Pair the first name with every later part, not just the final word: that last word is a
  // suffix in "Edward Paul Tabus Jr" and a second surname in "Ana García López", so "first
  // word + last word" happens to be the wrong answer for both.
  if (parts.length > 2) parts.slice(1).forEach((p) => opts.push(`${parts[0]} ${p}`))
  // No exceptions for an old saved value: the name shown must come from the ID, and the server
  // (utils/names.js) rejects anything else. Keep the two lists in step.
  return [...new Set(opts)]
}
