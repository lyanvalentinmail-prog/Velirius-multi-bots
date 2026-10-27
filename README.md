# 𓂃 ࣪ ִֶָ☾. Velirius Multi-Bots

Plataforma **multi-bot de WhatsApp** construida con [Baileys](https://github.com/WhiskeySockets/Baileys), con **dashboard web** para crear y administrar sub-bots. Cada sub-bot tiene su propia sesión, prefijo, banner y configuración.

- ✅ Conexión por **código QR** o **pairing code** (número de teléfono)
- ✅ **Mensajes de lista** interactivos (con respaldo automático en texto)
- ✅ Panel web para **crear, editar, iniciar y eliminar sub-bots**
- ✅ 78 comandos respaldados por la [Velirius API](https://velirius-api-sd8u.vercel.app/home) (104 endpoints)
- ✅ Diseño idéntico al `style.css` de Velirius (fondo de puntos, bordes negros, monoespaciada)
- ✅ Ejecutable en **Termux**, en un **VPS** y desplegable en **Render (Blueprint)**; la web también se despliega sola en **Vercel**

---

## 📁 Estructura

```
Velirius-multi-bots/
├── server/                  # API Express + sesiones Baileys
│   ├── index.js             # Entrada HTTP y dashboard estático
│   └── src/
│       ├── manager.js       # Gestor multi-sesión (QR, pairing, reconexión)
│       ├── dispatcher.js    # Despacha comandos y respuestas de lista
│       ├── lists.js         # Mensajes de lista nativos + fallback
│       ├── menu.js          # Menú con el formato estético pedido
│       ├── velirius.js      # Cliente de la Velirius API
│       ├── store.js         # Persistencia JSON (sub-bots)
│       ├── commands/        # Módulos de comandos (78)
│       ├── routes/          # Rutas REST del dashboard
│       └── middleware/      # Auth por token
├── web/                     # Dashboard estático (Vercel / servido por Express)
│   ├── index.html
│   ├── css/style.css        # El style.css original de Velirius (Drive)
│   ├── css/dashboard.css    # Extensiones del panel
│   └── js/                  # api.js + app.js (SPA vanilla)
├── termux/                  # Instalador y arranque para Android
├── render.yaml              # Blueprint de Render
├── vercel.json              # Despliegue estático de la web
└── .env.example
```

---

## 🚀 Arranque rápido (local o VPS)

Requisitos: **Node.js 18+** (recomendado 20/22).

```bash
# 1. Instalar dependencias del servidor
npm run install:server

# 2. Configurar variables (opcional; sin token se genera uno)
cp .env.example .env

# 3. Arrancar
npm start
```

En la consola aparecerá el **token del dashboard**. Abre `http://localhost:3000`, inicia sesión con ese token y crea tu primer sub-bot.

---

## 📱 Termux (Android)

```bash
# Clona el repo y entra en la carpeta
pkg install git -y
git clone https://github.com/lyanvalentinmail-prog/Velirius-multi-bots
cd Velirius-multi-bots

# Instala todo (Node, herramientas nativas y dependencias)
bash termux/install.sh

# Arranca (se reinicia solo si el proceso muere)
bash termux/start.sh
```

El instalador agrega `python`, `make`, `clang` y `libsodium` para que las dependencias nativas de Baileys compilen sin problemas. El QR también se imprime en la consola cuando hay terminal interactiva.

> Para acceder al dashboard desde el navegador del teléfono usa `http://localhost:3000`. Para verlo desde otro dispositivo, expón el puerto con Cloudflare Tunnel, ngrok o similares y pon esa URL en el campo *URL del servidor*.

---

## ☁️ Render (Blueprint — servidor + dashboard juntos)

1. Sube el proyecto a GitHub.
2. En Render: **New → Blueprint** y selecciona el repositorio.
3. Render detecta `render.yaml` y crea el servicio `velirius-multi-bots`:
   - `DASHBOARD_TOKEN` se genera automáticamente.
   - El disco persistente (`velirius-data`, 1 GB) guarda las sesiones de WhatsApp. El disco requiere un plan de pago: en el plan **free**, borra el bloque `disk:` de `render.yaml` y vuelve a vincular el WhatsApp en cada redespliegue.
4. Al terminar, abre la URL del servicio (`https://tu-servicio.onrender.com`): ahí están la API y el panel.

Comandos equivalentes por si configuras el servicio a mano:

- Build: `npm install --prefix server`
- Start: `npm start --prefix server`
- Health check: `/api/health`

---

## ▲ Vercel (solo la web)

Vercel no mantiene conexiones WebSocket persistentes, así que ahí se despliega **únicamente el dashboard**; el servidor Baileys sigue corriendo en Render, un VPS o Termux.

1. Importa el repositorio en Vercel (la raíz ya contiene `vercel.json` con `outputDirectory: web`).
2. Despliega sin comando de build.
3. Abre la web, en *Ajustes* escribe la **URL de tu servidor** y el **token** del dashboard.

---

## 🖥️ Uso del dashboard

1. **Entrar**: URL del servidor (vacía si web y API comparten dominio) + token.
2. **Nuevo sub-bot**: nombre, prefijo (`.`, `#`, `!`…), modo público/privado y estilo de menú.
3. **Vincular WhatsApp** (pestaña *Sesión*):
   - **QR**: se muestra el código en el panel y se refresca solo.
   - **Pairing code**: escribes el número con código de país y WhatsApp → *Dispositivos vinculados → Vincular con número*; el código de 8 caracteres aparece en el panel.
4. **Editar** (pestaña *Configuración*): nombre, prefijo, **banner**, URL de imagen del banner, propietarios, modo, estilo de menú, bienvenida, autolectura y activación.
5. **Registros**: logs en vivo de la sesión (conexión, QR, errores).

La API del panel:

| Método | Ruta | Descripción |
| --- | --- | --- |
| `POST` | `/api/login` | Validar token |
| `GET` | `/api/bots` | Listar sub-bots |
| `POST` | `/api/bots` | Crear sub-bot |
| `PATCH` | `/api/bots/:id` | Editar prefijo, banner, modo… |
| `DELETE` | `/api/bots/:id` | Eliminar sub-bot y su sesión |
| `POST` | `/api/bots/:id/start` | Iniciar `{ "method": "qr" }` o `{ "method": "pairing", "phone": "..." }` |
| `POST` | `/api/bots/:id/stop` · `/restart` · `/logout` | Control de sesión |
| `GET` | `/api/bots/:id/session` · `/logs` | Estado, QR/pairing y registros |

---

## 💬 Comandos de WhatsApp

El prefijo es editable (por defecto `.`). En modo **privado** solo responden los números propietario.

### Info
| Comando | Alias | Qué hace |
| --- | --- | --- |
| `.menu` | `.help`, `.ayuda` | Menú principal (texto o lista según configuración) |
| `.listamenu` | `.menulista` | Fuerza el menú como mensaje de lista |
| `.ping` | `.latencia` | Latencia y memoria |
| `.estado` | `.uptime` | Estado del sub-bot |
| `.owner` | `.creador` | Contactos de los propietarios |

### Propietario (solo owners)
`.prefix <nuevo>` · `.banner <texto>` · `.setname <nombre>` · `.modo publico|privado` · `.estilomenu texto|lista` · `.bienvenida <texto>` · `.activar` · `.desactivar` · `.reiniciar` · `.cmd <comando>` (activa/desactiva comandos)

### Descargas (Velirius API)
| Comando | Alias | Descripción |
| --- | --- | --- |
| `.play <canción>` | `.p` | Canción completa en MP3 |
| `.mp3 <url/búsqueda>` | `.yta`, `.ytmp3` | Audio de YouTube |
| `.mp4 <url/búsqueda>` | `.ytv`, `.ytmp4` | Video de YouTube |
| `.tiktok <url>` | `.tt` | TikTok sin marca de agua |
| `.instagram <url>` | `.ig` | Reels, videos y fotos |
| `.facebook <url>` | `.fb` | Videos públicos de Facebook |
| `.pinterestdl <url>` | `.pindl` | Pin en tamaño original |
| `.lyric <artista canción>` | `.letra` | Letra de canción |

### Anime
`.neko` · `.waifu` · `.maid` · `.pokemon <nombre|id|random>`

### Reacciones GIF (26)
`.hug` `.kiss` `.pat` `.slap` `.cuddle` `.wave` `.wink` `.blush` `.smile` `.happy` `.dance` `.cry` `.poke` `.tickle` `.highfive` `.handhold` `.nom` `.bite` `.bonk` `.baka` `.smug` `.laugh` `.shrug` `.sleep` `.think` `.thumbsup`

### Canvas (stickers y efectos)
`.quotly <texto>` · `.brat <texto>` · `.carcel <url>` · `.sunglass <url>` · `.trollface <url>` · `.badface <url>` · `.rata <url>` · `.banana <url>` · `.arandano <url>` · `.pan <url>` · `.galletita <url>` · `.minions <url>` · `.glitch <url>` · `.swirl <url>` · `.liquify <url> [bulge|pinch|melt]`

### Buscadores
`.google <consulta>` (`.g`) · `.wikipedia <tema>` (`.wiki`) · `.pinterest <consulta>` (`.pin`) · `.ytsearch <consulta>` (`.yts`) · `.ttsearch <consulta>`

### Herramientas
`.calc <expresión>` · `.traducir [en|es|pt] <texto>` · `.tts [idioma] <texto>` · `.morse <texto>` · `.resize <url> <ancho> [alto]`

---

## 📜 Menú principal

El bot construye el menú exactamente con el formato entregado, rellenando rol, tipo, tiempo activo, número de comandos, memoria y propietarios desde la configuración del sub-bot:

```
𓂃 ࣪ ִֶָ☾. 𝙱𝙸𝙴𝙽𝚅𝙴𝙽𝙸𝙳𝙾/𝙰  @usuario

   𓍯  𝙸𝙽𝙵𝙾 𝚄𝚂𝚄𝙰𝚁𝙸𝙾  𓍯

> 𓂃 ࣪ ִֶָ☾.  𝚁𝙾𝙻: 𝙿𝚁𝙾𝙿𝙸𝙴𝚃𝙰𝚁𝙸𝙾
> 𓂃 ࣪ ִֶָ☾. 𝙱𝙾𝚃: Velirius Bot
> 𓂃 ࣪ ִֶָ☾. 𝚃𝙸𝙿𝙾: 𝙿𝚄𝙱𝙻𝙸𝙲𝙾
> 𓂃 ࣪ ִֶָ☾. 𝚃𝙸𝙴𝙼𝙿𝙾 𝙰𝙲𝚃𝙸𝚅𝙾: 1h 2m 5s
> 𓂃 ࣪ ִֶָ☾. 𝙲𝙾𝙼𝙰𝙽𝙳𝙾𝚂: 78
> 𓂃 ࣪ ִֶָ☾. 𝙼𝙴𝙼𝙾𝚁𝙸𝙰: 113.2 MB

 𓂃 ࣪ ִֶָ☾. 𝙿𝚁𝙾𝙿𝙸𝙴𝚃𝙰𝚁𝙸𝙾𝚂𓂃 ࣪ ִֶָ☾.
> 𓂃 ࣪ ִֶָ☾.  ⊹ wa.me/59896719709 ⊹ *Lyann*
```

Los mensajes de lista usan `interactiveMessage`/`nativeFlowMessage` de Baileys y, si el cliente no los admite, caen automáticamente a un menú de texto numerado. Las respuestas de lista (`listResponseMessage`, `interactiveResponseMessage`, botones) se convierten solas en comandos.

---

## 🔧 Variables de entorno (`.env`)

| Variable | Por defecto | Descripción |
| --- | --- | --- |
| `PORT` | `3000` | Puerto HTTP (Render lo inyecta) |
| `DASHBOARD_TOKEN` | autogenerado en `server/data/.token` | Contraseña del panel |
| `VELIRIUS_API` | `https://velirius-api-sd8u.vercel.app` | Base de la API |
| `APP_NAME` | `Velirius Multi-Bots` | Nombre mostrado |

## 📝 Notas

- Las sesiones se guardan en `server/data/auth/<id>` (multifile auth state) y se reconectan solas al reiniciar el servidor.
- El reintento de conexión usa backoff exponencial hasta 15 s; un cierre de sesión (`loggedOut`) borra las credenciales y espera un nuevo QR/pairing.
- La Velirius API no requiere token. Si un endpoint devuelve JSON, el bot extrae la URL multimedia; si devuelve el archivo directo, lo reenvía tal cual.
- Licencia MIT.
