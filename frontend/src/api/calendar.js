import client from './client'

export const getCalendarEvents = (timeMin, timeMax) =>
  client.get('/calendar/events', { params: { timeMin, timeMax } }).then((r) => r.data)

export const disconnectCalendar = () => client.delete('/calendar/disconnect').then((r) => r.data)
