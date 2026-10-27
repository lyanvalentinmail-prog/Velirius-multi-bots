'use strict'

/**
 * Registro central de comandos. Cada módulo exporta un array de
 * comandos con la forma:
 * { command, alias[], category, desc, params, ownerOnly?, run(ctx) }
 */
const registry = {
  commands: [],

  register(mod) {
    for (const cmd of mod) {
      if (!cmd || !cmd.command || typeof cmd.run !== 'function') {
        throw new Error('Comando inválido: falta command o run()')
      }
      this.commands.push(cmd)
    }
  },

  find(name) {
    const key = String(name || '').toLowerCase()
    return this.commands.find(
      (c) => c.command === key || (c.alias || []).includes(key)
    )
  },

  categories() {
    return [...new Set(this.commands.map((c) => c.category))]
  },

  byCategory(category) {
    return this.commands.filter((c) => c.category === category)
  },

  count() {
    return this.commands.length
  }
}

registry.register(require('./info'))
registry.register(require('./owner'))
registry.register(require('./downloader'))
registry.register(require('./fun'))
registry.register(require('./searcher'))
registry.register(require('./tools'))

module.exports = registry
