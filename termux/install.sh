#!/data/data/com.termux/files/usr/bin/bash
# ─────────────────────────────────────────────────────────────
# Instalador de Velirius Multi-Bots para Termux (Android)
# Uso:  bash termux/install.sh
# ─────────────────────────────────────────────────────────────
set -e

echo "𓂃 ࣪ ִֶָ☾. Velirius Multi-Bots · instalador para Termux"

# 1. Paquetes del sistema que Baileys puede necesitar para
#    compilar dependencias nativas (libsignal, etc.).
pkg update -y
pkg install -y nodejs-lts git python make clang libsodium

# 2. Ruta del proyecto (carpeta padre de este script).
PROYECTO="$(cd "$(dirname "$0")/.." && pwd)"
cd "$PROYECTO"

# 3. Dependencias de Node.
echo "Instalando dependencias de Node.js..."
npm install --prefix server

# 4. Configuración inicial.
if [ ! -f .env ]; then
  cp .env.example .env
  echo "Se creó el archivo .env (puedes editar DASHBOARD_TOKEN)."
fi

mkdir -p server/data/auth

echo ""
echo "✓ Instalación terminada."
echo "  Inicia el bot con:  bash termux/start.sh"
echo "  Dashboard local:    http://localhost:3000"
