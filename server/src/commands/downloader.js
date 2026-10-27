'use strict'

/**
 * Descargas respaldadas por https://velirius-api-sd8u.vercel.app
 * Si la API devuelve JSON, resolve() extrae la URL del medio;
 * si devuelve el archivo directo, se reenvía esa misma URL.
 */
module.exports = [
  {
    command: 'play',
    alias: ['p'],
    category: 'downloader',
    desc: 'Busca y descarga una canción completa en MP3',
    params: '<canción>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}play Lisa Money`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. buscando la canción...')
      const resolved = await ctx.api.resolve('/downloader/play', { query: ctx.text }, 'media')
      await ctx.deliver(resolved, `🎵 ${ctx.text}`)
    }
  },
  {
    command: 'mp3',
    alias: ['yta', 'ytmp3', 'audio'],
    category: 'downloader',
    desc: 'Audio MP3 desde un video de YouTube (URL o búsqueda)',
    params: '<url o búsqueda>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}mp3 <url de YouTube>`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. descargando audio...')
      const params = /youtu\.?be/.test(ctx.text) ? { url: ctx.text } : { query: ctx.text }
      const resolved = await ctx.api.resolve('/downloader/mp3', params, 'media')
      await ctx.deliver(resolved, '🎧 audio convertido')
    }
  },
  {
    command: 'mp4',
    alias: ['ytv', 'ytmp4', 'video'],
    category: 'downloader',
    desc: 'Video MP4 con audio desde YouTube (URL o búsqueda)',
    params: '<url o búsqueda>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}mp4 <url de YouTube>`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. descargando video...')
      const params = /youtu\.?be/.test(ctx.text) ? { url: ctx.text, quality: 'auto' } : { query: ctx.text }
      const resolved = await ctx.api.resolve('/downloader/mp4', params, 'media')
      await ctx.deliver(resolved, '🎬 video descargado')
    }
  },
  {
    command: 'tiktok',
    alias: ['tt'],
    category: 'downloader',
    desc: 'TikTok sin marca de agua (video o audio)',
    params: '<url>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}tiktok <url del TikTok>`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. procesando TikTok...')
      const resolved = await ctx.api.resolve('/downloader/tiktok', { url: ctx.text }, 'media')
      await ctx.deliver(resolved, '🎥 TikTok sin marca de agua')
    }
  },
  {
    command: 'instagram',
    alias: ['ig', 'insta'],
    category: 'downloader',
    desc: 'Reels, videos y fotos de Instagram',
    params: '<url>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}instagram <url del post/reel>`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. procesando Instagram...')
      const resolved = await ctx.api.resolve('/downloader/instagram', { url: ctx.text }, 'media')
      await ctx.deliver(resolved, '📸 Instagram')
    }
  },
  {
    command: 'facebook',
    alias: ['fb', 'face'],
    category: 'downloader',
    desc: 'Videos públicos de Facebook (HD/SD)',
    params: '<url>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}facebook <url del video>`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. procesando Facebook...')
      const resolved = await ctx.api.resolve('/downloader/facebook', { url: ctx.text }, 'media')
      await ctx.deliver(resolved, '📘 Facebook')
    }
  },
  {
    command: 'pinterestdl',
    alias: ['pindl'],
    category: 'downloader',
    desc: 'Descarga un pin de Pinterest en tamaño original',
    params: '<url del pin>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}pinterestdl <url del pin>`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. descargando pin...')
      const resolved = await ctx.api.resolve('/downloader/pinterest', { url: ctx.text }, 'media')
      await ctx.deliver(resolved, '📌 Pinterest')
    }
  },
  {
    command: 'lyric',
    alias: ['letra', 'letras'],
    category: 'downloader',
    desc: 'Letra de una canción',
    params: '<artista canción>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}lyric Kendrick Lamar Humble`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. buscando la letra...')
      const resolved = await ctx.api.resolve('/downloader/lyric', { query: ctx.text, format: 'json' }, 'text')
      await ctx.deliver(resolved, `🎶 ${ctx.text}`)
    }
  }
]
