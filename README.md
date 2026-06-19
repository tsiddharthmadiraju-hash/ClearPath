# ClearPath

**Understand any document in seconds.**

ClearPath turns confusing legal and government documents into a plain-language
explanation, a prioritized action checklist with deadlines, direct connections
to local support resources, and an honest confidence indicator — built for
people under stress who cannot afford to misunderstand what they received.

> Built for the USAII Global AI Hackathon 2026 — Challenge 1A: Crisis-to-Action
> Translator. This repo implements the product described in `ClearPath_Product_Plan.pdf`.

---

## What's in here

```
clearpath-app/
├── backend/            Express API + Claude integration + runnable web demo
│   ├── src/            server, system prompt, analyze, validate, mock data, logging
│   └── public/         vanilla web client (Home → Processing → Results → Escalation)
├── app/                Expo (React Native + TypeScript) mobile app
│   ├── App.tsx         screen flow + 3 input methods (camera / upload / paste)
│   └── src/            screens, the 4 output components, escalation, theme, api
└── demo-documents/     5 synthetic test documents (no real personal data)
```

The **backend** is the brain (the Claude system prompt is its core asset) and it
also serves a **web demo** so you can try the whole flow in a browser with zero
mobile tooling. The **Expo app** is the production mobile client.

---

## Quick start (60 seconds, no API key needed)

```bash
cd backend
npm install
npm start
```

Open **http://localhost:4000** — try an example chip, paste text, or upload a
file. With no `ANTHROPIC_API_KEY` set, the backend runs in **MOCK mode** and
returns realistic sample analyses, so the full experience works offline.

### Run it for real with Claude

```bash
cd backend
cp .env.example .env
# edit .env and set ANTHROPIC_API_KEY=sk-ant-...
npm start
```

Now every document is analyzed live by Claude (`claude-sonnet-4-6` by default —
override with `CLEARPATH_MODEL`). `GET /health` shows the active mode and model.

---

## Run the mobile app (Expo)

```bash
cd app
npm install
# Point the app at your backend. Edit src/api.ts → API_BASE:
#   - iOS simulator / web:  http://localhost:4000
#   - a real phone:         http://<your-computer-LAN-IP>:4000  (or your deployed URL)
npx expo start
```

Scan the QR code with Expo Go. The app has three input methods (Take a Photo,
Upload a Document, Type or Paste Text) and the same four-output results screen.

> If `expo-camera`/`expo-document-picker` versions warn, run `npx expo install --fix`.
> The text-paste flow and example chips work without any native modules.

---

## The API

### `POST /analyze`
Body is **one of**:
```jsonc
{ "text": "..." }                          // pasted or PDF-extracted text
{ "image": "<base64>", "mediaType": "image/jpeg" }   // camera photo (Claude Vision)
{ "pdfBase64": "<base64>" }                // PDF — text extracted with pdf-parse
```
Optional: `"location"` (for local resources), `"inputMethod"`.

Returns the validated four-part analysis:
```jsonc
{
  "document_type": "Eviction Notice",
  "plain_explanation": "…7th-grade reading level, no jargon…",
  "action_checklist": [{ "step": 1, "action": "…", "deadline": "…", "urgency": "immediate", "detail": "…" }],
  "resources": [{ "name": "211", "phone": "211", "call_script": "…", "what_they_do": "…", "website": "…", "type": "…" }],
  "confidence": "high",                     // high | medium | low
  "confidence_reason": "…",
  "disclaimer": "…"
}
```

### `POST /escalation`
Records (anonymously) that a user asked for a real person and returns the human
resources shown in the escalation panel.

### `GET /health`
Reports `mode` (mock/live), `model`, and whether logging is enabled.

---

## How it works

```
User → (camera | PDF | text) → POST /analyze
     → backend builds the Claude request with the ClearPath system prompt
     → Claude returns ONE structured JSON object (4 fields)
     → backend validates/normalizes it (and enforces responsible-AI rules)
     → app renders: type banner · plain explanation · action checklist · resources · confidence
     → low confidence ⇒ 211 routing surfaced first
```

The system prompt (`backend/src/systemPrompt.js`) is the core technical asset —
it constrains Claude to a fixed JSON contract, which is what makes this a real AI
application rather than a chatbot wrapper.

### Why AI is required
A web search returns generic information. ClearPath reads *the specific document
in the user's hands* — it extracts the actual deadline, generates a prioritized
checklist from the real content, and writes a call script for that situation.
That is natural-language understanding of a specific document, not retrieval.

---

## Responsible AI

The concrete risk: ClearPath could misread a term or miss a deadline, causing a
wrong action. Three mitigations are built in:

1. **Confidence scoring** — Claude rates its own certainty as part of the JSON
   contract. Low confidence shows a red warning banner above all results and
   routes the user to 211 first. The backend also *forces* low confidence and
   211-first routing if the model output is missing or unusable
   (`backend/src/validate.js`) — a wrong answer with false confidence is worse
   than an honest "we're not sure."
2. **Human escalation at every step** — a "Talk to a real person" affordance is
   present on the home, results, and error screens, and in the web demo. It is
   never hidden. ClearPath explains what a document *says*; a qualified human
   decides what to *do*.
3. **Data minimization** — no document content is stored after analysis, no
   account, no personal data. Optional anonymous logging records only timestamp,
   detected document type, confidence, input method, and whether the user asked
   for a real person (`backend/src/logging.js`; off unless Supabase env is set).

---

## Tech stack

| Layer        | Choice                              | Cost |
|--------------|-------------------------------------|------|
| Mobile app   | Expo (React Native + TypeScript)    | Free |
| AI engine    | Claude API (`claude-sonnet-4-6`)    | Free tier |
| Backend      | Express.js                          | Free tier |
| PDF parsing  | pdf-parse                           | Free |
| Logging (opt)| Supabase (anonymous)                | Free tier |

Total cost: **$0**. Runs fully offline in MOCK mode.

---

## Demo documents

`demo-documents/` contains five synthetic documents (eviction, SNAP termination,
hospital discharge, school attendance, utility shutoff). Paste any of them into
the app, or click the matching example chip. None contain real personal data.
