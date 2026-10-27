'use strict'

const fs = require('fs')
const path = require('path')
const pino = require('pino')
const QRCode = require('qrcode')
const qrTerminal = require('qrcode-terminal')
const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  DisconnectReason,
  makeCacheableSignalKeyStore,
  Browsers
} = require('@whiskeysockets/baileys')

const config = require('./config')
const store = require('./store')
const registry = require('./commands')
const { handleMessage } = require('./dispatcher')

const logger = pino({ level: 'silent' })
const delay = (ms) => new Promise((r) => setTimeout(r, ms))

class BotManager {
  constructor() {
    /** @type {Map<string, any>} instancias vivas por id de bot */
    this.instances = new Map()
  }

  // ── Utilidades de soporte ──────────────────────────────────
  log(id, message, level = 'info') {
    const instance = this.instances.get(id)
    const line = { time: new Date().toISOString(), level, message }
    if (instance) {
      instance.logs.push(line)
      if (instance.logs.length > 200) instance.logs.shift()
    }
    const tag = `[${id}]`
    if (level === 'error') console.error(tag, message)
    else console.log(tag, message)
  }

  bump(id, key) {
    const instance = this.instances.get(id)
    if (instance) instance.stats[key] = (instance.stats[key] || 0) + 1
  }

  getLogs(id) {
    return this.instances.get(id)?.logs || []
  }

  getStats(id) {
    return this.instances.get(id)?.stats || { messages: 0, commands: 0 }
  }

  isRunning(id) {
    return this.instances.has(id)
  }

  sessionOf(id) {
    const bot = store.get(id)
    const instance = this.instances.get(id)
    return {
      status: bot?.session?.status || 'desconectado',
      method: bot?.session?.method || null,
      phone: bot?.session?.phone || null,
      qr: bot?.session?.qr || null,
      pairingCode: bot?.session?.pairingCode || null,
      running: Boolean(instance),
      number: instance?.sock?.user?.id?.split(':')[0] || null,
      startedAt: instance?.startedAt || null
    }
  }

  // ── Ciclo de vida de una sesión ────────────────────────────
  async start(id, options = {}) {
    const bot = store.get(id)
    if (!bot) throw new Error('El bot no existe')
    if (this.instances.has(id)) throw new Error('Ese bot ya está conectándose o conectado')

    const method = options.method === 'pairing' ? 'pairing' : 'qr'
    const phone = (options.phone || '').replace(/\D/g, '')
    if (method === 'pairing' && phone.length < 8) {
      throw new Error('Para pairing code se necesita un número con código de país, ej. 59896719709')
    }

    this.instances.set(id, {
      sock: null,
      method,
      phone,
      manualStop: false,
      attempts: 0,
      startedAt: Date.now(),
      stats: { messages: 0, commands: 0 },
      logs: []
    })
    store.saveSession(id, {
      status: 'iniciando',
      method,
      phone: phone || null,
      qr: null,
      pairingCode: null
    })
    this.log(id, `Sesión iniciada con método ${method}`)
    await this._connect(id, method, phone)
  }

  async _connect(id, method, phone) {
    const instance = this.instances.get(id)
    if (!instance) return
    const bot = store.get(id)
    if (!bot) return

    const authDir = path.join(config.AUTH_DIR, id)
    fs.mkdirSync(authDir, { recursive: true })
    const { state, saveCreds } = await useMultiFileAuthState(authDir)

    let version
    try {
      ({ version } = await fetchLatestBaileysVersion())
    } catch (_) {
      version = [2, 3000, 0]
    }

    const sock = makeWASocket({
      version,
      logger,
      printQRInTerminal: false,
      auth: {
        creds: state.creds,
        keys: makeCacheableSignalKeyStore(state.keys, logger)
      },
      browser: Browsers.ubuntu('Chrome'),
      markOnlineOnConnect: false,
      syncFullHistory: false,
      generateHighQualityLinkPreview: true,
      getMessage: async () => undefined
    })
    instance.sock = sock

    // ── Pairing code (solo si la sesión aún no está registrada) ──
    if (method === 'pairing' && !sock.authState.creds.registered) {
      try {
        await delay(2500)
        const rawCode = await sock.requestPairingCode(phone)
        const pairingCode = (rawCode || '').match(/.{1,4}/g)?.join('-') || rawCode
        store.saveSession(id, { status: 'esperando pairing', pairingCode })
        this.log(id, `Pairing code generado: ${pairingCode}`)
      } catch (err) {
        this.log(id, `Fallo al pedir pairing code: ${err.message}`, 'error')
      }
    }

    // ── Eventos de conexión ─────────────────────────────────
    sock.ev.on('creds.update', saveCreds)

    sock.ev.on('connection.update', async (update) => {
      const { connection, lastDisconnect, qr } = update

      if (qr) {
        try {
          const dataUrl = await QRCode.toDataURL(qr, { width: 264, margin: 1 })
          store.saveSession(id, { status: 'esperando QR', qr: dataUrl, pairingCode: null })
          if (process.stdout.isTTY) {
            qrTerminal.generate(qr, { small: true }, (qrText) => {
              this.log(id, `QR para ${bot.name}:\n${qrText}`)
            })
          } else {
            this.log(id, 'QR generado (visible en el dashboard)')
          }
        } catch (err) {
          this.log(id, `No se pudo generar el QR: ${err.message}`, 'error')
        }
      }

      if (connection === 'connecting') {
        store.saveSession(id, { status: 'conectando' })
        this.log(id, 'Conectando con WhatsApp...')
      }

      if (connection === 'open') {
        instance.attempts = 0
        instance.startedAt = Date.now()
        const number = sock.user?.id?.split(':')[0] || null
        store.saveSession(id, { status: 'conectado', qr: null, pairingCode: null })
        this.log(id, `Conectado como ${sock.user?.name || number}`)
      }

      if (connection === 'close') {
        const statusCode = lastDisconnect?.error?.output?.statusCode
        const loggedOut = statusCode === DisconnectReason.loggedOut
        store.saveSession(id, { status: loggedOut ? 'cerrada (sesión cerrada)' : 'desconectado', qr: null, pairingCode: null })
        this.log(id, `Conexión cerrada (código ${statusCode ?? '?'})`, loggedOut ? 'error' : 'info')

        if (instance.manualStop) return
        if (loggedOut) {
          fs.rmSync(authDir, { recursive: true, force: true })
          this.instances.delete(id)
          return
        }

        instance.attempts += 1
        const wait = Math.min(1000 * 2 ** instance.attempts, 15000)
        this.log(id, `Reintentando en ${Math.round(wait / 1000)}s (intento ${instance.attempts})`)
        setTimeout(() => this._connect(id, instance.method, instance.phone), wait)
      }
    })

    // ── Mensajes entrantes ──────────────────────────────────
    sock.ev.on('messages.upsert', async ({ messages, type }) => {
      if (type !== 'notify' || !messages[0]) return
      const currentBot = store.get(id)
      if (!currentBot) return
      this.bump(id, 'messages')
      let activeBot = currentBot
      try {
        await handleMessage({
          sock,
          bot: currentBot,
          m: messages[0],
          manager: this,
          store,
          registry,
          startedAt: instance.startedAt,
          refreshBot: (updated) => { activeBot = updated }
        })
      } catch (err) {
        this.log(id, `Error procesando mensaje: ${err.message}`, 'error')
      }
    })

    // ── Bienvenida a grupos ─────────────────────────────────
    sock.ev.on('group-participants.update', async (event) => {
      const currentBot = store.get(id)
      if (!currentBot?.welcomeText || event.action !== 'add') return
      for (const participant of event.participants) {
        const text = currentBot.welcomeText.replace(/@user/g, `@${participant.split('@')[0]}`)
        await sock.sendMessage(event.id, { text, mentions: [participant] }).catch(() => {})
      }
    })
  }

  async stop(id) {
    const instance = this.instances.get(id)
    if (!instance) throw new Error('El bot no está en ejecución')
    instance.manualStop = true
    try {
      instance.sock?.ev.removeAllListeners('connection.update')
      instance.sock?.end(undefined)
    } catch (_) { /* ya cerrado */ }
    this.instances.delete(id)
    store.saveSession(id, { status: 'detenido', qr: null, pairingCode: null })
    this.log(id, 'Sesión detenida manualmente')
  }

  async logout(id) {
    const instance = this.instances.get(id)
    if (instance) {
      try { await instance.sock?.logout() } catch (_) { /* sin sesión */ }
      instance.manualStop = true
      this.instances.delete(id)
    }
    const authDir = path.join(config.AUTH_DIR, id)
    fs.rmSync(authDir, { recursive: true, force: true })
    store.saveSession(id, {
      status: 'desconectado',
      qr: null,
      pairingCode: null,
      phone: null,
      method: null
    })
    this.log(id, 'Sesión cerrada y credenciales eliminadas')
  }

  async restart(id) {
    const instance = this.instances.get(id)
    const method = instance?.method || 'qr'
    const phone = instance?.phone || ''
    if (instance) {
      instance.manualStop = true
      try {
        instance.sock?.ev.removeAllListeners('connection.update')
        await instance.sock?.end(undefined)
      } catch (_) { /* ignore */ }
      this.instances.delete(id)
    }
    await this.start(id, { method, phone })
  }

  /** Reconecta al arrancar el servidor los bots con sesión guardada. */
  async init() {
    const bots = store.list()
    for (const bot of bots) {
      const credsFile = path.join(config.AUTH_DIR, bot.id, 'creds.json')
      try {
        if (fs.existsSync(credsFile)) {
          const creds = JSON.parse(fs.readFileSync(credsFile, 'utf8'))
          if (creds.registered) {
            await this.start(bot.id, { method: bot.session?.method || 'qr', phone: bot.session?.phone })
            await delay(1500)
          }
        }
      } catch (err) {
        this.log(bot.id, `No se pudo reconectar al iniciar: ${err.message}`, 'error')
      }
    }
  }
}

module.exports = new BotManager()
