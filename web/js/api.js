'use strict'

/*
 * Configuración opcional de conexión.
 * Por defecto base='' (rutas relativas): la web y la API comparten
 * origen, así que no hay que escribir ninguna URL. El token también
 * es opcional y solo hace falta si el servidor define DASHBOARD_TOKEN.
 * Ambos valores se pueden ajustar desde el botón "Ajustes".
 */
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
    return true
  }
}

const Api = {
  async request(path, options = {}) {
    const { method = 'GET', body } = options
    const headers = { 'Content-Type': 'application/json' }
    // Solo enviamos credenciales si el usuario guardó un token.
    if (Settings.token) {
      headers.Authorization = `Bearer ${Settings.token}`
      headers['X-Dashboard-Token'] = Settings.token
    }

    const res = await fetch(`${Settings.base}/api${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined
    })

    let data = null
    try { data = await res.json() } catch (_) { /* respuesta vacía */ }

    if (res.status === 401) {
      throw new Error('El servidor exige token. Ponlo en Ajustes (variable DASHBOARD_TOKEN).')
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
