// Set by JoinGroupPage.jsx when someone opens a group invite link while signed out, consumed
// once by ChatPage.jsx after they land in the app. Mirrors PENDING_DM_KEY: the code has to
// survive login/signup and the whole KYC flow, none of which know anything about groups.
export const PENDING_JOIN_KEY = 'pulse_pending_group_join'
