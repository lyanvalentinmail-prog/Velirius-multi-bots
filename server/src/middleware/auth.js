'use strict'

const config = require('../config')
const users = require('../auth/users')
const { verifyToken } = require('../auth/tokens')

/**
 * Exige una sesión de usuario válida (token firmado).
 * Acepta además el DASHBOARD_TOKEN de servicio si está definido,
 * pensado para scripts o integraciones externas.
 */
function requireAuth(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ')
    ? header.slice(7).trim()
    : (req.headers['x-dashboard-token'] || '').trim()

  if (!token) {
    return res.status(401).json({ ok: false, error: 'No autenticado' })
  }

  // Token de servicio heredado.
  if (config.DASHBOARD_TOKEN && token === config.DASHBOARD_TOKEN) {
    req.service = true
    req.user = { id: null, email: 'service-account', name: 'Servicio' }
    return next()
  }

  try {
    const payload = verifyToken(token)
    const user = users.findById(payload.sub)
    if (!user) return res.status(401).json({ ok: false, error: 'Usuario no encontrado' })
    req.user = user
    next()
  } catch (err) {
    return res.status(401).json({ ok: false, error: err.message })
  }
}

module.exports = requireAuth
