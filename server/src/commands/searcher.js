'use strict'

module.exports = [
  {
    command: 'google',
    alias: ['g', 'buscar'],
    category: 'searcher',
    desc: 'Busca en la web y resume los resultados',
    params: '<consulta>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}google Velirius API`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. buscando...')
      const resolved = await ctx.api.resolve('/searcher/google', { query: ctx.text, limit: 6, lang: 'es' }, 'text')
      await ctx.deliver(resolved, '🔎 resultados')
    }
  },
  {
    command: 'wikipedia',
    alias: ['wiki'],
    category: 'searcher',
    desc: 'Artículos de Wikipedia con extracto e imagen',
    params: '<tema>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}wikipedia One Piece`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. consultando Wikipedia...')
      const resolved = await ctx.api.resolve('/searcher/wikipedia', { query: ctx.text, limit: 3, lang: 'es' }, 'media')
      await ctx.deliver(resolved, '📚 Wikipedia')
    }
  },
  {
    command: 'pinterest',
    alias: ['pin'],
    category: 'searcher',
    desc: 'Busca imágenes o pines en Pinterest',
    params: '<consulta>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}pinterest gatos aesthetic`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. buscando pines...')
      const resolved = await ctx.api.resolve('/searcher/pinterest', { query: ctx.text, limit: 5 }, 'media')
      await ctx.deliver(resolved, '📌 Pinterest')
    }
  },
  {
    command: 'ytsearch',
    alias: ['ytbuscar', 'yts'],
    category: 'searcher',
    desc: 'Busca videos en YouTube',
    params: '<consulta>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}ytsearch Twice`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. buscando en YouTube...')
      const resolved = await ctx.api.resolve('/searcher/youtube', { query: ctx.text, limit: 8 }, 'text')
      await ctx.deliver(resolved, '▶️ YouTube')
    }
  },
  {
    command: 'ttsearch',
    alias: ['ttbuscar', 'ttsbuscar'],
    category: 'searcher',
    desc: 'Busca videos en TikTok',
    params: '<consulta>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}ttsearch anime edit`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. buscando en TikTok...')
      const resolved = await ctx.api.resolve('/searcher/tiktok', { query: ctx.text, limit: 8 }, 'text')
      await ctx.deliver(resolved, '🎵 TikTok')
    }
  }
]
