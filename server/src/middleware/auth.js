'use strict'

const config = require('../config')

/** Protege las rutas del dashboard con el token secreto. */
function requireToken(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : (req.headers['x-dashboard-token'] || req.query.token || '').trim()

  if (!token || token !== config.DASHBOARD_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Token inválido o ausente' })
  }
  next()
}

module.exports = requireToken
