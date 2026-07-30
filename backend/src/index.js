import http from 'http'
import { config } from './config/env.js'
import { checkConnection } from './config/database.js'
import { createApp } from './server.js'
import { initSocket } from './socket/index.js'
import { checkUnreadMessages } from './jobs/unreadMessageEmail.js'

const UNREAD_EMAIL_INTERVAL_MS = 15 * 60 * 1000

async function start() {
  await checkConnection()
  const app = createApp()
  const httpServer = http.createServer(app)
  initSocket(httpServer)
  httpServer.listen(config.port, () => {
    console.log(`Server running on http://localhost:${config.port}`)
  })
  setInterval(() => {
    checkUnreadMessages().catch((err) => console.error('checkUnreadMessages failed:', err.message))
  }, UNREAD_EMAIL_INTERVAL_MS)
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
