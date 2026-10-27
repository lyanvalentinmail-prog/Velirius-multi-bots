'use strict'

const crypto = require('crypto')
const config = require('../config')

function base64url(input) {
  return Buffer.from(input).toString('base64url')
}

function sign(data) {
  return crypto.createHmac('sha256', config.JWT_SECRET).update(data).digest('base64url')
}

/** Crea un token de sesión con vencimiento. */
function issueToken(user) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }))
  const payload = base64url(JSON.stringify({
    sub: user.id,
    email: user.email,
    name: user.name,
    iat: Date.now(),
    exp: Date.now() + config.TOKEN_TTL_DAYS * 24 * 60 * 60 * 1000
  }))
  const signature = sign(`${header}.${payload}`)
  return `${header}.${payload}.${signature}`
}

/** Verifica firma y vencimiento; devuelve el payload o lanza error. */
function verifyToken(token) {
  if (!token || typeof token !== 'string' || token.split('.').length !== 3) {
    throw new Error('Token mal formado')
  }
  const [header, payload, signature] = token.split('.')
  const expected = sign(`${header}.${payload}`)
  const a = Buffer.from(signature)
  const b = Buffer.from(expected)
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    throw new Error('Firma del token inválida')
  }
  const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8'))
  if (!data.exp || data.exp < Date.now()) throw new Error('Token expirado')
  return data
}

module.exports = { issueToken, verifyToken }
