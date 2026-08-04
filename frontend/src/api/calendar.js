import client from './client'

export const getCalendarStatus = () => client.get('/calendar/status').then((r) => r.data)

export const scheduleMeeting = (payload) =>
  client.post('/calendar/schedule-meeting', payload).then((r) => r.data)

export const disconnectCalendar = () => client.delete('/calendar/disconnect').then((r) => r.data)
