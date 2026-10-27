'use strict'

const path = require('path')
const fs = require('fs')
const express = require('express')
const cors = require('cors')

const config = require('./src/config')
const botsRouter = require('./src/routes/bots')
const manager = require('./src/manager')

const app = express()
app.use(cors())
app.use(express.json({ limit: '1mb' }))

// Salud pública.
app.get('/api/health', (req, res) => {
  res.json({ ok: true, status: 'en línea', app: config.APP_NAME, time: new Date().toISOString() })
})

// API del panel: acceso directo, sin login ni token.
app.use('/api', botsRouter)

// Errores globales de la API.
app.use('/api', (err, req, res, next) => {
  console.error('[api]', err.message)
  res.status(500).json({ ok: false, error: err.message })
})

// Dashboard estático servido en el mismo dominio (despliegue único).
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
    '  Acceso:    directo, sin login ni configuración',
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
