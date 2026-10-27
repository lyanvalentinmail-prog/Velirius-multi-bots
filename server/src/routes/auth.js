'use strict'

const express = require('express')
const config = require('../config')
const users = require('../auth/users')
const store = require('../store')
const { issueToken, verifyToken } = require('../auth/tokens')
const { verifyGoogleCredential } = require('../auth/google')

const router = express.Router()

function sessionPayload(user) {
  return {
    token: issueToken(user),
    user: users.public(user)
  }
}

// Configuración pública que necesita el frontend antes de entrar.
router.get('/config', (req, res) => {
  res.json({
    ok: true,
    appName: config.APP_NAME,
    googleEnabled: Boolean(config.GOOGLE_CLIENT_ID),
    googleClientId: config.GOOGLE_CLIENT_ID || null
  })
})

// Registro con email y contraseña.
router.post('/register', (req, res) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase()
    const password = String(req.body?.password || '')
    const name = String(req.body?.name || '').trim()
    if (password.length < 6) {
      return res.status(400).json({ ok: false, error: 'La contraseña debe tener al menos 6 caracteres' })
    }
    const user = users.create({ email, password, name })
    if (users.count() === 1) store.claimOwnerless(user.id)
    res.status(201).json({ ok: true, ...sessionPayload(user) })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

// Login con email y contraseña.
router.post('/login', (req, res) => {
  const email = String(req.body?.email || '').trim().toLowerCase()
  const password = String(req.body?.password || '')
  const user = users.verify(email, password)
  if (!user) {
    return res.status(401).json({ ok: false, error: 'Email o contraseña incorrectos' })
  }
  res.json({ ok: true, ...sessionPayload(user) })
})

// Login con Google: el frontend envía el ID token (credential) de GIS.
router.post('/google', async (req, res) => {
  try {
    const credential = String(req.body?.credential || '')
    const profile = await verifyGoogleCredential(credential)
    const wasFirst = users.count() === 0
    const user = users.upsertGoogle(profile)
    if (wasFirst) store.claimOwnerless(user.id)
    res.json({ ok: true, ...sessionPayload(user) })
  } catch (err) {
    res.status(401).json({ ok: false, error: `Google: ${err.message}` })
  }
})

// Devuelve el usuario actual si el token es válido.
router.get('/me', (req, res) => {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : ''
  try {
    const payload = verifyToken(token)
    const user = users.findById(payload.sub)
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' })
    res.json({ ok: true, user: users.public(user) })
  } catch (err) {
    res.status(401).json({ ok: false, error: err.message })
  }
})

module.exports = router
