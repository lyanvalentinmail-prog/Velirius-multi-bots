'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('./config')

const DB_FILE = path.join(config.DATA_DIR, 'bots.json')

/**
 * Configuración por defecto de un sub-bot recién creado.
 * Todos estos campos son editables desde el dashboard.
 */
function defaultBot(body = {}, ownerId = null) {
  const now = new Date().toISOString()
  return {
    id: body.id || crypto.randomBytes(6).toString('hex'),
    ownerId,
    name: body.name || 'Velirius Bot',
    prefix: body.prefix || '.',
    // El banner es la línea decorativa que encabeza el menú.
    banner: body.banner || '𓂃 ࣪ ִֶָ☾.',
    // bannerUrl: imagen opcional que se envía antes del menú.
    bannerUrl: body.bannerUrl || '',
    description: body.description || '',
    owners: Array.isArray(body.owners) && body.owners.length
      ? body.owners.map(String)
      : [config.OWNER_NUMBER_DEFAULT],
    ownerName: body.ownerName || config.OWNER_NAME_DEFAULT,
    // public = responde a todos · private = solo propietarios.
    mode: body.mode === 'private' ? 'private' : 'public',
    // texto = menú con el diseño dado · lista = mensaje de lista interactivo.
    menuStyle: body.menuStyle === 'lista' ? 'lista' : 'texto',
    welcomeText: body.welcomeText || '',
    autoread: body.autoread !== false,
    enabled: body.enabled !== false,
    disabledCommands: Array.isArray(body.disabledCommands) ? body.disabledCommands : [],
    createdAt: now,
    updatedAt: now
  }
}

function readAll() {
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf8')
    const data = JSON.parse(raw)
    return data && typeof data === 'object' ? data : {}
  } catch (_) {
    return {}
  }
}

function writeAll(data) {
  const tmp = DB_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, DB_FILE)
}

const store = {
  // Lista global (sistema: reconexión al arrancar, migraciones).
  list() {
    return Object.values(readAll()).sort((a, b) => a.createdAt.localeCompare(b.createdAt))
  },

  // Bots visibles para un usuario. ownerId null = servicio/global.
  listForOwner(ownerId) {
    const all = this.list()
    if (!ownerId) return all
    return all.filter((bot) => bot.ownerId === ownerId)
  },

  get(id) {
    return readAll()[id] || null
  },

  create(body, ownerId = null) {
    const bot = defaultBot(body, ownerId)
    const all = readAll()
    if (all[bot.id]) throw new Error('Ya existe un bot con ese ID')
    all[bot.id] = bot
    writeAll(all)
    return bot
  },

  // El primer usuario que se registra hereda los bots sin dueño
  // (migración desde la versión anterior sin cuentas).
  claimOwnerless(ownerId) {
    const all = readAll()
    let changed = false
    for (const bot of Object.values(all)) {
      if (!bot.ownerId) {
        bot.ownerId = ownerId
        changed = true
      }
    }
    if (changed) writeAll(all)
  },

  update(id, patch = {}) {
    const all = readAll()
    const bot = all[id]
    if (!bot) return null
    const editable = [
      'name', 'prefix', 'banner', 'bannerUrl', 'description', 'owners',
      'ownerName', 'mode', 'menuStyle', 'welcomeText', 'autoread',
      'enabled', 'disabledCommands'
    ]
    for (const key of editable) {
      if (patch[key] !== undefined) bot[key] = patch[key]
    }
    if (typeof bot.prefix === 'string') bot.prefix = bot.prefix.slice(0, 3) || '.'
    if (!Array.isArray(bot.owners) || bot.owners.length === 0) {
      bot.owners = [config.OWNER_NUMBER_DEFAULT]
    }
    bot.updatedAt = new Date().toISOString()
    all[id] = bot
    writeAll(all)
    return bot
  },

  remove(id) {
    const all = readAll()
    if (!all[id]) return false
    delete all[id]
    writeAll(all)
    return true
  },

  // Sube una imagen de sesión (QR / pairing) al registro en disco.
  saveSession(id, session) {
    const all = readAll()
    if (!all[id]) return
    all[id].session = { ...(all[id].session || {}), ...session, lastUpdate: new Date().toISOString() }
    writeAll(all)
  }
}

module.exports = store
module.exports.defaultBot = defaultBot
