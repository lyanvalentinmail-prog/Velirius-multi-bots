'use strict'

/**
 * Comandos exclusivos de propietario. Editan la configuración
 * del sub-bot en caliente: la misma que se edita en el dashboard.
 */
module.exports = [
  {
    command: 'prefix',
    alias: ['prefijo', 'setprefix'],
    category: 'owner',
    desc: 'Cambia el prefijo del bot',
    params: '<nuevo prefijo>',
    ownerOnly: true,
    async run(ctx) {
      const next = (ctx.args[0] || '').trim()
      if (!next) return ctx.reply(`Uso: ${ctx.prefix}prefix .`)
      const bot = ctx.store.update(ctx.bot.id, { prefix: next.slice(0, 3) })
      ctx.refreshBot(bot)
      await ctx.reply(`✓ Prefijo actualizado a *${bot.prefix}*`)
    }
  },
  {
    command: 'banner',
    alias: ['setbanner'],
    category: 'owner',
    desc: 'Cambia el banner (cabecera del menú)',
    params: '<texto>',
    ownerOnly: true,
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}banner 𓂃 ࣪ ִֶָ☾.`)
      const bot = ctx.store.update(ctx.bot.id, { banner: ctx.text })
      ctx.refreshBot(bot)
      await ctx.reply('✓ Banner actualizado.')
    }
  },
  {
    command: 'setname',
    alias: ['nombre', 'name'],
    category: 'owner',
    desc: 'Cambia el nombre del sub-bot',
    params: '<nombre>',
    ownerOnly: true,
    async run(ctx) {
      if (!ctx.text) return ctx.reply(`Uso: ${ctx.prefix}setname Mi Bot`)
      const bot = ctx.store.update(ctx.bot.id, { name: ctx.text })
      ctx.refreshBot(bot)
      await ctx.reply(`✓ Nombre actualizado a *${bot.name}*`)
    }
  },
  {
    command: 'modo',
    alias: ['mode'],
    category: 'owner',
    desc: 'Público (todos) o privado (solo owners)',
    params: '<publico|privado>',
    ownerOnly: true,
    async run(ctx) {
      const value = (ctx.args[0] || '').toLowerCase()
      if (!['publico', 'público', 'public', 'privado', 'private'].includes(value)) {
        return ctx.reply(`Uso: ${ctx.prefix}modo publico|privado`)
      }
      const mode = value.startsWith('public') || value.startsWith('públic') ? 'public' : 'private'
      const bot = ctx.store.update(ctx.bot.id, { mode })
      ctx.refreshBot(bot)
      await ctx.reply(`✓ Modo *${mode}* activado.`)
    }
  },
  {
    command: 'estilomenu',
    alias: ['menuestilo', 'menustyle'],
    category: 'owner',
    desc: 'Cambia el estilo del menú',
    params: '<texto|lista>',
    ownerOnly: true,
    async run(ctx) {
      const value = (ctx.args[0] || '').toLowerCase()
      if (!['texto', 'lista', 'text', 'list'].includes(value)) {
        return ctx.reply(`Uso: ${ctx.prefix}estilomenu texto|lista`)
      }
      const menuStyle = value.startsWith('list') || value === 'lista' ? 'lista' : 'texto'
      const bot = ctx.store.update(ctx.bot.id, { menuStyle })
      ctx.refreshBot(bot)
      await ctx.reply(`✓ Estilo de menú *${menuStyle}* activado.`)
    }
  },
  {
    command: 'bienvenida',
    alias: ['welcome'],
    category: 'owner',
    desc: 'Texto de bienvenida (vacío para desactivar)',
    params: '<texto>',
    ownerOnly: true,
    async run(ctx) {
      const bot = ctx.store.update(ctx.bot.id, { welcomeText: ctx.text })
      ctx.refreshBot(bot)
      await ctx.reply(ctx.text ? '✓ Mensaje de bienvenida guardado.' : '✓ Bienvenida desactivada.')
    }
  },
  {
    command: 'activar',
    alias: ['on', 'encender'],
    category: 'owner',
    desc: 'Activa las respuestas del bot',
    params: '',
    ownerOnly: true,
    async run(ctx) {
      const bot = ctx.store.update(ctx.bot.id, { enabled: true })
      ctx.refreshBot(bot)
      await ctx.reply('✓ Bot activado.')
    }
  },
  {
    command: 'desactivar',
    alias: ['off', 'apagar'],
    category: 'owner',
    desc: 'Pausa las respuestas del bot (sigue conectado)',
    params: '',
    ownerOnly: true,
    async run(ctx) {
      const bot = ctx.store.update(ctx.bot.id, { enabled: false })
      ctx.refreshBot(bot)
      await ctx.reply('✓ Bot pausado. Usa .activar para reanudarlo.')
    }
  },
  {
    command: 'reiniciar',
    alias: ['restart', 'reconectar'],
    category: 'owner',
    desc: 'Reconecta la sesión de WhatsApp',
    params: '',
    ownerOnly: true,
    async run(ctx) {
      await ctx.reply('𓂃 ࣪ ִֶָ☾. reconectando sesión...')
      await ctx.manager.restart(ctx.bot.id)
      await ctx.reply('✓ Sesión reiniciada.')
    }
  },
  {
    command: 'cmd',
    alias: ['togglecmd', 'comando'],
    category: 'owner',
    desc: 'Activa o desactiva un comando',
    params: '<nombre comando>',
    ownerOnly: true,
    async run(ctx) {
      const name = (ctx.args[0] || '').toLowerCase().replace(/^[^\w]+/, '')
      const found = ctx.registry.find(name)
      if (!found) return ctx.reply('Ese comando no existe.')
      const disabled = new Set(ctx.bot.disabledCommands)
      if (disabled.has(found.command)) disabled.delete(found.command)
      else disabled.add(found.command)
      const bot = ctx.store.update(ctx.bot.id, { disabledCommands: [...disabled] })
      ctx.refreshBot(bot)
      await ctx.reply(`Comando *${found.command}* ${disabled.has(found.command) ? 'desactivado' : 'activado'}.`)
    }
  }
]
