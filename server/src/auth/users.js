'use strict'

const fs = require('fs')
const path = require('path')
const crypto = require('crypto')
const config = require('../config')

const USERS_FILE = path.join(config.DATA_DIR, 'users.json')

function readAll() {
  try {
    return JSON.parse(fs.readFileSync(USERS_FILE, 'utf8')) || {}
  } catch (_) {
    return {}
  }
}

function writeAll(data) {
  const tmp = USERS_FILE + '.tmp'
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2))
  fs.renameSync(tmp, USERS_FILE)
}

function hashPassword(password, salt = crypto.randomBytes(16).toString('hex')) {
  const hash = crypto.scryptSync(String(password), salt, 64).toString('hex')
  return { salt, hash }
}

function verifyPassword(password, user) {
  if (!user || !user.hash || !user.salt) return false
  const candidate = crypto.scryptSync(String(password), user.salt, 64)
  const known = Buffer.from(user.hash, 'hex')
  return candidate.length === known.length && crypto.timingSafeEqual(candidate, known)
}

function publicUser(user) {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    provider: user.provider || 'email',
    createdAt: user.createdAt
  }
}

const users = {
  count() {
    return Object.keys(readAll()).length
  },

  list() {
    return Object.values(readAll()).map(publicUser)
  },

  findByEmail(email) {
    const key = String(email || '').trim().toLowerCase()
    return readAll()[key] || null
  },

  findById(id) {
    return Object.values(readAll()).find((u) => u.id === id) || null
  },

  create({ email, password, name, provider = 'email', googleId = null }) {
    const key = String(email || '').trim().toLowerCase()
    if (!key || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(key)) {
      throw new Error('Email no válido')
    }
    const all = readAll()
    if (all[key]) throw new Error('Ya existe una cuenta con ese email')

    const user = {
      id: crypto.randomBytes(9).toString('hex'),
      email: key,
      name: name || key.split('@')[0],
      provider,
      googleId,
      salt: null,
      hash: null,
      createdAt: new Date().toISOString()
    }
    if (password) {
      const { salt, hash } = hashPassword(password)
      user.salt = salt
      user.hash = hash
    }
    all[key] = user
    writeAll(all)
    return user
  },

  /** Busca por googleId/email o crea la cuenta en el primer login. */
  upsertGoogle({ email, name, googleId }) {
    const key = String(email || '').trim().toLowerCase()
    const all = readAll()
    if (all[key]) {
      if (!all[key].googleId) {
        all[key].googleId = googleId
        all[key].provider = all[key].hash ? all[key].provider : 'google'
        writeAll(all)
      }
      return all[key]
    }
    return this.create({ email: key, name, provider: 'google', googleId })
  },

  verify(email, password) {
    const user = this.findByEmail(email)
    if (!user || !user.hash) return null
    return verifyPassword(password, user) ? user : null
  },

  public: publicUser
}

module.exports = users
