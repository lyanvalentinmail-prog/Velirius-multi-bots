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
│       ├── auth/            # Usuarios, tokens HMAC y verificación Google
│       └── middleware/      # Protección de rutas por sesión
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

# 2. Configurar variables (opcional)
cp .env.example .env

# 3. Arrancar
npm start
```

Abre `http://localhost:3000`. La primera vez verás la pantalla de acceso: puedes **registrarte con email y contraseña**, **iniciar sesión** con una cuenta existente o usar **Entrar con Google** (si configuraste `GOOGLE_CLIENT_ID`). Cada usuario gestiona únicamente sus propios sub-bots.

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

## ☁️ Render — opción recomendada (un solo despliegue, cero configuración)

Este es el modo más simple: **el mismo servicio sirve el dashboard y la API del bot en el mismo dominio**. La web detecta el servidor automáticamente, nunca tienes que escribir una URL y las llamadas van por rutas relativas (`/api/...`).

1. Sube el proyecto a GitHub.
2. En Render: **New → Blueprint** y selecciona el repositorio.
3. Render detecta `render.yaml` y crea el servicio `velirius-multi-bots`:
   - `AUTH_SECRET` se genera automáticamente (firma los tokens de sesión).
   - Añade `GOOGLE_CLIENT_ID` en *Environment* para activar el botón de Google (ver más abajo). Es opcional: sin él solo está el registro por email.
   - El disco persistente (`velirius-data`, 1 GB) guarda usuarios, configuración y sesiones de WhatsApp. El disco requiere un plan de pago: en el plan **free**, borra el bloque `disk:` de `render.yaml` y volverás a vincular WhatsApp en cada redespliegue (las cuentas de usuario también se reinician sin disco).
4. Abre la URL del servicio (`https://tu-servicio.onrender.com`): verás el banner verde *«Conectado · mismo dominio, sin configuración»*. Regístrate la primera vez y listo.

> **Arranque en frío (plan free):** si el servicio estaba inactivo, la primera carga tarda hasta ~1 minuto. La pantalla de acceso reintenta sola varias veces mostrando *«El servidor está arrancando…»*; no necesitas tocar nada.

Comandos equivalentes por si configuras el servicio a mano:

- Build: `npm install --prefix server`
- Start: `npm start --prefix server`
- Health check: `/api/health`

---

## ▲ Vercel — opcional, solo la web (requiere un servidor aparte)

Vercel no mantiene conexiones WebSocket persistentes, por lo que **no puede ejecutar Baileys**. Ahí se despliega únicamente el dashboard estático; el bot sigue necesitando un servidor en Render, un VPS o Termux. Por eso, si puedes, usa el despliegue único de Render y evita configurar nada.

1. Importa el repositorio en Vercel (la raíz contiene `vercel.json` con build estático `@vercel/static` sobre `web/`).
2. Despliega sin comando de build.
3. Al abrir la web verás el banner rojo de servidor: tócalo (o usa *Configurar URL del servidor*) y pon la URL de tu servidor Render/VPS/Termux. Esa URL se guarda en el navegador y el banner pasa a verde; entonces inicia sesión normalmente.

---

## 🖥️ Uso del dashboard

1. **Acceso**: regístrate con email/contraseña (mínimo 6 caracteres) o usa *Entrar con Google*. La sesión se guarda en el navegador como token firmado; cada cuenta ve solo sus sub-bots. En el despliegue único de Render (o en local/Termux) no se configura nada: el panel y la API comparten dominio y el banner de estado sale verde. El botón *Configurar URL del servidor* solo aparece si despliegas la web por separado (p. ej. Vercel).
2. **Nuevo sub-bot**: nombre, prefijo (`.`, `#`, `!`…), modo público/privado y estilo de menú. Al crearlo se abre directo la pestaña de vinculación.
3. **Vincular WhatsApp** (pestaña *Vincular*): elige entre dos tarjetas:
   - **Código QR**: pulsa *Iniciar vinculación*, espera unos segundos y escanea el código con WhatsApp → *Dispositivos vinculados → Vincular dispositivo*. El QR se refresca solo en el panel.
   - **Pairing code**: selecciona la tarjeta, escribe tu número **con código de país y sin `+`** (ej. `59896719709`) y pulsa iniciar. Copia el código de 8 caracteres y en WhatsApp usa *Dispositivos vinculados → Vincular dispositivo → ¿Vincular con el número de teléfono?*.
   - Si algo falla verás un estado de error con botones *Reintentar* / *Detener*, y el detalle en la pestaña *Registros*.
4. **Editar** (pestaña *Configuración*): nombre, prefijo, **banner**, URL de imagen del banner, propietarios, modo, estilo de menú, bienvenida, autolectura y activación.
5. **Registros**: logs en vivo de la sesión (conexión, QR, pairing, errores).

### Configurar "Entrar con Google"

1. Entra a [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → *Credentials* → *Create Credentials* → **OAuth client ID** → tipo **Web application**.
2. En *Authorized JavaScript origins* añade el origen de tu web (ej. `https://velirius-multi-bots.vercel.app` y `https://tu-servicio.onrender.com`; en local `http://localhost:3000`).
3. Copia el **Client ID** (termina en `.apps.googleusercontent.com`). No necesitas el client secret: el frontend usa Google Identity Services y el servidor verifica el ID token con las llaves públicas de Google.
4. Define la variable `GOOGLE_CLIENT_ID` en el servidor (`.env` local o pestaña *Environment* en Render) y reinicia. El botón aparece solo; sin la variable se muestra un aviso de que está desactivado.

La API del panel (las rutas de bots exigen `Authorization: Bearer <token>` salvo que se use `DASHBOARD_TOKEN` de servicio):

| Método | Ruta | Descripción |
| --- | --- | --- |
| `GET` | `/api/auth/config` | Config pública: si Google está activo y su Client ID |
| `POST` | `/api/auth/register` | Crea cuenta con email/contraseña y devuelve token |
| `POST` | `/api/auth/login` | Inicia sesión con email/contraseña |
| `POST` | `/api/auth/google` | Verifica el ID token de Google y devuelve token |
| `GET` | `/api/auth/me` | Usuario de la sesión actual |
| `GET` | `/api/bots` | Listar sub-bots (solo los del usuario) |
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
| `AUTH_SECRET` | autogenerado en `server/data/.jwt-secret` | Secreto HMAC que firma los tokens de sesión |
| `TOKEN_TTL_DAYS` | `30` | Días de validez de cada token de sesión |
| `GOOGLE_CLIENT_ID` | vacío | Client ID OAuth de Google; vacío desactiva el botón *Entrar con Google* |
| `DASHBOARD_TOKEN` | vacío | Token de servicio opcional: si se define, se acepta como Bearer además de las cuentas |
| `VELIRIUS_API` | `https://velirius-api-sd8u.vercel.app` | Base de la API |
| `APP_NAME` | `Velirius Multi-Bots` | Nombre mostrado |

## 📝 Notas

- Las sesiones se guardan en `server/data/auth/<id>` (multifile auth state) y se reconectan solas al reiniciar el servidor.
- El reintento de conexión usa backoff exponencial hasta 15 s; un cierre de sesión (`loggedOut`) borra las credenciales y espera un nuevo QR/pairing.
- La Velirius API no requiere token. Si un endpoint devuelve JSON, el bot extrae la URL multimedia; si devuelve el archivo directo, lo reenvía tal cual.
- Licencia MIT.
