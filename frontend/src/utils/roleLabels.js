// Human-readable labels for the primary_role enum — shared by anywhere a contact/user's role is
// shown (Contacts list, Add Contact search results, etc.) so they all read identically.
export const ROLE_LABELS = {
  affiliate_publisher:          'Affiliate (Publisher)',
  affiliate_manager:            'Affiliate Manager',
  affiliate_network:            'Affiliate Network',
  business_development_sales:   'Business Development / Sales',
  casino_operator:               'Casino / Operator',
  compliance_legal:              'Compliance / Legal',
  data_odds_provider:            'Data / Odds Provider',
  entrepreneur:                  'Entrepreneur',
  event_organizer:               'Event Organizer',
  fraud_risk_provider:           'Fraud / Risk Provider',
  game_provider:                 'Game Provider',
  influencer_streamer:           'Influencer / Streamer',
  investor_advisor:              'Investor / Advisor',
  kyc_aml_provider:              'KYC / AML Provider',
  marketing_crm:                 'Marketing / CRM',
  media_seo_agency:              'Media / SEO Agency',
  payment_provider:              'Payment Provider',
  platform_provider:             'Platform Provider (White Label / Turnkey)',
  recruitment_talent:            'Recruitment / Talent',
  regulator_licensing:           'Regulator / Licensing',
  sportsbook_betting_provider:   'Sportsbook / Betting Provider',
  technology_software_provider:  'Technology / Software Provider',
}

// `user` here is anything with primary_role/primary_role_other/username — a contact row, a
// search result, etc. Falls back to the raw role string, then the username, same as the
// Contacts list always has.
export function getRoleLabel(user) {
  if (!user) return ''
  if (user.primary_role === 'other') return user.primary_role_other || user.primary_role || user.username
  return ROLE_LABELS[user.primary_role] || user.primary_role || user.username
}
