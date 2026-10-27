'use strict'

/*
 * Pantalla de autenticación: email/contraseña y Google Sign-In.
 * Depende de Api (api.js) y de las funciones de arranque de app.js.
 */
const Auth = {
  mode: 'login',
  config: { googleEnabled: false, googleClientId: null },
  reachable: false,

  async init() {
    this.cacheDom()
    this.bindTabs()
    this.bindForm()
    this.bindServerButton()
    // Reintenta solo durante el arranque en frío (plan free de Render).
    await this.checkServer(true)
    if (this.reachable) {
      try {
        this.config = await Api.authConfig()
      } catch (_) { /* el banner ya informa del problema */ }
      this.setupGoogle()
    }
    // Si el servicio sigue dormido o se cae, vuelve a comprobar solo.
    setInterval(() => {
      if (!this.reachable) this.checkServer(false)
    }, 8000)
  },

  cacheDom() {
    this.view = $('#auth-view')
    this.form = $('#auth-form')
    this.nameField = $('#name-field')
    this.nameInput = $('#auth-name')
    this.emailInput = $('#auth-email')
    this.passwordInput = $('#auth-password')
    this.submit = $('#auth-submit')
    this.error = $('#auth-error')
    this.googleButton = $('#google-button')
    this.googleNote = $('#google-note')
    this.statusBox = $('#server-status')
    this.statusText = $('#server-status-text')
  },

  // Comprueba que exista un backend en la URL configurada.
  // En el arranque inicial reintenta varias veces porque el plan
  // gratuito de Render puede tardar ~1 min en despertar.
  async checkServer(initial = false) {
    const attempts = initial ? 6 : 1
    for (let i = 0; i < attempts; i++) {
      this.setStatus(
        'checking',
        i === 0
          ? 'Conectando con el servidor…'
          : `El servidor está arrancando… (intento ${i + 1}/${attempts})`
      )
      try {
        await Api.health()
        this.reachable = true
        this.setStatus(
          'ok',
          Settings.base
            ? `Conectado a ${Settings.base}`
            : 'Conectado · mismo dominio, sin configuración'
        )
        // Con mismo origen no hace falta enseñar el botón de URL.
        const link = $('#auth-server')
        if (link) link.hidden = !Settings.base
        return true
      } catch (_) {
        if (i < attempts - 1) await new Promise((r) => setTimeout(r, 9000))
      }
    }
    this.reachable = false
    const link = $('#auth-server')
    if (link) link.hidden = false
    this.setStatus(
      'bad',
      Settings.base
        ? `No hay servidor en ${Settings.base} (toca para cambiarlo)`
        : 'Servidor no disponible (toca para indicar su URL)'
    )
    return false
  },

  setStatus(kind, text) {
    this.statusBox.className = `server-status ${kind}`
    this.statusText.textContent = text
  },

  askServerUrl() {
    const current = Settings.base
    const value = prompt(
      'URL del servidor donde corre el bot (Render, VPS o Termux).\n' +
      'Ejemplos: https://mi-servicio.onrender.com o http://192.168.1.20:3000\n' +
      'Déjala vacía solo si la web y el servidor comparten dominio.',
      current
    )
    if (value === null) return
    Settings.base = value.trim()
    location.reload()
  },

  bindTabs() {
    document.querySelectorAll('.auth-tab').forEach((tab) => {
      tab.addEventListener('click', () => {
        this.mode = tab.dataset.mode
        document.querySelectorAll('.auth-tab').forEach((t) => t.classList.toggle('active', t === tab))
        this.nameField.hidden = this.mode !== 'register'
        this.submit.textContent = this.mode === 'register' ? 'Crear cuenta' : 'Entrar'
        this.hideError()
      })
    })
  },

  bindForm() {
    this.form.addEventListener('submit', async (ev) => {
      ev.preventDefault()
      this.hideError()
      if (!this.reachable) {
        if (Settings.base) {
          this.showError('No hay servidor en la URL configurada. Revísala para continuar.')
          this.askServerUrl()
        } else {
          this.showError('El servidor todavía no responde. Si usas Render en plan gratuito, espera un minuto a que arranque; el estado se actualiza solo.')
          this.checkServer(false)
        }
        return
      }
      const payload = {
        email: this.emailInput.value.trim(),
        password: this.passwordInput.value
      }
      if (this.mode === 'register') payload.name = this.nameInput.value.trim()
      this.submit.disabled = true
      try {
        const res = this.mode === 'register'
          ? await Api.register(payload)
          : await Api.login(payload)
        this.enter(res)
      } catch (err) {
        this.showError(err.message)
      } finally {
        this.submit.disabled = false
      }
    })
  },

  bindServerButton() {
    $('#auth-server').addEventListener('click', () => this.askServerUrl())
    this.statusBox.addEventListener('click', () => this.askServerUrl())
  },

  setupGoogle() {
    if (!this.config.googleEnabled || !this.config.googleClientId) {
      this.googleButton.innerHTML = ''
      this.googleNote.hidden = false
      this.googleNote.textContent = 'Login con Google desactivado: define GOOGLE_CLIENT_ID en el servidor.'
      return
    }
    this.googleNote.hidden = true
    const render = () => {
      if (!window.google || !window.google.accounts) return false
      window.google.accounts.id.initialize({
        client_id: this.config.googleClientId,
        callback: async (response) => {
          try {
            const res = await Api.googleLogin(response.credential)
            this.enter(res)
          } catch (err) {
            this.showError(err.message)
          }
        },
        auto_select: false,
        cancel_on_tap_outside: true
      })
      window.google.accounts.id.renderButton(this.googleButton, {
        theme: 'filled_black',
        size: 'large',
        shape: 'pill',
        text: 'continue_with',
        locale: 'es',
        width: 280
      })
      return true
    }
    if (!render()) {
      // El script de GIS carga con async/defer: esperamos a que exista.
      let tries = 0
      const timer = setInterval(() => {
        if (render() || ++tries > 40) clearInterval(timer)
      }, 150)
    }
  },

  enter(session) {
    Settings.token = session.token
    Settings.user = session.user
    if (typeof showApp === 'function') showApp()
  },

  show() {
    this.view.hidden = false
    $('#app-view').hidden = true
  },

  showError(message) {
    this.error.textContent = message
    this.error.hidden = false
  },

  hideError() {
    this.error.hidden = true
  }
}

window.addEventListener('velirius:unauthorized', () => {
  if (typeof showAuth === 'function') showAuth()
})
