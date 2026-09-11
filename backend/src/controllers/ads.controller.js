import { isProUser } from '../utils/plan.js'
import { pickAdForUser, recordImpression, recordClick, dismissAd } from '../db/queries/ads.js'

// Ad-free is a Pro benefit, so the gate lives here rather than in the client — a paying
// user should never be sent ad creative at all, not merely have it hidden.
export async function getMyAd(req, res, next) {
  try {
    if (isProUser(req.user)) return res.json({ ad: null })

    const ad = await pickAdForUser(req.user.id, req.user.primary_role)
    if (!ad) return res.json({ ad: null })

    // Counted server-side on delivery: the client can't be trusted to report honestly, and
    // this is the number an advertiser is invoiced against.
    await recordImpression(ad.id, req.user.id).catch(() => {})
    res.json({ ad })
  } catch (err) {
    next(err)
  }
}

export async function clickAd(req, res, next) {
  try {
    await recordClick(req.params.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}

export async function dismiss(req, res, next) {
  try {
    await dismissAd(req.params.id, req.user.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
