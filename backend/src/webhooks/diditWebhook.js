import crypto from 'crypto'
import { updateKycStatus } from '../db/queries/users.js'

const APPROVED_STATUSES = ['Approved']
const FAILED_STATUSES = ['Declined', 'Expired', 'Not Finished']

function canonicalize(value) {
  if (Array.isArray(value)) return value.map(canonicalize)
  if (value && typeof value === 'object') {
    return Object.keys(value).sort().reduce((acc, key) => {
      acc[key] = canonicalize(value[key])
      return acc
    }, {})
  }
  return value
}

// Didit signs a canonical (recursively key-sorted, compact) JSON re-serialization of the
// parsed body — not the raw bytes — so we must parse then re-stringify before hashing.
export function verifyDiditSignature(rawBody, signature, timestamp, secret) {
  if (!secret) return true // webhook destination not registered yet — nothing to verify against

  if (!signature || !timestamp) return false
  const age = Math.abs(Date.now() / 1000 - Number(timestamp))
  if (!Number.isFinite(age) || age > 300) return false

  let parsed
  try {
    parsed = JSON.parse(rawBody.toString())
  } catch {
    return false
  }

  const canonical = JSON.stringify(canonicalize(parsed))
  const expected = crypto.createHmac('sha256', secret).update(canonical).digest('hex')

  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && crypto.timingSafeEqual(a, b)
}

export async function handleDiditWebhook(payload) {
  const userId = payload.vendor_data
  if (!userId) {
    console.warn('Didit webhook: no vendor_data (userId) in payload')
    return
  }

  if (APPROVED_STATUSES.includes(payload.status)) {
    await updateKycStatus(userId, 'verified')
  } else if (FAILED_STATUSES.includes(payload.status)) {
    await updateKycStatus(userId, 'failed')
  }
}
