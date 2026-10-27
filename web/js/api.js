'use strict'

/*
 * Cliente de la API. Usa rutas relativas (/api/...): la web y el
 * servidor se despliegan en el mismo dominio, así que no hay que
 * configurar ninguna URL.
 */
const Api = {
  async request(path, options = {}) {
    const { method = 'GET', body } = options

    let res
    try {
      res = await fetch(`/api${path}`, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: body ? JSON.stringify(body) : undefined
      })
    } catch (networkErr) {
      throw new Error('No se alcanza el servidor. Si usas Render en plan gratuito, espera un minuto a que arranque y reintenta.')
    }

    let data = null
    try { data = await res.json() } catch (_) { /* respuesta no JSON */ }

    if (!res.ok) {
      throw new Error(data?.error || `Petición fallida (HTTP ${res.status})`)
    }
    return data
  },

  health() {
    return this.request('/health')
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
