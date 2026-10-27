'use strict'

const config = require('./config')

const BASE = config.VELIRIUS_API

/**
 * Catálogo mínimo consumido por el bot. La API completa tiene
 * 104 endpoints: https://velirius-api-sd8u.vercel.app/docs
 * media = image | video | audio | json
 */
const CATALOG = {
  anime: ['neko', 'waifu', 'maid', 'pokemon'],
  reactions: [
    'hug', 'kiss', 'pat', 'slap', 'cuddle', 'wave', 'wink', 'blush',
    'smile', 'happy', 'dance', 'cry', 'poke', 'tickle', 'highfive',
    'handhold', 'nom', 'bite', 'bonk', 'baka', 'smug', 'laugh',
    'shrug', 'sleep', 'think', 'thumbsup'
  ],
  canvas: [
    'quotly', 'brat', 'carcel', 'sunglass', 'trollface', 'badface',
    'rata', 'banana', 'arandano', 'pan', 'galletita', 'minions',
    'glitch', 'swirl', 'liquify'
  ],
  downloader: ['tiktok', 'youtube', 'facebook', 'instagram', 'pinterest', 'mp3', 'mp4', 'play', 'lyric'],
  searcher: ['tiktok', 'youtube', 'google', 'pinterest', 'wikipedia'],
  tools: ['calculator', 'translator', 'resize', 'tts', 'stt', 'morse']
}

function buildUrl(route, params = {}) {
  const url = new URL(BASE + route)
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue
    url.searchParams.set(key, String(value))
  }
  return url.toString()
}

async function getJson(route, params = {}) {
  const res = await fetch(buildUrl(route, params), {
    headers: { accept: 'application/json' }
  })
  const contentType = res.headers.get('content-type') || ''
  if (!res.ok) {
    throw new Error(`La API respondió ${res.status} en ${route}`)
  }
  if (contentType.includes('application/json')) return res.json()
  // El endpoint devolvió el medio directo: lo devolvemos como URL.
  return { __direct: res.url, __type: contentType }
}

/** Devuelve la URL directa del medio (la descarga WhatsApp). */
function mediaUrl(route, params = {}) {
  return buildUrl(route, { ...params, direct: true })
}

const MEDIA_KEYS = ['url', 'media', 'image', 'video', 'audio', 'download', 'direct', 'link', 'src', 'resultUrl', 'file']
const MEDIA_EXT = /\.(jpe?g|png|webp|gif|mp4|m4v|webm|mp3|m4a|ogg|wav|aac|pdf)(\?|$)/i

/** Busca recursivamente la primera URL multimedia dentro de un JSON. */
function extractMedia(obj, depth = 0) {
  if (!obj || depth > 7) return null
  if (typeof obj === 'string') {
    return MEDIA_EXT.test(obj) && /^https?:\/\//.test(obj) ? obj : null
  }
  if (Array.isArray(obj)) {
    for (const item of obj) {
      const found = extractMedia(item, depth + 1)
      if (found) return found
    }
    return null
  }
  if (typeof obj === 'object') {
    for (const key of MEDIA_KEYS) {
      const value = obj[key]
      if (typeof value === 'string' && /^https?:\/\//.test(value) && MEDIA_EXT.test(value)) return value
    }
    for (const value of Object.values(obj)) {
      const found = extractMedia(value, depth + 1)
      if (found) return found
    }
  }
  return null
}

/** Resume una respuesta JSON en texto legible para resultados de búsqueda. */
function summarize(obj, limit = 8) {
  const lines = []
  const walk = (node) => {
    if (!node || lines.length >= limit) return
    if (Array.isArray(node)) return node.forEach(walk)
    if (typeof node === 'object') {
      const title = node.title || node.name || node.query || node.tema
      const url = node.url || node.link || node.permalink || node.web
      const desc = node.description || node.snippet || node.extract || node.text || node.resumen
      if (title || url || desc) {
        const line = [
          title ? `• ${title}` : null,
          desc ? `  ${String(desc).slice(0, 180)}` : null,
          url ? `  ${url}` : null
        ].filter(Boolean).join('\n')
        if (!lines.includes(line)) lines.push(line)
      }
      for (const value of Object.values(node)) {
        if (value && typeof value === 'object') walk(value)
      }
    } else if (typeof node === 'string' && node.length < 300) {
      if (!lines.includes(node)) lines.push(node)
    }
  }
  walk(obj)
  return lines.slice(0, limit).join('\n\n') || JSON.stringify(obj, null, 2).slice(0, 1500)
}

/** Convierte cualquier respuesta de la API en medio o texto. */
async function resolve(route, params = {}, kind = 'json') {
  const data = await getJson(route, params)
  if (data && data.__direct) {
    return { type: 'media', url: data.__direct, mediaType: data.__type, raw: data }
  }
  const url = extractMedia(data)
  if (url && kind !== 'text') {
    const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase()
    const type = ['mp4', 'webm', 'm4v', 'gif'].includes(ext)
      ? 'video'
      : ['mp3', 'm4a', 'ogg', 'wav', 'aac'].includes(ext)
        ? 'audio'
        : ext === 'webp' ? 'sticker' : 'image'
    return { type: 'media', url, mediaType: type, raw: data }
  }
  return { type: 'text', text: summarize(data), raw: data }
}

module.exports = { BASE, CATALOG, buildUrl, mediaUrl, getJson, extractMedia, summarize, resolve }
