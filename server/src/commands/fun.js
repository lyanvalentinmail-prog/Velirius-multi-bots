'use strict'

const api = require('../velirius')

// ── Anime (imágenes) ─────────────────────────────────────────
const animeCommands = ['neko', 'waifu', 'maid'].map((name) => ({
  command: name,
  alias: [],
  category: 'anime',
  desc: `Imagen aleatoria de ${name}`,
  params: '',
  async run(ctx) {
    const resolved = await ctx.api.resolve(`/anime/${name}`, { amount: 1 }, 'media')
    await ctx.deliver(resolved, `🌸 ${name}`)
  }
}))

animeCommands.push({
  command: 'pokemon',
  alias: ['poke'],
  category: 'anime',
  desc: 'Arte oficial, tipos y datos de un Pokémon',
  params: '<nombre|id|random>',
  async run(ctx) {
    const query = ctx.text || 'random'
    const resolved = await ctx.api.resolve('/anime/pokemon', { query }, 'media')
    await ctx.deliver(resolved, `🔎 ${query}`)
  }
})

// ── Reacciones GIF (26 endpoints) ────────────────────────────
const REACTIONS = api.CATALOG.reactions
const reactionCommands = REACTIONS.map((name) => ({
  command: name,
  alias: [],
  category: 'reactions',
  desc: `GIF de reacción: ${name}`,
  params: '[@usuario]',
  async run(ctx) {
    const target = ctx.mentions.length
      ? ` → @${ctx.mentions[0].split('@')[0]}`
      : ''
    const resolved = await ctx.api.resolve(`/reactions/${name}`, {}, 'media')
    await ctx.deliver(resolved, `💫 ${name}${target}`)
  }
}))

// ── Canvas: stickers y efectos de imagen ─────────────────────
const canvasCommands = [
  {
    command: 'quotly',
    desc: 'Sticker de burbuja de chat estilo Quotly',
    params: '<texto>',
    build: (ctx) => ({ route: '/canvas/quotly', params: { text: ctx.text, username: ctx.pushName || ctx.bot.name } })
  },
  {
    command: 'brat',
    desc: 'Sticker brat con el texto que envíes',
    params: '<texto>',
    build: (ctx) => ({ route: '/canvas/brat', params: { text: ctx.text } })
  },
  ...['carcel', 'sunglass', 'trollface', 'badface', 'rata', 'banana', 'arandano', 'pan', 'galletita', 'minions'].map((name) => ({
    command: name,
    desc: `Efecto canvas ${name} sobre una foto`,
    params: '<url de la imagen>',
    build: (ctx) => ({ route: `/canvas/${name}`, params: { url: ctx.text } })
  })),
  {
    command: 'glitch',
    desc: 'Efecto glitch RGB sobre una foto',
    params: '<url> [fuerza 0-1]',
    build: (ctx) => ({ route: '/canvas/glitch', params: { url: ctx.args[0], amount: ctx.args[1] || 0.7 } })
  },
  {
    command: 'swirl',
    desc: 'Remolino sobre una foto',
    params: '<url> [grados]',
    build: (ctx) => ({ route: '/canvas/swirl', params: { url: ctx.args[0], amount: ctx.args[1] || 190 } })
  },
  {
    command: 'liquify',
    desc: 'Infla, aspira o derrite una foto',
    params: '<url> [bulge|pinch|melt]',
    build: (ctx) => ({ route: '/canvas/liquify', params: { url: ctx.args[0], mode: ctx.args[1] || 'bulge', amount: 65 } })
  }
].map((def) => ({
  command: def.command,
  alias: [],
  category: 'canvas',
  desc: def.desc,
  params: def.params,
  async run(ctx) {
    if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}${def.command} ${def.params}`)
    const { route, params } = def.build(ctx)
    await ctx.reply('𓂃 ࣪ ִֶָ☾. generando imagen...')
    const resolved = await ctx.api.resolve(route, params, 'media')
    await ctx.deliver(resolved, `🎨 ${def.command}`)
  }
}))

module.exports = [...animeCommands, ...reactionCommands, ...canvasCommands]
