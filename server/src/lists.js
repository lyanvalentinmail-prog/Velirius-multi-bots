'use strict'

const {
  generateWAMessageFromContent,
  proto
} = require('@whiskeysockets/baileys')

/**
 * Envía un mensaje de lista interactivo (single select) usando
 * interactiveMessage/nativeFlowMessage, el formato vigente en
 * Baileys 6.x. Si el dispositivo lo rechaza, cae a un menú de
 * texto numerado para que el comando nunca falle.
 */
async function sendListMessage(sock, jid, opts = {}) {
  const {
    title = 'Velirius',
    text = '',
    footer = '',
    buttonText = 'VER LISTA',
    sections = []
  } = opts

  try {
    const message = generateWAMessageFromContent(jid, {
      viewOnceMessage: {
        message: {
          messageContextInfo: {
            deviceListMetadata: {},
            deviceListMetadataVersion: 2
          },
          interactiveMessage: proto.Message.InteractiveMessage.create({
            body: proto.Message.InteractiveMessage.Body.create({ text }),
            footer: proto.Message.InteractiveMessage.Footer.create({ text }),
            header: proto.Message.InteractiveMessage.Header.create({
              title,
              subtitle: footer,
              hasMediaAttachment: false
            }),
            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
              buttons: [{
                name: 'single_select',
                buttonParamsJson: JSON.stringify({ title: buttonText, sections })
              }]
            })
          })
        }
      }
    }, { userJid: sock.user?.id || undefined })

    await sock.relayMessage(jid, message.message, { messageId: message.key.id })
    return true
  } catch (err) {
    const fallback = [`*${title}*`, text, '']
    for (const section of sections) {
      fallback.push(`┌─ *${section.title}*`)
      section.rows.forEach((row, i) => {
        fallback.push(`├─ ${i + 1}. ${row.title}`)
        if (row.description) fallback.push(`│   ${row.description}`)
        if (row.id) fallback.push(`│   id: ${row.id}`)
      })
      fallback.push('└────')
    }
    fallback.push(footer)
    await sock.sendMessage(jid, { text: fallback.filter(Boolean).join('\n') })
    return false
  }
}

/**
 * Extrae la opción elegida en una respuesta de lista/botones,
 * compatible con listResponseMessage, interactiveResponseMessage,
 * templateButtonReplyMessage y buttonsResponseMessage.
 */
function extractListResponse(message = {}) {
  const list = message.listResponseMessage
  if (list?.singleSelectReply?.selectedRowId) {
    return list.singleSelectReply.selectedRowId
  }
  const interactive = message.interactiveResponseMessage
  if (interactive?.nativeFlowResponseMessage?.paramsJson) {
    try {
      const params = JSON.parse(interactive.nativeFlowResponseMessage.paramsJson)
      return params.selected_row_id || params.selectedRowId || null
    } catch (_) { /* no es JSON */ }
  }
  if (message.templateButtonReplyMessage?.selectedId) {
    return message.templateButtonReplyMessage.selectedId
  }
  if (message.buttonsResponseMessage?.selectedButtonId) {
    return message.buttonsResponseMessage.selectedButtonId
  }
  return null
}

module.exports = { sendListMessage, extractListResponse }
