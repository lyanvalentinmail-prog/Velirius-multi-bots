'use strict'

const express = require('express')
const store = require('../store')
const manager = require('../manager')
const velirius = require('../velirius')
const registry = require('../commands')
const { memoryUsage } = require('../menu')

const router = express.Router()

function serialize(bot) {
  return {
    ...bot,
    session: manager.sessionOf(bot.id),
    running: manager.isRunning(bot.id),
    stats: manager.getStats(bot.id)
  }
}

// ── Metadatos del panel y catálogo de la API ─────────────────
router.get('/meta', (req, res) => {
  res.json({
    ok: true,
    appName: process.env.APP_NAME || 'Velirius Multi-Bots',
    veliriusApi: velirius.BASE,
    memory: memoryUsage(),
    uptimeMs: process.uptime() * 1000,
    catalog: velirius.CATALOG,
    commands: registry.count(),
    categories: registry.categories()
  })
})

// ── CRUD de sub-bots ────────────────────────────────────────
router.get('/bots', (req, res) => {
  res.json({ ok: true, bots: store.list().map(serialize) })
})

router.post('/bots', (req, res) => {
  const { name } = req.body || {}
  if (!name || !String(name).trim()) {
    return res.status(400).json({ ok: false, error: 'El nombre del bot es obligatorio' })
  }
  const bot = store.create(req.body)
  res.status(201).json({ ok: true, bot: serialize(bot) })
})

router.get('/bots/:id', (req, res) => {
  const bot = store.get(req.params.id)
  if (!bot) return res.status(404).json({ ok: false, error: 'Bot no encontrado' })
  res.json({ ok: true, bot: serialize(bot), logs: manager.getLogs(bot.id) })
})

const PATCHABLE = [
  'name', 'prefix', 'banner', 'bannerUrl', 'description', 'owners',
  'ownerName', 'mode', 'menuStyle', 'welcomeText', 'autoread',
  'enabled', 'disabledCommands'
]

router.patch('/bots/:id', (req, res) => {
  const patch = {}
  for (const key of PATCHABLE) {
    if (req.body && req.body[key] !== undefined) patch[key] = req.body[key]
  }
  if (patch.mode && !['public', 'private'].includes(patch.mode)) {
    return res.status(400).json({ ok: false, error: "mode debe ser 'public' o 'private'" })
  }
  if (patch.menuStyle && !['texto', 'lista'].includes(patch.menuStyle)) {
    return res.status(400).json({ ok: false, error: "menuStyle debe ser 'texto' o 'lista'" })
  }
  if (patch.owners && !Array.isArray(patch.owners)) {
    return res.status(400).json({ ok: false, error: 'owners debe ser un array de números' })
  }
  const bot = store.update(req.params.id, patch)
  if (!bot) return res.status(404).json({ ok: false, error: 'Bot no encontrado' })
  res.json({ ok: true, bot: serialize(bot) })
})

router.delete('/bots/:id', async (req, res) => {
  try {
    if (manager.isRunning(req.params.id)) await manager.logout(req.params.id)
    const removed = store.remove(req.params.id)
    if (!removed) return res.status(404).json({ ok: false, error: 'Bot no encontrado' })
    res.json({ ok: true })
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message })
  }
})

// ── Control de la sesión de WhatsApp ────────────────────────
router.post('/bots/:id/start', async (req, res) => {
  try {
    const { method, phone } = req.body || {}
    await manager.start(req.params.id, { method, phone })
    res.json({ ok: true, session: manager.sessionOf(req.params.id) })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

router.post('/bots/:id/stop', async (req, res) => {
  try {
    await manager.stop(req.params.id)
    res.json({ ok: true, session: manager.sessionOf(req.params.id) })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

router.post('/bots/:id/restart', async (req, res) => {
  try {
    await manager.restart(req.params.id)
    res.json({ ok: true, session: manager.sessionOf(req.params.id) })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

router.post('/bots/:id/logout', async (req, res) => {
  try {
    await manager.logout(req.params.id)
    res.json({ ok: true, session: manager.sessionOf(req.params.id) })
  } catch (err) {
    res.status(400).json({ ok: false, error: err.message })
  }
})

router.get('/bots/:id/session', (req, res) => {
  if (!store.get(req.params.id)) return res.status(404).json({ ok: false, error: 'Bot no encontrado' })
  res.json({ ok: true, session: manager.sessionOf(req.params.id) })
})

router.get('/bots/:id/logs', (req, res) => {
  if (!store.get(req.params.id)) return res.status(404).json({ ok: false, error: 'Bot no encontrado' })
  res.json({ ok: true, logs: manager.getLogs(req.params.id) })
})

module.exports = router
