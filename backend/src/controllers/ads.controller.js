import { isProUser } from '../utils/plan.js'
import { pickAdForUser, recordImpression, recordClick, dismissAd } from '../db/queries/ads.js'

// Everyone sees ads, which keeps the inventory worth selling. What Pro buys is control:
// a Pro account can dismiss an ad for a week, a Free account cannot. `canHide` is computed
// server-side so the client can't grant itself the dismiss option.
export async function getMyAd(req, res, next) {
  try {
    const ad = await pickAdForUser(req.user.id, req.user.primary_role)
    if (!ad) return res.json({ ad: null })

    // Counted server-side on delivery: the client can't be trusted to report honestly, and
    // this is the number an advertiser is invoiced against.
    await recordImpression(ad.id, req.user.id).catch(() => {})
    res.json({ ad, canHide: isProUser(req.user) })
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
    // Hiding ads is the Pro benefit, so it's refused here rather than merely hidden in the
    // UI — otherwise a Free account could dismiss every ad with one call to this endpoint.
    if (!isProUser(req.user)) {
      return res.status(403).json({ error: 'Upgrade to Pro to hide ads.' })
    }
    await dismissAd(req.params.id, req.user.id)
    res.json({ success: true })
  } catch (err) {
    next(err)
  }
}
