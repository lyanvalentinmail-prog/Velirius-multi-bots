'use strict'

/* ── Utilidades DOM ─────────────────────────────────────────── */
const $ = (sel, root = document) => root.querySelector(sel)

function h(tag, attrs = {}, ...children) {
  const node = document.createElement(tag)
  for (const [key, value] of Object.entries(attrs || {})) {
    if (value === null || value === undefined || value === false) continue
    if (key === 'class') node.className = value
    else if (key === 'html') node.innerHTML = value
    else if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value)
    } else if (value === true) node.setAttribute(key, '')
    else node.setAttribute(key, String(value))
  }
  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue
    node.append(child.nodeType ? child : document.createTextNode(String(child)))
  }
  return node
}

const esc = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

function fmtUptime(ms) {
  if (!ms || ms < 0) return '—'
  const s = Math.floor(ms / 1000)
  const d = Math.floor(s / 86400)
  const hh = Math.floor((s % 86400) / 3600)
  const mm = Math.floor((s % 3600) / 60)
  const ss = s % 60
  return [d && `${d}d`, hh && `${hh}h`, mm && `${mm}m`, `${ss}s`].filter(Boolean).join(' ')
}

function toast(message, bad = false) {
  const node = $('#toast')
  node.textContent = message
  node.className = bad ? 'toast bad' : 'toast'
  node.hidden = false
  clearTimeout(toast._t)
  toast._t = setTimeout(() => { node.hidden = true }, 3200)
}

function copyText(text) {
  if (navigator.clipboard?.writeText) return navigator.clipboard.writeText(text)
  const ta = document.createElement('textarea')
  ta.value = text
  document.body.append(ta)
  ta.select()
  document.execCommand('copy')
  ta.remove()
  return Promise.resolve()
}

function statusPill(session) {
  const status = session?.status || 'desconectado'
  let cls = 'offline'
  if (status === 'conectado') cls = 'online'
  else if (/esperando|conectando|iniciando/.test(status)) cls = 'waiting'
  else if (/error|cerrada/.test(status)) cls = 'offline'
  return h('span', { class: `pill ${cls}` }, status)
}

/* ── Estado de la aplicación ────────────────────────────────── */
const state = { bots: [], meta: null, modalTimer: null, gridTimer: null, serverOk: false, errorShown: false }

/* ── Arranque directo del dashboard, sin login ──────────────── */
function showApp() {
  $('#app-view').hidden = false
  loadAll()
  clearInterval(state.gridTimer)
  state.gridTimer = setInterval(loadAll, 6000)
}

$('#btn-refresh').addEventListener('click', loadAll)
$('#btn-create').addEventListener('click', openCreate)

/* ── Carga y render principal ───────────────────────────────── */
async function loadAll() {
  try {
    const [botsRes, metaRes] = await Promise.all([Api.bots(), Api.meta()])
    state.bots = botsRes.bots
    state.meta = metaRes
    state.serverOk = true
    $('#server-indicator').textContent = 'servidor en línea'
    renderStats()
    renderBots()
  } catch (err) {
    state.serverOk = false
    $('#stat-status').textContent = 'sin servidor'
    $('#server-indicator').textContent = 'servidor no disponible'
    if (!state.errorShown) {
      state.errorShown = true
      toast(err.message, true)
    }
  }
}

function renderStats() {
  const m = state.meta
  if (!m) return
  const online = state.bots.filter((b) => b.session?.status === 'conectado').length
  state.errorShown = false
  $('#stat-status').textContent = 'en línea'
  $('#stat-total').textContent = String(state.bots.length)
  $('#stat-online').textContent = String(online)
  $('#stat-commands').textContent = String(m.commands)
  $('#stat-memory').textContent = m.memory
  $('#stat-uptime').textContent = fmtUptime(m.uptimeMs)
}

function renderBots() {
  const grid = $('#bots-grid')
  grid.innerHTML = ''
  $('#bots-empty').hidden = state.bots.length > 0

  for (const bot of state.bots) {
    const s = bot.session || {}
    const card = h('section', { class: 'bot-card' },
      h('header', {},
        h('h3', {}, esc(bot.name)),
        statusPill(s)
      ),
      h('div', { class: 'bot-meta' },
        h('b', {}, 'prefijo'), h('span', {}, esc(bot.prefix)),
        h('b', {}, 'modo'), h('span', {}, bot.mode === 'private' ? 'privado' : 'público'),
        h('b', {}, 'menú'), h('span', {}, esc(bot.menuStyle)),
        h('b', {}, 'número'), h('span', {}, s.number || 'sin conectar'),
        h('b', {}, 'mensajes'), h('span', {}, String(bot.stats?.messages || 0)),
        h('b', {}, 'comandos'), h('span', {}, String(bot.stats?.commands || 0))
      ),
      h('div', { class: 'bot-actions' },
        h('button', { class: 'btn small', onclick: () => openDetail(bot.id) }, 'Abrir'),
        s.running
          ? h('button', {
              class: 'btn ghost small',
              onclick: async () => { try { await Api.stop(bot.id); toast('Bot detenido'); loadAll() } catch (e) { toast(e.message, true) } }
            }, 'Detener')
          : h('button', {
              class: 'btn small',
              onclick: () => openDetail(bot.id)
            }, 'Vincular')
      )
    )
    grid.append(card)
  }
}

/* ── Modal genérico ─────────────────────────────────────────── */
function openModal(content, wide = false) {
  closeModal()
  const overlay = h('div', { class: 'modal-overlay', onclick: (ev) => {
    if (ev.target.classList.contains('modal-overlay')) closeModal()
  } })
  const modal = h('div', { class: wide ? 'modal wide' : 'modal' }, content)
  overlay.append(modal)
  $('#modal-root').append(overlay)
}

function closeModal() {
  clearInterval(state.modalTimer)
  state.modalTimer = null
  $('#modal-root').innerHTML = ''
}

function modalHead(title, onClose = closeModal) {
  return h('div', { class: 'modal-head' },
    h('h2', {}, title),
    h('button', { class: 'modal-close', onclick: onClose, 'aria-label': 'Cerrar' }, '✕')
  )
}

/* ── Crear sub-bot ──────────────────────────────────────────── */
function openCreate() {
  const name = h('input', { type: 'text', placeholder: 'Ej: Bot Secundario', required: true })
  const prefix = h('input', { type: 'text', value: '.', maxlength: '3' })
  const mode = h('select', {},
    h('option', { value: 'public' }, 'Público (todos)'),
    h('option', { value: 'private' }, 'Privado (solo owners)')
  )
  const menuStyle = h('select', {},
    h('option', { value: 'texto' }, 'Texto (diseño estético)'),
    h('option', { value: 'lista' }, 'Mensaje de lista interactivo')
  )
  const owner = h('input', { type: 'text', placeholder: '59896719709', value: '59896719709' })

  const form = h('form', { class: 'form-grid' },
    h('label', { class: 'field full' }, h('span', {}, 'Nombre *'), name),
    h('label', { class: 'field' }, h('span', {}, 'Prefijo'), prefix),
    h('label', { class: 'field' }, h('span', {}, 'Modo'), mode),
    h('label', { class: 'field' }, h('span', {}, 'Estilo de menú'), menuStyle),
    h('label', { class: 'field full' }, h('span', {}, 'Número propietario'), h('span', { class: 'hint' }, 'Con código de país, sin + ni espacios'), owner),
    h('div', { class: 'modal-foot full' },
      h('button', { type: 'button', class: 'btn ghost', onclick: closeModal }, 'Cancelar'),
      h('button', { type: 'submit', class: 'btn' }, 'Crear sub-bot')
    )
  )

  form.addEventListener('submit', async (ev) => {
    ev.preventDefault()
    try {
      const res = await Api.createBot({
        name: name.value.trim(),
        prefix: prefix.value.trim() || '.',
        mode: mode.value,
        menuStyle: menuStyle.value,
        owners: [owner.value.replace(/\D/g, '')].filter(Boolean)
      })
      closeModal()
      toast('Sub-bot creado')
      loadAll()
      openDetail(res.bot.id)
    } catch (err) {
      toast(err.message, true)
    }
  })

  openModal([modalHead('Nuevo sub-bot'), form])
  name.focus()
}

/* ── Detalle / edición del sub-bot ──────────────────────────── */
async function openDetail(id) {
  let bot
  try {
    const res = await Api.bot(id)
    bot = res.bot
  } catch (err) {
    return toast(err.message, true)
  }

  const head = modalHead(`Editar · ${bot.name}`)
  const tabs = h('div', { class: 'tabs' },
    h('button', { class: 'tab active', 'data-tab': 'session', type: 'button' }, 'Vincular'),
    h('button', { class: 'tab', 'data-tab': 'config', type: 'button' }, 'Configuración'),
    h('button', { class: 'tab', 'data-tab': 'logs', type: 'button' }, 'Registros')
  )
  const panel = h('div', { class: 'tab-panel' })
  openModal([head, tabs, panel], true)

  const switchTab = async (tab) => {
    tabs.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab))
    if (tab === 'session') renderSessionTab(panel, id)
    if (tab === 'config') renderConfigTab(panel, id)
    if (tab === 'logs') renderLogsTab(panel, id)
  }
  tabs.addEventListener('click', (ev) => {
    const tab = ev.target.closest('.tab')
    if (tab) switchTab(tab.dataset.tab)
  })

  await switchTab('session')
  clearInterval(state.modalTimer)
  state.modalTimer = setInterval(async () => {
    const active = tabs.querySelector('.tab.active')?.dataset.tab
    if (active === 'session') renderSessionTab(panel, id, true)
    if (active === 'logs') renderLogsTab(panel, id, true)
  }, 3000)
}

/* ── Selector de método de vinculación ──────────────────────── */
function methodPicker(onStart) {
  let method = 'qr'

  const qrCard = h('button', { type: 'button', class: 'method-card active' },
    h('span', { class: 'method-icon' }, '▣'),
    h('span', { class: 'method-title' }, 'Código QR'),
    h('span', { class: 'method-desc' }, 'Escanea con WhatsApp → Dispositivos vinculados')
  )
  const pairCard = h('button', { type: 'button', class: 'method-card' },
    h('span', { class: 'method-icon' }, '⌗'),
    h('span', { class: 'method-title' }, 'Pairing code'),
    h('span', { class: 'method-desc' }, 'Vincula con tu número, sin escanear')
  )

  const phone = h('input', { type: 'tel', placeholder: '59896719709', inputmode: 'numeric' })
  const phoneField = h('label', { class: 'field full', hidden: true },
    h('span', {}, 'Número de WhatsApp (con código de país, sin +)'),
    phone,
    h('span', { class: 'hint' }, 'Ejemplo: 59896719709')
  )

  const select = (next) => {
    method = next
    qrCard.classList.toggle('active', method === 'qr')
    pairCard.classList.toggle('active', method === 'pairing')
    phoneField.hidden = method !== 'pairing'
  }
  qrCard.addEventListener('click', () => select('qr'))
  pairCard.addEventListener('click', () => select('pairing'))

  const start = h('button', { class: 'btn', type: 'button' }, 'Iniciar vinculación')
  start.addEventListener('click', async () => {
    const payload = { method }
    if (method === 'pairing') {
      const digits = phone.value.replace(/\D/g, '')
      if (digits.length < 8) return toast('Escribe el número con código de país', true)
      payload.phone = digits
    }
    start.disabled = true
    try {
      await onStart(payload)
    } finally {
      start.disabled = false
    }
  })

  return h('div', { class: 'link-box' },
    h('div', { class: 'method-grid' }, qrCard, pairCard),
    phoneField,
    h('div', { class: 'session-row' }, start)
  )
}

/* ── Pestaña de sesión (QR / pairing code) ──────────────────── */
async function renderSessionTab(panel, id, silent = false) {
  let session
  try {
    session = (await Api.session(id)).session
  } catch (err) {
    if (!silent) panel.innerHTML = ''
    return
  }

  // No sobrescribir el DOM si el usuario está escribiendo el número.
  if (silent && panel.querySelector('.method-card')) return

  panel.innerHTML = ''
  const status = h('div', { class: 'session-row' },
    statusPill(session),
    h('span', { class: 'session-note' },
      session.number ? `Conectado como ${session.number}` : 'La sesión aún no está conectada')
  )
  panel.append(h('div', { class: 'session-box' }, status))

  // ── Conectado: acciones de mantenimiento ──
  if (session.running && session.status === 'conectado') {
    panel.append(h('div', { class: 'session-row' },
      h('button', {
        class: 'btn ghost', type: 'button',
        onclick: () => Api.restart(id).then(() => toast('Reiniciando...')).catch((e) => toast(e.message, true))
      }, 'Reiniciar'),
      h('button', {
        class: 'btn ghost', type: 'button',
        onclick: () => Api.stop(id).then(() => { toast('Detenido'); renderSessionTab(panel, id) }).catch((e) => toast(e.message, true))
      }, 'Detener'),
      h('button', {
        class: 'btn danger', type: 'button',
        onclick: async () => {
          if (!confirm('¿Cerrar la sesión de WhatsApp? Tendrás que volver a vincular.')) return
          try { await Api.logoutBot(id); toast('Sesión cerrada'); renderSessionTab(panel, id) } catch (e) { toast(e.message, true) }
        }
      }, 'Cerrar sesión')
    ))
    return
  }

  // ── Vinculación en curso: QR ──
  if (session.running && session.method === 'qr' && session.qr) {
    panel.append(
      h('div', { class: 'qr-box' }, h('img', { src: session.qr, alt: 'Código QR de WhatsApp' })),
      h('p', { class: 'session-note' }, 'En tu teléfono: WhatsApp → Ajustes → Dispositivos vinculados → Vincular dispositivo → escanea este QR.'),
      h('div', { class: 'session-row' },
        h('button', {
          class: 'btn ghost', type: 'button',
          onclick: () => Api.stop(id).then(() => { toast('Detenido'); renderSessionTab(panel, id) }).catch((e) => toast(e.message, true))
        }, 'Cancelar y elegir otro método')
      )
    )
    return
  }

  // ── Vinculación en curso: pairing code ──
  if (session.running && session.method === 'pairing' && session.pairingCode) {
    const copy = h('button', { class: 'btn ghost', type: 'button' }, 'Copiar código')
    copy.addEventListener('click', () => copyText(session.pairingCode).then(() => toast('Código copiado')))
    panel.append(
      h('div', { class: 'pairing-code' }, session.pairingCode),
      h('p', { class: 'session-note' },
        `En tu teléfono: WhatsApp → Dispositivos vinculados → Vincular dispositivo → "¿Vincular con el número de teléfono?" → escribe este código para el número ${session.phone || ''}.`),
      h('div', { class: 'session-row' },
        copy,
        h('button', {
          class: 'btn danger', type: 'button',
          onclick: () => Api.stop(id).then(() => { toast('Detenido'); renderSessionTab(panel, id) }).catch((e) => toast(e.message, true))
        }, 'Cancelar')
      )
    )
    return
  }

  // ── Error durante la vinculación ──
  if (session.running && /error|cerrada/.test(session.status)) {
    panel.append(
      h('p', { class: 'error-box' },
        `La vinculación falló (${session.status}). En la pestaña Registros verás el detalle. ` +
        'Suele ser un problema de red o que el código expiró; reintenta o cambia de método.'),
      h('div', { class: 'session-row' },
        h('button', {
          class: 'btn', type: 'button',
          onclick: () => Api.restart(id).then(() => { toast('Reintentando...'); renderSessionTab(panel, id) }).catch((e) => toast(e.message, true))
        }, 'Reintentar'),
        h('button', {
          class: 'btn danger', type: 'button',
          onclick: () => Api.stop(id).then(() => { toast('Detenido'); renderSessionTab(panel, id) }).catch((e) => toast(e.message, true))
        }, 'Detener')
      )
    )
    return
  }

  // ── En ejecución pero esperando todavía (QR/pairing generándose) ──
  if (session.running) {
    panel.append(
      h('p', { class: 'session-note' }, `Generando ${session.method === 'pairing' ? 'pairing code' : 'QR'}... espera unos segundos (se actualiza solo).`),
      h('div', { class: 'session-row' },
        h('button', {
          class: 'btn danger', type: 'button',
          onclick: () => Api.stop(id).then(() => { toast('Detenido'); renderSessionTab(panel, id) }).catch((e) => toast(e.message, true))
        }, 'Detener')
      )
    )
    return
  }

  // ── Sin ejecutar: elegir cómo vincular ──
  panel.append(methodPicker(async (payload) => {
    try {
      await Api.start(id, payload)
      toast(payload.method === 'pairing' ? 'Pairing code solicitado' : 'QR generándose...')
      renderSessionTab(panel, id)
    } catch (err) {
      toast(err.message, true)
    }
  }))
}

/* ── Pestaña de configuración ───────────────────────────────── */
function renderConfigTab(panel, id) {
  const bot = state.bots.find((b) => b.id === id)
  if (!bot) return
  panel.innerHTML = ''

  const field = (label, input, hint) =>
    h('label', { class: 'field' }, h('span', {}, label), input, hint ? h('span', { class: 'hint' }, hint) : null)

  const name = h('input', { type: 'text', value: bot.name })
  const prefix = h('input', { type: 'text', value: bot.prefix, maxlength: '3' })
  const banner = h('input', { type: 'text', value: bot.banner || '' })
  const bannerUrl = h('input', { type: 'text', value: bot.bannerUrl || '', placeholder: 'https://.../banner.jpg' })
  const ownerName = h('input', { type: 'text', value: bot.ownerName || '' })
  const owners = h('input', { type: 'text', value: (bot.owners || []).join(', ') })
  const mode = h('select', {},
    h('option', { value: 'public', ...(bot.mode === 'public' ? { selected: true } : {}) }, 'Público'),
    h('option', { value: 'private', ...(bot.mode === 'private' ? { selected: true } : {}) }, 'Privado')
  )
  const menuStyle = h('select', {},
    h('option', { value: 'texto', ...(bot.menuStyle === 'texto' ? { selected: true } : {}) }, 'Texto estético'),
    h('option', { value: 'lista', ...(bot.menuStyle === 'lista' ? { selected: true } : {}) }, 'Mensaje de lista')
  )
  const welcome = h('textarea', { placeholder: '¡Hola @user, bienvenido al grupo!' })
  welcome.value = bot.welcomeText || ''
  const autoread = h('input', { type: 'checkbox' })
  autoread.checked = bot.autoread !== false
  const enabled = h('input', { type: 'checkbox' })
  enabled.checked = bot.enabled !== false

  const save = h('button', { class: 'btn', type: 'button' }, 'Guardar cambios')
  save.addEventListener('click', async () => {
    try {
      await Api.updateBot(id, {
        name: name.value.trim(),
        prefix: prefix.value.trim() || '.',
        banner: banner.value,
        bannerUrl: bannerUrl.value.trim(),
        ownerName: ownerName.value.trim(),
        owners: owners.value.split(',').map((n) => n.replace(/\D/g, '')).filter(Boolean),
        mode: mode.value,
        menuStyle: menuStyle.value,
        welcomeText: welcome.value,
        autoread: autoread.checked,
        enabled: enabled.checked
      })
      toast('Configuración guardada')
      loadAll()
    } catch (err) {
      toast(err.message, true)
    }
  })

  const remove = h('button', { class: 'btn danger', type: 'button' }, 'Eliminar sub-bot')
  remove.addEventListener('click', async () => {
    if (!confirm('Se eliminará el bot y su sesión de WhatsApp. ¿Continuar?')) return
    try {
      await Api.deleteBot(id)
      closeModal()
      toast('Sub-bot eliminado')
      loadAll()
    } catch (err) {
      toast(err.message, true)
    }
  })

  panel.append(
    h('form', { class: 'form-grid', onsubmit: (ev) => ev.preventDefault() },
      h('label', { class: 'field full' }, h('span', {}, 'Nombre'), name),
      field('Prefijo', prefix, 'Hasta 3 caracteres, ejemplo: . / # / !'),
      field('Nombre del propietario', ownerName),
      field('Banner (cabecera del menú)', banner),
      field('Imagen del banner (URL opcional)', bannerUrl),
      field('Propietarios (números separados por coma)', owners, 'Con código de país, sin +'),
      field('Modo', mode),
      field('Estilo de menú', menuStyle),
      h('label', { class: 'field full' }, h('span', {}, 'Mensaje de bienvenida (@user se reemplaza por el número)'), welcome),
      h('label', { class: 'switch-row' }, autoread, 'Marcar mensajes como leídos'),
      h('label', { class: 'switch-row' }, enabled, 'Bot activado (responde comandos)'),
      h('div', { class: 'modal-foot full' }, remove, save)
    )
  )
}

/* ── Pestaña de registros ───────────────────────────────────── */
async function renderLogsTab(panel, id, silent = false) {
  let logs = []
  try {
    logs = (await Api.logs(id)).logs
  } catch (err) {
    if (!silent) toast(err.message, true)
    return
  }
  const pre = h('pre', { class: 'logs' })
  if (!logs.length) {
    pre.textContent = 'Sin registros todavía. Al iniciar la sesión aparecerán aquí las conexiones, el QR y los errores.'
  } else {
    for (const line of logs.slice(-120)) {
      pre.append(
        h('span', { class: 'time' }, line.time.replace('T', ' ').slice(0, 19) + '  '),
        h('span', { class: line.level === 'error' ? 'err' : '' }, line.message + '\n')
      )
    }
  }
  panel.innerHTML = ''
  panel.append(
    h('div', { class: 'session-row', style: 'margin-bottom:10px;justify-content:space-between' },
      h('span', { class: 'session-note' }, 'Últimos eventos de esta sesión (se actualiza solo)'),
      h('button', { class: 'btn ghost small', type: 'button', onclick: () => renderLogsTab(panel, id) }, 'Refrescar')
    ),
    pre
  )
}

/* ── Arranque ───────────────────────────────────────────────── */
showApp()
