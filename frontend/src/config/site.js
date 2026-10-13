// Public facts about the site that more than one screen needs: where it lives and who answers
// support mail. Plain JS with no imports on purpose: the build (vite.config.js, via
// pages/howItWorksMeta.js) reads it too, outside the React bundle.
//
// The legal pages (Terms, Privacy, Cookie and KYC policies) spell their contact addresses out
// in the text. Those are part of the published wording, so they are edited there, not here.

export const SITE_URL = 'https://pulse.affiliateroulette.com'

export const SUPPORT_EMAIL = 'pulse@affiliateroulette.com'
export const SUPPORT_MAILTO = `mailto:${SUPPORT_EMAIL}`
