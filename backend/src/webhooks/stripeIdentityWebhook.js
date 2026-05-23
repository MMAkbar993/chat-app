import { query } from '../config/database.js'
import { updateKycStatus } from '../db/queries/users.js'

export async function handleIdentityWebhook(event) {
  const session = event.data.object
  const userId = session.metadata?.userId

  if (!userId) {
    console.warn('Identity webhook: no userId in metadata')
    return
  }

  switch (event.type) {
    case 'identity.verification_session.verified':
      await updateKycStatus(userId, 'verified')
      break
    case 'identity.verification_session.requires_input':
      await updateKycStatus(userId, 'failed')
      break
    default:
      break
  }
}
