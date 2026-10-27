'use strict'

const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')

const config = require('./src/config')
const requireToken = require('./src/middleware/auth')
const botsRouter = require('./src/routes/bots')
const manager = require('./src/manager')

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Rutas públicas.
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'en línea', app: config.APP_NAME, time: new Date().toISOString() })
})

app.post('/api/login', (req, res) => {
  // Sin token configurado, el acceso está abierto.
  if (!config.AUTH_ENABLED) {
    return res.json({ ok: true, appName: config.APP_NAME, authEnabled: false })
  }
  const token = (req.body?.token || '').trim()
  if (token !== config.DASHBOARD_TOKEN) {
    return res.status(401).json({ ok: false, error: 'Token incorrecto', authEnabled: true })
  }
  res.json({ ok: true, appName: config.APP_NAME, authEnabled: true })
})

// Rutas protegidas del dashboard.
app.use('/api', requireToken, botsRouter)

// Errores globales de la API.
app.use('/api', (err, req, res, next) => {
  console.error('[api]', err.message)
  res.status(500).json({ ok: false, error: err.message })
})

// Dashboard estático (la misma carpeta web que se despliega en Vercel).
const webDir = path.resolve(__dirname, '..', 'web')
if (fs.existsSync(webDir)) {
  app.use(express.static(webDir))
  app.get(/^\/(?!api\/).*/, (req, res) => {
    res.sendFile(path.join(webDir, 'index.html'))
  })
}

app.listen(config.PORT, config.HOST, async () => {
  const banner = [
    '',
    '𓂃 ࣪ ִֶָ☾. ───────────────────────────────────────',
    `  ${config.APP_NAME}`,
    `  Servidor:  http://localhost:${config.PORT}`,
    `  API:       ${config.VELIRIUS_API}`,
    config.AUTH_ENABLED
      ? `  Token del dashboard: ${config.DASHBOARD_TOKEN}`
      : '  Acceso del dashboard: ABIERTO (sin token)',
    '𓂃 ࣪ ִֶָ☾. ───────────────────────────────────────',
    ''
  ].join('\n')
  console.log(banner)

  // Reconecta las sesiones que ya estaban registradas.
  await manager.init()
})

// Apagado ordenado.
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    console.log('\nCerrando Velirius Multi-Bots...')
    for (const [id, instance] of manager.instances) {
      try { instance.sock?.end(undefined) } catch (_) { /* noop */ }
    }
    process.exit(0)
  })
}
