import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../../context/AuthContext'
import { useChat } from '../../context/ChatContext'
import { useToast } from '../../context/ToastContext'
import { getGroup, updateGroup, addMember, removeMember, uploadGroupAvatar } from '../../api/groups'
import { getContacts, searchUsers } from '../../api/contacts'
import ConfirmDialog from '../ui/ConfirmDialog'
import client from '../../api/client'

function Accordion({ title, count, darkMode, children }) {
  const [open, setOpen] = useState(false)
  const dm = darkMode
  return (
    <div className={`border-t ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`w-full flex items-center justify-between px-3 py-2.5 text-sm transition-colors ${
          dm ? 'text-gray-200 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
        }`}
      >
        <span className="flex items-center gap-2">
          {title}
          {count !== undefined && (
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${dm ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-500'}`}>
              {count}
            </span>
          )}
        </span>
        <svg className={`w-4 h-4 text-gray-400 transition-transform ${open ? 'rotate-90' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>
      {open && <div className="pb-2">{children}</div>}
    </div>
  )
}

export default function GroupInfoPanel({ conversation, darkMode, onClose, onCallStart, onSearch }) {
  const { user } = useAuth()
  const { messages, toggleConversationFlag, removeConversation, dropConversation } = useChat()
  const { showToast } = useToast()

  const [participants, setParticipants] = useState([])
  const [groupData, setGroupData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [memberSearch, setMemberSearch] = useState('')
  const [showMemberSearch, setShowMemberSearch] = useState(false)
  const [showAddMembers, setShowAddMembers] = useState(false)
  const [contacts, setContacts] = useState([])
  const [addSearch, setAddSearch] = useState('')
  const [userSearchResults, setUserSearchResults] = useState([])
  const [confirm, setConfirm] = useState(null)
  const [showReport, setShowReport] = useState(false)
  const [reportReason, setReportReason] = useState('')
  const [editDesc, setEditDesc] = useState(false)
  const [descDraft, setDescDraft] = useState('')
  const [showEncryption, setShowEncryption] = useState(false)
  const [avatarPreview, setAvatarPreview] = useState(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const avatarInputRef = useRef(null)

  useEffect(() => {
    if (!conversation?.id) return
    setLoading(true)
    getGroup(conversation.id)
      .then((data) => {
        setGroupData(data.group)
        setParticipants(data.group.participants || [])
        setDescDraft(data.group.description || '')
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [conversation?.id])

  const me = participants.find((p) => p.id === user?.id)
  const isAdmin = me?.role === 'admin'

  const photos = messages.filter((m) => m.message_type === 'image' && m.media_url && !m.is_deleted)
  const videos = messages.filter((m) => m.message_type === 'video' && m.media_url && !m.is_deleted)
  const docs   = messages.filter((m) => m.message_type === 'file'  && m.media_url && !m.is_deleted)
  const links  = messages.filter(
    (m) => !m.is_deleted && m.content && /https?:\/\//i.test(m.content)
  )

  const filteredParticipants = participants.filter(
    (p) => !memberSearch || (p.display_name || p.full_name || '').toLowerCase().includes(memberSearch.toLowerCase())
  )

  async function handleLeave() {
    try {
      await client.delete(`/groups/${conversation.id}/leave`)
      dropConversation(conversation.id)
      onClose()
      showToast('Left the group', 'info')
    } catch {
      showToast('Could not leave group', 'error')
    }
  }

  async function handleRemoveMember(userId) {
    try {
      await removeMember(conversation.id, userId)
      setParticipants((prev) => prev.filter((p) => p.id !== userId))
      showToast('Member removed', 'info')
    } catch {
      showToast('Could not remove member', 'error')
    }
  }

  async function handleSaveDesc() {
    try {
      await updateGroup(conversation.id, { description: descDraft })
      const fresh = await getGroup(conversation.id)
      setGroupData(fresh.group)
      setDescDraft(fresh.group.description || '')
      setEditDesc(false)
      showToast('Description updated', 'success')
    } catch {
      showToast('Could not update description', 'error')
    }
  }

  async function handleAvatarChange(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setAvatarPreview(URL.createObjectURL(file))
    setUploadingAvatar(true)
    try {
      const data = await uploadGroupAvatar(conversation.id, file)
      setGroupData((prev) => ({ ...prev, avatar_url: data.avatarUrl }))
      showToast('Group icon updated', 'success')
    } catch {
      setAvatarPreview(null)
      showToast('Could not update group icon', 'error')
    } finally {
      setUploadingAvatar(false)
      e.target.value = ''
    }
  }

  async function handleAddMember(contactId) {
    try {
      await addMember(conversation.id, contactId)
      const data = await getGroup(conversation.id)
      setParticipants(data.group.participants || [])
      showToast('Member added', 'success')
    } catch {
      showToast('Could not add member', 'error')
    }
  }

  async function loadContacts() {
    try {
      const data = await getContacts()
      setContacts(data.contacts || [])
    } catch {}
  }

  useEffect(() => {
    if (!showAddMembers) { setUserSearchResults([]); return }
    if (addSearch.length < 2) { setUserSearchResults([]); return }
    const t = setTimeout(async () => {
      try {
        const data = await searchUsers(addSearch)
        setUserSearchResults(data.users || [])
      } catch {}
    }, 300)
    return () => clearTimeout(t)
  }, [addSearch, showAddMembers])

  const name   = groupData?.name || conversation.name || 'Group'
  const avatar = avatarPreview || groupData?.avatar_url || conversation.avatar_url
  const dm     = darkMode
  const bg     = dm ? 'bg-gray-900 border-gray-700' : 'bg-white border-gray-100'
  const card   = dm ? 'bg-gray-800' : 'bg-gray-50'
  const txt    = dm ? 'text-white' : 'text-gray-900'
  const sub    = dm ? 'text-gray-400' : 'text-gray-500'
  const divider = dm ? 'border-gray-700' : 'border-gray-100'

  const creatorName = groupData?.created_by_display_name || groupData?.created_by_name

  return (
    <div className={`w-72 border-l flex flex-col h-full ${bg}`}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-3 border-b ${divider} sticky top-0 z-10 ${dm ? 'bg-gray-900' : 'bg-white'}`}>
        <span className={`font-semibold text-sm ${txt}`}>Group Info</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-10">
            <div className="w-6 h-6 border-2 border-violet-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            {/* Identity */}
            <div className="flex flex-col items-center py-5 px-4">
              <div className="relative w-20 h-20 mb-2">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-violet-500 flex items-center justify-center text-white text-2xl font-bold">
                  {avatar
                    ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                    : (name || '?')[0].toUpperCase()}
                </div>
                {uploadingAvatar && (
                  <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center">
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                )}
              </div>
              {isAdmin && (
                <>
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <button
                    onClick={() => avatarInputRef.current?.click()}
                    className={`text-xs mb-1 ${sub} hover:text-violet-500 transition-colors`}
                  >
                    Change Icon
                  </button>
                </>
              )}
              <p className={`font-semibold text-base ${txt}`}>{name}</p>
              <p className={`text-xs ${sub}`}>{participants.length} participants</p>
            </div>

            {/* Quick action tiles */}
            <div className={`grid grid-cols-4 gap-2 mx-4 mb-4 p-3 rounded-xl ${card}`}>
              {[
                { label: 'Audio',  d: 'M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z', fn: () => onCallStart?.('audio') },
                { label: 'Video',  d: 'M15 10l4.553-2.069A1 1 0 0121 8.882v6.236a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z',   fn: () => onCallStart?.('video') },
                { label: 'Chat',   d: 'M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z', fn: onClose },
                { label: 'Search', d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',                                                                                                                                                                                                              fn: () => { onSearch?.(); onClose() } },
              ].map(({ label, d, fn }) => (
                <button key={label} onClick={fn} className="flex flex-col items-center gap-1">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${dm ? 'bg-gray-700' : 'bg-white'}`}>
                    <svg className="w-5 h-5 text-violet-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={d} />
                    </svg>
                  </div>
                  <span className={`text-xs ${sub}`}>{label}</span>
                </button>
              ))}
            </div>

            {/* Description */}
            <div className={`mx-4 mb-4 p-3 rounded-xl ${card}`}>
              <div className="flex items-center justify-between mb-2">
                <p className={`text-xs font-semibold uppercase tracking-wide ${sub}`}>Group Description</p>
                {isAdmin && !editDesc && (
                  <button onClick={() => setEditDesc(true)} className="text-violet-500 hover:text-violet-600">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                )}
              </div>
              {editDesc ? (
                <>
                  <textarea
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    rows={3}
                    placeholder="Group description…"
                    className={`w-full rounded-xl px-3 py-2 text-sm outline-none resize-none mb-2 ${dm ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-white text-gray-800 placeholder-gray-400'}`}
                  />
                  <div className="flex gap-2">
                    <button onClick={() => setEditDesc(false)} className={`flex-1 py-1.5 rounded-lg text-xs ${dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>Cancel</button>
                    <button onClick={handleSaveDesc} className="flex-1 py-1.5 rounded-lg text-xs bg-violet-600 text-white hover:bg-violet-700">Save</button>
                  </div>
                </>
              ) : (
                <p className={`text-sm ${dm ? 'text-gray-300' : 'text-gray-600'}`}>
                  {groupData?.description ?? 'No description'}
                </p>
              )}
              {creatorName && (
                <p className={`text-xs mt-2 ${sub}`}>Group created by {creatorName}</p>
              )}
            </div>

            {/* Media Details */}
            <div className={`mx-4 mb-4 rounded-xl overflow-hidden ${card}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide px-3 pt-3 mb-1 ${sub}`}>Media Details</p>
              <Accordion title="Photos" count={photos.length} darkMode={dm}>
                {photos.length > 0
                  ? <div className="grid grid-cols-3 gap-1 px-2">{photos.slice(0, 9).map((m) => (
                      <img key={m.id} src={m.media_url} alt="" className="w-full h-16 object-cover rounded" />
                    ))}</div>
                  : <p className={`px-3 text-xs ${sub}`}>No photos found.</p>}
              </Accordion>
              <Accordion title="Videos" count={videos.length} darkMode={dm}>
                {videos.length > 0
                  ? <div className="grid grid-cols-3 gap-1 px-2">{videos.slice(0, 9).map((m) => (
                      <video key={m.id} src={m.media_url} className="w-full h-16 object-cover rounded" />
                    ))}</div>
                  : <p className={`px-3 text-xs ${sub}`}>No videos found.</p>}
              </Accordion>
              <Accordion title="Links" count={links.length} darkMode={dm}>
                {links.length > 0
                  ? <div className="px-3 space-y-1">
                      {links.slice(0, 10).map((m) => {
                        const url = m.content.match(/https?:\/\/[^\s]+/i)?.[0]
                        return url ? (
                          <a key={m.id} href={url} target="_blank" rel="noopener noreferrer"
                            className="block text-xs text-violet-500 hover:underline truncate">{url}</a>
                        ) : null
                      })}
                    </div>
                  : <p className={`px-3 text-xs ${sub}`}>No links found.</p>}
              </Accordion>
              <Accordion title="Documents" count={docs.length} darkMode={dm}>
                {docs.length > 0
                  ? <div className="px-3 space-y-1">
                      {docs.map((m) => (
                        <a key={m.id} href={m.media_url} target="_blank" rel="noopener noreferrer"
                          className={`flex items-center gap-2 text-xs underline ${dm ? 'text-violet-400' : 'text-violet-600'}`}>
                          <svg className="w-3.5 h-3.5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {m.media_url.split('/').pop()}
                        </a>
                      ))}
                    </div>
                  : <p className={`px-3 text-xs ${sub}`}>No documents found.</p>}
              </Accordion>
            </div>

            {/* Encryption */}
            <div className={`mx-4 mb-4 p-3 rounded-xl ${card}`}>
              <button
                onClick={() => setShowEncryption((v) => !v)}
                className={`w-full flex items-center gap-3 ${txt}`}
              >
                <svg className="w-5 h-5 text-green-500 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <div className="text-left flex-1">
                  <p className="text-sm font-medium">Encryption</p>
                  <p className={`text-xs ${sub}`}>Messages are end-to-end encrypted</p>
                </div>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
              {showEncryption && (
                <p className={`mt-2 text-xs leading-relaxed ${sub}`}>
                  Text messages in this group are protected with end-to-end encryption. Only members of this group can read them — not even the server.
                </p>
              )}
            </div>

            {/* Group Settings */}
            <div className={`mx-4 mb-4 rounded-xl overflow-hidden ${card}`}>
              <p className={`text-xs font-semibold uppercase tracking-wide px-3 pt-3 mb-1 ${sub}`}>Group Settings</p>
              <button
                onClick={() => { toggleConversationFlag(conversation.id, 'is_muted'); showToast('Mute toggled', 'success') }}
                className={`w-full flex items-center justify-between px-3 py-2.5 text-sm border-t transition-colors ${dm ? 'border-gray-700 text-gray-200 hover:bg-gray-700' : 'border-gray-100 text-gray-700 hover:bg-gray-100'}`}
              >
                <span>Mute Notifications</span>
                <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </button>
            </div>

            {/* Participants */}
            <div className={`mx-4 mb-4 rounded-xl overflow-hidden ${card}`}>
              <div className="flex items-center justify-between px-3 pt-3 pb-2">
                <p className={`text-xs font-semibold uppercase tracking-wide ${sub}`}>
                  Participants <span className="normal-case font-normal">{participants.length}</span>
                </p>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setShowMemberSearch((v) => !v)}
                    className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                  >
                    <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </button>
                  {isAdmin && (
                    <button
                      onClick={() => { loadContacts(); setShowAddMembers(true) }}
                      className={`w-6 h-6 flex items-center justify-center rounded-full transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                    >
                      <svg className="w-3.5 h-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                      </svg>
                    </button>
                  )}
                </div>
              </div>

              {showMemberSearch && (
                <div className={`mx-3 mb-2 flex items-center gap-2 rounded-xl px-3 py-1.5 ${dm ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <svg className="w-3.5 h-3.5 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  <input
                    autoFocus
                    value={memberSearch}
                    onChange={(e) => setMemberSearch(e.target.value)}
                    placeholder="Search members…"
                    className={`bg-transparent flex-1 outline-none text-xs ${dm ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
                  />
                </div>
              )}

              {filteredParticipants.map((p) => {
                const pName = p.display_name || p.full_name || p.username || '?'
                return (
                  <div key={p.id} className={`flex items-center gap-3 px-3 py-2.5 border-t ${divider}`}>
                    <div className="w-8 h-8 rounded-full overflow-hidden bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                      {p.avatar_url
                        ? <img src={p.avatar_url} alt="" className="w-full h-full object-cover" />
                        : pName[0].toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${txt}`}>{pName}</p>
                      {p.role !== 'member' && (
                        <p className="text-xs text-violet-500">{p.role === 'admin' ? 'Admin' : 'Owner'}</p>
                      )}
                    </div>
                    {isAdmin && p.id !== user?.id && (
                      <button
                        onClick={() => setConfirm({
                          title: 'Remove Member',
                          message: `Remove ${pName} from this group?`,
                          confirmLabel: 'Remove',
                          variant: 'danger',
                          onConfirm: () => handleRemoveMember(p.id),
                        })}
                        className="text-red-400 hover:text-red-500 shrink-0 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7a4 4 0 11-8 0 4 4 0 018 0zM9 14a6 6 0 00-6 6v1h12v-1a6 6 0 00-6-6zM21 12h-6" />
                        </svg>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Exit + Report */}
            <div className={`mx-4 mb-6 rounded-xl overflow-hidden ${card}`}>
              <button
                onClick={() => setConfirm({
                  title: 'Exit Group',
                  message: 'Only group admins will be notified that you left the group.',
                  confirmLabel: 'Exit Group',
                  variant: 'danger',
                  onConfirm: handleLeave,
                })}
                className={`w-full flex items-center gap-3 px-3 py-3 text-sm text-red-500 border-b transition-colors ${dm ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-100 hover:bg-red-50'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
                Exit Group
              </button>
              <button
                onClick={() => { setReportReason(''); setShowReport(true) }}
                className={`w-full flex items-center gap-3 px-3 py-3 text-sm text-red-500 transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-red-50'}`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
                Report Group
              </button>
            </div>
          </>
        )}
      </div>

      {/* Add Members modal */}
      {showAddMembers && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div
            className={`w-80 rounded-2xl shadow-2xl flex flex-col max-h-[70vh] ${dm ? 'bg-gray-800' : 'bg-white'}`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="px-5 pt-5 pb-3 flex items-center justify-between">
              <h3 className={`font-semibold text-base ${txt}`}>Add Members</h3>
              <button onClick={() => { setShowAddMembers(false); setAddSearch('') }}
                className={`w-7 h-7 flex items-center justify-center rounded-full ${dm ? 'text-gray-400 hover:bg-gray-700' : 'text-gray-500 hover:bg-gray-100'}`}>
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className={`mx-4 mb-3 flex items-center gap-2 rounded-xl px-3 py-2 ${dm ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <svg className="w-4 h-4 text-gray-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <input
                autoFocus
                value={addSearch}
                onChange={(e) => setAddSearch(e.target.value)}
                placeholder="Search contacts…"
                className={`bg-transparent flex-1 outline-none text-sm ${dm ? 'text-white placeholder-gray-500' : 'text-gray-800 placeholder-gray-400'}`}
              />
            </div>
            <div className="overflow-y-auto flex-1 pb-2">
              {(() => {
                const pool = addSearch.length >= 2 ? userSearchResults : contacts
                const available = pool.filter((u) => !participants.some((p) => p.id === u.id))
                if (available.length === 0) {
                  return (
                    <p className={`text-sm text-center py-6 ${sub}`}>
                      {addSearch.length >= 2 ? 'No users found' : 'No contacts to add — type a name to search all users'}
                    </p>
                  )
                }
                return available.map((u) => {
                  const uName = u.display_name || u.full_name || u.username || '?'
                  return (
                    <button
                      key={u.id}
                      onClick={() => { handleAddMember(u.id); setShowAddMembers(false) }}
                      className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors ${dm ? 'hover:bg-gray-700' : 'hover:bg-gray-50'}`}
                    >
                      <div className="w-9 h-9 rounded-full overflow-hidden bg-violet-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {u.avatar_url ? <img src={u.avatar_url} alt="" className="w-full h-full object-cover" /> : uName[0].toUpperCase()}
                      </div>
                      <p className={`text-sm font-medium ${txt}`}>{uName}</p>
                    </button>
                  )
                })
              })()}
            </div>
          </div>
        </div>
      )}

      {/* Report modal */}
      {showReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className={`w-72 rounded-2xl shadow-2xl p-5 ${dm ? 'bg-gray-800' : 'bg-white'}`}>
            <h3 className={`font-semibold mb-1 ${txt}`}>Report Group</h3>
            <p className={`text-xs mb-3 ${sub}`}>
              We will report this group for review when you tap Report below.
            </p>
            <textarea
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className={`w-full rounded-xl px-3 py-2 text-sm outline-none resize-none mb-3 ${dm ? 'bg-gray-700 text-white placeholder-gray-500' : 'bg-gray-100 text-gray-800 placeholder-gray-400'}`}
            />
            <div className="flex gap-2">
              <button onClick={() => setShowReport(false)}
                className={`flex-1 py-2 rounded-xl text-sm ${dm ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}>
                Cancel
              </button>
              <button
                onClick={() => { showToast('Group reported', 'success'); setShowReport(false) }}
                className="flex-1 py-2 rounded-xl text-sm bg-red-500 text-white hover:bg-red-600"
              >
                Report
              </button>
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={!!confirm}
        title={confirm?.title}
        message={confirm?.message}
        confirmLabel={confirm?.confirmLabel}
        variant={confirm?.variant}
        onConfirm={() => { confirm?.onConfirm(); setConfirm(null) }}
        onCancel={() => setConfirm(null)}
        darkMode={dm}
      />
    </div>
  )
}
