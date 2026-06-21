# ClearPath — Technology Stack

A complete rundown of the languages, frameworks, platforms, services, and APIs
used to build ClearPath.

## Languages
- **JavaScript (Node.js, ESM)** — backend API + server
- **JavaScript (vanilla, no framework)** — web client
- **TypeScript** — Expo / React Native mobile app
- **HTML5 + CSS3** — web UI
- **YAML** — Render Blueprint + GitHub Actions
- **Bash** — automation / keep-alive scripts

## AI / APIs
- **Anthropic Claude API** via the official **`@anthropic-ai/sdk`** — the core engine
  - **`claude-haiku-4-5`** — text/PDF analysis, translation, and the "explain this
    step in more detail" feature (fast + low cost)
  - **`claude-sonnet-4-6`** — photo/vision input for stronger OCR of document images
- **`pdf-parse`** — server-side PDF text extraction
- **Browser MediaDevices `getUserMedia` + Canvas API** — in-browser document camera capture

## Frameworks & runtime
- **Backend:** Node.js + **Express 5** (REST API that also serves the web app)
- **Mobile:** **Expo SDK 54**, **React Native 0.81**, **React 19**, with
  `expo-camera`, `expo-document-picker`, `expo-file-system`, `expo-localization`,
  `expo-constants`
- **Web:** dependency-free vanilla-JS SPA (delegated event handling, custom
  client-side i18n)

## Cloud services / hosting / DevOps
- **Render** — cloud hosting (Node web service, deployed via a `render.yaml`
  Blueprint, env-var secret management)
- **Cloudflare** — CDN / edge proxy in front of the origin (TLS, caching)
- **GitHub** — source control
- **GitHub Actions** — scheduled "keep-warm" workflow (cron) that avoids
  free-tier cold-start 502s

## Databases / storage
- **No server-side database — privacy by design.** Documents are never persisted;
  they're analyzed in-memory and discarded.
- **Client-side only:** `localStorage` (web history) and **AsyncStorage** (mobile
  history), with per-item translation caching.
- **`@supabase/supabase-js`** — *optional* dependency for anonymous, content-free
  session metrics; disabled unless Supabase env vars are set (off by default).

## Security
- **Helmet** (CSP, frameguard, referrer policy), **CORS** allowlist, and
  **express-rate-limit** (per-endpoint), plus custom **input sanitization,
  prompt-injection detection, and image magic-byte validation**. Secrets live in
  `.env` (git-ignored); `Cache-Control` headers prevent stale clients.

## SEO / PWA / web platform
- **Open Graph + Twitter Cards + JSON-LD** structured data, a **Web App Manifest**
  (installable PWA), `robots.txt`, `sitemap.xml`, an SVG favicon, and a generated
  social share image.

## Internationalization
- Custom i18n across **14 languages** (including full RTL for Arabic), with
  on-the-fly translation of results, history, and saved items through Claude.

## Dev tooling
- **Git / GitHub**, **npm**, **`puppeteer-core`** (automated browser testing &
  screenshots), and Node's built-in `--check` + `tsc` for verification.

---

**One-line summary:** Node.js/Express backend + a vanilla-JS web app + an
Expo/React Native (TypeScript) mobile app, powered by the Anthropic Claude API
(Haiku 4.5 for text, Sonnet 4.6 for vision) with `pdf-parse`, hosted on Render
behind Cloudflare, deployed from GitHub with a GitHub Actions keep-alive — and no
server-side database (privacy by design; history is stored on-device).
