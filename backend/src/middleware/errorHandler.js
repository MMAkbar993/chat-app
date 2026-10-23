import { config } from '../config/env.js'

// Last stop for any error a route passes to next(err) or throws. Errors a controller raises on
// purpose carry a status (err.status = 4xx) and a message meant for the member, so those go back
// as they are. Anything else is a fault: logged in full here, and in production answered with a
// generic message, so a database or library error never shows its internals to the browser.
export function errorHandler(err, req, res, next) {
  // An upload over the size limit (multer, routes/upload.routes.js): the member's mistake, not a fault.
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'That file is too large. Files can be up to 100 MB.' })
  }
  const status = err.status || err.statusCode || 500
  if (status >= 500) console.error(`[${req.method} ${req.originalUrl}]`, err)
  if (res.headersSent) return next(err)
  const message = status >= 500 && config.nodeEnv === 'production'
    ? 'Something went wrong on our side. Please try again.'
    : err.message || 'Internal server error'
  res.status(status).json({ error: message })
}
