// A group's picture: two overlapping circles, so a group never looks like a person in a list.
// The front circle is the group's own photo when it has one, otherwise a member; the back circle
// is another member. Members without a photo show as a grey silhouette.
//
// `members` is the list query's group_members_preview: up to two other members, those with a
// photo first. It can be missing (a group opened from elsewhere); the silhouettes cover that.
// `size` is the outer box in px. The ring around each circle should match the background behind
// the avatar, so the front circle reads as sitting on top of the back one.

function Silhouette() {
  return (
    <svg viewBox="0 0 40 40" className="w-full h-full" aria-hidden="true">
      <rect width="40" height="40" fill="#D9DCE3" />
      <circle cx="20" cy="15.5" r="7.5" fill="#F4F5F8" />
      <path d="M5 40c1.6-9 7.6-14 15-14s13.4 5 15 14z" fill="#F4F5F8" />
    </svg>
  )
}

function Circle({ src, position, diameter, ring }) {
  return (
    <span
      className={`absolute ${position} rounded-full overflow-hidden ring-2 ${ring}`}
      style={{ width: diameter, height: diameter }}
    >
      {src ? <img src={src} alt="" className="w-full h-full object-cover" /> : <Silhouette />}
    </span>
  )
}

export default function GroupAvatar({ avatarUrl, members, size = 56, darkMode = false, ringClass }) {
  const list = Array.isArray(members) ? members : []
  const front = avatarUrl || list[0]?.avatar || null
  const back = avatarUrl ? (list[0]?.avatar || null) : (list[1]?.avatar || null)
  const ring = ringClass || (darkMode ? 'ring-gray-900' : 'ring-white')
  // 72% of the box each: big enough to recognise a face, with a clear overlap.
  const diameter = Math.round(size * 0.72)
  return (
    <span role="img" aria-label="Group" className="relative block shrink-0" style={{ width: size, height: size }}>
      <Circle src={back} position="top-0 left-0" diameter={diameter} ring={ring} />
      <Circle src={front} position="bottom-0 right-0" diameter={diameter} ring={ring} />
    </span>
  )
}
