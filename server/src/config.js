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

// ── Secreto para firmar los tokens de sesión (JWT casero HMAC) ──
// AUTH_SECRET en el entorno manda; si no, se guarda uno persistente
// en data/.jwt-secret para que las sesiones sobrevivan reinicios.
function resolveJwtSecret() {
  if (process.env.AUTH_SECRET && process.env.AUTH_SECRET.trim()) {
    return process.env.AUTH_SECRET.trim()
  }
  const secretFile = path.join(DATA_DIR, '.jwt-secret')
  try {
    if (fs.existsSync(secretFile)) return fs.readFileSync(secretFile, 'utf8').trim()
  } catch (_) { /* se regenera */ }
  const secret = crypto.randomBytes(32).toString('hex')
  try { fs.writeFileSync(secretFile, secret, { mode: 0o600 }) } catch (_) { /* sin permisos */ }
  return secret
}

// Token de servicio heredado (opcional). Si DASHBOARD_TOKEN está
// definido, además del login de usuarios se acepta como Bearer.
const DASHBOARD_TOKEN = (process.env.DASHBOARD_TOKEN || '').trim()

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  DASHBOARD_TOKEN,
  JWT_SECRET: resolveJwtSecret(),
  TOKEN_TTL_DAYS: Number(process.env.TOKEN_TTL_DAYS) || 30,
  // Google Sign-In (Google Identity Services, flujo ID token)
  GOOGLE_CLIENT_ID: (process.env.GOOGLE_CLIENT_ID || '').trim(),
  VELIRIUS_API: (process.env.VELIRIUS_API || 'https://velirius-api-sd8u.vercel.app').replace(/\/+$/, ''),
  APP_NAME: process.env.APP_NAME || 'Velirius Multi-Bots',
  DATA_DIR,
  AUTH_DIR,
  OWNER_NUMBER_DEFAULT: '59896719709',
  OWNER_NAME_DEFAULT: 'Lyann'
}
