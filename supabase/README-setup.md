# Setup medicina + generazione automatica da PDF

## 1. Migrazione database (obbligatoria)

Il deck ora ha solo `question` + `answer`. Le colonne `area`/`level` erano
`NOT NULL`: finche non le rimuovi, **gli insert falliscono**.

Apri Supabase → SQL Editor e lancia (o riesegui tutto `schema.sql`):

```sql
alter table public.flashcards drop column if exists area;
alter table public.flashcards drop column if exists level;
```

Le vecchie card di programmazione restano; se vuoi ripartire pulito:
`delete from public.flashcards;` e poi rilancia la parte `insert into ...` di `schema.sql`.

## 2. Chiave Groq (gratuita, funziona in EU)

Il free tier dell'API Gemini e disabilitato in EU (`limit: 0`), quindi si usa Groq.

1. Vai su https://console.groq.com/keys (login).
2. "Create API Key" → copia la chiave. Nessuna carta richiesta.
   Free tier `llama-3.3-70b-versatile`: ampio, adatto all'uso personale.

## 3. Deploy della Edge Function

Via Dashboard (consigliata): Supabase → progetto → Edge Functions →
crea/aggiorna `generate-flashcards`, incolla il codice di
`supabase/functions/generate-flashcards/index.ts`, **Verify JWT: OFF**,
aggiungi il secret `GROQ_API_KEY`, poi Deploy.

Via CLI (alternativa):

```bash
npx supabase login
npx supabase link --project-ref ooudsqwknnkoebjpkiss
npx supabase secrets set GROQ_API_KEY=LA_TUA_CHIAVE
npx supabase functions deploy generate-flashcards --no-verify-jwt
```

## 4. Uso

- App → home → **Genera da PDF** (o `/import`).
- Carica un PDF: il testo viene estratto **nel browser** (nessun upload del file).
- Scegli quante domande, premi **Genera domande** → Gemini restituisce le coppie Q/R.
- Rivedi/modifica/deseleziona → **Salva nel deck**.

### Note
- PDF scansionati come immagine non hanno testo estraibile (servirebbe OCR).
- La chiave Groq non è mai esposta al browser: la chiama solo la Edge Function.
