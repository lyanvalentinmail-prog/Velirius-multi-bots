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

module.exports = {
  PORT: Number(process.env.PORT) || 3000,
  HOST: process.env.HOST || '0.0.0.0',
  VELIRIUS_API: (process.env.VELIRIUS_API || 'https://velirius-api-sd8u.vercel.app').replace(/\/+$/, ''),
  APP_NAME: process.env.APP_NAME || 'Velirius Multi-Bots',
  DATA_DIR,
  AUTH_DIR,
  OWNER_NUMBER_DEFAULT: '59896719709',
  OWNER_NAME_DEFAULT: 'Lyann'
}
