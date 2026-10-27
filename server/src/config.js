'use strict'

const path = require('path')
const fs = require('fs')

// Carga el .env de la raíz del proyecto si existe.
require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env') })
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') })

const DATA_DIR = process.env.DATA_DIR
  ? path.resolve(process.env.DATA_DIR)
  : path.resolve(__dirname, '..', 'data')
const AUTH_DIR = path.join(DATA_DIR, 'auth')

fs.mkdirSync(AUTH_DIR, { recursive: true })

// El token es opcional: si DASHBOARD_TOKEN no está definido (o está
// vacío), el dashboard y la API quedan abiertos sin contraseña.
// Si defines la variable, todas las rutas /api pasan a exigirla.
function resolveToken() {
  return (process.env.DASHBOARD_TOKEN || '').trim()
}

const DASHBOARD_TOKEN = resolveToken()

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  DASHBOARD_TOKEN,
  AUTH_ENABLED: Boolean(DASHBOARD_TOKEN),
  VELIRIUS_API: (process.env.VELIRIUS_API || 'https://velirius-api-sd8u.vercel.app').replace(/\/+$/, ''),
  APP_NAME: process.env.APP_NAME || 'Velirius Multi-Bots',
  DATA_DIR,
  AUTH_DIR,
  OWNER_NUMBER_DEFAULT: '59896719709',
  OWNER_NAME_DEFAULT: 'Lyann'
}
