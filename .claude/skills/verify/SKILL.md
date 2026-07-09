# Verify — FlashCardUniKey

Ricetta per verificare modifiche runtime nell'app Angular (SPA, nessun backend locale: Supabase remoto).

## Build & serve

```powershell
npx ng build --configuration development   # build rapida, output in dist/FlashCardUniKey.FE/browser
npx ng serve --port 4237                   # dev server (background)
```

## Drive della UI (headless, senza estensione Chrome)

Chrome installato in `C:\Program Files\Google\Chrome\Application\chrome.exe`.
Nello scratchpad: `npm i puppeteer-core`, poi script con `puppeteer.launch({ executablePath, headless: 'new' })`.

- Upload PDF: `input[type=file]` + `elementHandle.uploadFile(path)` — niente click sul picker nativo.
- Attesa estrazione: `page.waitForFunction` su `textarea.value.length` o messaggio d'errore nel DOM.
- Cattura: `page.on('response')` per asset (es. worker pdfjs), `page.on('console'/'pageerror')` per errori.

## Rotte utili

- `/` deck, `/import` import PDF (senza guard), `/manage` gestione card, `/login` (loginGuard).
- PDF di prova reale nella root del repo (`a1.5 Dispense di MMSC VI...pdf`, 164 pagine).

## Gotcha

- Il builder Angular NON risolve `new URL(..., import.meta.url)`: asset tipo pdf.worker vanno copiati via `assets` in angular.json e referenziati con URL runtime. Verifica presenza in `dist/FlashCardUniKey.FE/browser` dopo build.
- Generazione flashcard verificabile LIVE anche da localhost: la Edge Function `generate-flashcards` è deployata e l'URL Supabase in `environment.development.ts` è reale. Incollare testo nel textarea via `evaluate` + `dispatchEvent(new Event('input', {bubbles:true}))` (50k chars = 3 blocchi). Consuma quota Groq free tier — tenere i test piccoli e NON cliccare "Salva nel deck" (scrive su DB).
- Groq free tier llama-3.3-70b: TPM limit basso, i 429 sono normali con blocchi da 20k chars — il client fa retry con backoff 25s, un run da 3 blocchi dura ~1-2 min.
- CORS Edge Function: consente solo `authorization, x-client-info, apikey, content-type` — mai aggiungere altri header (es. `Prefer`) alla chiamata functions.
- Per testare lo swipe del deck senza sporcare i contatori di ripasso sul DB: `page.setRequestInterception(true)` e rispondere 200 `[]` alle PATCH verso `/rest/v1/flashcards` (header `access-control-allow-origin: *`).
- Drag swipe con puppeteer: `mouse.down()` → `mouse.move(cx±110, cy, {steps:10})` → `mouse.up()`; soglia conferma 64px, sotto rientra elastica.
- Due trappole nel misurare questa UI:
  - `html { scroll-behavior: smooth }` rende asincrono `el.scrollTop = N`. Per testare lo scroll usa `el.scrollTo({top: N, behavior: 'instant'})` + due `requestAnimationFrame`, altrimenti leggi sempre 0 e credi che la pagina non scrolli.
  - `.stamp` ha `pointer-events: none`, quindi `elementFromPoint` non lo restituisce mai: non prova che sia coperto. Per l'ordine di pittura nel contesto 3D confronta `new DOMMatrix(getComputedStyle(el).transform).m43` (asse Z) tra timbro e `.face`.
- `overflow-x` non-visible su `html`/`body` forza `overflow-y` a hidden (spec CSS Overflow) e uccide lo scroll di pagina. Il contenuto orizzontale in eccesso va ritagliato su `.app-main` (height auto), mai sul documento.
