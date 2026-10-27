#!/data/data/com.termux/files/usr/bin/bash
# ─────────────────────────────────────────────────────────────
# Arranca Velirius Multi-Bots en Termux.
# Uso:  bash termux/start.sh
# ─────────────────────────────────────────────────────────────
PROYECTO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROYECTO"

if [ ! -d server/node_modules ]; then
  echo "Faltan dependencias. Ejecuta primero: bash termux/install.sh"
  exit 1
fi

# Mantén el proceso vivo: si el socket se cae, el gestor de
# Baileys reconecta solo; si Node muere, lo levantamos de nuevo.
while true; do
  node server/index.js
  echo "El proceso se detuvo, reiniciando en 3 s... (Ctrl+C para salir)"
  sleep 3
done
