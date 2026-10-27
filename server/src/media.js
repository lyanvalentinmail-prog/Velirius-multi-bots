'use strict'

/**
 * Envía una URL multimedia por WhatsApp eligiendo el tipo de
 * mensaje correcto según la extensión y el tipo reportado.
 * Los GIF de reacción se envían como video con gifPlayback.
 */
async function sendMedia(sock, jid, url, kind = 'image', caption = '') {
  const ext = (url.split('?')[0].split('.').pop() || '').toLowerCase()

  if (kind === 'audio' || ['mp3', 'm4a', 'ogg', 'wav', 'aac'].includes(ext)) {
    return sock.sendMessage(jid, {
      audio: { url },
      mimetype: ext === 'ogg' ? 'audio/ogg' : 'audio/mpeg',
      caption
    })
  }

  if (kind === 'sticker' || ext === 'webp') {
    return sock.sendMessage(jid, { sticker: { url } })
  }

  if (kind === 'video' || ['mp4', 'webm', 'm4v', 'gif'].includes(ext)) {
    const isGif = ext === 'gif'
    return sock.sendMessage(jid, {
      video: { url },
      caption,
      gifPlayback: isGif,
      ...(isGif ? { mimetype: 'video/mp4' } : { mimetype: 'video/mp4' })
    })
  }

  return sock.sendMessage(jid, { image: { url }, caption })
}

module.exports = { sendMedia }
