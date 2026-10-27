'use strict'

const { extractListResponse } = require('./lists')
const { sendMedia } = require('./media')

const WRAPPERS = ['ephemeralMessage', 'viewOnceMessage', 'viewOnceMessageV2', 'documentWithCaptionMessage']

/** Desenvuelve mensajes efímeros / de vista única. */
function unwrap(message) {
  let current = message
  for (let i = 0; i < 4 && current; i++) {
    for (const wrapper of WRAPPERS) {
      if (current[wrapper]?.message) {
        current = current[wrapper].message
        break
      }
    }
    if (!current.ephemeralMessage && !current.viewOnceMessage && !current.viewOnceMessageV2 && !current.documentWithCaptionMessage) {
      break
    }
  }
  return current
}

/** Extrae texto, menciones y mensaje citado de cualquier tipo de mensaje. */
function extract(message) {
  const result = { text: '', mentions: [], quoted: null }

  const contextInfo =
    message.extendedTextMessage?.contextInfo ||
    message.imageMessage?.contextInfo ||
    message.videoMessage?.contextInfo ||
    message.documentMessage?.contextInfo

  if (contextInfo?.mentionedJid) result.mentions = contextInfo.mentionedJid
  if (contextInfo?.quotedMessage) {
    result.quoted = {
      message: unwrap(contextInfo.quotedMessage),
      sender: contextInfo.participant || null
    }
    result.quoted.text =
      result.quoted.message?.conversation ||
      result.quoted.message?.extendedTextMessage?.text ||
      result.quoted.message?.imageMessage?.caption ||
      result.quoted.message?.videoMessage?.caption ||
      ''
  }

  result.text =
    message.conversation ||
    message.extendedTextMessage?.text ||
    message.imageMessage?.caption ||
    message.videoMessage?.caption ||
    message.documentMessage?.caption ||
    message.buttonsResponseMessage?.selectedDisplayText ||
    message.templateButtonReplyMessage?.selectedDisplayText ||
    ''

  return result
}

async function detectRole(sock, m, jid, isGroup, isOwner) {
  if (isOwner) return '𝙿𝚁𝙾𝙿𝙸𝙴𝚃𝙰𝚁𝙸𝙾'
  if (!isGroup) return '𝚄𝚂𝚄𝙰𝚁𝙸𝙾'
  try {
    const metadata = await sock.groupMetadata(jid)
    const participant = metadata.participants.find((p) => p.id === m.key.participant)
    if (participant?.admin) return '𝙰𝙳𝙼𝙸𝙽'
  } catch (_) { /* sin metadatos */ }
  return '𝚄𝚂𝚄𝙰𝚁𝙸𝙾'
}

/**
 * Punto de entrada de cada mensaje recibido. Lo llama el gestor
 * de Baileys en el evento messages.upsert.
 */
async function handleMessage(options) {
  const { sock, bot, m, manager, store, registry, refreshBot, startedAt } = options
  if (!m.message || m.key.fromMe) return
  const jid = m.key.remoteJid
  if (jid === 'status@broadcast') return

  const message = unwrap(m.message)
  const { text: rawText, mentions, quoted } = extract(message)
  const listId = extractListResponse(message)
  const text = rawText || (listId ? `${bot.prefix}${listId}` : '')
  if (!text || !text.startsWith(bot.prefix)) return

  const senderJid = m.key.participant || m.key.remoteJid
  const senderNumber = senderJid.split('@')[0].split(':')[0].replace(/\D/g, '')
  const isGroup = jid.endsWith('@g.us')
  const isOwner = bot.owners.map((o) => String(o).replace(/\D/g, '')).includes(senderNumber)
  const pushName = m.pushName || 'usuario'

  const body = text.slice(bot.prefix.length).trim()
  const [cmdToken, ...args] = body.split(/\s+/)
  const command = registry.find(cmdToken)
  if (!command) return
  if (bot.disabledCommands.includes(command.command)) return

  // Bot en pausa: solo el propietario puede usarlo.
  if (bot.enabled === false && !isOwner) return

  if (bot.autoread) {
    await sock.readMessages([m.key]).catch(() => {})
  }

  const reply = (content) =>
    sock.sendMessage(jid, typeof content === 'string' ? { text: content } : content, { quoted: m })

  const deliver = async (resolved, caption = '') => {
    if (!resolved || resolved.type === 'text') {
      return reply(caption ? `${caption}\n\n${resolved?.text || ''}`.trim() : resolved?.text || 'Sin resultados.')
    }
    try {
      await sendMedia(sock, jid, resolved.url, resolved.mediaType, caption)
    } catch (err) {
      await reply(`No se pudo enviar el medio.\nEnlace directo: ${resolved.url}`)
    }
  }

  if (bot.mode === 'private' && !isOwner) {
    return reply('🔒 Este bot está en modo privado: solo los propietarios pueden usarlo.')
  }
  if (command.ownerOnly && !isOwner) {
    return reply('🚫 Comando exclusivo de propietarios.')
  }

  const role = await detectRole(sock, m, jid, isGroup, isOwner)
  const api = require('./velirius')
  const ctx = {
    sock, m, bot, jid, isGroup, isOwner, role,
    senderJid, senderNumber, pushName, mentions, quoted,
    prefix: bot.prefix, command: command.command,
    args, text: args.join(' '),
    registry, store, manager,
    uptimeMs: Date.now() - startedAt,
    reply, deliver,
    refreshBot,
    api
  }

  try {
    await sock.sendPresenceUpdate('composing', jid).catch(() => {})
    manager.bump(bot.id, 'commands')
    await command.run(ctx)
  } catch (err) {
    manager.log(bot.id, `error en ${command.command}: ${err.message}`, 'error')
    await reply(`⚠️ El comando *${command.command}* falló: ${err.message}`)
  } finally {
    await sock.sendPresenceUpdate('paused', jid).catch(() => {})
  }
}

module.exports = { handleMessage, unwrap, extract }
