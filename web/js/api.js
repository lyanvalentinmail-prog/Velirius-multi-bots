'use strict'

/* Almacenamiento local de la URL del servidor y el token. */
const Settings = {
  get base() {
    return (localStorage.getItem('velirius.base') || '').replace(/\/+$/, '')
  },
  set base(value) {
    localStorage.setItem('velirius.base', String(value || '').replace(/\/+$/, ''))
  },
  get token() {
    return localStorage.getItem('velirius.token') || ''
  },
  set token(value) {
    localStorage.setItem('velirius.token', value || '')
  },
  get ready() {
    return Boolean(this.token)
  }
}

const Api = {
  async request(path, options = {}) {
    const { method = 'GET', body } = options
    const res = await fetch(`${Settings.base}/api${path}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${Settings.token}`,
        'X-Dashboard-Token': Settings.token
      },
      body: body ? JSON.stringify(body) : undefined
    })

    let data = null
    try { data = await res.json() } catch (_) { /* respuesta vacía */ }

    if (res.status === 401) {
      Settings.token = ''
      window.location.reload()
      throw new Error('Sesión expirada: vuelve a entrar.')
    }
    if (!res.ok) {
      throw new Error(data?.error || `Petición fallida (HTTP ${res.status})`)
    }
    return data
  },

  login(base, token) {
    Settings.base = base
    Settings.token = token
    return this.request('/login', { method: 'POST', body: { token } })
  },

  meta() {
    return this.request('/meta')
  },

  bots() {
    return this.request('/bots')
  },

  bot(id) {
    return this.request(`/bots/${encodeURIComponent(id)}`)
  },

  createBot(payload) {
    return this.request('/bots', { method: 'POST', body: payload })
  },

  updateBot(id, patch) {
    return this.request(`/bots/${encodeURIComponent(id)}`, { method: 'PATCH', body: patch })
  },

  deleteBot(id) {
    return this.request(`/bots/${encodeURIComponent(id)}`, { method: 'DELETE' })
  },

  start(id, payload) {
    return this.request(`/bots/${encodeURIComponent(id)}/start`, { method: 'POST', body: payload })
  },

  stop(id) {
    return this.request(`/bots/${encodeURIComponent(id)}/stop`, { method: 'POST' })
  },

  restart(id) {
    return this.request(`/bots/${encodeURIComponent(id)}/restart`, { method: 'POST' })
  },

  logout(id) {
    return this.request(`/bots/${encodeURIComponent(id)}/logout`, { method: 'POST' })
  },

  session(id) {
    return this.request(`/bots/${encodeURIComponent(id)}/session`)
  },

  logs(id) {
    return this.request(`/bots/${encodeURIComponent(id)}/logs`)
  }
}
