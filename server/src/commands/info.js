'use strict'

const { buildTextMenu, buildListSections, formatUptime, memoryUsage } = require('../menu')
const { sendListMessage } = require('../lists')

module.exports = [
  {
    command: 'menu',
    alias: ['menú', 'help', 'ayuda', 'comandos'],
    category: 'info',
    desc: 'Muestra el menú principal del bot',
    params: '',
    async run(ctx) {
      const { sock, jid, bot, pushName, role, registry, prefix, uptimeMs } = ctx
      const menuCtx = { bot, pushName, role, registry, prefix, uptimeMs }

      if (bot.menuStyle === 'lista') {
        await sendListMessage(sock, jid, {
          title: bot.name.toUpperCase(),
          text: `Bienvenido/a @${pushName || 'usuario'}\nSelecciona una categoría para ver sus comandos.`,
          footer: `${bot.name} · Powered by Velirius API`,
          buttonText: 'VER COMANDOS',
          sections: buildListSections(menuCtx)
        })
        return
      }

      if (bot.bannerUrl) {
        await sock.sendMessage(jid, { image: { url: bot.bannerUrl } }).catch(() => {})
      }
      await sock.sendMessage(jid, { text: buildTextMenu(menuCtx), mentions: ctx.mentions })
    }
  },
  {
    command: 'listamenu',
    alias: ['menulista', 'menulist'],
    category: 'info',
    desc: 'Fuerza el menú como mensaje de lista interactivo',
    params: '',
    async run(ctx) {
      const sections = buildListSections(ctx)
      await sendListMessage(ctx.sock, ctx.jid, {
        title: ctx.bot.name.toUpperCase(),
        text: `Menú interactivo de ${ctx.bot.name}`,
        footer: 'Powered by Velirius API',
        buttonText: 'ABRIR MENÚ',
        sections
      })
    }
  },
  {
    command: 'ping',
    alias: ['pong', 'latencia'],
    category: 'info',
    desc: 'Comprueba que el bot responde',
    params: '',
    async run(ctx) {
      const start = Date.now()
      const msg = await ctx.reply('𓂃 ࣪ ִֶָ☾. midiendo...')
      const latency = Date.now() - start
      await ctx.sock.sendMessage(ctx.jid, {
        text: `𓂃 ࣪ ִֶָ☾. *PONG*\n> latencia: ${latency} ms\n> memoria: ${memoryUsage()}`,
        edit: msg?.key
      }).catch(() => ctx.reply(`PONG · ${latency} ms`))
    }
  },
  {
    command: 'estado',
    alias: ['uptime', 'status', 'info'],
    category: 'info',
    desc: 'Estado general del sub-bot',
    params: '',
    async run(ctx) {
      const { bot, uptimeMs, sock } = ctx
      const lines = [
        `𓂃 ࣪ ִֶָ☾. *${bot.name}*`,
        `> prefijo: ${bot.prefix}`,
        `> modo: ${bot.mode}`,
        `> menú: ${bot.menuStyle}`,
        `> activo: ${bot.enabled ? 'sí' : 'no'}`,
        `> tiempo activo: ${formatUptime(uptimeMs)}`,
        `> memoria: ${memoryUsage()}`,
        `> número: ${sock.user?.id?.split(':')[0] || 'desconocido'}`
      ]
      await ctx.reply(lines.join('\n'))
    }
  },
  {
    command: 'owner',
    alias: ['propietario', 'creador', 'dueño'],
    category: 'info',
    desc: 'Muestra los contactos de los propietarios',
    params: '',
    async run(ctx) {
      const lines = ctx.bot.owners.map(
        (n) => `> 𓂃 ࣪ ִֶָ☾. ⊹ wa.me/${String(n).replace(/\D/g, '')} ⊹ *${ctx.bot.ownerName}*`
      )
      await ctx.reply(`𓂃 ࣪ ִֶָ☾. *PROPIETARIOS*\n${lines.join('\n')}`)
    }
  }
]
