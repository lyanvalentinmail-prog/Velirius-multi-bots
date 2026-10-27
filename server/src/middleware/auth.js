'use strict'

const config = require('../config')

/**
 * Protege las rutas del dashboard con el token secreto.
 * Si no hay DASHBOARD_TOKEN configurado, la API queda abierta
 * y el panel entra sin pedir credenciales.
 */
function requireToken(req, res, next) {
  if (!config.AUTH_ENABLED) return next()

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
