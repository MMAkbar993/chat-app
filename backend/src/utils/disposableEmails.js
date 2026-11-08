// Throwaway inbox services, refused when joining the Christmas giveaway so one person cannot open
// dozens of entries. Not complete (new ones appear every week); the per IP and per browser limits
// and the ID check at claim time catch what this misses. Add domains here as they turn up.
const DOMAINS = `
10minutemail.com 10minutemail.net 20minutemail.com 33mail.com anonaddy.me burnermail.io
discard.email disposablemail.com dispostable.com dropmail.me emailfake.com emailondeck.com
fakeinbox.com fakemail.net fakemailgenerator.com getairmail.com getnada.com guerrillamail.biz
guerrillamail.com guerrillamail.de guerrillamail.info guerrillamail.net guerrillamail.org
guerrillamailblock.com grr.la harakirimail.com inboxbear.com incognitomail.org jetable.org
mail-temp.com mail.tm mail7.io mailcatch.com maildrop.cc mailinator.com mailinator.net
mailinator2.com mailnesia.com mailpoof.com mailsac.com mintemail.com mohmal.com moakt.com
mytemp.email mytrashmail.com nada.email nwytg.net sharklasers.com spam4.me spambox.us
spamgourmet.com tempail.com tempinbox.com tempmail.com tempmail.dev tempmail.net tempmail.plus
tempmailo.com tempm.com temp-mail.io temp-mail.org tempr.email throwawaymail.com tmail.ws
tmailor.com tmpmail.net tmpmail.org trashmail.com trashmail.de trashmail.net trbvm.com
yopmail.com yopmail.fr yopmail.net emltmp.com dropmail.me 1secmail.com 1secmail.net
1secmail.org esiix.com wwjmp.com xojxe.com yoggm.com rteet.com dpptd.com laafd.com
vjuum.com ezztt.com icznn.com kzccv.com qiott.com wuuvo.com tmpeml.com spymail.one
minuteinbox.com fexbox.org fexpost.com mailto.plus byom.de
`.split(/\s+/).filter(Boolean)

const SET = new Set(DOMAINS)

// True for an address at one of the domains above or a subdomain of one (x.mailinator.com).
export function isDisposableEmail(email) {
  const domain = String(email).split('@')[1]?.toLowerCase().trim()
  if (!domain) return false
  const parts = domain.split('.')
  for (let i = 0; i < parts.length - 1; i++) {
    if (SET.has(parts.slice(i).join('.'))) return true
  }
  return false
}
