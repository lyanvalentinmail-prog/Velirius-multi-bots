'use strict'

/*
 * Pantalla de autenticación: email/contraseña y Google Sign-In.
 * Depende de Api (api.js) y de las funciones de arranque de app.js.
 */
const Auth = {
  mode: 'login',
  config: { googleEnabled: false, googleClientId: null },

  async init() {
    this.cacheDom()
    this.bindTabs()
    this.bindForm()
    this.bindServerButton()
    try {
      this.config = await Api.authConfig()
    } catch (_) {
      this.showError('No se alcanza el servidor. Revisa la URL con el botón de abajo.')
    }
    this.setupGoogle()
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
    $('#auth-server').addEventListener('click', () => {
      const current = Settings.base
      const value = prompt('URL del servidor (déjala vacía si la web y la API comparten dominio):', current)
      if (value === null) return
      Settings.base = value.trim()
      location.reload()
    })
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
