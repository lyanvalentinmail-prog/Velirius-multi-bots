'use strict'

module.exports = [
  {
    command: 'calc',
    alias: ['calculadora', 'calcular'],
    category: 'tools',
    desc: 'Calculadora científica (+ - * / ^ sqrt sin pi...)',
    params: '<expresión>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}calc (2+3)*4^2 + sqrt(81)`)
      const resolved = await ctx.api.resolve('/tools/calculator', { expr: ctx.text }, 'text')
      await ctx.deliver(resolved, '🧮 calculadora')
    }
  },
  {
    command: 'traducir',
    alias: ['translate', 'traductor'],
    category: 'tools',
    desc: 'Traduce texto (el primer argumento puede ser el idioma)',
    params: '[en|es|pt...] <texto>',
    async run(ctx) {
      const langPattern = /^[a-z]{2}$/i
      const to = langPattern.test(ctx.args[0] || '') ? ctx.args.shift().toLowerCase() : 'en'
      if (!ctx.args.length) return ctx.reply(`Uso: ${ctx.prefix}traducir en hola mundo`)
      const resolved = await ctx.api.resolve('/tools/translator', { text: ctx.args.join(' '), to, from: 'auto' }, 'text')
      await ctx.deliver(resolved, `🌐 traducción a ${to}`)
    }
  },
  {
    command: 'tts',
    alias: ['voz', 'speech'],
    category: 'tools',
    desc: 'Convierte texto en audio MP3 (text to speech)',
    params: '[es|en...] <texto>',
    async run(ctx) {
      const langPattern = /^[a-z]{2}$/i
      const lang = langPattern.test(ctx.args[0] || '') ? ctx.args.shift().toLowerCase() : 'es'
      if (!ctx.args.length) return ctx.reply(`Uso: ${ctx.prefix}tts hola, soy Velirius`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. generando audio...')
      const resolved = await ctx.api.resolve('/tools/tts', { text: ctx.args.join(' '), lang, direct: true }, 'media')
      await ctx.deliver(resolved, '🔊 texto a voz')
    }
  },
  {
    command: 'morse',
    alias: ['codemorse'],
    category: 'tools',
    desc: 'Codifica o decodifica código Morse',
    params: '<texto o código>',
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}morse SOS`)
      const looksLikeMorse = /^[·.\-–/ ]+$/.test(ctx.text)
      const resolved = await ctx.api.resolve('/tools/morse', {
        text: ctx.text,
        mode: looksLikeMorse ? 'decode' : 'encode',
        separator: '/'
      }, 'text')
      await ctx.deliver(resolved, '📡 morse')
    }
  },
  {
    command: 'resize',
    alias: ['redimensionar'],
    category: 'tools',
    desc: 'Cambia el tamaño de una imagen',
    params: '<url> <ancho> [alto]',
    async run(ctx) {
      const [url, width, height] = ctx.args
      if (!url || !width) return ctx.reply(`Uso: ${ctx.prefix}resize https://foto.jpg 512`)
      await ctx.reply('𓂃 ࣪ ִֶָ☾. redimensionando...')
      const resolved = await ctx.api.resolve('/tools/resize', {
        url, width, ...(height ? { height } : {}), json: true
      }, 'media')
      await ctx.deliver(resolved, '📐 imagen redimensionada')
    }
  }
]
