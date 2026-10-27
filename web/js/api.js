'use strict'

/*
 * Configuración de conexión y sesión.
 * - base: URL del servidor. Vacía = rutas relativas (mismo origen).
 * - token: JWT de sesión obtenido al registrarse/iniciar sesión.
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
    if (value) localStorage.setItem('velirius.token', value)
    else localStorage.removeItem('velirius.token')
  },
  get user() {
    try { return JSON.parse(localStorage.getItem('velirius.user') || 'null') } catch (_) { return null }
  },
  set user(value) {
    if (value) localStorage.setItem('velirius.user', JSON.stringify(value))
    else localStorage.removeItem('velirius.user')
  },
  get ready() {
    return Boolean(this.token)
  }
}

const Api = {
  async request(path, options = {}) {
    const { method = 'GET', body, auth = true } = options
    const headers = { 'Content-Type': 'application/json' }
    if (auth && Settings.token) headers.Authorization = `Bearer ${Settings.token}`

    let res
    try {
      res = await fetch(`${Settings.base}/api${path}`, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined
      })
    } catch (networkErr) {
      throw new Error('No se alcanza el servidor. Revisa la URL en Ajustes o que el servidor esté encendido.')
    }

    let data = null
    try { data = await res.json() } catch (_) { /* respuesta vacía */ }

    if (res.status === 401 && auth) {
      Settings.token = ''
      Settings.user = null
      window.dispatchEvent(new CustomEvent('velirius:unauthorized'))
      throw new Error(data?.error || 'Sesión expirada, vuelve a iniciar sesión.')
    }
    if (!res.ok) {
      throw new Error(data?.error || `Petición fallida (HTTP ${res.status})`)
    }
    return data
  },

  // ── Autenticación ──────────────────────────────────────────
  authConfig() {
    return this.request('/auth/config', { auth: false })
  },
  register(payload) {
    return this.request('/auth/register', { method: 'POST', body: payload, auth: false })
  },
  login(payload) {
    return this.request('/auth/login', { method: 'POST', body: payload, auth: false })
  },
  googleLogin(credential) {
    return this.request('/auth/google', { method: 'POST', body: { credential }, auth: false })
  },
  me() {
    return this.request('/auth/me')
  },

  // ── Sub-bots ───────────────────────────────────────────────
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
  logoutBot(id) {
    return this.request(`/bots/${encodeURIComponent(id)}/logout`, { method: 'POST' })
  },
  session(id) {
    return this.request(`/bots/${encodeURIComponent(id)}/session`)
  },
  logs(id) {
    return this.request(`/bots/${encodeURIComponent(id)}/logs`)
  }
}
