'use strict'

const ORNAMENT = '𓂃 ࣪ ִֶָ☾.'

function formatUptime(ms) {
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const seg = s % 60
  const parts = []
  if (d) parts.push(`${d}d`)
  if (h) parts.push(`${h}h`)
  if (m) parts.push(`${m}m`)
  parts.push(`${seg}s`)
  return parts.join(' ')
}

function memoryUsage() {
  const mb = process.memoryUsage().rss / 1024 / 1024
  return `${mb.toFixed(1)} MB`
}

/**
 * Construye el menú principal respetando el formato entregado:
 * banner de bienvenida, info del usuario, propietarios y lista
 * de comandos agrupada por categoría.
 */
function buildTextMenu(ctx) {
  const { bot, pushName, role, registry, prefix, uptimeMs } = ctx
  const total = registry.count()

  const owners = bot.owners
    .map((num) => `> ${ORNAMENT}  ⊹ wa.me/${String(num).replace(/\D/g, '')} ⊹ *${bot.ownerName}*`)
    .join('\n')

  const blocks = registry.categories().map((category) => {
    const cmds = registry.byCategory(category)
    const head = `ー ${category.toUpperCase()} ー`
    const rows = cmds
      .filter((c) => !bot.disabledCommands.includes(c.command))
      .map((c) => `> • ${prefix}${c.command}${c.params ? ' ' + c.params : ''}`)
      .join('\n')
    return `${head}\n${rows}`
  })

  return [
    `${bot.banner || ORNAMENT} 𝙱𝙸𝙴𝙽𝚅𝙴𝙽𝙸𝙳𝙾/𝙰  @${pushName || 'usuario'}`,
    '',
    '   𓍯  𝙸𝙽𝙵𝙾 𝚄𝚂𝚄𝙰𝚁𝙸𝙾  𓍯  ',
    '',
    `> ${ORNAMENT}  𝚁𝙾𝙻: ${role}`,
    `> ${ORNAMENT} 𝙱𝙾𝚃: ${bot.name}`,
    `> ${ORNAMENT} 𝚃𝙸𝙿𝙾: ${bot.mode === 'private' ? '𝙿𝚁𝙸𝚅𝙰𝙳𝙾' : '𝙿𝚄𝙱𝙻𝙸𝙲𝙾'}`,
    `> ${ORNAMENT} 𝚃𝙸𝙴𝙼𝙿𝙾 𝙰𝙲𝚃𝙸𝚅𝙾: ${formatUptime(uptimeMs)}`,
    `> ${ORNAMENT} 𝙲𝙾𝙼𝙰𝙽𝙳𝙾𝚂: ${total}`,
    `> ${ORNAMENT} 𝙼𝙴𝙼𝙾𝚁𝙸𝙰: ${memoryUsage()}`,
    '',
    ` ${ORNAMENT} 𝙿𝚁𝙾𝙿𝙸𝙴𝚃𝙰𝚁𝙸𝙾𝚂${ORNAMENT}`,
    owners,
    '',
    `${ORNAMENT} *𝙲𝙾𝙼𝙰𝙽𝙳𝙾𝚂* ${ORNAMENT}`,
    '',
    blocks.join('\n\n'),
    '',
    '𓂃 ࣪ ִֶָ☾. *Powered by Velirius API* 𓂃 ࣪ ִֶָ☾.'
  ].join('\n')
}

/** Secciones del menú para el mensaje de lista interactivo. */
function buildListSections(ctx) {
  const { registry, prefix, bot } = ctx
  return registry.categories().map((category) => ({
    title: category.toUpperCase(),
    rows: registry.byCategory(category)
      .filter((c) => !bot.disabledCommands.includes(c.command))
      .map((c) => ({
        title: `${prefix}${c.command}`,
        description: c.desc,
        id: c.command
      }))
  }))
}

module.exports = { ORNAMENT, formatUptime, memoryUsage, buildTextMenu, buildListSections }
