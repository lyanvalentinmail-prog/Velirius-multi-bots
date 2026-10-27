'use strict'

const path = require('path')
const fs = require('fs')
const crypto = require('crypto')

// Carga el .env de la raíz del proyecto si existe.
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '..', 'data')
const AUTH_DIR = path.join(DATA_DIR, 'auth')

fs.mkdirSync(AUTH_DIR, { recursive: true })

// Si no hay token en el entorno, se genera uno persistente en
// data/.token para no cambiarlo en cada reinicio (útil en Termux).
function resolveToken() {
  if (process.env.DASHBOARD_TOKEN && process.env.DASHBOARD_TOKEN.trim()) {
    return process.env.DASHBOARD_TOKEN.trim()
  }
  const tokenFile = path.join(DATA_DIR, '.token')
  try {
    if (fs.existsSync(tokenFile)) return fs.readFileSync(tokenFile, 'utf8').trim()
  } catch (_) { /* se regenera */ }
  const token = crypto.randomBytes(10).toString('hex')
  try { fs.writeFileSync(tokenFile, token, { mode: 0o600 }) } catch (_) { /* sin permisos */ }
  return token
}

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  DASHBOARD_TOKEN: resolveToken(),
  VELIRIUS_API: (process.env.VELIRIUS_API || 'https://velirius-api-sd8u.vercel.app').replace(/\/+$/, ''),
  APP_NAME: process.env.APP_NAME || 'Velirius Multi-Bots',
  DATA_DIR,
  AUTH_DIR,
  OWNER_NUMBER_DEFAULT: '59896719709',
  OWNER_NAME_DEFAULT: 'Lyann'
}
