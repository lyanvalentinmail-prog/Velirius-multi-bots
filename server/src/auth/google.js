'use strict'

const crypto = require('crypto')
const config = require('../config')

const DISCOVERY = 'https://accounts.google.com/.well-known/openid-configuration'
const ALLOWED_ISSUERS = ['https://accounts.google.com', 'accounts.google.com']

let cache = { jwks: null, fetchedAt: 0 }
const TTL = 6 * 60 * 60 * 1000 // 6 horas

function b64urlDecode(value) {
  return Buffer.from(value, 'base64url')
}

async function getJwks() {
  if (cache.jwks && Date.now() - cache.fetchedAt < TTL) return cache.jwks
  const discovery = await fetch(DISCOVERY).then((r) => r.json())
  const jwks = await fetch(discovery.jwks_uri).then((r) => r.json())
  cache = { jwks, fetchedAt: Date.now() }
  return jwks
}

/**
 * Verifica un ID token de Google Identity Services.
 * Comprueba firma RS256 contra las JWKS públicas, emisor,
 * audiencia (nuestro GOOGLE_CLIENT_ID) y vencimiento.
 */
async function verifyGoogleCredential(credential) {
  if (!config.GOOGLE_CLIENT_ID) {
    throw new Error('El login con Google no está configurado en el servidor')
  }
  const parts = String(credential || '').split('.')
  if (parts.length !== 3) throw new Error('Credencial de Google inválida')

  let header
  let payload
  try {
    header = JSON.parse(b64urlDecode(parts[0]).toString('utf8'))
    payload = JSON.parse(b64urlDecode(parts[1]).toString('utf8'))
  } catch (_) {
    throw new Error('Credencial de Google mal formada')
  }
  const signature = b64urlDecode(parts[2])

  if (header.alg !== 'RS256') throw new Error('Algoritmo no soportado')
  if (!ALLOWED_ISSUERS.includes(payload.iss)) throw new Error('Emisor inválido')
  if (payload.aud !== config.GOOGLE_CLIENT_ID) throw new Error('Cliente OAuth no coincide')
  if (!payload.email_verified) throw new Error('El email de Google no está verificado')
  if (!payload.exp || payload.exp * 1000 < Date.now()) throw new Error('Credencial de Google expirada')

  const jwks = await getJwks()
  const key = jwks.keys.find((k) => k.kid === header.kid && k.kty === 'RSA')
  if (!key) throw new Error('Llave pública de Google no encontrada')

  const publicKey = crypto.createPublicKey({ key, format: 'jwk' })
  const valid = crypto.verify(
    'sha256',
    Buffer.from(`${parts[0]}.${parts[1]}`),
    { key: publicKey, padding: crypto.constants.RSA_PKCS1_PADDING },
    signature
  )
  if (!valid) throw new Error('Firma de Google inválida')

  return {
    googleId: payload.sub,
    email: payload.email,
    name: payload.name || payload.given_name || payload.email.split('@')[0],
    picture: payload.picture || null
  }
}

module.exports = { verifyGoogleCredential }
